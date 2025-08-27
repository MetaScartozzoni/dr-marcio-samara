// fix-rls-policies.js
// Script para corrigir políticas RLS problemáticas
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔧 CORREÇÃO DE POLÍTICAS RLS');
console.log('===============================\n');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  console.log('🔍 Verificando políticas RLS problemáticas...\n');

  // SQL para corrigir políticas RLS
  const fixPoliciesSQL = `
    -- =============================================
    -- CORREÇÃO DE POLÍTICAS RLS PROBLEMÁTICAS
    -- =============================================

    -- 1. Corrigir tabela usuarios
    ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
    ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

    -- Remover políticas problemáticas
    DROP POLICY IF EXISTS "Users can view their own profile" ON usuarios;
    DROP POLICY IF EXISTS "Users can update their own profile" ON usuarios;
    DROP POLICY IF EXISTS "Admins can view all users" ON usuarios;
    DROP POLICY IF EXISTS "Admins can update all users" ON usuarios;
    DROP POLICY IF EXISTS "Staff can view patients" ON usuarios;

    -- Criar políticas corretas para usuarios
    CREATE POLICY "Users can view own profile" ON usuarios
        FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON usuarios
        FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Admins can view all users" ON usuarios
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM usuarios
                WHERE id = auth.uid() AND tipo_usuario = 'admin'
            )
        );

    CREATE POLICY "Admins can update all users" ON usuarios
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM usuarios
                WHERE id = auth.uid() AND tipo_usuario = 'admin'
            )
        );

    -- 2. Corrigir tabela profiles (se existir)
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- Remover políticas problemáticas da tabela profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

    -- Criar políticas corretas para profiles
    CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Admins can view all profiles" ON profiles
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND tipo_usuario = 'admin'
            )
        );

    CREATE POLICY "Admins can update all profiles" ON profiles
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND tipo_usuario = 'admin'
            )
        );
  `;

  console.log('📋 SQL para corrigir políticas RLS:');
  console.log('=====================================');
  console.log(fixPoliciesSQL);
  console.log('\n💡 Execute este SQL no SQL Editor do Supabase\n');

  // Testar acesso após correção
  console.log('🔍 Testando acesso às tabelas...\n');

  // Testar usuarios
  try {
    const { error: usuariosError } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);

    if (usuariosError) {
      console.log('❌ Ainda há erro em usuarios:', usuariosError.message);
    } else {
      console.log('✅ usuarios acessível após correção');
    }
  } catch (err) {
    console.log('❌ Erro ao testar usuarios:', err.message);
  }

  // Testar profiles
  try {
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      console.log('❌ Ainda há erro em profiles:', profilesError.message);
      console.log('   (Isso é normal se a tabela não existir)');
    } else {
      console.log('✅ profiles acessível');
    }
  } catch (err) {
    console.log('❌ Erro ao testar profiles:', err.message);
  }

  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('===================');
  console.log('1. ✅ Executar SQL de correção no Supabase');
  console.log('2. 🔄 Criar tabela profiles padronizada');
  console.log('3. 🔄 Migrar dados de usuarios para profiles');
  console.log('4. 🔄 Atualizar código para usar profiles');
  console.log('5. 🧪 Testar aplicação completa');
  console.log('');
  console.log('💡 Execute o script migration-usuarios-to-profiles.js novamente');
  console.log('   após corrigir as políticas RLS');
}

// Executar correção
if (require.main === module) {
  fixRLSPolicies().catch(console.error);
}

module.exports = { fixRLSPolicies };
