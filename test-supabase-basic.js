// test-supabase-basic.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Teste básico de conexão Supabase');
console.log('=====================================\n');

// Verificar variáveis
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl ? '✅' : '❌');
console.log('Key length:', supabaseKey ? supabaseKey.length : '❌');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis não configuradas');
  process.exit(1);
}

// Testar criação do cliente
try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Cliente criado com sucesso');

  // Testar uma operação simples que não requer autenticação
  // Vamos tentar acessar uma tabela pública ou fazer uma query simples
  console.log('\n🔍 Testando operações básicas...');

  // Tentar fazer uma query que não requer autenticação
  // Por exemplo, verificar se conseguimos acessar informações do projeto
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.log('❌ Erro na operação básica:', error.message);
      console.log('Detalhes:', error);
    } else {
      console.log('✅ Operação básica funcionando');
      console.log('Sessão:', data.session ? 'Existe' : 'Nenhuma');
    }

    console.log('\n🎉 Teste concluído!');
  }).catch(err => {
    console.error('❌ Erro inesperado:', err.message);
  });

} catch (error) {
  console.error('❌ Erro ao criar cliente:', error.message);
  process.exit(1);
}
