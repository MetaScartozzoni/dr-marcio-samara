// test-sms-real.js
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env manualmente
const envPath = path.join(__dirname, '.env');
const envFile = fs.readFileSync(envPath, 'utf8');

console.log('📁 Carregando arquivo .env...');

// Parse manual do arquivo .env
envFile.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    process.env[key.trim()] = value;
  }
});

console.log('🔧 Configurações Twilio:');
console.log('📱 Account SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Configurado' : '❌ Não encontrado');
console.log('🔑 Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '✅ Configurado' : '❌ Não encontrado');
console.log('📞 Messaging Service:', process.env.TWILIO_MESSAGING_SERVICE_SID ? '✅ Configurado' : '❌ Não encontrado');

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.error('❌ Credenciais Twilio não encontradas!');
  process.exit(1);
}

console.log('\n🧪 Testando SMS Service...');

try {
  const smsService = require('./src/services/sms.service.js');
  
  console.log('📋 Métodos disponíveis:', Object.getOwnPropertyNames(Object.getPrototypeOf(smsService)).filter(name => name !== 'constructor'));
  
  // Teste de envio de SMS simples primeiro
  smsService.enviarSMS('+5511932357636', 'Teste SMS Service - Dr. Marcio').then(resultado => {
    console.log('✅ Resultado do teste SMS:', resultado);
    
    if (resultado.sucesso) {
      console.log('🎉 SMS enviado com sucesso!');
      console.log('📨 Message ID:', resultado.messageId);
    } else {
      console.log('❌ Falha no envio:', resultado.erro);
    }
  }).catch(error => {
    console.error('❌ Erro no teste:', error.message);
  });
  
} catch (error) {
  console.error('❌ Erro ao carregar SMS Service:', error.message);
  console.error('📋 Stack trace:', error.stack);
}
