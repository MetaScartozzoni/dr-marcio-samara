// 🔧 SOLUÇÃO COMPLETA: SISTEMA DE PERFIS FUNCIONAL
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔧 SOLUÇÃO COMPLETA PARA SISTEMA DE PERFIS');
console.log('===========================================');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarSistemaPerfisCompleto() {
  try {
    console.log('🔍 Analisando situação atual...\n');

    // 1. Verificar tabelas existentes
    console.log('1️⃣  Verificando tabelas existentes...');

    const tabelasParaVerificar = ['usuarios', 'profiles'];

    for (const tabela of tabelasParaVerificar) {
      try {
        const { error } = await supabase.from(tabela).select('count').limit(1);
        if (error) {
          if (error.message.includes('Could not find the table')) {
            console.log(`❌ Tabela ${tabela} NÃO existe`);
          } else {
            console.log(`⚠️  Tabela ${tabela} com problemas: ${error.message}`);
          }
        } else {
          console.log(`✅ Tabela ${tabela} existe e está acessível`);
        }
      } catch (e) {
        console.log(`❌ Erro ao verificar ${tabela}: ${e.message}`);
      }
    }

    // 2. Estratégia de solução
    console.log('\n2️⃣  ESTRATÉGIA RECOMENDADA:');
    console.log('===========================');

    console.log('\n🎯 SOLUÇÃO: Unificar em uma única tabela usuarios bem configurada');
    console.log('✅ Vantagens:');
    console.log('   - Elimina conflitos entre tabelas');
    console.log('   - Simplifica o sistema');
    console.log('   - Melhor performance');
    console.log('   - Mais fácil de manter');

    // 3. Comandos SQL completos
    console.log('\n3️⃣  COMANDOS SQL PARA EXECUTAR NO SUPABASE DASHBOARD:');
    console.log('======================================================');

    const sqlCommands = [
      // 1. Corrigir tabela profiles (se existir)
      `-- Remover políticas problemáticas da tabela profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;`,

      // 2. Criar tabela usuarios completa
      `-- Criar tabela usuarios (sistema principal de perfis)
CREATE TABLE IF NOT EXISTS usuarios (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    nome text NOT NULL,
    tipo_usuario text NOT NULL DEFAULT 'paciente'
        CHECK (tipo_usuario IN ('admin', 'medico', 'funcionario', 'paciente')),
    status text NOT NULL DEFAULT 'aguardando_aprovacao'
        CHECK (status IN ('ativo', 'inativo', 'aguardando_aprovacao', 'bloqueado')),
    telefone text,
    data_nascimento date,
    endereco jsonb,
    permissions jsonb DEFAULT '[]'::jsonb,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);`,

      // 3. Índices para performance
      `-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);`,

      // 4. RLS e Políticas de Segurança
      `-- Habilitar Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "users_select_own" ON usuarios
    FOR SELECT USING (auth.uid() = id);

-- Política: Usuários podem atualizar seu próprio perfil
CREATE POLICY "users_update_own" ON usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Política: Administradores podem ver todos os usuários
CREATE POLICY "admins_select_all" ON usuarios
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin')
    );

-- Política: Administradores podem atualizar todos os usuários
CREATE POLICY "admins_update_all" ON usuarios
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin')
    );

-- Política: Médicos e funcionários podem ver pacientes
CREATE POLICY "staff_select_patients" ON usuarios
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_usuario IN ('admin', 'medico', 'funcionario'))
        AND tipo_usuario = 'paciente'
    );`,

      // 5. Trigger para updated_at
      `-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();`,

      // 6. Função para criar perfil automaticamente
      `-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, nome, tipo_usuario, status)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'tipo_usuario', 'paciente'),
        CASE
            WHEN COALESCE(new.raw_user_meta_data->>'tipo_usuario', 'paciente') = 'admin' THEN 'ativo'
            ELSE 'aguardando_aprovacao'
        END
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`,

      // 7. Trigger para criação automática
      `-- Trigger para executar função automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`,

      // 8. Migrar dados existentes (se houver)
      `-- Migrar dados da tabela profiles para usuarios (se existir)
INSERT INTO usuarios (id, email, nome, tipo_usuario, status, created_at, updated_at)
SELECT
    p.id,
    p.email,
    COALESCE(p.nome, p.email),
    COALESCE(p.tipo_usuario, 'paciente'),
    COALESCE(p.status, 'ativo'),
    p.created_at,
    p.updated_at
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.id = p.id)
ON CONFLICT (id) DO NOTHING;`
    ];

    // Exibir comandos
    sqlCommands.forEach((sql, index) => {
      console.log(`\n${index + 1}. ${sql.split('\n')[0]}`);
      console.log(`${'='.repeat(70)}`);
      console.log(`${sql}`);
      console.log(`${'='.repeat(70)}`);
    });

    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('======================');
    console.log('✅ Tabela usuarios criada e configurada');
    console.log('✅ Sistema de perfis funcional');
    console.log('✅ user.profiles será substituído por dados da tabela usuarios');
    console.log('✅ Novos cadastros funcionarão automaticamente');
    console.log('✅ Perfis criados automaticamente via trigger');

    console.log('\n🚀 PARA IMPLEMENTAR NO FRONTEND:');
    console.log('=================================');
    console.log('Substitua qualquer referência a user.profiles por:');
    console.log(`
const { data: userProfile } = await supabase
  .from('usuarios')
  .select('*')
  .eq('id', user.id)
  .single();

// Ou no AuthContext:
const profile = userProfile; // ao invés de user.profiles
`);

    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('===================');
    console.log('1. Execute os comandos SQL no Supabase Dashboard');
    console.log('2. Teste um novo cadastro');
    console.log('3. Verifique se os dados aparecem na tabela usuarios');
    console.log('4. Atualize o frontend para usar usuarios ao invés de profiles');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

// Executar solução
criarSistemaPerfisCompleto();
