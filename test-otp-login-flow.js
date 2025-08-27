// test-otp-login-flow.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔐 TESTE COMPLETO DO FLUXO OTP LOGIN');
console.log('=====================================\n');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOTPLoginFlow() {
  const testEmail = `test-otp-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!@#Strong2024';

  console.log('📧 Email de teste:', testEmail);
  console.log('🔑 Senha de teste:', testPassword.replace(/./g, '*'));

  try {
    // 1. Criar usuário
    console.log('\n1️⃣  Criando usuário...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome_completo: 'Test User OTP',
          tipo_usuario: 'paciente'
        }
      }
    });

    if (signupError) {
      console.log('❌ Erro no signup:', signupError.message);
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('   ID:', signupData.user?.id);
    console.log('   Email confirmado:', signupData.user?.email_confirmed_at ? 'Sim' : 'Não');

    // 2. Fazer login com senha
    console.log('\n2️⃣  Fazendo login com senha...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('   Token de acesso:', loginData.session?.access_token ? 'Presente' : 'Ausente');
    console.log('   Token de refresh:', loginData.session?.refresh_token ? 'Presente' : 'Ausente');

    // 3. Testar renovação de token
    console.log('\n3️⃣  Testando renovação de token...');
    const { error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: loginData.session.refresh_token
    });

    if (refreshError) {
      console.log('❌ Erro na renovação:', refreshError.message);
    } else {
      console.log('✅ Token renovado com sucesso!');
    }

    // 4. Logout
    console.log('\n4️⃣  Fazendo logout...');
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      console.log('❌ Erro no logout:', logoutError.message);
    } else {
      console.log('✅ Logout realizado com sucesso!');
    }

    // 5. Verificar se ainda há sessão
    console.log('\n5️⃣  Verificando sessão após logout...');
    const { data: sessionData } = await supabase.auth.getSession();

    console.log('   Sessão ativa:', sessionData.session ? 'Sim' : 'Não');

    console.log('\n🎉 FLUXO OTP LOGIN CONCLUÍDO COM SUCESSO!');

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

testOTPLoginFlow().catch(console.error);
