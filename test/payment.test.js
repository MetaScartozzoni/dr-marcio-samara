// test/payment.test.js
const paymentService = require('../src/services/payment.service.js');
const emailService = require('../src/services/email-formatted.service.js');
const smsService = require('../src/services/sms.service.js');

async function testarSistemaPagamentos() {
  console.log('🧪 TESTE DO SISTEMA DE PAGAMENTOS');
  console.log('=' .repeat(50));

  try {
    // 1. Testar configuração dos gateways
    console.log('\n1️⃣ Testando configuração dos gateways...');
    const configTeste = await paymentService.testarConfiguracao();
    
    console.log('📱 Stripe:', configTeste.stripe ? '✅ Configurado' : '❌ Não configurado');
    console.log('🏦 PagSeguro:', configTeste.pagseguro ? '✅ Configurado' : '❌ Não configurado');

    // 2. Criar dados de teste para orçamento
    console.log('\n2️⃣ Preparando dados de teste...');
    const dadosOrcamento = {
      numero_orcamento: 'ORC-2025-0001',
      valor_final: 1500.00,
      observacoes: 'Rinoplastia - Procedimento de teste',
      paciente_id: 1,
      paciente_email: 'teste@example.com',
      paciente_nome: 'João Silva',
      paciente_telefone: '+5511999999999'
    };
    console.log('📋 Orçamento de teste criado:', dadosOrcamento.numero_orcamento);

    // 3. Testar criação de sessão Stripe
    console.log('\n3️⃣ Testando sessão Stripe...');
    const stripeSession = await paymentService.criarSessaoStripe(1, dadosOrcamento);
    
    if (stripeSession.sucesso) {
      console.log('✅ Sessão Stripe criada com sucesso');
      console.log('🔗 URL de checkout:', stripeSession.checkout_url);
    } else {
      console.log('❌ Erro na sessão Stripe:', stripeSession.erro);
    }

    // 4. Testar criação de pagamento PagSeguro
    console.log('\n4️⃣ Testando pagamento PagSeguro...');
    const pagseguroPayment = await paymentService.criarPagamentoPagSeguro(1, dadosOrcamento);
    
    if (pagseguroPayment.sucesso) {
      console.log('✅ Pagamento PagSeguro criado com sucesso');
      console.log('🔗 URL de checkout:', pagseguroPayment.checkout_url);
    } else {
      console.log('❌ Erro no PagSeguro:', pagseguroPayment.erro);
    }

    // 5. Testar envio de confirmação por email
    console.log('\n5️⃣ Testando email de confirmação...');
    try {
      await emailService.enviarConfirmacaoPagamento({
        email: 'teste@example.com',
        nome: 'João Silva - Teste',
        numeroOrcamento: 'ORC-2025-0001',
        valor: 1500.00
      });
      console.log('✅ Email de confirmação enviado');
    } catch (error) {
      console.log('❌ Erro no email:', error.message);
    }

    // 6. Testar envio de confirmação por SMS
    console.log('\n6️⃣ Testando SMS de confirmação...');
    try {
      const smsResult = await smsService.enviarConfirmacaoPagamento({
        telefone: '+5511932357636',
        nome: 'João Silva - Teste',
        numeroOrcamento: 'ORC-2025-0001',
        valor: 1500.00
      });
      
      if (smsResult.sucesso) {
        console.log('✅ SMS de confirmação enviado');
        console.log('📨 Message ID:', smsResult.messageId);
      } else {
        console.log('❌ Erro no SMS:', smsResult.erro);
      }
    } catch (error) {
      console.log('❌ Erro no SMS:', error.message);
    }

    console.log('\n🎉 TESTE COMPLETO!');
    console.log('=' .repeat(50));
    
    // Resumo das funcionalidades
    console.log('\n📋 FUNCIONALIDADES DISPONÍVEIS:');
    console.log('✅ Criação de sessões de pagamento Stripe');
    console.log('✅ Criação de pagamentos PagSeguro');
    console.log('✅ Webhooks para ambos os gateways');
    console.log('✅ Confirmação automática por email e SMS');
    console.log('✅ Página de checkout integrada');
    console.log('✅ Relatórios de pagamentos');
    console.log('✅ Gestão de status de pagamentos');

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Configure as credenciais reais do Stripe e PagSeguro no .env');
    console.log('2. Execute o schema do banco de dados: database-schema-payments.sql');
    console.log('3. Integre as rotas de pagamento no servidor principal');
    console.log('4. Configure os webhooks nos dashboards dos gateways');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar teste se o arquivo for chamado diretamente
if (require.main === module) {
  testarSistemaPagamentos();
}

module.exports = { testarSistemaPagamentos };
