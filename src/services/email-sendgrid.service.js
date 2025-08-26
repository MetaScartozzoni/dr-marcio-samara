// =====================================================
// SERVIÇO DE EMAIL COM SENDGRID - PORTAL DR. MARCIO
// Data: 29/07/2025
// =====================================================

const sgMail = require('@sendgrid/mail');
require('dotenv').config();

class EmailSendGridService {
  constructor() {
    // Configurar SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    this.emailFrom = process.env.EMAIL_FROM || 'clinica@mscartozzoni.com.br';
    this.clinicaNome = process.env.CLINICA_NOME || 'Dr. Marcio Scartozzoni';
    this.clinicaTelefone = process.env.TELEFONE_CLINICA || '(11) 99999-9999';
    this.clincaEndereco = process.env.ENDERECO_CLINICA || 'Consultório Médico';
  }

  /**
   * Método genérico para enviar emails
   */
  async enviarEmail(destinatario, assunto, conteudoHtml, anexos = null) {
    try {
      const msg = {
        to: destinatario,
        from: {
          email: this.emailFrom,
          name: this.clinicaNome
        },
        subject: assunto,
        html: conteudoHtml
      };

      // Adicionar anexos se fornecidos
      if (anexos && anexos.length > 0) {
        msg.attachments = anexos;
      }

      const response = await sgMail.send(msg);
      
      console.log('✅ Email enviado com sucesso via SendGrid');
      console.log('📧 Para:', destinatario);
      console.log('📋 Assunto:', assunto);
      console.log('🆔 Message ID:', response[0].headers['x-message-id']);
      
      return {
        sucesso: true,
        messageId: response[0].headers['x-message-id'],
        statusCode: response[0].statusCode
      };

    } catch (error) {
      console.error('❌ Erro ao enviar email via SendGrid:', {
        erro: error.message,
        response: error.response?.body || 'Sem detalhes da resposta'
      });

      return {
        sucesso: false,
        erro: error.message,
        detalhes: error.response?.body
      };
    }
  }

