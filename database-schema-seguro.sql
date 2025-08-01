-- ============================
-- TABELA CONFIDENCIAL DE SENHAS CHAVE
-- ============================

-- Tabela para logs de uso de senhas chave
CREATE TABLE IF NOT EXISTS senhas_chave_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    evento TEXT NOT NULL,
    email_hash TEXT NOT NULL, -- Hash do email para privacidade
    tipo_senha_chave TEXT,
    sucesso BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    detalhes_json TEXT,
    nivel_alerta TEXT DEFAULT 'INFO',
    processado BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para controle de senhas chave ativas
CREATE TABLE IF NOT EXISTS senhas_chave_ativas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL UNIQUE, -- 'primeiro_admin', 'funcionario', 'paciente'
    hash_senha_chave TEXT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_expiracao DATETIME,
    ativa BOOLEAN DEFAULT TRUE,
    usos_permitidos INTEGER DEFAULT -1, -- -1 = ilimitado, 1 = uso único
    usos_realizados INTEGER DEFAULT 0,
    criado_por TEXT,
    observacoes TEXT
);

-- Tabela para auditoria de mudanças de senha
CREATE TABLE IF NOT EXISTS auditoria_senhas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    email_hash TEXT NOT NULL,
    tipo_operacao TEXT NOT NULL, -- 'criar', 'alterar', 'resetar'
    metodo TEXT NOT NULL, -- 'senha_chave', 'recuperacao', 'admin'
    ip_address TEXT,
    user_agent TEXT,
    sucesso BOOLEAN NOT NULL,
    erro_detalhes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para controle de renovação de senhas
CREATE TABLE IF NOT EXISTS controle_renovacao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    email_hash TEXT NOT NULL,
    data_ultima_troca DATETIME NOT NULL,
    data_proxima_renovacao DATETIME NOT NULL,
    notificacoes_enviadas INTEGER DEFAULT 0,
    renovacao_forcada BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_senhas_chave_logs_timestamp ON senhas_chave_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_senhas_chave_logs_evento ON senhas_chave_logs(evento);
CREATE INDEX IF NOT EXISTS idx_senhas_chave_logs_nivel ON senhas_chave_logs(nivel_alerta);
CREATE INDEX IF NOT EXISTS idx_auditoria_senhas_timestamp ON auditoria_senhas(timestamp);
CREATE INDEX IF NOT EXISTS idx_controle_renovacao_proxima ON controle_renovacao(data_proxima_renovacao);

-- ============================
-- ATUALIZAÇÃO DA TABELA USUARIOS
-- ============================

-- Adicionar campos para suporte ao sistema de senhas chave
ALTER TABLE usuarios ADD COLUMN senha_chave_utilizada TEXT;
ALTER TABLE usuarios ADD COLUMN data_uso_senha_chave DATETIME;
ALTER TABLE usuarios ADD COLUMN primeiro_acesso_realizado BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN data_primeira_troca_senha DATETIME;
ALTER TABLE usuarios ADD COLUMN renovacao_obrigatoria BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN ultimo_login DATETIME;
ALTER TABLE usuarios ADD COLUMN tentativas_login_falhadas INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN conta_bloqueada BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN data_bloqueio DATETIME;

-- ============================
-- FUNÇÕES DE SEGURANÇA
-- ============================

-- View para relatórios de segurança (sem dados sensíveis)
CREATE VIEW IF NOT EXISTS relatorio_seguranca AS
SELECT 
    evento,
    COUNT(*) as total_ocorrencias,
    nivel_alerta,
    DATE(timestamp) as data_evento,
    COUNT(CASE WHEN sucesso = 1 THEN 1 END) as sucessos,
    COUNT(CASE WHEN sucesso = 0 THEN 1 END) as falhas
FROM senhas_chave_logs 
GROUP BY evento, nivel_alerta, DATE(timestamp)
ORDER BY timestamp DESC;

-- View para usuários com renovação pendente
CREATE VIEW IF NOT EXISTS usuarios_renovacao_pendente AS
SELECT 
    u.id,
    u.nome,
    u.email,
    u.tipo,
    cr.data_ultima_troca,
    cr.data_proxima_renovacao,
    cr.notificacoes_enviadas
FROM usuarios u
JOIN controle_renovacao cr ON u.id = cr.user_id
WHERE cr.data_proxima_renovacao <= DATE('now', '+7 days')
AND u.ativo = 1;

-- ============================
-- DADOS INICIAIS DE SEGURANÇA
-- ============================

-- Inserir senhas chave iniciais (hasheadas)
INSERT OR REPLACE INTO senhas_chave_ativas (tipo, hash_senha_chave, data_expiracao, usos_permitidos) VALUES
('primeiro_admin', 'hash_da_senha_primeiro_admin', NULL, 1),
('funcionario', 'hash_da_senha_funcionario', DATE('now', '+90 days'), -1),
('paciente', 'hash_da_senha_paciente', DATE('now', '+90 days'), -1);

-- ============================
-- TRIGGERS DE AUDITORIA
-- ============================

-- Trigger para log automático de mudanças de senha
CREATE TRIGGER IF NOT EXISTS trigger_auditoria_senha_update
AFTER UPDATE OF hash_senha ON usuarios
FOR EACH ROW
WHEN NEW.hash_senha != OLD.hash_senha
BEGIN
    INSERT INTO auditoria_senhas (
        user_id, email_hash, tipo_operacao, metodo, sucesso, timestamp
    ) VALUES (
        NEW.id, 
        lower(hex(randomblob(16))), -- Hash fictício do email
        'alterar',
        'sistema',
        1,
        CURRENT_TIMESTAMP
    );
    
    -- Atualizar controle de renovação
    INSERT OR REPLACE INTO controle_renovacao (
        user_id, email_hash, data_ultima_troca, data_proxima_renovacao
    ) VALUES (
        NEW.id,
        lower(hex(randomblob(16))),
        CURRENT_TIMESTAMP,
        DATE('now', '+90 days')
    );
END;

-- Trigger para contabilizar uso de senhas chave
CREATE TRIGGER IF NOT EXISTS trigger_uso_senha_chave
AFTER INSERT ON senhas_chave_logs
FOR EACH ROW
WHEN NEW.sucesso = 1 AND NEW.evento = 'senha_chave_valida'
BEGIN
    UPDATE senhas_chave_ativas 
    SET usos_realizados = usos_realizados + 1
    WHERE tipo = NEW.tipo_senha_chave;
    
    -- Desativar senha de uso único após primeiro uso
    UPDATE senhas_chave_ativas 
    SET ativa = FALSE
    WHERE tipo = NEW.tipo_senha_chave 
    AND usos_permitidos = 1 
    AND usos_realizados >= 1;
END;
