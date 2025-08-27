// 🔍 DIAGNÓSTICO ESPECÍFICO: Problema na Verificação OTP
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 DIAGNÓSTICO ESPECÍFICO - VERIFICAÇÃO OTP');
console.log('==============================================');

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

async function testarVerificacaoOtp() {
  try {
    console.log('🔍 Iniciando teste específico de verificação...\n');

    // Usar um email fixo para testes consistentes
    const testEmail = 'teste-diagnostico@example.com';
    const testPassword = 'VeryStrongPassword2024!@#$%';

    console.log(`📧 Email de teste: ${testEmail}`);

    // PASSO 1: Registrar usuário (se não existir)
    console.log('\n1️⃣  Registrando usuário de teste...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome_completo: 'Usuário Diagnóstico OTP',
          tipo_usuario: 'paciente'
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('✅ Usuário já existe, continuando...');
      } else {
        console.error('❌ Erro no registro:', signUpError.message);
        return;
      }
    } else {
      console.log('✅ Usuário registrado com sucesso!');
      console.log(`👤 User ID: ${signUpData.user?.id}`);
    }

    // PASSO 2: Aguardar e enviar código
    console.log('\n2️⃣  Enviando código de verificação...');

    // Aguardar um pouco antes de tentar enviar
    console.log('⏳ Aguardando 60 segundos para evitar rate limiting...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: testEmail,
    });

    if (resendError) {
      console.error('❌ Erro ao enviar código:', resendError.message);

      if (resendError.message.includes('rate limit') || resendError.message.includes('after')) {
        const waitTime = resendError.message.match(/after (\d+) seconds?/);
        if (waitTime) {
          console.log(`🚨 Rate limit: aguardar ${waitTime[1]} segundos`);
          return;
        }
      }

      return;
    }

    console.log('✅ Código enviado com sucesso!');

    // PASSO 3: Solicitar código ao usuário
    console.log('\n3️⃣  AGUARDANDO CÓDIGO...');
    console.log('📧 Verifique seu email e digite o código de 6 dígitos:');

    // Simular entrada do usuário (em produção seria input real)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Digite o código OTP: ', async (codigo) => {
        rl.close();

        if (!codigo || codigo.length !== 6) {
          console.log('❌ Código inválido. Deve ter 6 dígitos.');
          resolve();
          return;
        }

        // PASSO 4: Testar verificação
        console.log('\n4️⃣  Testando verificação do código...');

        try {
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            email: testEmail,
            token: codigo,
            type: 'signup',
          });

          if (verifyError) {
            console.error('❌ ERRO NA VERIFICAÇÃO:', verifyError.message);
            console.log('\n🔍 ANÁLISE DO ERRO:');

            if (verifyError.message.includes('invalid')) {
              console.log('🔴 Código inválido ou incorreto');
            } else if (verifyError.message.includes('expired')) {
              console.log('🔴 Código expirado (tempo limite padrão: 1 hora)');
            } else if (verifyError.message.includes('rate limit')) {
              console.log('🔴 Rate limiting - muitas tentativas');
            } else if (verifyError.message.includes('already')) {
              console.log('🔴 Email já confirmado anteriormente');
            } else {
              console.log('🔴 Erro desconhecido:', verifyError.message);
            }

            console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
            console.log('1. Verifique se o código está correto');
            console.log('2. Certifique-se de que não passou 1 hora desde o envio');
            console.log('3. Tente reenviar um novo código');
            console.log('4. Verifique os logs no Supabase Dashboard');

          } else {
            console.log('✅ VERIFICAÇÃO BEM-SUCEDIDA!');
            console.log(`👤 Usuário: ${verifyData.user?.email}`);
            console.log(`📧 Confirmado: ${verifyData.user?.email_confirmed_at ? 'Sim' : 'Não'}`);
            console.log(`🔑 Sessão criada: ${verifyData.session ? 'Sim' : 'Não'}`);
          }

        } catch (error) {
          console.error('❌ ERRO INESPERADO:', error.message);
        }

        resolve();
      });
    });

  } catch (error) {
    console.error('❌ ERRO inesperado no teste:', error.message);
  }
}

// Executar teste
testarVerificacaoOtp().then(() => {
  console.log('\n🏁 Teste concluído!');
});
