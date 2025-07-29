-- Schema para sistema de pagamentos
-- Execute este SQL no PostgreSQL

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    orcamento_id INTEGER REFERENCES orcamentos(id),
    valor DECIMAL(10,2),
    tipo_pagamento VARCHAR(20) NOT NULL, -- 'stripe', 'pagseguro'
    status VARCHAR(20) NOT NULL, -- 'pendente', 'aprovado', 'falhou', 'cancelado'
    gateway_transaction_id VARCHAR(255),
    data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de orçamentos (se não existir)
CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES usuarios(id),
    numero_orcamento VARCHAR(50) UNIQUE NOT NULL,
    valor_final DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'aceito', 'rejeitado', 'pago'
    observacoes TEXT,
    validade DATE,
    aceito_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de itens do orçamento
CREATE TABLE IF NOT EXISTS orcamento_itens (
    id SERIAL PRIMARY KEY,
    orcamento_id INTEGER REFERENCES orcamentos(id),
    servico_nome VARCHAR(255) NOT NULL,
    quantidade INTEGER DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_orcamento_id ON pagamentos(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_pagamento ON pagamentos(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_orcamentos_paciente_id ON orcamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_numero ON orcamentos(numero_orcamento);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pagamentos_updated_at 
    BEFORE UPDATE ON pagamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orcamentos_updated_at 
    BEFORE UPDATE ON orcamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views úteis
CREATE OR REPLACE VIEW v_pagamentos_detalhados AS
SELECT 
    p.*,
    o.numero_orcamento,
    o.valor_final as valor_orcamento,
    u.full_name as paciente_nome,
    u.email as paciente_email
FROM pagamentos p
JOIN orcamentos o ON p.orcamento_id = o.id
JOIN usuarios u ON o.paciente_id = u.id;

-- Função para gerar número de orçamento único
CREATE OR REPLACE FUNCTION gerar_numero_orcamento()
RETURNS TEXT AS $$
DECLARE
    ano_atual TEXT;
    contador INTEGER;
    numero_final TEXT;
BEGIN
    ano_atual := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Buscar próximo número sequencial do ano
    SELECT COALESCE(MAX(
        CASE 
            WHEN numero_orcamento ~ ('^ORC-' || ano_atual || '-[0-9]+$')
            THEN SUBSTRING(numero_orcamento FROM '^ORC-' || ano_atual || '-([0-9]+)$')::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO contador
    FROM orcamentos;
    
    numero_final := 'ORC-' || ano_atual || '-' || LPAD(contador::TEXT, 4, '0');
    
    RETURN numero_final;
END;
$$ LANGUAGE plpgsql;

-- Dados de exemplo (opcional)
-- INSERT INTO orcamentos (paciente_id, numero_orcamento, valor_final, observacoes, validade)
-- VALUES 
-- (1, gerar_numero_orcamento(), 1500.00, 'Rinoplastia completa', CURRENT_DATE + INTERVAL '30 days'),
-- (2, gerar_numero_orcamento(), 2800.00, 'Abdominoplastia', CURRENT_DATE + INTERVAL '30 days');

COMMENT ON TABLE pagamentos IS 'Registro de todos os pagamentos realizados pelos pacientes';
COMMENT ON TABLE orcamentos IS 'Orçamentos enviados aos pacientes';
COMMENT ON TABLE orcamento_itens IS 'Itens detalhados de cada orçamento';
COMMENT ON FUNCTION gerar_numero_orcamento() IS 'Gera número único para orçamentos no formato ORC-YYYY-NNNN';
