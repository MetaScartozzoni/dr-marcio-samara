-- ===========================================
-- 🔧 COMANDOS PARA LIMPAR E RECRIAR SISTEMA
-- ===========================================

-- 1. REMOVER TRIGGER E FUNÇÃO EXISTENTES (se existirem)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. REMOVER POLÍTICAS EXISTENTES (se existirem)
DROP POLICY IF EXISTS "users_select_own" ON usuarios;
DROP POLICY IF EXISTS "users_update_own" ON usuarios;
DROP POLICY IF EXISTS "admins_select_all" ON usuarios;
DROP POLICY IF EXISTS "admins_update_all" ON usuarios;
DROP POLICY IF EXISTS "staff_select_patients" ON usuarios;

-- 3. REMOVER ÍNDICES EXISTENTES (se existirem)
DROP INDEX IF EXISTS idx_usuarios_email;
DROP INDEX IF EXISTS idx_usuarios_tipo_usuario;
DROP INDEX IF EXISTS idx_usuarios_status;

-- 4. REMOVER TRIGGER UPDATED_AT (se existir)
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 5. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- ===========================================
-- 🔄 RECRIAR SISTEMA LIMPO
-- ===========================================

-- 6. CRIAR TABELA USUARIOS (se não existir)
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
);

-- 7. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

-- 8. HABILITAR RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 9. CRIAR POLÍTICAS DE SEGURANÇA
CREATE POLICY "users_select_own" ON usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON usuarios
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "admins_select_all" ON usuarios
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin')
    );

CREATE POLICY "admins_update_all" ON usuarios
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin')
    );

-- 10. CRIAR FUNÇÃO PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. CRIAR TRIGGER PARA UPDATED_AT
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. CRIAR FUNÇÃO PARA NOVOS USUÁRIOS
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. CRIAR TRIGGER PARA NOVOS USUÁRIOS
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- ✅ VERIFICAÇÃO FINAL
-- ===========================================

-- 14. VERIFICAR SE TUDO FUNCIONOU
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'usuarios';

-- 15. VERIFICAR TRIGGERS
SELECT
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'usuarios' OR event_object_table = 'users';

-- 16. VERIFICAR POLÍTICAS RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'usuarios';
