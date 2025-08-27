// create-profiles-standard.js
// Script para criar tabela profiles padronizada em inglês
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🌍 CRIANDO TABELA PROFILES PADRONIZADA (INGLÊS)');
console.log('=================================================\n');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProfilesTable() {
  console.log('🔍 Verificando estrutura atual...\n');

  // Verificar se tabela profiles já existe
  try {
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log('✅ Tabela profiles não existe - será criada');
    } else if (error) {
      console.log('⚠️  Erro ao verificar profiles:', error.message);
    } else {
      console.log('✅ Tabela profiles já existe');
    }
  } catch (err) {
    console.log('⚠️  Erro ao verificar profiles:', err.message);
  }

  // SQL para criar tabela profiles padronizada
  const createProfilesSQL = `
    -- =============================================
    -- TABELA PROFILES PADRONIZADA (INGLÊS)
    -- =============================================

    -- Criar tabela profiles padronizada em inglês
    CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        email TEXT UNIQUE,
        full_name TEXT NOT NULL,
        phone TEXT,
        date_of_birth DATE,
        cpf TEXT UNIQUE,
        role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('admin', 'doctor', 'staff', 'patient')),
        status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('active', 'inactive', 'pending_approval', 'blocked')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Criar índices para melhor performance
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
    CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

    -- Habilitar RLS (Row Level Security)
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Políticas de segurança para usuários autenticados
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Staff can view patients" ON public.profiles;

    CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);

    -- Política para administradores verem todos os perfis
    CREATE POLICY "Admins can view all profiles" ON public.profiles
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        );

    CREATE POLICY "Admins can update all profiles" ON public.profiles
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        );

    -- Política para médicos e funcionários verem pacientes
    CREATE POLICY "Staff can view patients" ON public.profiles
        FOR SELECT USING (
            role = 'patient' OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'staff')
            )
        );
  `;

  console.log('📋 SQL para criar tabela profiles padronizada:');
  console.log('===============================================');
  console.log(createProfilesSQL);
  console.log('\n💡 Execute este SQL no SQL Editor do Supabase\n');

  // SQL para migrar dados
  const migrateDataSQL = `
    -- =============================================
    -- MIGRAÇÃO DE DADOS (usuarios → profiles)
    -- =============================================

    -- Migrar dados da tabela usuarios para profiles
    INSERT INTO public.profiles (
        id, email, full_name, phone, date_of_birth,
        cpf, role, status, created_at, updated_at
    )
    SELECT
        id, email, nome_completo, telefone, data_nascimento,
        cpf,
        CASE
            WHEN tipo_usuario = 'paciente' THEN 'patient'
            WHEN tipo_usuario = 'admin' THEN 'admin'
            WHEN tipo_usuario = 'medico' THEN 'doctor'
            WHEN tipo_usuario = 'funcionario' THEN 'staff'
            ELSE 'patient'
        END as role,
        CASE
            WHEN status = 'ativo' THEN 'active'
            WHEN status = 'inativo' THEN 'inactive'
            WHEN status = 'aguardando_aprovacao' THEN 'pending_approval'
            WHEN status = 'bloqueado' THEN 'blocked'
            ELSE 'pending_approval'
        END as status,
        criado_em, atualizado_em
    FROM public.usuarios
    WHERE id NOT IN (SELECT id FROM public.profiles)
    ON CONFLICT (id) DO NOTHING;
  `;

  console.log('📋 SQL para migrar dados:');
  console.log('==========================');
  console.log(migrateDataSQL);
  console.log('\n💡 Execute este SQL após criar a tabela profiles\n');

  // SQL para verificação
  const verifyMigrationSQL = `
    -- =============================================
    -- VERIFICAÇÃO DA MIGRAÇÃO
    -- =============================================

    -- Verificar quantos registros foram migrados
    SELECT
        (SELECT COUNT(*) FROM public.profiles) as profiles_count,
        (SELECT COUNT(*) FROM public.usuarios) as usuarios_count;

    -- Verificar distribuição por role
    SELECT role, COUNT(*) as count
    FROM public.profiles
    GROUP BY role
    ORDER BY role;

    -- Verificar distribuição por status
    SELECT status, COUNT(*) as count
    FROM public.profiles
    GROUP BY status
    ORDER BY status;
  `;

  console.log('📋 SQL para verificar migração:');
  console.log('================================');
  console.log(verifyMigrationSQL);
  console.log('\n💡 Execute este SQL para verificar se a migração foi bem-sucedida\n');

  console.log('🎯 RESUMO DAS MUDANÇAS:');
  console.log('=======================');
  console.log('✅ Tabela profiles em inglês');
  console.log('✅ Colunas padronizadas:');
  console.log('   - full_name (antes: nome_completo)');
  console.log('   - phone (antes: telefone)');
  console.log('   - role (antes: tipo_usuario)');
  console.log('   - status (nova coluna)');
  console.log('   - date_of_birth (antes: data_nascimento)');
  console.log('   - created_at/updated_at (antes: criado_em/atualizado_em)');
  console.log('✅ Roles padronizados: admin, doctor, staff, patient');
  console.log('✅ Status padronizados: active, inactive, pending_approval, blocked');
  console.log('');

  console.log('🚀 PRÓXIMOS PASSOS:');
  console.log('===================');
  console.log('1. ✅ Executar SQL de criação da tabela');
  console.log('2. 🔄 Executar SQL de migração de dados');
  console.log('3. 🔄 Executar SQL de verificação');
  console.log('4. 🔄 Atualizar código para usar nova estrutura');
  console.log('5. 🧪 Testar aplicação');
  console.log('');

  console.log('💡 Execute os SQLs na ordem mostrada no SQL Editor do Supabase');
}

// Executar criação
if (require.main === module) {
  createProfilesTable().catch(console.error);
}

module.exports = { createProfilesTable };
