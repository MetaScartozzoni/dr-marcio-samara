// test-email-confirmation.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 DIAGNÓSTICO DE CONFIGURAÇÃO DE EMAIL');
console.log('=====================================');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas');
  console.log('Verifique se o arquivo .env existe com:');
  console.log('REACT_APP_SUPABASE_URL=...');
  console.log('REACT_APP_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

console.log('✅ SUPABASE_URL: Configurado');
console.log(`✅ SUPABASE_ANON_KEY: Configurado (comprimento: ${supabaseKey.length})`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

async function testConnection() {
  try {
    console.log('\n🔍 Testando conexão com Supabase...');

    const { error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ ERRO na conexão:', error.message);
      return;
    }

    console.log('✅ Conexão estabelecida com sucesso');

    // Testar configuração de auth
    console.log('\n🔍 Verificando configurações de autenticação...');

    // Tentar fazer uma chamada simples para verificar se a API está respondendo
    const { error: configError } = await supabase
      .from('_supabase_auth')
      .select('*')
      .limit(1);

    if (configError) {
      console.log('⚠️  Nota: Não foi possível verificar configurações internas (normal)');
    }

    console.log('\n📋 CONFIGURAÇÕES DETECTADAS:');
    console.log(`URL do Supabase: ${supabaseUrl}`);
    console.log(`Key Length: ${supabaseKey.length} caracteres`);
    console.log(`Flow Type: PKCE`);
    console.log(`Auto Refresh Token: Habilitado`);
    console.log(`Persist Session: Habilitado`);
    console.log(`Detect Session in URL: Habilitado`);

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Acesse https://supabase.com/dashboard');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá para Authentication > Settings');
    console.log('4. Configure as seguintes URLs de redirecionamento:');
    console.log('   - http://localhost:3000/email-confirmation');
    console.log('   - http://localhost:3000/login');
    console.log('   - http://localhost:3000/dashboard');
    console.log('5. Certifique-se de que "Enable email confirmations" está ativado');

    console.log('\n🔧 CONFIGURAÇÃO DO CLIENT SUPABASE:');
    console.log('Se o problema persistir, podemos ajustar a configuração do cliente.');

  } catch (error) {
    console.error('❌ ERRO inesperado:', error.message);
  }
}

testConnection();
