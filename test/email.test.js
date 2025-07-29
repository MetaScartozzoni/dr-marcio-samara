// test/email.test.js
const emailService = require('../src/services/email.service');

async function testarEmailService() {
  console.log('🧪 Testando Serviço de Email...\n');

  try {
    // 1. Testar configuração
    console.log('1️⃣ Testando configuração SMTP...');
    const configValida = await emailService.testarConfiguracao();
    
    if (configValida) {
      console.log('✅ Configuração SMTP válida\n');
    } else {
      console.log('❌ Erro na configuração SMTP\n');
      return;
    }

    // 2. Testar email de confirmação de agendamento
    console.log('2️⃣ Testando email de confirmação de agendamento...');
    try {
      const resultadoConfirmacao = await emailService.enviarConfirmacaoAgendamento({
        email: 'teste@exemplo.com',
        nome: 'João Silva',
        servico: 'Consulta Odontológica',
        data: new Date(),
        agendamentoId: '12345'
      });
      console.log('✅ Email de confirmação enviado:', resultadoConfirmacao.messageId);
    } catch (error) {
      console.log('⚠️ Erro ao enviar confirmação (normal se não tiver template):', error.message);
    }

    // 3. Testar email de lembrete
    console.log('\n3️⃣ Testando email de lembrete...');
    try {
      const resultadoLembrete = await emailService.enviarLembreteAgendamento({
        email: 'teste@exemplo.com',
        nome: 'Maria Santos',
        servico: 'Limpeza Dental',
        data: new Date()
      });
      console.log('✅ Email de lembrete enviado:', resultadoLembrete.messageId);
    } catch (error) {
      console.log('⚠️ Erro ao enviar lembrete (normal se não tiver template):', error.message);
    }

    // 4. Testar email de orçamento
    console.log('\n4️⃣ Testando email de orçamento...');
    try {
      const resultadoOrcamento = await emailService.enviarOrcamento({
        email: 'teste@exemplo.com',
        nome: 'Carlos Oliveira',
        numeroOrcamento: 'ORC-001',
        valorTotal: 250.00,
        validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        linkVisualizacao: 'http://localhost:3000/orcamento/ORC-001',
        linkAceite: 'http://localhost:3000/aceitar/ORC-001',
        observacoes: 'Orçamento válido por 30 dias'
      });
      console.log('✅ Email de orçamento enviado:', resultadoOrcamento.messageId);
    } catch (error) {
      console.log('⚠️ Erro ao enviar orçamento (normal se não tiver template):', error.message);
    }

    // 5. Testar emails com HTML inline (que não dependem de templates)
    console.log('\n5️⃣ Testando emails com HTML inline...');
    
    try {
      const resultadoCancelamento = await emailService.enviarCancelamentoAgendamento({
        email: 'teste@exemplo.com',
        nome: 'Ana Costa',
        servico: 'Consulta de Rotina',
        data: '25/12/2024',
        hora: '14:30',
        motivo: 'Reagendamento a pedido do paciente'
      });
      console.log('✅ Email de cancelamento enviado:', resultadoCancelamento.messageId);
    } catch (error) {
      console.log('❌ Erro ao enviar cancelamento:', error.message);
    }

    try {
      const resultadoReagendamento = await emailService.enviarReagendamento({
        email: 'teste@exemplo.com',
        nome: 'Pedro Lima',
        servico: 'Extração Dentária',
        dataAnterior: '20/12/2024',
        horaAnterior: '10:00',
        dataNova: '22/12/2024',
        horaNova: '15:30'
      });
      console.log('✅ Email de reagendamento enviado:', resultadoReagendamento.messageId);
    } catch (error) {
      console.log('❌ Erro ao enviar reagendamento:', error.message);
    }

    try {
      const resultadoLembrete24h = await emailService.enviarLembrete24h({
        email: 'teste@exemplo.com',
        nome: 'Lucia Fernandes',
        servico: 'Clareamento Dental',
        data: 'Amanhã (26/12/2024)',
        hora: '09:00'
      });
      console.log('✅ Email de lembrete 24h enviado:', resultadoLembrete24h.messageId);
    } catch (error) {
      console.log('❌ Erro ao enviar lembrete 24h:', error.message);
    }

    console.log('\n🎉 Testes do serviço de email concluídos!');
    console.log('\n📝 Notas:');
    console.log('- Emails com templates Handlebars podem falhar se os arquivos .hbs não existirem');
    console.log('- Emails com HTML inline devem funcionar normalmente');
    console.log('- Verifique se as variáveis de ambiente estão configuradas corretamente');
    console.log('- Para produção, substitua teste@exemplo.com por emails reais');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  testarEmailService();
}

module.exports = { testarEmailService };
