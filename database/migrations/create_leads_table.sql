-- Criação da tabela de leads para captura via landing page
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    protocolo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    idade VARCHAR(20),
    procedimento VARCHAR(255) NOT NULL,
    observacoes TEXT,
    origem VARCHAR(100) DEFAULT 'landing-publica',
    status VARCHAR(50) DEFAULT 'novo',
    data_captura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Campos para tracking e conversão
    convertido_em_paciente BOOLEAN DEFAULT FALSE,
    paciente_id INTEGER,
    data_conversao TIMESTAMP WITH TIME ZONE,
    responsavel_conversao VARCHAR(255),
    
    -- Campos para marketing
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    referrer TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_leads_protocolo ON leads(protocolo);
CREATE INDEX IF NOT EXISTS idx_leads_telefone ON leads(telefone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_procedimento ON leads(procedimento);
CREATE INDEX IF NOT EXISTS idx_leads_origem ON leads(origem);
CREATE INDEX IF NOT EXISTS idx_leads_data_captura ON leads(data_captura);
CREATE INDEX IF NOT EXISTS idx_leads_convertido ON leads(convertido_em_paciente);

-- Trigger para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_leads_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_leads_timestamp
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_timestamp();

-- Comentários para documentação
COMMENT ON TABLE leads IS 'Tabela para armazenar leads capturados via landing pages públicas';
COMMENT ON COLUMN leads.protocolo IS 'Identificador único do lead para rastreamento';
COMMENT ON COLUMN leads.origem IS 'Origem do lead (landing-publica, instagram, facebook, etc.)';
COMMENT ON COLUMN leads.status IS 'Status do lead (novo, contatado, agendado, convertido, perdido)';
COMMENT ON COLUMN leads.convertido_em_paciente IS 'Indica se o lead foi convertido em paciente';
COMMENT ON COLUMN leads.paciente_id IS 'ID do paciente caso tenha sido convertido';

-- Inserir alguns status padrão se não existirem
-- (Esta parte pode ser executada apenas uma vez)
