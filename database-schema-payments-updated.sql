-- Schema atualizado para sistema de pagamentos
-- Execute este SQL no PostgreSQL para adequação backend/frontend

-- Tabela de orçamentos atualizada
CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    numero_orcamento VARCHAR(50) UNIQUE NOT NULL,
    nome_paciente VARCHAR(255), -- Campo adicionado para compatibilidade
    email_paciente VARCHAR(255), -- Campo adicionado para compatibilidade  
    telefone_paciente VARCHAR(20),
    valor_final DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'aceito', 'rejeitado', 'pago'
    observacoes TEXT,
    validade DATE,
    aceito_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para performance
    INDEX idx_orcamento_numero (numero_orcamento),
    INDEX idx_orcamento_status (status),
    INDEX idx_orcamento_email (email_paciente)
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    orcamento_id INTEGER REFERENCES orcamentos(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    tipo_pagamento VARCHAR(20) NOT NULL, -- 'stripe', 'pagseguro'
    status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- 'pendente', 'aprovado', 'falhou', 'cancelado'
    gateway_transaction_id VARCHAR(255),
    gateway_session_id VARCHAR(255),
    checkout_url TEXT,
    data_pagamento TIMESTAMP,
    data_expiracao TIMESTAMP,
    metadata JSONB, -- Para dados adicionais dos gateways
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para performance
    INDEX idx_pagamento_orcamento (orcamento_id),
    INDEX idx_pagamento_status (status),
    INDEX idx_pagamento_gateway_id (gateway_transaction_id),
    INDEX idx_pagamento_tipo (tipo_pagamento)
);

-- Tabela de itens do orçamento
CREATE TABLE IF NOT EXISTS orcamento_itens (
    id SERIAL PRIMARY KEY,
    orcamento_id INTEGER REFERENCES orcamentos(id) ON DELETE CASCADE,
    descricao VARCHAR(255) NOT NULL,
    quantidade INTEGER DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_item_orcamento (orcamento_id)
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
CREATE TRIGGER update_orcamentos_updated_at 
    BEFORE UPDATE ON orcamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at 
    BEFORE UPDATE ON pagamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo para testes (opcional)
INSERT INTO orcamentos (
    numero_orcamento, 
    nome_paciente, 
    email_paciente, 
    valor_final, 
    status, 
    observacoes
) VALUES 
(
    'ORC-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-001',
    'João Silva',
    'joao@exemplo.com',
    150.00,
    'pendente',
    'Consulta odontológica'
) ON CONFLICT (numero_orcamento) DO NOTHING;

-- Verificar estrutura criada
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('orcamentos', 'pagamentos', 'orcamento_itens')
ORDER BY table_name, ordinal_position;
