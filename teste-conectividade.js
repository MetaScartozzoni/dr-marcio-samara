// 🔍 TESTE SIMPLES DE CONECTIVIDADE SUPABASE
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 TESTE BÁSICO DE CONECTIVIDADE SUPABASE');
console.log('==========================================');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('📋 CONFIGURAÇÕES:');
console.log(`   URL: ${supabaseUrl ? '✅ Definida' : '❌ Não definida'}`);
console.log(`   KEY: ${supabaseKey ? '✅ Definida (' + supabaseKey.length + ' chars)' : '❌ Não definida'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ ERRO: Variáveis de ambiente não encontradas!');
  console.log('💡 Verifique o arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testeBasico() {
  try {
    console.log('\n🔍 Testando conexão básica...');

    // Teste 1: Verificar sessão atual (não requer tabelas)
    const { data: session, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Erro na sessão:', sessionError.message);
      return;
    }

    console.log('✅ Conexão básica OK');
    console.log(`   Sessão: ${session.session ? 'Ativa' : 'Inativa'}`);

    // Teste 2: Tentar fazer uma consulta simples que não depende de tabelas específicas
    console.log('\n🔍 Testando consulta simples...');

    // Vamos tentar consultar uma tabela que sabemos que pode existir
    const tablesToTest = ['usuarios', 'profiles', 'consultas'];

    for (const table of tablesToTest) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count')
          .limit(1);

        if (error) {
          if (error.message.includes('Could not find the table')) {
            console.log(`   ${table}: ❌ Tabela não existe`);
          } else if (error.message.includes('permission denied')) {
            console.log(`   ${table}: ⚠️  Sem permissão`);
          } else {
            console.log(`   ${table}: ⚠️  ${error.message}`);
          }
        } else {
          console.log(`   ${table}: ✅ OK`);
        }
      } catch (e) {
        console.log(`   ${table}: ❌ Erro - ${e.message}`);
      }
    }

    // Teste 3: Verificar se podemos fazer uma operação de escrita simples
    console.log('\n🔍 Testando capacidades...');

    // Tentar criar um usuário de teste (vamos cancelar se funcionar)
    const testEmail = `test-connectivity-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log('   Criando usuário de teste...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome: 'Teste Conectividade',
          tipo_usuario: 'paciente'
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('rate limit')) {
        console.log('   ⚠️  Rate limit atingido (aguarde alguns minutos)');
      } else {
        console.log(`   ❌ Erro no cadastro: ${signUpError.message}`);
      }
    } else {
      console.log('   ✅ Cadastro OK');
      console.log(`   👤 User ID: ${signUpData.user?.id}`);

      // Limpar o usuário de teste
      if (signUpData.user?.id) {
        console.log('   🧹 Limpando usuário de teste...');
        // Note: Em produção, você usaria service role key para deletar
        console.log('   ℹ️  Usuário de teste criado (será limpo manualmente se necessário)');
      }
    }

    console.log('\n🎯 DIAGNÓSTICO:');
    console.log('===============');

    if (sessionError) {
      console.log('❌ Problema de conectividade');
      console.log('💡 Verifique:');
      console.log('   - URL do Supabase está correta');
      console.log('   - Chave anon key está válida');
      console.log('   - Conexão com internet OK');
    } else {
      console.log('✅ Conectividade básica funcionando');
      console.log('💡 Status das tabelas:');
      console.log('   - Se tabelas não existem: Execute os comandos SQL');
      console.log('   - Se sem permissão: Verifique RLS policies');
    }

    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('===================');
    console.log('1. Se conectividade OK: Execute comandos SQL no Supabase Dashboard');
    console.log('2. Se erro de conexão: Verifique credenciais no .env');
    console.log('3. Teste novamente após correções');

  } catch (error) {
    console.error('❌ ERRO INESPERADO:', error.message);
  }
}

testeBasico();
