// examples/email-usage.js
// Exemplos práticos de como usar o EmailService

const emailService = require('../src/services/email.service');

// Exemplo 1: Enviar confirmação de agendamento
async function exemploConfirmacaoAgendamento() {
  console.log('📧 Enviando confirmação de agendamento...');
  
  const dados = {
    email: 'paciente@email.com',
    nome: 'João Silva',
    servico: 'Consulta Odontológica',
    data: new Date('2024-12-25T14:30:00'),
    agendamentoId: 'AGD123456'
  };

  try {
    const resultado = await emailService.enviarConfirmacaoAgendamento(dados);
    console.log('✅ Email enviado com sucesso:', resultado.messageId);
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
  }
}

// Exemplo 2: Enviar lembrete 24h antes
async function exemploLembrete24h() {
  console.log('🔔 Enviando lembrete de consulta...');
  
  const dados = {
    email: 'paciente@email.com',
    nome: 'Maria Santos',
    servico: 'Limpeza Dental',
    data: 'Amanhã (26/12/2024)',
    hora: '09:00'
  };

  try {
    const resultado = await emailService.enviarLembrete24h(dados);
    console.log('✅ Lembrete enviado com sucesso:', resultado.messageId);
  } catch (error) {
    console.error('❌ Erro ao enviar lembrete:', error.message);
  }
}

// Exemplo 3: Enviar orçamento detalhado
async function exemploOrcamento() {
  console.log('💰 Enviando orçamento...');
  
  const dados = {
    email: 'paciente@email.com',
    nome: 'Carlos Oliveira',
    numeroOrcamento: 'ORC-2024-001',
    valorTotal: 850.00,
    validade: '31/01/2025',
    servicos: [
      { nome: 'Consulta Inicial', quantidade: 1, valor: 100.00 },
      { nome: 'Radiografia Panorâmica', quantidade: 1, valor: 150.00 },
      { nome: 'Tratamento de Canal', quantidade: 2, valor: 300.00 }
    ],
    observacoes: 'Tratamento pode ser dividido em 3 sessões. Desconto de 5% para pagamento à vista.',
    pdfUrl: null // Caminho para PDF anexo (opcional)
  };

  try {
    const resultado = await emailService.enviarEmailOrcamento(dados);
    console.log('✅ Orçamento enviado com sucesso:', resultado.messageId);
  } catch (error) {
    console.error('❌ Erro ao enviar orçamento:', error.message);
  }
}

// Exemplo 4: Cancelar agendamento
async function exemploCancelamento() {
  console.log('❌ Enviando cancelamento...');
  
  const dados = {
    email: 'paciente@email.com',
    nome: 'Ana Costa',
    servico: 'Consulta de Rotina',
    data: '25/12/2024',
    hora: '14:30',
    motivo: 'Reagendamento solicitado pelo paciente devido a compromisso de trabalho'
  };

  try {
    const resultado = await emailService.enviarCancelamentoAgendamento(dados);
    console.log('✅ Cancelamento enviado com sucesso:', resultado.messageId);
  } catch (error) {
    console.error('❌ Erro ao enviar cancelamento:', error.message);
  }
}

// Exemplo 5: Reagendar consulta
async function exemploReagendamento() {
  console.log('📅 Enviando reagendamento...');
  
  const dados = {
    email: 'paciente@email.com',
    nome: 'Pedro Lima',
    servico: 'Extração de Siso',
    dataAnterior: '20/12/2024',
    horaAnterior: '10:00',
    dataNova: '27/12/2024',
    horaNova: '15:30'
  };

  try {
    const resultado = await emailService.enviarReagendamento(dados);
    console.log('✅ Reagendamento enviado com sucesso:', resultado.messageId);
  } catch (error) {
    console.error('❌ Erro ao enviar reagendamento:', error.message);
  }
}

// Exemplo 6: Envio em lote
async function exemploEnvioLote() {
  console.log('📬 Enviando emails em lote...');
  
  const emails = [
    {
      from: process.env.EMAIL_USER,
      to: 'paciente1@email.com',
      subject: 'Lembrete: Consulta Agendada',
      html: '<p>Olá! Você tem uma consulta agendada para amanhã às 14:00.</p>'
    },
    {
      from: process.env.EMAIL_USER,
      to: 'paciente2@email.com',
      subject: 'Resultado de Exame Disponível',
      html: '<p>Seu resultado de exame já está disponível no portal.</p>'
    }
  ];

  try {
    const resultados = await emailService.enviarEmLote(emails);
    console.log('📊 Resultados do envio em lote:');
    resultados.forEach((resultado, index) => {
      if (resultado.sucesso) {
        console.log(`✅ Email ${index + 1}: Enviado (${resultado.messageId})`);
      } else {
        console.log(`❌ Email ${index + 1}: Falhou (${resultado.erro})`);
      }
    });
  } catch (error) {
    console.error('❌ Erro no envio em lote:', error.message);
  }
}

// Exemplo 7: Testar configuração
async function exemploTesteConfiguracao() {
  console.log('🔧 Testando configuração de email...');
  
  try {
    const configValida = await emailService.testarConfiguracao();
    
    if (configValida) {
      console.log('✅ Configuração SMTP válida - Pronto para enviar emails!');
    } else {
      console.log('❌ Problema na configuração SMTP - Verifique as variáveis de ambiente');
    }
  } catch (error) {
    console.error('❌ Erro ao testar configuração:', error.message);
  }
}

// Função principal para executar todos os exemplos
async function executarExemplos() {
  console.log('🚀 Executando exemplos do EmailService...\n');

  // Primeiro, testar a configuração
  await exemploTesteConfiguracao();
  console.log('\n' + '='.repeat(50) + '\n');

  // Executar exemplos apenas se a configuração estiver válida
  try {
    const configValida = await emailService.testarConfiguracao();
    
    if (configValida) {
      await exemploConfirmacaoAgendamento();
      console.log('\n' + '-'.repeat(30) + '\n');
      
      await exemploLembrete24h();
      console.log('\n' + '-'.repeat(30) + '\n');
      
      await exemploOrcamento();
      console.log('\n' + '-'.repeat(30) + '\n');
      
      await exemploCancelamento();
      console.log('\n' + '-'.repeat(30) + '\n');
      
      await exemploReagendamento();
      console.log('\n' + '-'.repeat(30) + '\n');
      
      await exemploEnvioLote();
      
      console.log('\n🎉 Todos os exemplos foram executados!');
      console.log('\n📝 Lembre-se de:');
      console.log('- Configurar as variáveis de ambiente corretamente');
      console.log('- Usar emails reais em produção');
      console.log('- Verificar os templates Handlebars na pasta src/templates/email/');
    } else {
      console.log('\n⚠️ Configure o SMTP antes de testar os envios');
    }
  } catch (error) {
    console.error('\n❌ Erro ao executar exemplos:', error.message);
  }
}

// Executar exemplos se chamado diretamente
if (require.main === module) {
  executarExemplos();
}

module.exports = {
  exemploConfirmacaoAgendamento,
  exemploLembrete24h,
  exemploOrcamento,
  exemploCancelamento,
  exemploReagendamento,
  exemploEnvioLote,
  exemploTesteConfiguracao,
  executarExemplos
};
