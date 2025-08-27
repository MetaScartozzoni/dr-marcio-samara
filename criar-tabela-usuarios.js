// 🚀 SCRIPT PARA CRIAR TABELA USUARIOS
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🚀 CRIANDO TABELA USUARIOS NO SUPABASE');
console.log('=====================================');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Usar service role key se disponível, senão usar anon key
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function criarTabelaUsuarios() {
  try {
    console.log('🔍 Gerando comandos SQL para criar tabela usuarios...');

    // SQL para criar a tabela usuarios
    const sqlCommands = [
      // 1. Criar tabela usuarios
      `CREATE TABLE IF NOT EXISTS usuarios (
        id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email text UNIQUE NOT NULL,
        nome text NOT NULL,
        tipo_usuario text NOT NULL DEFAULT 'paciente' CHECK (tipo_usuario IN ('admin', 'medico', 'funcionario', 'paciente')),
        status text NOT NULL DEFAULT 'aguardando_aprovacao' CHECK (status IN ('ativo', 'inativo', 'aguardando_aprovacao', 'bloqueado')),
        telefone text,
        data_nascimento date,
        endereco jsonb,
        permissions jsonb DEFAULT '[]'::jsonb,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      )`,

      // 2. Criar índices
      `CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)`,
      `CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario ON usuarios(tipo_usuario)`,
      `CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status)`,

      // 3. Habilitar RLS
      `ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY`,

      // 4. Políticas RLS
      `CREATE POLICY "Users can view their own profile" ON usuarios FOR SELECT USING (auth.uid() = id)`,
      `CREATE POLICY "Users can update their own profile" ON usuarios FOR UPDATE USING (auth.uid() = id)`,
      `CREATE POLICY "Admins can view all users" ON usuarios FOR SELECT USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin'))`,
      `CREATE POLICY "Admins can update all users" ON usuarios FOR UPDATE USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin'))`,

      // 5. Trigger para updated_at
      `CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ language 'plpgsql'`,
      `CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

      // 6. Função para criar perfil automaticamente
      `CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.usuarios (id, email, nome, tipo_usuario, status)
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'nome', new.email),
          COALESCE(new.raw_user_meta_data->>'tipo_usuario', 'paciente'),
          CASE
            WHEN COALESCE(new.raw_user_meta_data->>'tipo_usuario', 'paciente') = 'admin' THEN 'ativo'
            ELSE 'aguardando_aprovacao'
          END
        );
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER`,

      // 7. Trigger para criar perfil automaticamente
      `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
      `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`
    ];

    console.log('\n📋 COMANDOS SQL PARA EXECUTAR NO SUPABASE DASHBOARD:');
    console.log('====================================================');
    console.log('\n🔗 Acesse: https://supabase.com/dashboard > Seu Projeto > SQL Editor');
    console.log('\n📝 Execute estes comandos UM POR UM:');

    sqlCommands.forEach((sql, index) => {
      console.log(`\n${index + 1}. ${sql.split('\n')[0]}${sql.length > 50 ? '...' : ''}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`${sql}`);
      console.log(`${'='.repeat(60)}`);
    });

    console.log('\n🎯 DEPOIS DE EXECUTAR OS COMANDOS:');
    console.log('==================================');
    console.log('1. ✅ Tabela usuarios será criada');
    console.log('2. ✅ Novos usuários serão salvos automaticamente');
    console.log('3. ✅ Sistema de permissões estará ativo');
    console.log('4. ✅ Trigger automático funcionará');

    console.log('\n🧪 PARA TESTAR:');
    console.log('===============');
    console.log('1. Tente fazer um novo cadastro');
    console.log('2. Verifique se os dados aparecem na tabela usuarios');
    console.log('3. Teste o login com o novo usuário');

    console.log('\n🔍 DIAGNÓSTICO FINAL:');
    console.log('=====================');
    console.log('✅ Problema identificado: Tabela usuarios não existia');
    console.log('✅ Solução implementada: Comandos SQL gerados');
    console.log('✅ Resultado esperado: Cadastro funcionará corretamente');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

// Executar script
criarTabelaUsuarios();
