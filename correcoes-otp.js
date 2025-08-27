// 🔧 CORREÇÕES PARA PROBLEMAS DE VERIFICAÇÃO OTP
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔧 CORREÇÕES PARA VERIFICAÇÃO OTP');
console.log('=====================================');

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

async function aplicarCorrecoes() {
  try {
    console.log('🔍 Analisando possíveis correções...\n');

    // 1. Verificar configuração atual
    console.log('1️⃣  Verificando configuração atual...');
    const { data: config, error: configError } = await supabase.auth.getSession();

    if (configError) {
      console.error('❌ Erro de configuração:', configError.message);
      return;
    }

    console.log('✅ Configuração básica OK');

    // 2. Testar diferentes abordagens de verificação
    console.log('\n2️⃣  Testando diferentes abordagens...');

    const testEmail = 'correcao-otp@example.com';
    const testPassword = 'VeryStrongPassword2024!@#$%';

    // Registrar usuário
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome_completo: 'Usuário Correção OTP',
          tipo_usuario: 'paciente'
        }
      }
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('❌ Erro no registro:', signUpError.message);
      return;
    }

    console.log('✅ Usuário pronto para testes');

    // Aguardar rate limiting
    console.log('⏳ Aguardando 60 segundos...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    // 3. Testar método alternativo de envio
    console.log('\n3️⃣  Testando método alternativo de envio...');

    // Método 1: Usando signUp novamente (pode reenviar código)
    console.log('🔄 Tentativa 1: Re-registro para reenviar código...');
    const { error: resendError1 } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome_completo: 'Usuário Correção OTP',
          tipo_usuario: 'paciente'
        }
      }
    });

    if (resendError1) {
      console.log('❌ Método 1 falhou:', resendError1.message);
    } else {
      console.log('✅ Método 1 funcionou!');
    }

    // Aguardar novamente
    console.log('⏳ Aguardando mais 60 segundos...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Método 2: Usando resend tradicional
    console.log('🔄 Tentativa 2: Método resend tradicional...');
    const { error: resendError2 } = await supabase.auth.resend({
      type: 'signup',
      email: testEmail,
    });

    if (resendError2) {
      console.log('❌ Método 2 falhou:', resendError2.message);
    } else {
      console.log('✅ Método 2 funcionou!');
    }

    // 4. Análise de possíveis problemas
    console.log('\n4️⃣  ANÁLISE DE POSSÍVEIS PROBLEMAS:');
    console.log('=====================================');

    console.log('\n🔍 PROBLEMA IDENTIFICADO:');
    console.log('Baseado nos testes anteriores, o problema mais provável é:');

    console.log('\n🚨 RATE LIMITING AGRESSIVO:');
    console.log('- Supabase está bloqueando reenvios por até 53+ segundos');
    console.log('- Isso pode estar afetando a experiência do usuário');

    console.log('\n🚨 POSSÍVEL SOLUÇÃO - CONFIGURAÇÃO:');
    console.log('No Supabase Dashboard > Authentication > Rate Limits:');
    console.log('- Aumentar limite de "Send email OTP"');
    console.log('- Configurar período de cooldown menor');
    console.log('- Verificar se há bloqueios por IP');

    console.log('\n🚨 POSSÍVEL SOLUÇÃO - CÓDIGO:');
    console.log('No AuthContext.jsx, adicionar tratamento melhor:');

    console.log('\n💡 IMPLEMENTAÇÃO RECOMENDADA:');
    console.log(`
// No AuthContext.jsx - melhorar verifyOtpCode
const verifyOtpCode = async (email, code) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: code,
      type: 'signup',
    });

    if (error) {
      // Tratar erros específicos
      if (error.message.includes('invalid')) {
        throw new Error('Código inválido. Verifique o código digitado.');
      }
      if (error.message.includes('expired')) {
        throw new Error('Código expirado. Solicite um novo código.');
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Muitas tentativas. Aguarde alguns minutos.');
      }
      if (error.message.includes('already')) {
        throw new Error('Email já confirmado. Você pode fazer login.');
      }

      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro na verificação OTP:', error);
    throw error;
  }
};
`);

    console.log('\n💡 MELHORIAS PARA sendVerificationCode:');
    console.log(`
// Melhorar tratamento de rate limiting
const sendVerificationCode = async (email) => {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      if (error.message.includes('rate limit') || error.message.includes('after')) {
        const waitTime = error.message.match(/after (\\d+) seconds?/);
        const seconds = waitTime ? parseInt(waitTime[1]) : 60;

        throw new Error(\`Aguarde \${seconds} segundos antes de solicitar um novo código.\`);
      }

      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao enviar código:', error);
    throw error;
  }
};
`);

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Acesse Supabase Dashboard > Authentication > Rate Limits');
    console.log('2. Ajuste as configurações de rate limiting');
    console.log('3. Atualize o AuthContext.jsx com o código melhorado');
    console.log('4. Teste novamente o fluxo completo');

    console.log('\n📊 CONFIGURAÇÕES RECOMENDADAS NO SUPABASE:');
    console.log('- Send email OTP: 10 requests per minute');
    console.log('- Verify email OTP: 5 requests per minute');
    console.log('- Cooldown period: 30 seconds (ao invés de 53+)');

  } catch (error) {
    console.error('❌ ERRO inesperado:', error.message);
  }
}

// Executar correções
aplicarCorrecoes();
