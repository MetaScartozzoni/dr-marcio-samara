-- Migração para tabelas de Orçamentos
-- Este arquivo cria as tabelas necessárias para o sistema de orçamentos

-- Tabela principal de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES usuarios(id),
    ficha_atendimento_id INTEGER,
    numero_orcamento VARCHAR(20) UNIQUE NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    descricao_procedimento TEXT,
    forma_pagamento VARCHAR(50),
    observacoes TEXT,
    vencimento DATE,
    status VARCHAR(30) DEFAULT 'pendente',
    criado_por INTEGER,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'expirado', 'convertido'))
);

-- Tabela para itens detalhados do orçamento
CREATE TABLE IF NOT EXISTS orcamento_itens (
    id SERIAL PRIMARY KEY,
    orcamento_id INTEGER REFERENCES orcamentos(id) ON DELETE CASCADE,
    descricao VARCHAR(255) NOT NULL,
    quantidade INTEGER DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
    categoria VARCHAR(100),
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para histórico de status dos orçamentos
CREATE TABLE IF NOT EXISTS orcamento_historico (
    id SERIAL PRIMARY KEY,
    orcamento_id INTEGER REFERENCES orcamentos(id) ON DELETE CASCADE,
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30) NOT NULL,
    motivo TEXT,
    alterado_por INTEGER,
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para templates de orçamentos (procedimentos comuns)
CREATE TABLE IF NOT EXISTS orcamento_templates (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor_base DECIMAL(10,2),
    categoria VARCHAR(50),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para relacionar templates com itens
CREATE TABLE IF NOT EXISTS template_itens (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES orcamento_templates(id) ON DELETE CASCADE,
    descricao VARCHAR(255) NOT NULL,
    quantidade INTEGER DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100),
    obrigatorio BOOLEAN DEFAULT false
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_paciente_id ON orcamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_numero ON orcamentos(numero_orcamento);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_criado_em ON orcamentos(criado_em);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento_id ON orcamento_itens(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_historico_orcamento_id ON orcamento_historico(orcamento_id);

-- Trigger para atualizar automaticamente o valor total do orçamento
CREATE OR REPLACE FUNCTION atualizar_total_orcamento()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar valor total do orçamento baseado nos itens
    UPDATE orcamentos 
    SET valor_total = (
        SELECT COALESCE(SUM(valor_total), 0) 
        FROM orcamento_itens 
        WHERE orcamento_id = COALESCE(NEW.orcamento_id, OLD.orcamento_id)
    ),
    atualizado_em = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.orcamento_id, OLD.orcamento_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nos itens do orçamento
DROP TRIGGER IF EXISTS trigger_atualizar_total_orcamento ON orcamento_itens;
CREATE TRIGGER trigger_atualizar_total_orcamento
    AFTER INSERT OR UPDATE OR DELETE ON orcamento_itens
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_total_orcamento();

-- Trigger para log de mudanças de status
CREATE OR REPLACE FUNCTION log_mudanca_status_orcamento()
RETURNS TRIGGER AS $$
BEGIN
    -- Só registrar se o status realmente mudou
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO orcamento_historico (
            orcamento_id, 
            status_anterior, 
            status_novo, 
            alterado_por
        ) VALUES (
            NEW.id, 
            OLD.status, 
            NEW.status, 
            NEW.criado_por
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de mudança de status
DROP TRIGGER IF EXISTS trigger_log_mudanca_status_orcamento ON orcamentos;
CREATE TRIGGER trigger_log_mudanca_status_orcamento
    AFTER UPDATE ON orcamentos
    FOR EACH ROW
    EXECUTE FUNCTION log_mudanca_status_orcamento();

-- Inserir alguns templates básicos
INSERT INTO orcamento_templates (nome, descricao, valor_base, categoria) VALUES
('Consulta Inicial', 'Primeira consulta com avaliação completa', 200.00, 'consulta'),
('Limpeza Dental', 'Profilaxia com aplicação de flúor', 150.00, 'preventivo'),
('Restauração Simples', 'Restauração em resina composta', 180.00, 'restaurador'),
('Clareamento Dental', 'Clareamento a laser (3 sessões)', 800.00, 'estético'),
('Extração Simples', 'Extração de dente sem complicações', 120.00, 'cirúrgico')
ON CONFLICT DO NOTHING;

-- Inserir itens para os templates
INSERT INTO template_itens (template_id, descricao, quantidade, valor_unitario, categoria, obrigatorio) VALUES
(1, 'Consulta e avaliação', 1, 150.00, 'consulta', true),
(1, 'Radiografia panorâmica', 1, 50.00, 'exame', false),
(2, 'Profilaxia', 1, 120.00, 'preventivo', true),
(2, 'Aplicação de flúor', 1, 30.00, 'preventivo', true),
(3, 'Restauração em resina', 1, 180.00, 'restaurador', true),
(4, 'Sessão de clareamento', 3, 200.00, 'estético', true),
(4, 'Moldagem para protetor', 1, 200.00, 'estético', false),
(5, 'Extração dental', 1, 120.00, 'cirúrgico', true)
ON CONFLICT DO NOTHING;
