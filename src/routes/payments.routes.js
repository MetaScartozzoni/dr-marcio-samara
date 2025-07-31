// src/routes/payments.routes.js
const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service.js');
const { authenticateToken } = require('../middleware/auth.middleware.js');

// Gerar link de pagamento
router.post('/payment-link/:orcamentoId', authenticateToken, async (req, res) => {
  try {
    const { orcamentoId } = req.params;
    const { metodoPagamento = 'stripe' } = req.body;

    const resultado = await paymentService.gerarLinkPagamento(orcamentoId, metodoPagamento);

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao gerar link de pagamento:', error);
    res.status(500).json({ 
      sucesso: false, 
      erro: error.message 
    });
  }
});

// Verificar status de pagamento
router.get('/status/:orcamentoId', authenticateToken, async (req, res) => {
  try {
    const { orcamentoId } = req.params;
    
    const pagamento = await paymentService.verificarStatusPagamento(orcamentoId);
    
    if (!pagamento) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Pagamento não encontrado'
      });
    }

    res.json({
      sucesso: true,
      pagamento
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ 
      sucesso: false, 
      erro: error.message 
    });
  }
});

// Listar pagamentos do paciente
router.get('/meus-pagamentos', authenticateToken, async (req, res) => {
  try {
    const pacienteId = req.user.id;
    
    const pagamentos = await paymentService.listarPagamentosPaciente(pacienteId);
    
    res.json({
      sucesso: true,
      pagamentos
    });
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ 
      sucesso: false, 
      erro: error.message 
    });
  }
});

// Relatório de pagamentos (apenas admin)
router.get('/relatorio', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        sucesso: false,
        erro: 'Acesso negado'
      });
    }

    const { dataInicio, dataFim } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Período é obrigatório'
      });
    }

    const pagamentos = await paymentService.relatorioPagamentos(dataInicio, dataFim);
    
    res.json({
      sucesso: true,
      pagamentos,
      total: pagamentos.length,
      valorTotal: pagamentos
        .filter(p => p.status === 'aprovado')
        .reduce((sum, p) => sum + parseFloat(p.valor || 0), 0)
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ 
      sucesso: false, 
      erro: error.message 
    });
  }
});

// Webhook Stripe
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    const resultado = await paymentService.processarWebhookStripe(req.body, signature);
    
    if (resultado.sucesso) {
      res.status(200).send('Webhook processado');
    } else {
      res.status(400).send('Erro no webhook');
    }
  } catch (error) {
    console.error('Erro no webhook Stripe:', error);
    res.status(400).send('Webhook error');
  }
});

// Webhook PagSeguro
router.post('/webhooks/pagseguro', async (req, res) => {
  try {
    const { notificationCode } = req.body;
    
    if (!notificationCode) {
      return res.status(400).send('Código de notificação obrigatório');
    }

    const resultado = await paymentService.processarWebhookPagSeguro(notificationCode);
    
    if (resultado.sucesso) {
      res.status(200).send('Notificação processada');
    } else {
      res.status(400).send('Erro na notificação');
    }
  } catch (error) {
    console.error('Erro no webhook PagSeguro:', error);
    res.status(400).send('Webhook error');
  }
});

// Testar configuração dos gateways
router.get('/test-config', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        sucesso: false,
        erro: 'Acesso negado'
      });
    }

    const testes = await paymentService.testarConfiguracao();
    
    res.json({
      sucesso: true,
      configuracoes: testes
    });
  } catch (error) {
    console.error('Erro ao testar configuração:', error);
    res.status(500).json({ 
      sucesso: false, 
      erro: error.message 
    });
  }
});

// Página de pagamento (frontend)
router.get('/checkout/:orcamentoId', async (req, res) => {
  try {
    const { orcamentoId } = req.params;
    
    // Buscar dados do orçamento para mostrar na página
    const orcamento = await paymentService.db.query(`
      SELECT o.*, u.full_name, u.email
      FROM orcamentos o
      JOIN usuarios u ON o.paciente_id = u.id
      WHERE o.id = $1 AND o.status = 'pendente'
    `, [orcamentoId]);

    if (orcamento.rows.length === 0) {
      return res.status(404).send('Orçamento não encontrado ou já processado');
    }

    const dados = orcamento.rows[0];

    // Renderizar página de pagamento
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pagamento - Dr. Marcio</title>
          <link rel="stylesheet" href="/style.css">
          <script src="https://js.stripe.com/v3/"></script>
      </head>
      <body>
          <div class="container">
              <div class="payment-container">
                  <h1>💳 Finalizar Pagamento</h1>
                  
                  <div class="payment-info">
                      <h2>Orçamento ${dados.numero_orcamento}</h2>
                      <p><strong>Paciente:</strong> ${dados.full_name}</p>
                      <p><strong>Valor:</strong> R$ ${parseFloat(dados.valor_final).toFixed(2)}</p>
                      ${dados.observacoes ? `<p><strong>Observações:</strong> ${dados.observacoes}</p>` : ''}
                  </div>

                  <div class="payment-methods">
                      <h3>Escolha a forma de pagamento:</h3>
                      
                      <div class="payment-option">
                          <button onclick="pagarComStripe()" class="btn btn-primary">
                              💳 Cartão de Crédito (Stripe)
                          </button>
                      </div>
                      
                      <div class="payment-option">
                          <button onclick="pagarComPagSeguro()" class="btn btn-secondary">
                              🏦 PagSeguro (PIX, Boleto, Cartão)
                          </button>
                      </div>
                  </div>

                  <div id="loading" style="display: none;">
                      Processando pagamento...
                  </div>
              </div>
          </div>

          <script>
              const orcamentoId = '${orcamentoId}';
              const stripe = Stripe('${process.env.STRIPE_PUBLISHABLE_KEY}');
              
              async function pagarComStripe() {
                  showLoading();
                  
                  try {
                      const response = await fetch('/api/payments/payment-link/' + orcamentoId, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ metodoPagamento: 'stripe' })
                      });
                      
                      const data = await response.json();
                      
                      if (data.sucesso) {
                          window.location.href = data.checkout_url;
                      } else {
                          alert('Erro: ' + data.erro);
                      }
                  } catch (error) {
                      alert('Erro ao processar pagamento: ' + error.message);
                  } finally {
                      hideLoading();
                  }
              }
              
              async function pagarComPagSeguro() {
                  showLoading();
                  
                  try {
                      const response = await fetch('/api/payments/payment-link/' + orcamentoId, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ metodoPagamento: 'pagseguro' })
                      });
                      
                      const data = await response.json();
                      
                      if (data.sucesso) {
                          window.location.href = data.checkout_url;
                      } else {
                          alert('Erro: ' + data.erro);
                      }
                  } catch (error) {
                      alert('Erro ao processar pagamento: ' + error.message);
                  } finally {
                      hideLoading();
                  }
              }
              
              function showLoading() {
                  document.getElementById('loading').style.display = 'block';
              }
              
              function hideLoading() {
                  document.getElementById('loading').style.display = 'none';
              }
          </script>
      </body>
      </html>
    `;

    res.send(html);

  } catch (error) {
    console.error('Erro na página de checkout:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

module.exports = router;
