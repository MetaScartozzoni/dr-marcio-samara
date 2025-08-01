-- ========================================
-- CORRIGIR ESTRUTURA DO BANCO DE DADOS
-- ========================================

-- 1. Adicionar colunas que estão faltando na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status_aprovacao VARCHAR(20) DEFAULT 'pendente';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo_verificacao VARCHAR(10);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS data_ultimo_codigo TIMESTAMP;

-- 2. Atualizar estrutura para suportar fluxo de aprovação
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aprovado_por VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMP;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status_aprovacao);
CREATE INDEX IF NOT EXISTS idx_usuarios_verificado ON usuarios(email_verificado);

-- 4. Verificar estrutura atual
\d usuarios;

-- 5. Mostrar dados existentes
SELECT email, role, status, autorizado, password_hash, email_verificado, status_aprovacao FROM usuarios LIMIT 5;
