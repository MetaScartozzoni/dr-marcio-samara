// test-email-rate-limit.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 TESTE DE RATE LIMITING DE EMAIL');
console.log('===================================');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

async function testRateLimit() {
  try {
    console.log('🔍 Testando rate limiting...\n');

    // Teste com senha forte
    const testPassword = 'TestPassword123!@#';

    // Tentar registrar vários usuários rapidamente para testar rate limit
    console.log('📧 Fazendo múltiplas tentativas de registro...\n');

    for (let i = 1; i <= 3; i++) {
      const testEmail = `test-rate-limit-${Date.now()}-${i}@example.com`;

      console.log(`Tentativa ${i}: Registrando ${testEmail}`);

      const { error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          redirectTo: 'http://localhost:3000/email-confirmation'
        }
      });

      if (error) {
        console.error(`❌ Erro na tentativa ${i}:`, error.message);

        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          console.log(`\n🚨 RATE LIMITING DETECTADO na tentativa ${i}!`);
          console.log('💡 Isso significa que o Supabase está bloqueando emails.');
          break;
        }
      } else {
        console.log(`✅ Tentativa ${i} bem-sucedida - Email enviado`);
      }

      // Pequena pausa entre tentativas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎯 ANÁLISE DO RATE LIMITING:');
    console.log('=====================================');

    console.log('\n🔧 RECOMENDAÇÕES IMEDIATAS:');
    console.log('1. ✅ AGUARDE 15-30 minutos antes de tentar novamente');
    console.log('2. ✅ Vá ao Supabase Dashboard > Authentication > Rate Limits');
    console.log('3. ✅ Verifique as configurações atuais de rate limit');
    console.log('4. ✅ Considere aumentar os limites se necessário');

    console.log('\n📧 DICAS PARA RECEBER EMAILS:');
    console.log('• Use um email real (Gmail, Outlook, etc.)');
    console.log('• Verifique a caixa de spam');
    console.log('• Aguarde alguns minutos após o registro');
    console.log('• Tente registrar apenas uma vez por email');

    console.log('\n🚨 SE O PROBLEMA PERSISTIR:');
    console.log('• Vá ao Supabase Dashboard > Authentication > Logs');
    console.log('• Procure por "rate limit" ou "email" nos logs');
    console.log('• Verifique se há configuração de SMTP personalizada');

  } catch (error) {
    console.error('❌ ERRO inesperado:', error.message);
  }
}

testRateLimit();
