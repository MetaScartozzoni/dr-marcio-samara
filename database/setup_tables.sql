-- Tabelas para o Sistema de Setup Inicial
-- Execute este arquivo no PostgreSQL para criar as tabelas necessárias

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de logs do sistema
CREATE TABLE IF NOT EXISTS logs_sistema (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    usuario_id INTEGER,
    data_evento TIMESTAMP DEFAULT NOW(),
    detalhes JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_system_config_locked ON system_config(is_locked);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_tipo ON logs_sistema(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_data ON logs_sistema(data_evento);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_usuario ON logs_sistema(usuario_id);

-- Comentários nas tabelas
COMMENT ON TABLE system_config IS 'Configurações globais do sistema, algumas podem ser bloqueadas após setup inicial';
COMMENT ON TABLE logs_sistema IS 'Log de eventos e ações importantes do sistema';

COMMENT ON COLUMN system_config.config_key IS 'Chave única da configuração';
COMMENT ON COLUMN system_config.config_value IS 'Valor da configuração (pode ser JSON)';
COMMENT ON COLUMN system_config.is_locked IS 'Se true, configuração não pode ser alterada via interface';
COMMENT ON COLUMN logs_sistema.tipo IS 'Tipo do evento: SETUP, LOGIN, ERROR, CONFIG, etc.';
COMMENT ON COLUMN logs_sistema.detalhes IS 'Detalhes adicionais em formato JSON';

-- Inserir configuração padrão se não existir
INSERT INTO system_config (config_key, config_value, is_locked) 
VALUES ('system_version', '1.0.0', true)
ON CONFLICT (config_key) DO NOTHING;
