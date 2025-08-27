-- Criar tabela usuarios
CREATE TABLE IF NOT EXISTS usuarios (
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
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para usuários autenticados
CREATE POLICY "Users can view their own profile" ON usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Política para administradores verem todos os usuários
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

-- Política para médicos e funcionários verem pacientes
CREATE POLICY "Staff can view patients" ON usuarios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND tipo_usuario IN ('admin', 'medico', 'funcionario')
        ) AND tipo_usuario = 'paciente'
    );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
