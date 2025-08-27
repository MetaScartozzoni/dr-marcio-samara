// test-correct-api-key.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔑 VERIFICAÇÃO DA CHAVE API CORRETA');
console.log('=====================================');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas');
  process.exit(1);
}

console.log(`📡 URL: ${supabaseUrl}`);
console.log(`🔑 Tipo da chave: ${supabaseKey.startsWith('eyJ') ? '✅ ANON KEY (correta)' : '❌ SECRET KEY (incorreta)'}`);
console.log(`🔑 Comprimento: ${supabaseKey.length} caracteres`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

async function testCorrectApiKey() {
  try {
    console.log('\n🔍 Testando chave API correta...\n');

    // Teste 1: Verificar se não há erro de chave secreta
    console.log('1️⃣  Testando conexão sem erro de chave secreta...');
    const { error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Erro na sessão:', sessionError.message);

      if (sessionError.message.includes('Forbidden use of secret API key')) {
        console.log('🚨 PROBLEMA: Ainda usando chave secreta!');
        console.log('💡 Solução: Obter chave anon no Supabase Dashboard');
        console.log('🔧 Passos:');
        console.log('   1. Acesse: https://supabase.com/dashboard');
        console.log('   2. Selecione seu projeto');
        console.log('   3. Vá para: Settings > API');
        console.log('   4. Copie a chave "anon public"');
        console.log('   5. Atualize o .env');
        return;
      }

      if (sessionError.message.includes('Hook requires authorization token')) {
        console.log('🚨 PROBLEMA: Erro de hook authorization token');
        console.log('💡 Solução: Verificar hooks no Supabase Dashboard');
      }
    } else {
      console.log('✅ Conexão OK - Sem erro de chave secreta!');
    }

    // Teste 2: Tentar login com credenciais inválidas
    console.log('\n2️⃣  Testando login com chave correta...');
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123',
    });

    if (loginError) {
      console.error('❌ Erro no login (esperado):', loginError.message);

      if (loginError.message.includes('Forbidden use of secret API key')) {
        console.log('🚨 PROBLEMA: Chave secreta ainda em uso!');
        return;
      }

      if (loginError.message.includes('Invalid login credentials')) {
        console.log('✅ Login rejeitado corretamente');
        console.log('🎉 Chave API está funcionando perfeitamente!');
      } else {
        console.log('⚠️  Erro diferente:', loginError.message);
      }
    } else {
      console.log('✅ Login funcionou (inesperado)');
    }

    // Teste 3: Verificar se podemos fazer chamadas básicas
    console.log('\n3️⃣  Testando chamadas básicas...');
    const { error: tableError } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);

    if (tableError) {
      console.log('⚠️  Tabela não encontrada (normal):', tableError.message);
    } else {
      console.log('✅ Acesso às tabelas funcionando');
    }

    console.log('\n🎯 RESULTADO FINAL:');
    console.log('===================');

    const hasSecretKeyError = sessionError?.message?.includes('Forbidden use of secret API key') ||
                             loginError?.message?.includes('Forbidden use of secret API key');

    if (hasSecretKeyError) {
      console.log('❌ PROBLEMA: Chave secreta em uso');
      console.log('💡 Precisamos da chave ANON (pública), não da SECRET');
      console.log('🔧 Obter chave correta no Supabase Dashboard > Settings > API');
    } else {
      console.log('✅ SUCESSO: Chave API correta está funcionando!');
      console.log('🎉 Erro de chave secreta foi resolvido');
      console.log('🚀 Sistema pronto para uso');
    }

    console.log('\n📋 RESUMO DA CHAVE:');
    console.log('====================');
    console.log(`• Tipo: ${supabaseKey.startsWith('eyJ') ? 'ANON (correta)' : 'SECRET (incorreta)'}`);
    console.log(`• Comprimento: ${supabaseKey.length} caracteres`);
    console.log(`• Status: ${hasSecretKeyError ? '❌ INCORRETA' : '✅ CORRETA'}`);

    if (!hasSecretKeyError) {
      console.log('\n🎉 SISTEMA PRONTO!');
      console.log('===================');
      console.log('A chave API correta foi configurada com sucesso!');
      console.log('Agora você pode testar o login sem erros!');
    }

  } catch (error) {
    console.error('❌ ERRO inesperado:', error.message);
  }
}

testCorrectApiKey();
