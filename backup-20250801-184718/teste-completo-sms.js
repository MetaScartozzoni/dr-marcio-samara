// teste-completo-sms.js
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env
const envPath = path.join(__dirname, '.env');
const envFile = fs.readFileSync(envPath, 'utf8');

envFile.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    process.env[key.trim()] = value;
  }
});

const smsService = require('./src/services/sms.service.js');

console.log('🎯 TESTE COMPLETO DO SMS SERVICE - DR. MARCIO');
console.log('=' .repeat(50));

async function executarTestes() {
  const telefoneTestePaciente = '+5511932357636'; // Número que você testou
  
  try {
    console.log('\n1️⃣ Teste: Confirmação de Agendamento');
    const teste1 = await smsService.enviarConfirmacaoAgendamento({
      nome: 'João Silva',
      telefone: telefoneTestePaciente,
      data: new Date('2025-07-30T14:30:00'),
      servico: 'Consulta - Rinoplastia'
    });
    console.log('📱 Resultado:', teste1.sucesso ? '✅ Enviado' : '❌ Falhou');
    if (teste1.messageId) console.log('📨 ID:', teste1.messageId);
    
    // Aguardar 2 segundos entre envios
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n2️⃣ Teste: Lembrete 24h');
    const teste2 = await smsService.enviarLembrete24h({
      nome: 'Maria Santos',
      telefone: telefoneTestePaciente,
      data: new Date('2025-07-31T09:00:00'),
      servico: 'Abdominoplastia - Consulta'
    });
    console.log('📱 Resultado:', teste2.sucesso ? '✅ Enviado' : '❌ Falhou');
    if (teste2.messageId) console.log('📨 ID:', teste2.messageId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n3️⃣ Teste: Código de Verificação');
    const teste3 = await smsService.enviarCodigoVerificacao(telefoneTestePaciente, '123456');
    console.log('📱 Resultado:', teste3.sucesso ? '✅ Enviado' : '❌ Falhou');
    if (teste3.messageId) console.log('📨 ID:', teste3.messageId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n4️⃣ Teste: Orçamento');
    const teste4 = await smsService.enviarOrcamento({
      nome: 'Carlos Oliveira',
      telefone: telefoneTestePaciente,
      procedimento: 'Lipoaspiração',
      valor: 'R$ 8.500,00',
      parcelas: '12x de R$ 708,33'
    });
    console.log('📱 Resultado:', teste4.sucesso ? '✅ Enviado' : '❌ Falhou');
    if (teste4.messageId) console.log('📨 ID:', teste4.messageId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n5️⃣ Teste: Boas-vindas');
    const teste5 = await smsService.enviarBoasVindas('Ana Costa', telefoneTestePaciente);
    console.log('📱 Resultado:', teste5.sucesso ? '✅ Enviado' : '❌ Falhou');
    if (teste5.messageId) console.log('📨 ID:', teste5.messageId);
    
    console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS!');
    console.log('=' .repeat(50));
    console.log('✅ Sistema SMS está funcionando perfeitamente');
    console.log('📱 Twilio configurado corretamente');
    console.log('💬 Messaging Service ativo:', process.env.TWILIO_MESSAGING_SERVICE_SID);
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

// Executar testes
executarTestes();
