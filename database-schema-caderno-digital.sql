-- ===================================
-- SCHEMA COMPLETO PARA CADERNO DIGITAL
-- Inclui: Receitas, Exames e Fichas de Atendimento
-- ===================================

-- Tabela para Receitas Médicas
CREATE TABLE IF NOT EXISTS receitas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL,
    medico_nome VARCHAR(255) NOT NULL,
    medico_crm VARCHAR(50) NOT NULL,
    data_emissao DATE NOT NULL,
    prescricao TEXT,
    observacoes TEXT,
    status VARCHAR(50) DEFAULT 'ativa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Medicamentos da Receita
CREATE TABLE IF NOT EXISTS receita_medicamentos (
    id SERIAL PRIMARY KEY,
    receita_id INTEGER REFERENCES receitas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    concentracao VARCHAR(100),
    forma_farmaceutica VARCHAR(100),
    quantidade VARCHAR(50),
    posologia TEXT,
    via_administracao VARCHAR(50) DEFAULT 'Oral',
    uso_continuo BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Exames Solicitados
CREATE TABLE IF NOT EXISTS exames (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL,
    medico_nome VARCHAR(255) NOT NULL,
    medico_crm VARCHAR(50) NOT NULL,
    data_solicitacao DATE NOT NULL,
    tipo_exame VARCHAR(100),
    exames_solicitados TEXT,
    justificativa_clinica TEXT,
    cid_10 VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pendente',
    data_realizacao DATE,
    resultado TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Fichas de Atendimento
CREATE TABLE IF NOT EXISTS fichas_atendimento (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL,
    paciente_nome VARCHAR(255) NOT NULL,
    paciente_idade INTEGER,
    data_atendimento DATE NOT NULL,
    tipo_consulta VARCHAR(100),
    queixa_principal TEXT,
    historia_doenca TEXT,
    alergias TEXT,
    medicacoes_atuais TEXT,
    pressao_arterial VARCHAR(20),
    frequencia_cardiaca VARCHAR(10),
    peso DECIMAL(5,2),
    altura DECIMAL(4,2),
    exame_fisico TEXT,
    diagnostico TEXT,
    conduta TEXT,
    observacoes TEXT,
    proximo_retorno DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================
-- ÍNDICES PARA PERFORMANCE
-- ===================================

-- Índices para Receitas
CREATE INDEX IF NOT EXISTS idx_receitas_paciente_id ON receitas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_receitas_data_emissao ON receitas(data_emissao);
CREATE INDEX IF NOT EXISTS idx_receitas_status ON receitas(status);

-- Índices para Medicamentos
CREATE INDEX IF NOT EXISTS idx_receita_medicamentos_receita_id ON receita_medicamentos(receita_id);

-- Índices para Exames
CREATE INDEX IF NOT EXISTS idx_exames_paciente_id ON exames(paciente_id);
CREATE INDEX IF NOT EXISTS idx_exames_data_solicitacao ON exames(data_solicitacao);
CREATE INDEX IF NOT EXISTS idx_exames_status ON exames(status);

-- Índices para Fichas de Atendimento
CREATE INDEX IF NOT EXISTS idx_fichas_paciente_id ON fichas_atendimento(paciente_id);
CREATE INDEX IF NOT EXISTS idx_fichas_data_atendimento ON fichas_atendimento(data_atendimento);
CREATE INDEX IF NOT EXISTS idx_fichas_paciente_nome ON fichas_atendimento(paciente_nome);

-- ===================================
-- TRIGGERS PARA UPDATED_AT
-- ===================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_receitas_updated_at BEFORE UPDATE ON receitas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exames_updated_at BEFORE UPDATE ON exames FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fichas_updated_at BEFORE UPDATE ON fichas_atendimento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- INSERÇÃO DE DADOS DE EXEMPLO
-- ===================================

-- Dados de exemplo para teste (podem ser removidos em produção)
-- Inserir apenas se as tabelas estiverem vazias

DO $$
BEGIN
    -- Receita de exemplo
    IF NOT EXISTS (SELECT 1 FROM receitas LIMIT 1) THEN
        INSERT INTO receitas (paciente_id, medico_nome, medico_crm, data_emissao, prescricao, observacoes)
        VALUES (1, 'Dr. Marcio Scartozzoni', 'CRM/SP-123456', CURRENT_DATE, 
                'Dipirona 500mg - 1 comprimido de 6/6h se dor', 
                'Tomar com alimento');
    END IF;

    -- Exame de exemplo
    IF NOT EXISTS (SELECT 1 FROM exames LIMIT 1) THEN
        INSERT INTO exames (paciente_id, medico_nome, medico_crm, data_solicitacao, tipo_exame, 
                           exames_solicitados, justificativa_clinica)
        VALUES (1, 'Dr. Marcio Scartozzoni', 'CRM/SP-123456', CURRENT_DATE, 'Laboratorial',
                'Hemograma completo, Glicemia de jejum', 'Avaliação de rotina');
    END IF;

    -- Ficha de atendimento de exemplo
    IF NOT EXISTS (SELECT 1 FROM fichas_atendimento LIMIT 1) THEN
        INSERT INTO fichas_atendimento (paciente_id, paciente_nome, paciente_idade, data_atendimento,
                                       tipo_consulta, queixa_principal, diagnostico)
        VALUES (1, 'Paciente Exemplo', 35, CURRENT_DATE, 'Consulta', 'Dor de cabeça', 'Cefaleia tensional');
    END IF;
END $$;
