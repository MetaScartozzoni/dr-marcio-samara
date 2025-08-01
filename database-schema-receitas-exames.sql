-- Schema para Receitas Médicas e Solicitações de Exames
-- Adicionar ao database-schema-completo.sql

-- ==========================================
-- TABELAS PARA RECEITAS MÉDICAS
-- ==========================================

CREATE TABLE IF NOT EXISTS receitas_medicas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    observacoes TEXT,
    tipo_receita VARCHAR(20) DEFAULT 'comum' CHECK (tipo_receita IN ('comum', 'controlada', 'especial')),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_validade DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'utilizada', 'cancelada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receita_medicamentos (
    id SERIAL PRIMARY KEY,
    receita_id INTEGER NOT NULL REFERENCES receitas_medicas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    dosagem VARCHAR(100) NOT NULL,
    frequencia VARCHAR(100) NOT NULL,
    duracao VARCHAR(100) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- TABELAS PARA SOLICITAÇÕES DE EXAMES
-- ==========================================

CREATE TABLE IF NOT EXISTS solicitacoes_exames (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    indicacao_clinica TEXT NOT NULL,
    hipotese_diagnostica TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_validade DATE DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'parcial', 'concluido', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exames_solicitados (
    id SERIAL PRIMARY KEY,
    solicitacao_id INTEGER NOT NULL REFERENCES solicitacoes_exames(id) ON DELETE CASCADE,
    tipo VARCHAR(100) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) DEFAULT 'laboratorio' CHECK (categoria IN ('laboratorio', 'imagem', 'cardiologico', 'especial')),
    urgente BOOLEAN DEFAULT FALSE,
    observacoes TEXT,
    resultado TEXT,
    data_realizacao DATE,
    observacoes_resultado TEXT,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'coletado', 'processando', 'concluido', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índices para receitas
CREATE INDEX IF NOT EXISTS idx_receitas_paciente ON receitas_medicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_receitas_medico ON receitas_medicas(medico_id);
CREATE INDEX IF NOT EXISTS idx_receitas_data ON receitas_medicas(data_criacao);
CREATE INDEX IF NOT EXISTS idx_receitas_status ON receitas_medicas(status);

-- Índices para medicamentos
CREATE INDEX IF NOT EXISTS idx_medicamentos_receita ON receita_medicamentos(receita_id);

-- Índices para solicitações de exames
CREATE INDEX IF NOT EXISTS idx_solicitacoes_paciente ON solicitacoes_exames(paciente_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_medico ON solicitacoes_exames(medico_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_data ON solicitacoes_exames(data_criacao);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes_exames(status);

-- Índices para exames solicitados
CREATE INDEX IF NOT EXISTS idx_exames_solicitacao ON exames_solicitados(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_exames_categoria ON exames_solicitados(categoria);
CREATE INDEX IF NOT EXISTS idx_exames_status ON exames_solicitados(status);
CREATE INDEX IF NOT EXISTS idx_exames_urgente ON exames_solicitados(urgente);

-- ==========================================
-- TRIGGERS PARA UPDATED_AT
-- ==========================================

-- Trigger para receitas_medicas
CREATE OR REPLACE FUNCTION update_receitas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_receitas_updated_at
    BEFORE UPDATE ON receitas_medicas
    FOR EACH ROW
    EXECUTE FUNCTION update_receitas_updated_at();

-- Trigger para solicitacoes_exames
CREATE OR REPLACE FUNCTION update_solicitacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_solicitacoes_updated_at
    BEFORE UPDATE ON solicitacoes_exames
    FOR EACH ROW
    EXECUTE FUNCTION update_solicitacoes_updated_at();

-- Trigger para exames_solicitados
CREATE OR REPLACE FUNCTION update_exames_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exames_updated_at
    BEFORE UPDATE ON exames_solicitados
    FOR EACH ROW
    EXECUTE FUNCTION update_exames_updated_at();

-- ==========================================
-- COMENTÁRIOS DAS TABELAS
-- ==========================================

COMMENT ON TABLE receitas_medicas IS 'Receitas médicas emitidas pelos profissionais';
COMMENT ON TABLE receita_medicamentos IS 'Medicamentos prescritos em cada receita';
COMMENT ON TABLE solicitacoes_exames IS 'Solicitações de exames médicos';
COMMENT ON TABLE exames_solicitados IS 'Exames individuais solicitados em cada requisição';

-- ==========================================
-- DADOS INICIAIS DE EXEMPLO (OPCIONAL)
-- ==========================================

-- Tipos de exames mais comuns
INSERT INTO public.configuracoes (chave, valor, descricao, categoria) VALUES
('exames_laboratorio', '["Hemograma Completo", "Glicemia", "Colesterol Total", "Triglicérides", "Ureia", "Creatinina", "TGO/AST", "TGP/ALT", "TSH", "T4 Livre"]', 'Lista de exames de laboratório comuns', 'exames'),
('exames_imagem', '["Raio-X Tórax", "Ultrassom Abdomen", "Tomografia", "Ressonância Magnética", "Mamografia", "Densitometria Óssea"]', 'Lista de exames de imagem comuns', 'exames'),
('exames_cardiologicos', '["Eletrocardiograma (ECG)", "Ecocardiograma", "Teste Ergométrico", "Holter 24h", "MAPA"]', 'Lista de exames cardiológicos comuns', 'exames')
ON CONFLICT (chave) DO NOTHING;
