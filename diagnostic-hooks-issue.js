// diagnostic-hooks-issue.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 DIAGNÓSTICO: Hook Authorization Token Issue');
console.log('================================================');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas');
  process.exit(1);
}

async function testLoginWithoutHooks() {
  try {
    console.log('🔍 Testando login com configuração básica...\n');

    // Criar cliente com configuração mínima (sem hooks)
    const supabaseBasic = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    // Teste 1: Verificar conexão básica
    console.log('1️⃣  Testando conexão básica...');
    const { error: sessionError } = await supabaseBasic.auth.getSession();

    if (sessionError) {
      console.error('❌ Erro na sessão:', sessionError.message);
    } else {
      console.log('✅ Conexão básica OK');
    }

    // Teste 2: Tentar login com configuração básica
    console.log('\n2️⃣  Testando login com configuração básica...');
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';

    const { error: loginError } = await supabaseBasic.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.error('❌ Erro no login (esperado para email inexistente):', loginError.message);

      if (loginError.message.includes('Hook requires authorization token')) {
        console.log('\n🚨 PROBLEMA IDENTIFICADO:');
        console.log('===========================');
        console.log('• Há hooks configurados no Supabase que exigem autorização');
        console.log('• O cliente atual está enviando tokens incorretos');
        console.log('• Isso pode estar causando o erro 500');

        console.log('\n🔧 SOLUÇÕES:');
        console.log('=============');
        console.log('1. Verificar hooks no Supabase Dashboard');
        console.log('2. Desabilitar hooks problemáticos');
        console.log('3. Ajustar permissões dos hooks');
        console.log('4. Usar configuração básica do cliente');
      }
    } else {
      console.log('✅ Login básico funcionou (inesperado)');
    }

    console.log('\n🎯 RECOMENDAÇÕES:');
    console.log('==================');

    console.log('\n1️⃣  Verificar Hooks no Supabase:');
    console.log('   • Acesse: https://supabase.com/dashboard');
    console.log('   • Selecione seu projeto');
    console.log('   • Vá para: Database > Hooks');
    console.log('   • Verifique se há hooks ativos');
    console.log('   • Desabilite hooks que podem estar causando problemas');

    console.log('\n2️⃣  Configuração Atual do Cliente:');
    console.log('   ✅ Removido redirectTo do cliente');
    console.log('   ✅ Configuração simplificada');
    console.log('   ✅ Tratamento de erro melhorado');

    console.log('\n3️⃣  Para Desenvolvimento:');
    console.log('   • Use a configuração básica se necessário');
    console.log('   • Teste em modo incógnito');
    console.log('   • Limpe cache e cookies');

    console.log('\n🚨 SE O PROBLEMA PERSISTIR:');
    console.log('=============================');
    console.log('• Vá ao Supabase Dashboard > Settings > API');
    console.log('• Verifique as configurações de autenticação');
    console.log('• Considere recriar as chaves API');
    console.log('• Entre em contato com o suporte do Supabase');

  } catch (error) {
    console.error('❌ ERRO inesperado:', error.message);
  }
}

testLoginWithoutHooks();
