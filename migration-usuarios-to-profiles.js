// migration-usuarios-to-profiles.js
// Script para migrar da estrutura confusa para o padrão Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔄 MIGRAÇÃO: usuarios → profiles (Padrão Supabase)');
console.log('===================================================\n');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateToProfiles() {
  console.log('🔍 Passo 1: Verificando estrutura atual...\n');

  // Verificar tabelas existentes
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['usuarios', 'profiles']);

    if (error) {
      console.log('⚠️  Não foi possível verificar tabelas via SQL');
      console.log('Continuando com verificação direta...\n');
    } else {
      console.log('📋 Tabelas encontradas:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      console.log('');
    }
  } catch (err) {
    console.log('⚠️  Erro ao verificar tabelas:', err.message);
  }

  // Testar acesso às tabelas
  console.log('🔍 Passo 2: Testando acesso às tabelas...\n');

  // Testar tabela usuarios
  try {
    const { error: usuariosError } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);

    if (usuariosError) {
      console.log('❌ Erro ao acessar usuarios:', usuariosError.message);
    } else {
      console.log('✅ Tabela usuarios acessível');
    }
  } catch (err) {
    console.log('❌ Erro ao testar usuarios:', err.message);
  }

  // Testar tabela profiles
  try {
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      console.log('❌ Erro ao acessar profiles:', profilesError.message);
      console.log('   (Isso é esperado se a tabela não existir ainda)');
    } else {
      console.log('✅ Tabela profiles acessível');
    }
  } catch (err) {
    console.log('❌ Erro ao testar profiles:', err.message);
  }

  console.log('\n🔧 Passo 3: Criando tabela profiles padronizada...\n');

  // SQL para criar tabela profiles
  const createProfilesSQL = `
    -- Criar tabela profiles padronizada
    CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        email TEXT UNIQUE,
        nome_completo TEXT NOT NULL,
        telefone TEXT,
        data_nascimento DATE,
        cpf TEXT UNIQUE,
        tipo_usuario TEXT NOT NULL DEFAULT 'paciente',
        ativo BOOLEAN NOT NULL DEFAULT true,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_tipo_usuario ON public.profiles(tipo_usuario);

    -- Habilitar RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Políticas RLS (remover se já existirem)
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

    -- Criar políticas RLS
    CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Admins can view all profiles" ON public.profiles
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND tipo_usuario = 'admin'
            )
        );
  `;

  try {
    // Nota: Este método pode não funcionar dependendo das permissões
    // Se não funcionar, o usuário precisará executar o SQL manualmente
    console.log('⚠️  Para criar a tabela profiles, execute este SQL no painel do Supabase:');
    console.log('📄 SQL para criar tabela profiles:');
    console.log(createProfilesSQL);
    console.log('\n🔄 Ou use o SQL Editor no painel do Supabase\n');

  } catch (err) {
    console.log('❌ Erro ao criar tabela:', err.message);
  }

  console.log('🔄 Passo 4: Preparando migração de dados...\n');

  // SQL para migrar dados
  const migrateDataSQL = `
    -- Migrar dados da tabela usuarios para profiles
    -- (Execute apenas se a tabela profiles foi criada)
    INSERT INTO public.profiles (
        id, email, nome_completo, telefone, data_nascimento,
        cpf, tipo_usuario, ativo, criado_em, atualizado_em
    )
    SELECT
        id, email, nome_completo, telefone, data_nascimento,
        cpf, tipo_usuario, ativo, criado_em, atualizado_em
    FROM public.usuarios
    WHERE id NOT IN (SELECT id FROM public.profiles)
    ON CONFLICT (id) DO NOTHING;
  `;

  console.log('📋 SQL para migrar dados:');
  console.log(migrateDataSQL);
  console.log('');

  console.log('🔧 Passo 5: Instruções para atualização do código...\n');

  console.log('📝 Código que precisa ser atualizado:');
  console.log('');

  console.log('1. ❌ ANTES (problemático):');
  console.log('   const profile = user.profiles; // Não existe!');
  console.log('');

  console.log('2. ✅ DEPOIS (correto):');
  console.log(`   const { data: profile } = await supabase
       .from('profiles')
       .select('*')
       .eq('id', user.id)
       .single();`);
  console.log('');

  console.log('🔍 Passo 6: Verificando arquivos que precisam ser atualizados...\n');

  // Procurar arquivos que referenciam user.profiles ou usuarios
  const fs = require('fs');
  const path = require('path');

  function findFilesWithPattern(dir, pattern, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        findFilesWithPattern(filePath, pattern, fileList);
      } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes(pattern)) {
            fileList.push(filePath);
          }
        } catch (err) {
          // Ignorar arquivos que não podem ser lidos
        }
      }
    });

    return fileList;
  }

  // Procurar referências problemáticas
  const filesWithUserProfiles = findFilesWithPattern('.', 'user.profiles');
  const filesWithUsuarios = findFilesWithPattern('.', '.from(\'usuarios\')');

  if (filesWithUserProfiles.length > 0) {
    console.log('📁 Arquivos com "user.profiles" (precisam ser corrigidos):');
    filesWithUserProfiles.forEach(file => {
      console.log(`   - ${file}`);
    });
  } else {
    console.log('✅ Nenhum arquivo encontrado com "user.profiles"');
  }

  if (filesWithUsuarios.length > 0) {
    console.log('\n📁 Arquivos com ".from(\'usuarios\')" (podem precisar atualização):');
    filesWithUsuarios.forEach(file => {
      console.log(`   - ${file}`);
    });
  } else {
    console.log('✅ Nenhum arquivo encontrado com ".from(\'usuarios\')"');
  }

  console.log('\n🎯 RESUMO DA MIGRAÇÃO:');
  console.log('======================');
  console.log('');
  console.log('✅ Diagnóstico concluído');
  console.log('📋 SQL para criar tabela profiles fornecido');
  console.log('📋 SQL para migrar dados fornecido');
  console.log('📁 Arquivos que precisam ser atualizados identificados');
  console.log('');
  console.log('🚀 PRÓXIMOS PASSOS:');
  console.log('===================');
  console.log('1. Executar SQL para criar tabela profiles');
  console.log('2. Executar SQL para migrar dados');
  console.log('3. Atualizar referências no código');
  console.log('4. Testar aplicação');
  console.log('5. Remover tabela usuarios antiga (opcional)');
  console.log('');
  console.log('💡 Dica: Use o SQL Editor no painel do Supabase para executar os comandos');
  console.log('');
  console.log('🎉 Migração preparada com sucesso!');
}

// Executar migração
if (require.main === module) {
  migrateToProfiles().catch(console.error);
}

module.exports = { migrateToProfiles };
