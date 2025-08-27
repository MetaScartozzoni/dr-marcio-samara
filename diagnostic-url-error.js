// diagnostic-url-error.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Diagnóstico de erro "Invalid URL" do Supabase');
console.log('================================================\n');

// Verificar variáveis de ambiente
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('1. Variáveis de ambiente:');
console.log('   REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Indefinida');
console.log('   REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Definida (comprimento: ' + supabaseKey.length + ')' : '❌ Indefinida');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

// Verificar formato da URL
console.log('\n2. Validação da URL:');
try {
  const url = new URL(supabaseUrl);
  console.log('   ✅ URL válida:', url.href);
  console.log('   Protocolo:', url.protocol);
  console.log('   Hostname:', url.hostname);
  console.log('   Pathname:', url.pathname);
} catch (error) {
  console.error('   ❌ URL inválida:', error.message);
  console.error('   URL fornecida:', supabaseUrl);
  process.exit(1);
}

// Verificar formato da chave
console.log('\n3. Validação da chave API:');
if (supabaseKey.length < 100) {
  console.error('   ❌ Chave API muito curta (comprimento:', supabaseKey.length, ')');
  process.exit(1);
} else {
  console.log('   ✅ Chave API tem comprimento adequado');
}

// Testar criação do cliente
console.log('\n4. Teste de criação do cliente Supabase:');
try {
  createClient(supabaseUrl, supabaseKey);
  console.log('   ✅ Cliente Supabase criado com sucesso');
} catch (error) {
  console.error('   ❌ Erro ao criar cliente Supabase:', error.message);
  process.exit(1);
}

// Testar conexão básica
console.log('\n5. Teste de conexão básica:');
try {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Teste 1: Verificar se conseguimos fazer uma chamada básica
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('   ❌ Erro na conexão:', error.message);
    console.error('   Detalhes do erro:', JSON.stringify(error, null, 2));
  } else {
    console.log('   ✅ Conexão básica funcionando');
    console.log('   Sessão atual:', data.session ? 'Existe' : 'Nenhuma');
  }
} catch (error) {
  console.error('   ❌ Erro inesperado:', error.message);
  console.error('   Stack trace:', error.stack);
}

console.log('\n🎉 Diagnóstico concluído!');
