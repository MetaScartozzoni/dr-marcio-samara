// 🔍 DIAGNÓSTICO: Erro na Verificação de Código OTP
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 DIAGNÓSTICO DE ERRO NA VERIFICAÇÃO OTP');
console.log('==========================================');

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

async function diagnosticarErroOtp() {
  try {
    console.log('🔍 Iniciando diagnóstico...\n');

    // Teste 1: Verificar configuração atual
    console.log('1️⃣  Verificando configuração do Supabase...');
    const { error: configError } = await supabase.auth.getSession();

    if (configError) {
      console.error('❌ Erro de configuração:', configError.message);
      return;
    }
    console.log('✅ Configuração OK');

    // Teste 2: Simular fluxo completo
    console.log('\n2️⃣  Simulando fluxo completo de registro + verificação...');
    const testEmail = `diag-otp-${Date.now()}@example.com`;
    const testPassword = 'VeryStrongPassword2024!@#$%';

    console.log(`📧 Email de teste: ${testEmail}`);

    // Registrar usuário
    console.log('📝 Registrando usuário...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome_completo: 'Usuário Diagnóstico',
          tipo_usuario: 'paciente'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Erro no registro:', signUpError.message);

      if (signUpError.message.includes('rate limit')) {
        console.log('🚨 SOLUÇÃO: Aguarde 15-30 minutos antes de tentar novamente');
        console.log('💡 Dica: Verifique os limites de rate no Supabase Dashboard');
      }

      return;
    }

    console.log('✅ Usuário registrado com sucesso!');
    console.log(`👤 User ID: ${signUpData.user?.id}`);
    console.log(`📧 Email confirmado: ${signUpData.user?.email_confirmed_at ? 'Sim' : 'Não'}`);

    // Aguardar um pouco
    console.log('⏳ Aguardando 5 segundos...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Teste 3: Tentar diferentes tipos de verificação
    console.log('\n3️⃣  Testando diferentes tipos de verificação...');

    // Primeiro, tentar reenviar código
    console.log('🔄 Enviando código de verificação...');
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: testEmail,
    });

    if (resendError) {
      console.error('❌ Erro ao enviar código:', resendError.message);

      if (resendError.message.includes('rate limit')) {
        console.log('🚨 RATE LIMIT: Muitos códigos enviados recentemente');
        return;
      }

      // Tentar outros tipos
      console.log('🔄 Tentando outros tipos de reenvio...');

      const tipos = ['email', 'recovery'];
      for (const tipo of tipos) {
        console.log(`🔄 Tentando tipo: ${tipo}`);
        const { error: tipoError } = await supabase.auth.resend({
          type: tipo,
          email: testEmail,
        });

        if (!tipoError) {
          console.log(`✅ Tipo ${tipo} funcionou!`);
          break;
        } else {
          console.log(`❌ Tipo ${tipo} falhou: ${tipoError.message}`);
        }
      }
    } else {
      console.log('✅ Código enviado com sucesso!');
    }

    // Aguardar código chegar
    console.log('⏳ Aguardando 3 segundos para o email chegar...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Teste 4: Simular verificação com código fictício
    console.log('\n4️⃣  Testando verificação com código fictício...');
    const codigoFicticio = '123456';

    try {
      await supabase.auth.verifyOtp({
        email: testEmail,
        token: codigoFicticio,
        type: 'signup',
      });

      console.log('✅ Verificação funcionou (inesperado com código fictício)');
    } catch (error) {
      console.error('❌ Erro inesperado na verificação:', error.message);
    }

    // Teste 5: Verificar configuração do projeto
    console.log('\n5️⃣  Verificando configuração do projeto...');

    // Verificar se o usuário existe
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (userError) {
      console.log('⚠️  Nota: Não foi possível verificar usuário na tabela auth');
    } else {
      console.log('✅ Usuário encontrado na base de dados');
      console.log(`📧 Email confirmado: ${userData.email_confirmed_at ? 'Sim' : 'Não'}`);
      console.log(`📅 Criado em: ${userData.created_at}`);
    }

  } catch (error) {
    console.error('❌ ERRO inesperado no diagnóstico:', error.message);
  }

  // Análise final e recomendações
  console.log('\n🎯 ANÁLISE FINAL E RECOMENDAÇÕES');
  console.log('==================================');

  console.log('\n🔧 POSSÍVEIS CAUSAS DO ERRO:');
  console.log('1. ✅ Tipo de verificação incorreto (signup vs email)');
  console.log('2. ✅ Código expirado (padrão: 1 hora)');
  console.log('3. ✅ Rate limiting do Supabase');
  console.log('4. ✅ Configuração incorreta do projeto');
  console.log('5. ✅ Problema na implementação do verifyOtpCode');

  console.log('\n💡 SOLUÇÕES RECOMENDADAS:');
  console.log('1. Verificar o tipo correto no Supabase Dashboard');
  console.log('2. Aumentar tempo de expiração se necessário');
  console.log('3. Verificar logs no Supabase Dashboard');
  console.log('4. Testar com diferentes tipos de verificação');
  console.log('5. Verificar configuração de rate limiting');

  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('1. Execute este diagnóstico: node diagnostico-otp-erro.js');
  console.log('2. Verifique os logs no Supabase Dashboard');
  console.log('3. Teste com um email real');
  console.log('4. Ajuste a implementação conforme necessário');

  console.log('\n📞 SUPORTE:');
  console.log('Se o problema persistir, verifique:');
  console.log('- Supabase Dashboard > Authentication > Logs');
  console.log('- Configurações de rate limiting');
  console.log('- Templates de email ativos');
}

// Executar diagnóstico
diagnosticarErroOtp();
