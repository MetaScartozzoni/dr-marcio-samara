// =====================================================
// TESTE DO SENDGRID - PORTAL DR. MARCIO
// Execute: node test-sendgrid.js
// =====================================================

require('dotenv').config();
const EmailSendGridService = require('./src/services/email-sendgrid.service');

async function testarSendGrid() {
  console.log('🧪 INICIANDO TESTE DO SENDGRID...\n');
  
  // Verificar se a API Key está configurada
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ ERRO: SENDGRID_API_KEY não encontrada no arquivo .env');
    return;
  }
  
  if (!process.env.EMAIL_FROM) {
    console.error('❌ ERRO: EMAIL_FROM não encontrado no arquivo .env');
    return;
  }

  console.log('✅ Variáveis de ambiente carregadas:');
  console.log(`📧 EMAIL_FROM: ${process.env.EMAIL_FROM}`);
  console.log(`🔑 SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY.substring(0, 20)}...`);
  console.log('');

  // Inicializar serviço
  const emailService = new EmailSendGridService();

  // Teste 1: Email simples
  console.log('📧 TESTE 1: Enviando email simples...');
  try {
    const resultado1 = await emailService.enviarEmail(
      'marcioscartozzoni@gmail.com', // Substitua pelo seu email
      'Teste SendGrid - Portal Dr. Marcio',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #007bff;">🎉 SendGrid Funcionando!</h1>
          <p>Este é um <strong>email de teste</strong> enviado diretamente do Portal Dr. Marcio.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>✅ Configuração Verificada:</h3>
            <ul>
              <li>API Key configurada</li>
              <li>Single Sender verificado</li>
              <li>Email profissional ativo</li>
            </ul>
          </div>
          <p><strong>Status:</strong> Sistema pronto para produção! 🚀</p>
          <hr>
          <small>
            <strong>Dr. Marcio Scartozzoni</strong><br>
            Portal Médico Integrado<br>
            Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
          </small>
        </div>
      `
    );

    if (resultado1.sucesso) {
      console.log('✅ TESTE 1 APROVADO!');
      console.log(`📬 Message ID: ${resultado1.messageId}`);
      console.log(`📊 Status Code: ${resultado1.statusCode}`);
    } else {
      console.log('❌ TESTE 1 FALHOU:', resultado1.erro);
      return;
    }
  } catch (error) {
    console.error('❌ ERRO NO TESTE 1:', error.message);
    return;
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Teste 2: Email de confirmação de agendamento (template)
  console.log('📧 TESTE 2: Enviando email de confirmação de agendamento...');
  try {
    const pacienteTeste = {
      full_name: 'João da Silva',
      email: 'marcioscartozzoni@gmail.com' // Substitua pelo seu email
    };

    const agendamentoTeste = {
      data_agendamento: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      valor_consulta: 200.00
    };

    const servicoTeste = {
      nome: 'Consulta Inicial',
      duracao_minutos: 60
    };

    const resultado2 = await emailService.enviarConfirmacaoAgendamento(
      pacienteTeste,
      agendamentoTeste,
      servicoTeste
    );

    if (resultado2.sucesso) {
      console.log('✅ TESTE 2 APROVADO!');
      console.log(`📬 Message ID: ${resultado2.messageId}`);
    } else {
      console.log('❌ TESTE 2 FALHOU:', resultado2.erro);
    }
  } catch (error) {
    console.error('❌ ERRO NO TESTE 2:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Teste 3: Email de confirmação de pagamento
  console.log('📧 TESTE 3: Enviando email de confirmação de pagamento...');
  try {
    const pacienteTeste = {
      full_name: 'Maria Santos',
      email: 'marcioscartozzoni@gmail.com' // Substitua pelo seu email
    };

    const pagamentoTeste = {
      id: 'PAG-123456',
      valor: 150.00,
      tipo_pagamento: 'pix',
      data_pagamento: new Date(),
      gateway_transaction_id: 'TXN-789012'
    };

    const resultado3 = await emailService.enviarConfirmacaoPagamento(
      pacienteTeste,
      pagamentoTeste,
      { servico: 'Consulta de Retorno' }
    );

    if (resultado3.sucesso) {
      console.log('✅ TESTE 3 APROVADO!');
      console.log(`📬 Message ID: ${resultado3.messageId}`);
    } else {
      console.log('❌ TESTE 3 FALHOU:', resultado3.erro);
    }
  } catch (error) {
    console.error('❌ ERRO NO TESTE 3:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 TESTES CONCLUÍDOS!');
  console.log('');
  console.log('📋 VERIFICAR:');
  console.log('1. Cheque sua caixa de entrada (marcioscartozzoni@gmail.com)');
  console.log('2. Verifique também a pasta de SPAM/Lixo Eletrônico');
  console.log('3. Se chegaram os 3 emails, o SendGrid está 100% funcionando!');
  console.log('');
  console.log('🚀 PRÓXIMO PASSO: Deploy no Railway');
}

// Executar teste
testarSendGrid().catch(console.error);
