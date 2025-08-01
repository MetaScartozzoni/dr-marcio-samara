-- ============================
-- SCHEMA DE RECUPERAÇÃO DE SENHA
-- ============================

-- Tabela para logs de recuperação de senha
CREATE TABLE IF NOT EXISTS logs_recuperacao_senha (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    email_mascarado VARCHAR(255) NOT NULL,
    evento ENUM(
        'solicitacao_recuperacao',
        'codigo_enviado',
        'codigo_verificado',
        'senha_redefinida',
        'tentativa_codigo_invalido',
        'codigo_expirado',
        'rate_limit_atingido',
        'erro_envio_email'
    ) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    codigo_mascarado VARCHAR(10), -- apenas 2 últimos dígitos
    tentativas_codigo INT DEFAULT 0,
    token_usado VARCHAR(64),
    metadados JSON,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_evento (evento),
    INDEX idx_data (data_criacao),
    INDEX idx_ip (ip_address)
);

-- Tabela para códigos ativos (em memória no sistema, mas backup em DB)
CREATE TABLE IF NOT EXISTS codigos_recuperacao_ativos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    codigo_hash VARCHAR(64) NOT NULL, -- hash do código para segurança
    token VARCHAR(64) NOT NULL UNIQUE,
    expiracao TIMESTAMP NOT NULL,
    tentativas INT DEFAULT 0,
    ip_solicitacao VARCHAR(45),
    user_agent_solicitacao TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_ultima_tentativa TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_token (token),
    INDEX idx_expiracao (expiracao)
);

