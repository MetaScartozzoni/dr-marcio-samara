// src/services/payment.service.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const { Pool } = require('pg');

class PaymentService {
  constructor() {
    // Configuração do banco de dados
    this.db = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    // Configuração PagSeguro
    this.pagseguroConfig = {
      email: process.env.PAGSEGURO_EMAIL,
      token: process.env.PAGSEGURO_TOKEN,
      sandbox: process.env.NODE_ENV !== 'production',
      apiUrl: process.env.NODE_ENV === 'production' 
        ? 'https://ws.pagseguro.uol.com.br' 
        : 'https://ws.sandbox.pagseguro.uol.com.br'
    };
  }

  // Criar sessão de pagamento Stripe
  async criarSessaoStripe(orcamentoId, dadosOrcamento) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Orçamento ${dadosOrcamento.numero_orcamento}`,
              description: dadosOrcamento.observacoes || 'Serviços médicos Dr. Marcio',
            },
            unit_amount: Math.round(dadosOrcamento.valor_final * 100), // Centavos
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/pagamento/cancelado`,
        metadata: {
          orcamento_id: orcamentoId,
          paciente_id: dadosOrcamento.paciente_id
        },
        customer_email: dadosOrcamento.paciente_email,
        payment_intent_data: {
          description: `Pagamento orçamento ${dadosOrcamento.numero_orcamento}`,
          metadata: {
            orcamento_id: orcamentoId
          }
        }
      });

      return {
        sucesso: true,
        checkout_url: session.url,
        session_id: session.id
      };
    } catch (error) {
      console.error('Erro ao criar sessão Stripe:', error);
      return {
        sucesso: false,
        erro: error.message
      };
    }
  }

  // Criar pagamento PagSeguro
  async criarPagamentoPagSeguro(orcamentoId, dadosOrcamento) {
    try {
      const telefone = dadosOrcamento.paciente_telefone.replace(/\D/g, '');
      const ddd = telefone.substring(2, 4); // Pega DDD sem código do país
      const numero = telefone.substring(4);

      const xmlData = `
        <?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
        <checkout>
          <currency>BRL</currency>
          <items>
            <item>
              <id>${orcamentoId}</id>
              <description>Orçamento ${dadosOrcamento.numero_orcamento}</description>
              <amount>${dadosOrcamento.valor_final.toFixed(2)}</amount>
              <quantity>1</quantity>
            </item>
          </items>
          <sender>
            <name>${dadosOrcamento.paciente_nome}</name>
            <email>${dadosOrcamento.paciente_email}</email>
            <phone>
              <areaCode>${ddd}</areaCode>
              <number>${numero}</number>
            </phone>
          </sender>
          <redirectURL>${process.env.FRONTEND_URL}/pagamento/retorno</redirectURL>
          <notificationURL>${process.env.API_URL}/webhooks/pagseguro</notificationURL>
        </checkout>
      `;

      const response = await axios.post(
        `${this.pagseguroConfig.apiUrl}/v2/checkout`,
        xmlData,
        {
          headers: {
            'Content-Type': 'application/xml; charset=ISO-8859-1'
          },
          params: {
            email: this.pagseguroConfig.email,
            token: this.pagseguroConfig.token
          }
        }
      );

      // Extrair código do checkout da resposta XML
      const codeMatch = response.data.match(/<code>([^<]+)<\/code>/);
      const checkoutCode = codeMatch ? codeMatch[1] : null;

      if (!checkoutCode) {
        throw new Error('Código de checkout não encontrado na resposta do PagSeguro');
      }

      const checkoutUrl = this.pagseguroConfig.sandbox
        ? `https://sandbox.pagseguro.uol.com.br/v2/checkout/payment.html?code=${checkoutCode}`
        : `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${checkoutCode}`;

      return {
        sucesso: true,
        checkout_code: checkoutCode,
        checkout_url: checkoutUrl
      };
    } catch (error) {
      console.error('Erro ao criar pagamento PagSeguro:', error);
      return {
        sucesso: false,
        erro: error.message
      };
    }
  }

  // Processar webhook Stripe
  async processarWebhookStripe(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'checkout.session.completed':
          await this.processarPagamentoAprovado(event.data.object, 'stripe');
          break;
        case 'payment_intent.payment_failed':
          await this.processarPagamentoFalhou(event.data.object, 'stripe');
          break;
        default:
          console.log(`Evento não tratado: ${event.type}`);
      }

      return { sucesso: true };
    } catch (error) {
      console.error('Erro no webhook Stripe:', error);
      return { sucesso: false, erro: error.message };
    }
  }

  // Processar webhook PagSeguro
  async processarWebhookPagSeguro(notificationCode) {
    try {
      const response = await axios.get(
        `${this.pagseguroConfig.apiUrl}/v3/transactions/notifications/${notificationCode}`,
        {
          params: {
            email: this.pagseguroConfig.email,
            token: this.pagseguroConfig.token
          }
        }
      );

      const transaction = response.data;
      
      switch (transaction.status) {
        case '3': // Paga
        case '4': // Disponível
          await this.processarPagamentoAprovado(transaction, 'pagseguro');
          break;
        case '7': // Cancelada
          await this.processarPagamentoFalhou(transaction, 'pagseguro');
          break;
      }

      return { sucesso: true };
    } catch (error) {
      console.error('Erro no webhook PagSeguro:', error);
      return { sucesso: false, erro: error.message };
    }
  }

  async processarPagamentoAprovado(transacao, gateway) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      let orcamentoId;
      let valorPago;
      let transactionId;

      if (gateway === 'stripe') {
        orcamentoId = transacao.metadata.orcamento_id;
        valorPago = transacao.amount_total / 100; // Converter de centavos
        transactionId = transacao.payment_intent;
      } else if (gateway === 'pagseguro') {
        orcamentoId = transacao.items[0].id;
        valorPago = parseFloat(transacao.grossAmount);
        transactionId = transacao.code;
      }

      // Atualizar orçamento
      await client.query(`
        UPDATE orcamentos 
        SET status = 'pago', aceito_em = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [orcamentoId]);

      // Registrar pagamento
      await client.query(`
        INSERT INTO pagamentos (
          orcamento_id, valor, tipo_pagamento, status,
          gateway_transaction_id, data_pagamento
        ) VALUES ($1, $2, $3, 'aprovado', $4, CURRENT_TIMESTAMP)
      `, [orcamentoId, valorPago, gateway, transactionId]);

      await client.query('COMMIT');

      // Enviar confirmação de pagamento
      await this.enviarConfirmacaoPagamento(orcamentoId);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async processarPagamentoFalhou(transacao, gateway) {
    // Implementar lógica para pagamento falhou
    console.log('Pagamento falhou:', transacao);
    
    const client = await this.db.connect();
    
    try {
      let orcamentoId;
      let transactionId;

      if (gateway === 'stripe') {
        orcamentoId = transacao.metadata?.orcamento_id;
        transactionId = transacao.id;
      } else if (gateway === 'pagseguro') {
        orcamentoId = transacao.items?.[0]?.id;
        transactionId = transacao.code;
      }

      if (orcamentoId) {
        // Registrar tentativa de pagamento falhada
        await client.query(`
          INSERT INTO pagamentos (
            orcamento_id, tipo_pagamento, status,
            gateway_transaction_id, data_pagamento
          ) VALUES ($1, $2, 'falhou', $3, CURRENT_TIMESTAMP)
        `, [orcamentoId, gateway, transactionId]);
      }
    } catch (error) {
      console.error('Erro ao processar pagamento falhado:', error);
    } finally {
      client.release();
    }
  }

  async enviarConfirmacaoPagamento(orcamentoId) {
    try {
      // Buscar dados do orçamento e paciente
      const query = `
        SELECT o.*, u.full_name, u.email, u.telefone
        FROM orcamentos o
        JOIN usuarios u ON o.paciente_id = u.id
        WHERE o.id = $1
      `;
      const { rows: [orcamento] } = await this.db.query(query, [orcamentoId]);

      if (orcamento) {
        // Importar serviços dinamicamente para evitar dependência circular
        const emailService = require('./email.service.js');
        const smsService = require('./sms.service.js');

        // Enviar email de confirmação
        await emailService.enviarConfirmacaoPagamento({
          email: orcamento.email,
          nome: orcamento.full_name,
          numeroOrcamento: orcamento.numero_orcamento,
          valor: orcamento.valor_final
        });

        // Enviar SMS/WhatsApp
        await smsService.enviarConfirmacaoPagamento({
          telefone: orcamento.telefone,
          nome: orcamento.full_name,
          numeroOrcamento: orcamento.numero_orcamento,
          valor: orcamento.valor_final
        });
      }
    } catch (error) {
      console.error('Erro ao enviar confirmação de pagamento:', error);
    }
  }

  // Gerar link de pagamento direto
  async gerarLinkPagamento(orcamentoId, metodoPagamento = 'stripe') {
    const query = `
      SELECT o.*, u.full_name, u.email, u.telefone
      FROM orcamentos o
      JOIN usuarios u ON o.paciente_id = u.id
      WHERE o.id = $1 AND o.status = 'pendente'
    `;
    const { rows: [orcamento] } = await this.db.query(query, [orcamentoId]);

    if (!orcamento) {
      throw new Error('Orçamento não encontrado ou já processado');
    }

    if (metodoPagamento === 'stripe') {
      return await this.criarSessaoStripe(orcamentoId, {
        numero_orcamento: orcamento.numero_orcamento,
        valor_final: orcamento.valor_final,
        observacoes: orcamento.observacoes,
        paciente_id: orcamento.paciente_id,
        paciente_email: orcamento.email
      });
    } else if (metodoPagamento === 'pagseguro') {
      return await this.criarPagamentoPagSeguro(orcamentoId, {
        numero_orcamento: orcamento.numero_orcamento,
        valor_final: orcamento.valor_final,
        paciente_nome: orcamento.full_name,
        paciente_email: orcamento.email,
        paciente_telefone: orcamento.telefone
      });
    }
  }

  // Verificar status de um pagamento
  async verificarStatusPagamento(orcamentoId) {
    const query = `
      SELECT p.*, o.numero_orcamento, o.valor_final
      FROM pagamentos p
      JOIN orcamentos o ON p.orcamento_id = o.id
      WHERE p.orcamento_id = $1
      ORDER BY p.data_pagamento DESC
      LIMIT 1
    `;
    const { rows: [pagamento] } = await this.db.query(query, [orcamentoId]);
    
    return pagamento;
  }

  // Listar pagamentos de um paciente
  async listarPagamentosPaciente(pacienteId) {
    const query = `
      SELECT p.*, o.numero_orcamento, o.valor_final
      FROM pagamentos p
      JOIN orcamentos o ON p.orcamento_id = o.id
      WHERE o.paciente_id = $1
      ORDER BY p.data_pagamento DESC
    `;
    const { rows } = await this.db.query(query, [pacienteId]);
    
    return rows;
  }

  // Relatório de pagamentos
  async relatorioPagamentos(dataInicio, dataFim) {
    const query = `
      SELECT 
        p.*,
        o.numero_orcamento,
        u.full_name as paciente_nome
      FROM pagamentos p
      JOIN orcamentos o ON p.orcamento_id = o.id
      JOIN usuarios u ON o.paciente_id = u.id
      WHERE p.data_pagamento BETWEEN $1 AND $2
      ORDER BY p.data_pagamento DESC
    `;
    const { rows } = await this.db.query(query, [dataInicio, dataFim]);
    
    return rows;
  }

  // Testar configuração dos gateways
  async testarConfiguracao() {
    const testes = {
      stripe: false,
      pagseguro: false
    };

    // Testar Stripe
    try {
      const account = await stripe.accounts.retrieve();
      testes.stripe = !!account.id;
    } catch (error) {
      console.error('Erro na configuração Stripe:', error.message);
    }

    // Testar PagSeguro
    try {
      await axios.get(`${this.pagseguroConfig.apiUrl}/v2/sessions`, {
        params: {
          email: this.pagseguroConfig.email,
          token: this.pagseguroConfig.token
        }
      });
      testes.pagseguro = true;
    } catch (error) {
      console.error('Erro na configuração PagSeguro:', error.message);
    }

    return testes;
  }
}

module.exports = new PaymentService();