  /**
   * Template base para emails da clínica
   */
  gerarTemplateBase(titulo, conteudo, botao = null) {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${titulo}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #007bff, #0056b3); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 300;
          }
          .content { 
            padding: 30px; 
          }
          .info-box { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #007bff;
          }
          .btn { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold;
            margin: 10px 0;
          }
          .btn:hover { 
            background: #0056b3; 
          }
          .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            border-top: 1px solid #dee2e6;
            font-size: 14px;
            color: #6c757d;
          }
          .contact-info {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #dee2e6;
          }
          .important {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${titulo}</h1>
          </div>
          <div class="content">
            ${conteudo}
            ${botao ? `<div style="text-align: center; margin: 30px 0;">${botao}</div>` : ''}
          </div>
          <div class="footer">
            <strong>${this.clinicaNome}</strong><br>
            ${this.clincaEndereco}<br>
            Telefone: ${this.clinicaTelefone}
            
            <div class="contact-info">
              <small>
                Este é um email automático do sistema. Para dúvidas, entre em contato conosco.<br>
                © ${new Date().getFullYear()} ${this.clinicaNome}. Todos os direitos reservados.
              </small>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Email de confirmação de agendamento
   */
  async enviarConfirmacaoAgendamento(paciente, agendamento, servico) {
    const dataFormatada = new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const horaFormatada = new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const conteudo = `
      <p>Olá <strong>${paciente.full_name}</strong>,</p>
      
      <p>Confirmamos seu agendamento com sucesso! Segue os detalhes:</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #007bff;">📅 Detalhes do Agendamento</h3>
        <p><strong>📋 Serviço:</strong> ${servico.nome}</p>
        <p><strong>📅 Data:</strong> ${dataFormatada}</p>
        <p><strong>🕐 Horário:</strong> ${horaFormatada}</p>
        <p><strong>⏱️ Duração:</strong> ${servico.duracao_minutos} minutos</p>
        ${agendamento.valor_consulta ? `<p><strong>💰 Valor:</strong> R$ ${agendamento.valor_consulta}</p>` : ''}
      </div>

      <div class="important">
        <h4>📋 Orientações Importantes:</h4>
        <ul>
          <li><strong>Chegue 15 minutos antes</strong> do horário agendado</li>
          <li>Traga um <strong>documento com foto</strong></li>
          <li>Em caso de <strong>cancelamento</strong>, avise com pelo menos 24h de antecedência</li>
          <li>Para reagendamentos, entre em contato conosco</li>
        </ul>
      </div>

      <p>Estamos ansiosos para atendê-lo(a)!</p>
    `;

    const botao = `
      <a href="tel:${this.clinicaTelefone.replace(/[^\d]/g, '')}" class="btn">
        📞 Entrar em Contato
      </a>
    `;

    const html = this.gerarTemplateBase(
      'Agendamento Confirmado',
      conteudo,
      botao
    );

    return await this.enviarEmail(
      paciente.email,
      `Agendamento Confirmado - ${dataFormatada} às ${horaFormatada}`,
      html
    );
  }

  /**
   * Email de lembrete de consulta
   */
  async enviarLembreteConsulta(paciente, agendamento, servico) {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    
    const dataFormatada = new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR');
    const horaFormatada = new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const conteudo = `
      <p>Olá <strong>${paciente.full_name}</strong>,</p>
      
      <p>Este é um lembrete de que você tem uma consulta marcada para <strong>amanhã</strong>:</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #ffc107;">⏰ Lembrete de Consulta</h3>
        <p><strong>📋 Serviço:</strong> ${servico.nome}</p>
        <p><strong>📅 Data:</strong> ${dataFormatada}</p>
        <p><strong>🕐 Horário:</strong> ${horaFormatada}</p>
        <p><strong>📍 Local:</strong> ${this.clincaEndereco}</p>
      </div>

      <div class="important">
        <h4>⚠️ Não esqueça:</h4>
        <ul>
          <li>Chegue 15 minutos antes</li>
          <li>Traga documento com foto</li>
          <li>Use máscara se necessário</li>
        </ul>
      </div>

      <p>Nos vemos amanhã!</p>
    `;

    const botao = `
      <a href="tel:${this.clinicaTelefone.replace(/[^\d]/g, '')}" class="btn">
        📞 Preciso Reagendar
      </a>
    `;

    const html = this.gerarTemplateBase(
      'Lembrete de Consulta - Amanhã',
      conteudo,
      botao
    );

    return await this.enviarEmail(
      paciente.email,
      `Lembrete: Consulta amanhã (${dataFormatada}) às ${horaFormatada}`,
      html
    );
  }

  /**
   * Email de confirmação de pagamento
   */
  async enviarConfirmacaoPagamento(paciente, pagamento, detalhes = {}) {
    const dataFormatada = new Date(pagamento.data_pagamento || new Date()).toLocaleDateString('pt-BR');
    
    const conteudo = `
      <p>Olá <strong>${paciente.full_name}</strong>,</p>
      
      <p>Confirmamos o recebimento do seu pagamento! 🎉</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #28a745;">✅ Pagamento Confirmado</h3>
        <p><strong>💰 Valor:</strong> R$ ${parseFloat(pagamento.valor).toFixed(2)}</p>
        <p><strong>📅 Data:</strong> ${dataFormatada}</p>
        <p><strong>💳 Método:</strong> ${this.formatarTipoPagamento(pagamento.tipo_pagamento)}</p>
        <p><strong>🆔 ID da Transação:</strong> ${pagamento.id}</p>
        ${pagamento.gateway_transaction_id ? `<p><strong>🔢 ID Gateway:</strong> ${pagamento.gateway_transaction_id}</p>` : ''}
      </div>

      ${detalhes.servico ? `
        <div class="info-box">
          <h4>📋 Referente ao Serviço:</h4>
          <p>${detalhes.servico}</p>
        </div>
      ` : ''}

      <p>Obrigado pela confiança em nossos serviços!</p>
    `;

    const html = this.gerarTemplateBase(
      'Pagamento Confirmado',
      conteudo
    );

    return await this.enviarEmail(
      paciente.email,
      `Pagamento Confirmado - R$ ${parseFloat(pagamento.valor).toFixed(2)}`,
      html
    );
  }

  /**
   * Email de orçamento aprovado
   */
  async enviarOrcamentoAprovado(paciente, orcamento) {
    const dataValidade = new Date(orcamento.validade).toLocaleDateString('pt-BR');
    
    const conteudo = `
      <p>Olá <strong>${paciente.full_name}</strong>,</p>
      
      <p>Seu orçamento foi aprovado e está pronto! 🎉</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #28a745;">✅ Orçamento Aprovado</h3>
        <p><strong>📋 Número:</strong> ${orcamento.numero_orcamento}</p>
        <p><strong>💰 Valor Total:</strong> R$ ${parseFloat(orcamento.valor_total).toFixed(2)}</p>
        ${orcamento.desconto > 0 ? `<p><strong>🎁 Desconto:</strong> R$ ${parseFloat(orcamento.desconto).toFixed(2)}</p>` : ''}
        <p><strong>💳 Valor Final:</strong> R$ ${parseFloat(orcamento.valor_final).toFixed(2)}</p>
        <p><strong>📅 Válido até:</strong> ${dataValidade}</p>
      </div>

      <div class="important">
        <h4>💳 Como pagar:</h4>
        <ul>
          <li><strong>PIX:</strong> Pagamento instantâneo</li>
          <li><strong>Cartão:</strong> À vista ou parcelado</li>
          <li><strong>Transferência:</strong> Entre em contato</li>
        </ul>
      </div>

      <p>Para efetuar o pagamento, entre em contato conosco.</p>
    `;

    const botao = `
      <a href="tel:${this.clinicaTelefone.replace(/[^\d]/g, '')}" class="btn">
        💳 Efetuar Pagamento
      </a>
    `;

    const html = this.gerarTemplateBase(
      'Orçamento Aprovado',
      conteudo,
      botao
    );

    return await this.enviarEmail(
      paciente.email,
      `Orçamento Aprovado - ${orcamento.numero_orcamento}`,
      html
    );
  }

  /**
   * Formatar tipo de pagamento para exibição
   */
  formatarTipoPagamento(tipo) {
    const tipos = {
      'cartao': 'Cartão de Crédito/Débito',
      'pix': 'PIX',
      'boleto': 'Boleto Bancário',
      'dinheiro': 'Dinheiro',
      'transferencia': 'Transferência Bancária'
    };
    
    return tipos[tipo] || tipo;
  }

  /**
   * Teste de conectividade com SendGrid
   */
  async testarConexao() {
    try {
      console.log('🧪 Testando conexão com SendGrid...');
      
      const resultado = await this.enviarEmail(
        'test@example.com',
        'Teste de Conectividade SendGrid',
        '<h1>✅ SendGrid funcionando!</h1><p>Este é um email de teste.</p>'
      );

      if (resultado.sucesso) {
        console.log('✅ SendGrid configurado e funcionando corretamente!');
        return true;
      } else {
        console.log('❌ Erro na configuração do SendGrid:', resultado.erro);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao testar SendGrid:', error.message);
      return false;
    }
  }
}

module.exports = EmailSendGridService;
