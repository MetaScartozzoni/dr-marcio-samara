// diagnostic-email-issues.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 DIAGNÓSTICO DE PROBLEMAS DE EMAIL');
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

async function testEmailSystem() {
  try {
    console.log('🔍 Testando sistema de email...\n');

    // Teste 1: Verificar configuração de email
    console.log('1️⃣  Verificando configuração de autenticação...');
    const { error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('❌ Erro na configuração de auth:', authError.message);
    } else {
      console.log('✅ Configuração de auth OK');
    }

    // Teste 2: Tentar registrar um usuário de teste
    console.log('\n2️⃣  Testando registro de usuário...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    console.log(`📧 Tentando registrar: ${testEmail}`);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        redirectTo: 'http://localhost:3000/email-confirmation'
      }
    });

    if (signUpError) {
      console.error('❌ Erro no registro:', signUpError.message);

      // Verificar se é rate limiting
      if (signUpError.message.includes('rate limit') || signUpError.message.includes('too many')) {
        console.log('\n🚨 POSSÍVEL CAUSA: Rate Limiting');
        console.log('O Supabase está bloqueando emails devido a muitos envios.');
        console.log('\n🔧 SOLUÇÕES:');
        console.log('1. Aguarde 15-30 minutos antes de tentar novamente');
        console.log('2. Verifique se não há muitos registros de teste');
        console.log('3. Vá ao dashboard do Supabase > Authentication > Rate Limits');
        console.log('4. Ajuste as configurações de rate limit se necessário');
      }

      if (signUpError.message.includes('SMTP') || signUpError.message.includes('email')) {
        console.log('\n🚨 POSSÍVEL CAUSA: Problema de SMTP');
        console.log('Configuração de email no Supabase pode estar com problema.');
        console.log('\n🔧 SOLUÇÕES:');
        console.log('1. Vá ao dashboard do Supabase > Authentication > Settings');
        console.log('2. Verifique as configurações de SMTP');
        console.log('3. Teste com um provedor de email diferente');
      }

    } else {
      console.log('✅ Registro realizado com sucesso!');
      console.log(`📧 Email enviado para: ${testEmail}`);
      console.log(`👤 User ID: ${signUpData.user?.id}`);
      console.log(`📧 Email confirmado: ${signUpData.user?.email_confirmed_at ? 'Sim' : 'Não'}`);

      if (signUpData.user && !signUpData.user.email_confirmed_at) {
        console.log('\n📧 Email de confirmação enviado!');
        console.log('Verifique sua caixa de entrada e spam.');
      }
    }

    // Teste 3: Verificar se há usuários existentes
    console.log('\n3️⃣  Verificando usuários existentes...');
    const { data: users, error: usersError } = await supabase
      .from('usuarios')
      .select('email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (usersError) {
      console.log('⚠️  Não foi possível verificar usuários (pode ser normal)');
    } else if (users && users.length > 0) {
      console.log(`✅ Encontrados ${users.length} usuários recentes:`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${new Date(user.created_at).toLocaleString()}`);
      });
    } else {
      console.log('ℹ️  Nenhum usuário encontrado na tabela usuarios');
    }

    console.log('\n🎯 RESUMO E RECOMENDAÇÕES:');
    console.log('=====================================');

    if (signUpError) {
      if (signUpError.message.includes('rate limit')) {
        console.log('🚨 PRINCIPAL PROBLEMA: Rate Limiting do Supabase');
        console.log('💡 SOLUÇÃO: Aguarde alguns minutos e tente novamente');
      } else if (signUpError.message.includes('SMTP')) {
        console.log('🚨 PRINCIPAL PROBLEMA: Configuração de Email');
        console.log('💡 SOLUÇÃO: Verifique configurações no dashboard do Supabase');
      } else {
        console.log('🚨 PROBLEMA: Erro desconhecido no registro');
        console.log('💡 SOLUÇÃO: Verifique configurações e tente novamente');
      }
    } else {
      console.log('✅ SISTEMA FUNCIONANDO: Emails sendo enviados');
      console.log('💡 Se não recebeu: Verifique spam, aguarde alguns minutos');
    }

    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Vá ao Supabase Dashboard > Authentication > Logs');
    console.log('2. Procure por erros relacionados a email');
    console.log('3. Verifique se há rate limiting ativo');
    console.log('4. Teste com um email real diferente');

  } catch (error) {
    console.error('❌ ERRO inesperado:', error.message);
  }
}

testEmailSystem();
