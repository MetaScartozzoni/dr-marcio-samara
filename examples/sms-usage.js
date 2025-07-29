// examples/sms-usage.js
// Exemplos práticos de como usar o SMSService

const smsService = require('../src/services/sms.service');

// Exemplo 1: Enviar confirmação de agendamento
async function exemploConfirmacaoAgendamento() {
  console.log('📱 Enviando confirmação de agendamento...');
  
  const dados = {
    telefone: '+5511999999999',
    nome: 'João Silva',
    servico: 'Consulta Odontológica',
    data: new Date('2025-07-30T14:30:00')
  };

  try {
    const resultado = await smsService.enviarConfirmacaoAgendamento(dados);
    console.log('✅ Mensagem enviada:', resultado.messageId);
  } catch (error) {
    console.error('❌ Erro ao enviar:', error.message);
  }
}

// Exemplo 2: Enviar lembrete 24h antes
async function exemploLembrete24h() {
  console.log('🔔 Enviando lembrete de consulta...');
  
  const dados = {
    telefone: '+5511999999999',
    nome: 'Maria Santos',
    servico: 'Limpeza Dental',
    data: 'Amanhã (30/07/2025)',
    hora: '09:00'
  };

  try {
    const resultado = await smsService.enviarLembrete24h(dados);
    console.log('✅ Lembrete enviado:', resultado.messageId);
  } catch (error) {
    console.error('❌ Erro ao enviar lembrete:', error.message);
  }
}

