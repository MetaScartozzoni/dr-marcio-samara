// test-password-policy.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 TESTE DE POLÍTICA DE SENHA');
console.log('===============================');

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

// Senhas para testar (da mais simples para mais complexa)
const testPasswords = [
  'senha123',
  'Senha123',
  'MinhaSenha123',
  'MinhaSenha123!',
  'PortalMedico2024!',
  'Supabase2024!@#$',
  'DrMarcio2024!@#$%'
];

async function runPasswordTests() {
  console.log('🔍 Testando diferentes senhas...\n');

  for (let i = 0; i < testPasswords.length; i++) {
    const password = testPasswords[i];
    const testEmail = `test-pwd-${Date.now()}-${i}@example.com`;

    console.log(`\n${i + 1}. Testando senha: "${password}"`);
    console.log(`   Email: ${testEmail}`);

    try {
      const { error } = await supabase.auth.signUp({
        email: testEmail,
        password: password,
        options: {
          redirectTo: 'http://localhost:3000/email-confirmation'
        }
      });

      if (error) {
        if (error.message.includes('weak') || error.message.includes('guess')) {
          console.log(`   ❌ REJEITADA: Senha muito fraca`);
        } else if (error.message.includes('rate limit')) {
          console.log(`   ❌ BLOQUEADA: Rate limiting ativo`);
          break;
        } else {
          console.log(`   ❌ ERRO: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ACEITA: Senha válida!`);
        console.log(`   📧 Email de confirmação enviado`);
        break; // Para no primeiro sucesso
      }
    } catch (error) {
      console.log(`   ❌ ERRO INESPERADO: ${error.message}`);
    }

    // Pequena pausa entre tentativas
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n🎯 RESULTADO:');
  console.log('==============');
  console.log('\n🔧 RECOMENDAÇÕES:');
  console.log('1. Use uma das senhas que foram ACEITAS');
  console.log('2. Se nenhuma funcionou, ajuste as configurações no Supabase Dashboard');
  console.log('3. Vá para Authentication > Settings > Security');
  console.log('4. Reduza os requisitos de senha para desenvolvimento');

  console.log('\n📧 PARA O USUÁRIO FINAL:');
  console.log('• Use senhas com pelo menos 8 caracteres');
  console.log('• Inclua letras maiúsculas e minúsculas');
  console.log('• Adicione números');
  console.log('• Use símbolos se possível (!@#$%...)');
}

runPasswordTests();
