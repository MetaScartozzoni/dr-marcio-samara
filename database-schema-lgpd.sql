-- LGPD Compliance Database Schema
-- Adicionar ao database-schema.sql existente

-- ========================================
-- TABELAS PARA CONFORMIDADE LGPD
-- ========================================

-- Tabela de consentimentos LGPD
CREATE TABLE IF NOT EXISTS consentimentos_lgpd (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_consentimento VARCHAR(50) NOT NULL CHECK (tipo_consentimento IN (
        'PROCESSAMENTO_DADOS',
        'COMUNICACAO_MARKETING', 
        'COOKIES',
        'COMPARTILHAMENTO_DADOS',
        'DADOS_SENSIVEIS',
        'PESQUISA_SATISFACAO'
    )),
    finalidade TEXT NOT NULL,
    data_consentimento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_revogacao TIMESTAMP WITH TIME ZONE NULL,
    motivo_revogacao TEXT NULL,
    ativo BOOLEAN DEFAULT true,
    ip_origem INET,
    user_agent TEXT,
    versao_politica VARCHAR(10) DEFAULT '2.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs de exclusão LGPD
CREATE TABLE IF NOT EXISTS logs_exclusao_lgpd (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    email_original VARCHAR(255) NOT NULL,
    motivo TEXT NOT NULL,
    data_exclusao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP WITH TIME ZONE NULL,
    executado_por VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'INICIADO' CHECK (status IN ('INICIADO', 'CONCLUIDO', 'ERRO')),
    erro_detalhes TEXT NULL,
    dados_backup JSONB NULL, -- Backup dos dados principais antes da exclusão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs gerais LGPD para auditoria
CREATE TABLE IF NOT EXISTS logs_lgpd (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(50) NOT NULL CHECK (acao IN (
        'CONSENTIMENTO_REGISTRADO',
        'CONSENTIMENTO_REVOGADO',
        'DADOS_EXPORTADOS',
        'DADOS_EXCLUIDOS',
        'ACESSO_DADOS',
        'CORRECAO_DADOS',
        'PORTABILIDADE_SOLICITADA',
        'VIOLACAO_DETECTADA'
    )),
    details JSONB NULL,
    ip_origem INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs de acesso para auditoria
CREATE TABLE IF NOT EXISTS logs_acesso (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    email VARCHAR(255) NULL,
    data_acesso TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_origem INET,
    user_agent TEXT,
    acao VARCHAR(100) NOT NULL,
    recurso_acessado VARCHAR(255) NULL,
    sucesso BOOLEAN DEFAULT true,
    detalhes JSONB NULL
);

-- Tabela de configurações de privacidade por usuário
CREATE TABLE IF NOT EXISTS preferencias_privacidade (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    receber_marketing BOOLEAN DEFAULT false,
    compartilhar_dados_terceiros BOOLEAN DEFAULT false,
    cookies_funcionais BOOLEAN DEFAULT false,
    cookies_analiticos BOOLEAN DEFAULT false,
    notificacoes_email BOOLEAN DEFAULT true,
    notificacoes_sms BOOLEAN DEFAULT false,
    visibilidade_perfil VARCHAR(20) DEFAULT 'privado' CHECK (visibilidade_perfil IN ('publico', 'restrito', 'privado')),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de solicitações LGPD
CREATE TABLE IF NOT EXISTS solicitacoes_lgpd (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_solicitacao VARCHAR(30) NOT NULL CHECK (tipo_solicitacao IN (
        'ACESSO_DADOS',
        'CORRECAO_DADOS',
        'EXCLUSAO_DADOS',
        'PORTABILIDADE_DADOS',
        'OPOSICAO_TRATAMENTO',
        'RESTRICAO_TRATAMENTO'
    )),
    descricao TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN (
        'PENDENTE', 
        'EM_ANALISE', 
        'APROVADO', 
        'REJEITADO', 
        'CONCLUIDO'
    )),
    data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_resposta TIMESTAMP WITH TIME ZONE NULL,
    resposta_detalhes TEXT NULL,
    prazo_resposta TIMESTAMP WITH TIME ZONE NULL,
    atendido_por INTEGER NULL REFERENCES usuarios(id),
    arquivos_anexos JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para consentimentos
CREATE INDEX IF NOT EXISTS idx_consentimentos_usuario_tipo ON consentimentos_lgpd(usuario_id, tipo_consentimento);
CREATE INDEX IF NOT EXISTS idx_consentimentos_ativo ON consentimentos_lgpd(ativo);
CREATE INDEX IF NOT EXISTS idx_consentimentos_data ON consentimentos_lgpd(data_consentimento);

-- Índices para logs LGPD
CREATE INDEX IF NOT EXISTS idx_logs_lgpd_usuario ON logs_lgpd(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_lgpd_acao ON logs_lgpd(acao);
CREATE INDEX IF NOT EXISTS idx_logs_lgpd_data ON logs_lgpd(created_at);

-- Índices para logs de acesso
CREATE INDEX IF NOT EXISTS idx_logs_acesso_usuario ON logs_acesso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_data ON logs_acesso(data_acesso);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_ip ON logs_acesso(ip_origem);

-- Índices para exclusões
CREATE INDEX IF NOT EXISTS idx_exclusao_usuario ON logs_exclusao_lgpd(usuario_id);
CREATE INDEX IF NOT EXISTS idx_exclusao_status ON logs_exclusao_lgpd(status);
CREATE INDEX IF NOT EXISTS idx_exclusao_data ON logs_exclusao_lgpd(data_exclusao);

-- Índices para solicitações
CREATE INDEX IF NOT EXISTS idx_solicitacoes_usuario ON solicitacoes_lgpd(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes_lgpd(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_tipo ON solicitacoes_lgpd(tipo_solicitacao);

-- ========================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- ========================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger às tabelas necessárias
CREATE TRIGGER update_consentimentos_lgpd_updated_at 
    BEFORE UPDATE ON consentimentos_lgpd 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferencias_privacidade_updated_at 
    BEFORE UPDATE ON preferencias_privacidade 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitacoes_lgpd_updated_at 
    BEFORE UPDATE ON solicitacoes_lgpd 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- TRIGGERS PARA LOG AUTOMÁTICO DE AÇÕES SENSÍVEIS
-- ========================================

-- Trigger para logar modificações em dados de usuários
CREATE OR REPLACE FUNCTION log_usuario_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log quando dados pessoais são modificados
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO logs_lgpd (usuario_id, acao, details, ip_origem)
        VALUES (
            NEW.id,
            'CORRECAO_DADOS',
            jsonb_build_object(
                'campos_alterados', (
                    SELECT jsonb_object_agg(key, value)
                    FROM (
                        SELECT key, NEW.data->>key as value
                        FROM jsonb_each(to_jsonb(NEW))
                        WHERE NEW.data->>key IS DISTINCT FROM OLD.data->>key
                    ) changes
                ),
                'operacao', 'UPDATE'
            ),
            inet_client_addr()
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Aplicar trigger de log à tabela usuarios
CREATE TRIGGER log_usuarios_changes 
    AFTER UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION log_usuario_changes();

-- ========================================
-- VIEWS PARA RELATÓRIOS LGPD
-- ========================================

-- View para estatísticas de consentimentos
CREATE OR REPLACE VIEW v_estatisticas_consentimentos AS
SELECT 
    tipo_consentimento,
    COUNT(*) as total_consentimentos,
    COUNT(CASE WHEN ativo = true THEN 1 END) as consentimentos_ativos,
    COUNT(CASE WHEN ativo = false THEN 1 END) as consentimentos_revogados,
    ROUND(
        COUNT(CASE WHEN ativo = true THEN 1 END) * 100.0 / COUNT(*), 2
    ) as percentual_ativos
FROM consentimentos_lgpd
GROUP BY tipo_consentimento;

-- View para dashboard de conformidade
CREATE OR REPLACE VIEW v_dashboard_lgpd AS
SELECT 
    'consentimentos' as metrica,
    COUNT(*) as valor,
    'Total de consentimentos registrados' as descricao
FROM consentimentos_lgpd
WHERE ativo = true

UNION ALL

SELECT 
    'exclusoes' as metrica,
    COUNT(*) as valor,
    'Solicitações de exclusão processadas' as descricao
FROM logs_exclusao_lgpd
WHERE status = 'CONCLUIDO'

UNION ALL

SELECT 
    'exportacoes' as metrica,
    COUNT(*) as valor,
    'Exportações de dados realizadas' as descricao
FROM logs_lgpd
WHERE acao = 'DADOS_EXPORTADOS'
AND created_at >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT 
    'solicitacoes_pendentes' as metrica,
    COUNT(*) as valor,
    'Solicitações LGPD pendentes' as descricao
FROM solicitacoes_lgpd
WHERE status IN ('PENDENTE', 'EM_ANALISE');

-- ========================================
-- FUNÇÕES UTILITÁRIAS LGPD
-- ========================================

-- Função para verificar se usuário tem consentimento
CREATE OR REPLACE FUNCTION tem_consentimento(
    p_usuario_id INTEGER,
    p_tipo_consentimento VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM consentimentos_lgpd
    WHERE usuario_id = p_usuario_id 
      AND tipo_consentimento = p_tipo_consentimento
      AND ativo = true;
    
    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Função para anonimizar dados de usuário
CREATE OR REPLACE FUNCTION anonimizar_usuario(p_usuario_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Anonimizar dados principais
    UPDATE usuarios SET
        email = 'anonimo_' || p_usuario_id || '@excluido.lgpd',
        full_name = 'Usuário Excluído - LGPD',
        telefone = NULL,
        password_hash = NULL,
        status = 'excluido_lgpd',
        data_exclusao_lgpd = CURRENT_TIMESTAMP
    WHERE id = p_usuario_id;
    
    -- Anonimizar dados relacionados
    UPDATE agendamentos SET
        observacoes = 'Dados anonimizados - LGPD Art. 17'
    WHERE paciente_id = p_usuario_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- INSERIR DADOS INICIAIS
-- ========================================

-- Inserir preferências padrão para usuários existentes
INSERT INTO preferencias_privacidade (usuario_id, receber_marketing, compartilhar_dados_terceiros)
SELECT id, false, false
FROM usuarios
WHERE id NOT IN (SELECT usuario_id FROM preferencias_privacidade);

-- ========================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE consentimentos_lgpd IS 'Registro de consentimentos conforme Art. 8º da LGPD';
COMMENT ON TABLE logs_exclusao_lgpd IS 'Log de exclusões/anonimizações - Direito ao Esquecimento Art. 17';
COMMENT ON TABLE logs_lgpd IS 'Auditoria geral de ações relacionadas à LGPD';
COMMENT ON TABLE logs_acesso IS 'Log de acessos para auditoria de segurança';
COMMENT ON TABLE preferencias_privacidade IS 'Preferências de privacidade do usuário';
COMMENT ON TABLE solicitacoes_lgpd IS 'Solicitações formais dos titulares de dados';

COMMENT ON COLUMN consentimentos_lgpd.tipo_consentimento IS 'Tipo de consentimento conforme finalidades específicas';
COMMENT ON COLUMN logs_exclusao_lgpd.dados_backup IS 'Backup dos dados principais antes da exclusão (criptografado)';
COMMENT ON COLUMN logs_lgpd.acao IS 'Ação executada conforme direitos dos titulares';

-- ========================================
-- GRANTS E PERMISSÕES
-- ========================================

-- Garantir que o usuário da aplicação tenha acesso às tabelas LGPD
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