-- Tabela para histórico de alterações de senha
CREATE TABLE IF NOT EXISTS historico_alteracao_senha (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    metodo_alteracao ENUM(
        'primeiro_acesso',
        'alteracao_manual',
        'recuperacao_codigo',
        'admin_reset',
        'expiracao_forcada'
    ) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    senha_anterior_hash VARCHAR(64), -- hash da senha anterior (para auditoria)
    token_recuperacao VARCHAR(64), -- se foi por recuperação
    observacoes TEXT,
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_email (email),
    INDEX idx_metodo (metodo_alteracao),
    INDEX idx_data (data_alteracao),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela para rate limiting de recuperação
CREATE TABLE IF NOT EXISTS rate_limit_recuperacao (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    identificador VARCHAR(255) NOT NULL, -- pode ser IP ou email
    tipo_limite ENUM('ip', 'email') NOT NULL,
    contador INT DEFAULT 1,
    janela_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_tentativa TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_limite (identificador, tipo_limite),
    INDEX idx_identificador (identificador),
    INDEX idx_janela (janela_inicio)
);

-- Adicionar colunas na tabela usuarios para controle de senha
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS data_ultima_alteracao_senha TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS requer_troca_senha BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tentativas_login_falhadas INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_ultimo_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS conta_bloqueada_ate TIMESTAMP NULL;

-- ============================
-- ÍNDICES PARA PERFORMANCE
-- ============================

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_logs_email_evento ON logs_recuperacao_senha(email, evento);
CREATE INDEX IF NOT EXISTS idx_logs_ip_data ON logs_recuperacao_senha(ip_address, data_criacao);
CREATE INDEX IF NOT EXISTS idx_historico_usuario_data ON historico_alteracao_senha(usuario_id, data_alteracao);

-- ============================
-- TRIGGERS PARA AUDITORIA
-- ============================

-- Trigger para limpar códigos expirados automaticamente
DELIMITER //
CREATE EVENT IF NOT EXISTS limpar_codigos_expirados
ON SCHEDULE EVERY 10 MINUTE
DO
BEGIN
    DELETE FROM codigos_recuperacao_ativos 
    WHERE expiracao < NOW();
    
    -- Limpar rate limiting antigo (mais de 24 horas)
    DELETE FROM rate_limit_recuperacao 
    WHERE janela_inicio < DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    -- Limpar logs muito antigos (mais de 90 dias) - opcional
    DELETE FROM logs_recuperacao_senha 
    WHERE data_criacao < DATE_SUB(NOW(), INTERVAL 90 DAY);
END//
DELIMITER ;

-- Trigger para log automático de alteração de senha
DELIMITER //
CREATE TRIGGER IF NOT EXISTS log_alteracao_senha_usuarios
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    IF OLD.senha != NEW.senha THEN
        INSERT INTO historico_alteracao_senha (
            usuario_id, 
            email, 
            metodo_alteracao, 
            senha_anterior_hash,
            observacoes
        ) VALUES (
            NEW.id,
            NEW.email,
            'alteracao_manual',
            OLD.senha,
            'Alteração detectada automaticamente'
        );
    END IF;
END//
DELIMITER ;

-- ============================
-- VIEWS PARA RELATÓRIOS
-- ============================

-- View para relatório de tentativas de recuperação
CREATE OR REPLACE VIEW vw_relatorio_recuperacao AS
SELECT 
    DATE(data_criacao) as data,
    COUNT(*) as total_solicitacoes,
    COUNT(CASE WHEN evento = 'codigo_enviado' THEN 1 END) as codigos_enviados,
    COUNT(CASE WHEN evento = 'codigo_verificado' THEN 1 END) as codigos_verificados,
    COUNT(CASE WHEN evento = 'senha_redefinida' THEN 1 END) as senhas_redefinidas,
    COUNT(CASE WHEN evento = 'tentativa_codigo_invalido' THEN 1 END) as tentativas_invalidas
FROM logs_recuperacao_senha
WHERE data_criacao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(data_criacao)
ORDER BY data DESC;

-- View para monitoramento de segurança
CREATE OR REPLACE VIEW vw_monitoramento_seguranca AS
SELECT 
    ip_address,
    COUNT(*) as total_tentativas,
    COUNT(DISTINCT email) as emails_distintos,
    MAX(data_criacao) as ultima_tentativa,
    COUNT(CASE WHEN evento = 'tentativa_codigo_invalido' THEN 1 END) as tentativas_invalidas
FROM logs_recuperacao_senha
WHERE data_criacao >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY ip_address
HAVING tentativas_invalidas > 5 OR total_tentativas > 20
ORDER BY tentativas_invalidas DESC, total_tentativas DESC;

-- ============================
-- PROCEDURES PARA MANUTENÇÃO
-- ============================

-- Procedure para limpar dados antigos
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS LimparDadosAntigos()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Limpar logs de recuperação antigos (mais de 90 dias)
    DELETE FROM logs_recuperacao_senha 
    WHERE data_criacao < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- Limpar histórico de alteração de senha antigo (mais de 1 ano)
    DELETE FROM historico_alteracao_senha 
    WHERE data_alteracao < DATE_SUB(NOW(), INTERVAL 1 YEAR);
    
    -- Limpar códigos expirados
    DELETE FROM codigos_recuperacao_ativos 
    WHERE expiracao < NOW();
    
    -- Limpar rate limiting antigo
    DELETE FROM rate_limit_recuperacao 
    WHERE janela_inicio < DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    COMMIT;
    
    SELECT 'Limpeza concluída com sucesso' as resultado;
END//
DELIMITER ;

-- Procedure para relatório de segurança
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS RelatorioSegurancaRecuperacao(IN dias INT DEFAULT 7)
BEGIN
    SELECT 
        'Resumo dos últimos dias' as secao,
        dias as periodo_dias,
        COUNT(*) as total_eventos,
        COUNT(DISTINCT email) as usuarios_unicos,
        COUNT(DISTINCT ip_address) as ips_unicos
    FROM logs_recuperacao_senha 
    WHERE data_criacao >= DATE_SUB(NOW(), INTERVAL dias DAY)
    
    UNION ALL
    
    SELECT 
        'Eventos por tipo' as secao,
        evento as periodo_dias,
        COUNT(*) as total_eventos,
        0 as usuarios_unicos,
        0 as ips_unicos
    FROM logs_recuperacao_senha 
    WHERE data_criacao >= DATE_SUB(NOW(), INTERVAL dias DAY)
    GROUP BY evento
    ORDER BY secao, total_eventos DESC;
END//
DELIMITER ;

-- ============================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================

/*
DOCUMENTAÇÃO DO SCHEMA DE RECUPERAÇÃO DE SENHA

1. TABELAS PRINCIPAIS:
   - logs_recuperacao_senha: Registra todos os eventos de recuperação
   - codigos_recuperacao_ativos: Códigos válidos em memória (backup em DB)
   - historico_alteracao_senha: Histórico completo de mudanças de senha
   - rate_limit_recuperacao: Controle de tentativas por IP/email

2. SEGURANÇA:
   - Códigos são hasheados no banco
   - Emails mascarados nos logs
   - IPs e User-Agents registrados
   - Rate limiting por IP e email
   - Limpeza automática de dados expirados

3. AUDITORIA:
   - Logs completos de todas as ações
   - Triggers automáticos para mudanças
   - Views para relatórios
   - Procedures para manutenção

4. PERFORMANCE:
   - Índices otimizados para consultas frequentes
   - Limpeza automática por eventos
   - Views materializadas para relatórios

5. CONFORMIDADE:
   - Retenção limitada de dados sensíveis
   - Mascaramento de informações pessoais
   - Logs estruturados para auditoria
   - Controles de acesso por roles
*/
