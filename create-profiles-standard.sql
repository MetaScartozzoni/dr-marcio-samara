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