// Exemplo 3: Enviar código de verificação
async function exemploCodigoVerificacao() {
  console.log('🔐 Enviando código de verificação...');
  
  const telefone = '+5511999999999';
  const codigo = Math.floor(100000 + Math.random() * 900000);

  try {
    const resultado = await smsService.enviarCodigoVerificacao(telefone, codigo);
    
    if (resultado.sucesso) {
      console.log('✅ Código enviado com sucesso!');
      console.log(`📱 Código: ${codigo}`);
      
      // Salvar código no banco de dados para verificação posterior
      // await salvarCodigoVerificacao(telefone, codigo);
      
    } else {
      console.error('❌ Falha no envio:', resultado.erro);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Exemplo 4: Enviar orçamento via SMS/WhatsApp
async function exemploOrcamento() {
  console.log('💰 Enviando orçamento...');
  
  const dados = {
    telefone: '+5511999999999',
    nome: 'Carlos Oliveira',
    numeroOrcamento: 'ORC-2025-001',
    valorTotal: 1200.00,
    validade: '31/08/2025',
    servicos: [
      { nome: 'Consulta Inicial', quantidade: 1, valor: 150.00 },
      { nome: 'Radiografia Panorâmica', quantidade: 1, valor: 200.00 },
      { nome: 'Tratamento de Canal', quantidade: 2, valor: 425.00 }
    ],
    observacoes: 'Desconto de 10% para pagamento à vista. Parcelamento em até 6x sem juros.'
  };

  try {
    const resultado = await smsService.enviarOrcamento(dados);
    console.log('✅ Orçamento enviado:', resultado.messageId);
  } catch (error) {
    console.error('❌ Erro ao enviar orçamento:', error.message);
  }
}

// Exemplo 5: Cancelar agendamento
async function exemploCancelamento() {
  console.log('❌ Enviando cancelamento...');
  
  const dados = {
    telefone: '+5511999999999',
    nome: 'Ana Costa',
    servico: 'Consulta de Rotina',
    data: '30/07/2025',
    hora: '14:30',
    motivo: 'Reagendamento solicitado pelo paciente devido a compromisso de trabalho'
  };

  try {
    const resultado = await smsService.enviarCancelamentoAgendamento(dados);
    console.log('✅ Cancelamento enviado:', resultado.messageId);
  } catch (error) {
    console.error('❌ Erro ao enviar cancelamento:', error.message);
  }
}

// Exemplo 6: Reagendar consulta
async function exemploReagendamento() {
  console.log('📅 Enviando reagendamento...');
  
  const dados = {
    telefone: '+5511999999999',
    nome: 'Pedro Lima',
    servico: 'Extração de Siso',
    dataAnterior: '25/07/2025',
    horaAnterior: '10:00',
    dataNova: '02/08/2025',
    horaNova: '15:30'
  };

  try {
    const resultado = await smsService.enviarReagendamento(dados);
    console.log('✅ Reagendamento enviado:', resultado.messageId);
  } catch (error) {
    console.error('❌ Erro ao enviar reagendamento:', error.message);
  }
}

// Exemplo 7: Boas-vindas para novo paciente
async function exemploBoasVindas() {
  console.log('🎉 Enviando boas-vindas...');
  
  const dados = {
    telefone: '+5511999999999',
    nome: 'Lucia Fernandes',
    email: 'lucia@email.com'
  };

  try {
    const resultado = await smsService.enviarBoasVindas(dados);
    console.log('✅ Boas-vindas enviado:', resultado.messageId);
  } catch (error) {
    console.error('❌ Erro ao enviar boas-vindas:', error.message);
  }
}

// Exemplo 8: Envio em lote para múltiplos pacientes
async function exemploEnvioLote() {
  console.log('📬 Enviando mensagens em lote...');
  
  const mensagens = [
    {
      tipo: 'sms',
      telefone: '+5511999999999',
      mensagem: 'Lembrete: Você tem consulta agendada para amanhã às 14:00.'
    },
    {
      tipo: 'whatsapp',
      telefone: '+5511888888888',
      mensagem: 'Seu resultado de exame já está disponível no portal.'
    },
    {
      tipo: 'sms',
      telefone: '+5511777777777',
      mensagem: 'Confirmação: Seu agendamento foi realizado com sucesso.'
    }
  ];

  try {
    const resultados = await smsService.enviarEmLote(mensagens);
    
    console.log('📊 Resultados do envio em lote:');
    resultados.forEach((resultado, index) => {
      const status = resultado.sucesso ? '✅ Enviado' : '❌ Falhou';
      console.log(`  Mensagem ${index + 1} (${resultado.telefone}): ${status}`);
      if (resultado.erro) {
        console.log(`    Erro: ${resultado.erro}`);
      }
    });
  } catch (error) {
    console.error('❌ Erro no envio em lote:', error.message);
  }
}

// Exemplo 9: Verificar status de entrega
async function exemploVerificarStatus() {
  console.log('📊 Verificando status de entrega...');
  
  const messageId = 'SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // ID de mensagem Twilio
  
  try {
    const status = await smsService.verificarStatusEntrega(messageId, 'sms');
    
    console.log('📱 Status da mensagem:');
    console.log(`  Status: ${status.status}`);
    if (status.erro) {
      console.log(`  Erro: ${status.erro}`);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
  }
}

// Exemplo 10: Integração com sistema de agendamento
async function exemploIntegracaoAgendamento() {
  console.log('🔄 Simulando integração com sistema de agendamento...');
  
  // Simular dados vindos do sistema de agendamento
  const agendamento = {
    id: 'AGD-2025-001',
    paciente: {
      nome: 'Roberto Silva',
      telefone: '(11) 99999-9999',
      email: 'roberto@email.com'
    },
    consulta: {
      servico: 'Consulta Cardiológica',
      data: '2025-08-01',
      hora: '16:00',
      medico: 'Dr. Marcio',
      local: 'Consultório Centro'
    }
  };

  try {
    // 1. Enviar confirmação imediatamente
    await smsService.enviarConfirmacaoAgendamento({
      telefone: agendamento.paciente.telefone,
      nome: agendamento.paciente.nome,
      servico: agendamento.consulta.servico,
      data: new Date(`${agendamento.consulta.data}T${agendamento.consulta.hora}:00`)
    });
    
    console.log('✅ Confirmação enviada para', agendamento.paciente.nome);
    
    // 2. Programar lembrete para 24h antes (simulado)
    console.log('📅 Lembrete programado para 24h antes da consulta');
    
    // 3. Log da operação
    console.log(`📝 Agendamento ${agendamento.id} processado com sucesso`);
    
  } catch (error) {
    console.error('❌ Erro na integração:', error.message);
  }
}

// Função principal para executar todos os exemplos
async function executarExemplos() {
  console.log('🚀 Executando exemplos do SMSService...\n');

  // Primeiro, verificar configuração
  try {
    const config = await smsService.testarConfiguracao();
    
    if (!config.twilio && !config.whatsapp) {
      console.log('⚠️ Nenhuma configuração de SMS/WhatsApp encontrada.');
      console.log('Configure as credenciais no arquivo .env antes de testar os envios.\n');
      console.log('📝 Executando apenas exemplos que não enviam mensagens...\n');
    }

    await exemploConfirmacaoAgendamento();
    console.log('\n' + '-'.repeat(30) + '\n');
    
    await exemploLembrete24h();
    console.log('\n' + '-'.repeat(30) + '\n');
    
    await exemploCodigoVerificacao();
    console.log('\n' + '-'.repeat(30) + '\n');
    
    await exemploOrcamento();
    console.log('\n' + '-'.repeat(30) + '\n');
    
    await exemploCancelamento();
    console.log('\n' + '-'.repeat(30) + '\n');
    
    await exemploReagendamento();
    console.log('\n' + '-'.repeat(30) + '\n');
    
    await exemploBoasVindas();
    console.log('\n' + '-'.repeat(30) + '\n');
    
    await exemploEnvioLote();
    console.log('\n' + '-'.repeat(30) + '\n');
    
    await exemploIntegracaoAgendamento();
    
    console.log('\n🎉 Todos os exemplos foram executados!');
    console.log('\n📝 Lembre-se de:');
    console.log('- Configurar as credenciais Twilio e/ou WhatsApp');
    console.log('- Usar números reais apenas em produção');
    console.log('- Respeitar os limites de taxa dos provedores');
    console.log('- Criar templates WhatsApp no Facebook Business Manager');
    console.log('- Monitorar custos de envio');

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
  exemploCodigoVerificacao,
  exemploOrcamento,
  exemploCancelamento,
  exemploReagendamento,
  exemploBoasVindas,
  exemploEnvioLote,
  exemploVerificarStatus,
  exemploIntegracaoAgendamento,
  executarExemplos
};
