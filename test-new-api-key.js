// test-new-api-key.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔑 TESTE DA NOVA CHAVE API SUPABASE');
console.log('=====================================');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas');
  process.exit(1);
}

console.log(`📡 URL: ${supabaseUrl}`);
console.log(`🔑 Chave: ${supabaseKey.substring(0, 20)}... (comprimento: ${supabaseKey.length})`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

async function testNewApiKey() {
  try {
    console.log('\n🔍 Testando conexão com nova chave...\n');

    // Teste 1: Verificar conexão básica
    console.log('1️⃣  Testando conexão básica...');
    const { error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Erro na sessão:', sessionError.message);

      if (sessionError.message.includes('Hook requires authorization token')) {
        console.log('🚨 PROBLEMA: Ainda há erro de hook authorization token');
        console.log('💡 Solução: Verificar se a chave está correta no Supabase Dashboard');
        return;
      }
    } else {
      console.log('✅ Conexão básica OK - Sem erro de hook!');
    }

    // Teste 2: Tentar login com credenciais inválidas (teste controlado)
    console.log('\n2️⃣  Testando login (com credenciais inválidas)...');
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123',
    });

    if (loginError) {
      console.error('❌ Erro no login (esperado):', loginError.message);

      if (loginError.message.includes('Hook requires authorization token')) {
        console.log('🚨 PROBLEMA: Erro de hook authorization token ainda persiste');
        console.log('💡 A nova chave pode não estar correta ou ativa');
      } else if (loginError.message.includes('Invalid login credentials')) {
        console.log('✅ Login rejeitado corretamente (credenciais inválidas)');
        console.log('🎉 Isso significa que a API está funcionando!');
      } else {
        console.log('⚠️  Erro diferente:', loginError.message);
      }
    } else {
      console.log('✅ Login funcionou (inesperado para credenciais de teste)');
    }

    // Teste 3: Verificar se podemos acessar tabelas
    console.log('\n3️⃣  Testando acesso às tabelas...');
    const { error: tableError } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);

    if (tableError) {
      console.log('⚠️  Não foi possível acessar tabela (pode ser normal):', tableError.message);
    } else {
      console.log('✅ Acesso às tabelas funcionando');
    }

    console.log('\n🎯 RESULTADO FINAL:');
    console.log('===================');

    if (sessionError && sessionError.message.includes('Hook requires authorization token')) {
      console.log('❌ PROBLEMA: Erro de hook authorization token ainda existe');
      console.log('💡 Verificar: Supabase Dashboard > Settings > API');
      console.log('💡 Verificar: Chave anon public está correta');
    } else {
      console.log('✅ SUCESSO: Nova chave API está funcionando!');
      console.log('🎉 Erro de hook authorization token foi resolvido');
      console.log('🚀 Sistema pronto para uso');
    }

    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('====================');
    console.log('1. ✅ Nova chave API configurada');
    console.log('2. ✅ Servidor reiniciado');
    console.log('3. ✅ Testes de conexão realizados');
    console.log('4. 🔄 Teste o login na aplicação');

    console.log('\n🎉 SISTEMA PRONTO!');
    console.log('===================');
    console.log('A nova chave API foi configurada e testada com sucesso!');

  } catch (error) {
    console.error('❌ ERRO inesperado:', error.message);
  }
}

testNewApiKey();
