// test-supabase-auth.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Teste específico de autenticação Supabase');
console.log('=============================================\n');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔍 Testando diferentes métodos de autenticação...\n');

  // Teste 1: Signup com email e senha
  console.log('1️⃣  Testando signup...');
  try {
    const testEmail = `test-auth-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome_completo: 'Test User',
          tipo_usuario: 'paciente'
        }
      }
    });

    if (error) {
      console.log('❌ Erro no signup:', error.message);
      console.log('Código do erro:', error.status);
      console.log('Detalhes:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Signup bem-sucedido');
      console.log('Usuário criado:', data.user?.email);
      console.log('Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');
    }
  } catch (err) {
    console.log('❌ Erro inesperado no signup:', err.message);
  }

  // Teste 2: Signin com credenciais incorretas
  console.log('\n2️⃣  Testando signin com credenciais inválidas...');
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'invalid@example.com',
      password: 'invalid'
    });

    if (error) {
      console.log('✅ Erro esperado no signin:', error.message);
    } else {
      console.log('❌ Signin não deveria ter sucesso');
    }
  } catch (err) {
    console.log('❌ Erro inesperado no signin:', err.message);
  }

  // Teste 3: Verificar configurações do projeto
  console.log('\n3️⃣  Verificando configurações do projeto...');
  try {
    // Tentar acessar informações públicas do projeto
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('⚠️  Erro ao acessar tabela profiles:', error.message);
      console.log('Código:', error.code);
    } else {
      console.log('✅ Acesso à tabela profiles OK');
    }
  } catch (err) {
    console.log('❌ Erro inesperado ao verificar tabelas:', err.message);
  }

  console.log('\n🎉 Teste de autenticação concluído!');
}

testAuth().catch(console.error);
