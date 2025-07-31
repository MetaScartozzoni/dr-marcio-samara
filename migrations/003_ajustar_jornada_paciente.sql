-- Migration: Ajustar estrutura da jornada_paciente
-- Arquivo: migrations/003_ajustar_jornada_paciente.sql

-- ================================
-- ATUALIZAR TABELA JORNADA_PACIENTE
-- ================================
DO $$ 
BEGIN
    -- Adicionar colunas necessárias para o novo fluxo
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jornada_paciente' AND column_name = 'etapa_atual') THEN
        ALTER TABLE jornada_paciente ADD COLUMN etapa_atual VARCHAR(50) DEFAULT 'cadastrado';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jornada_paciente' AND column_name = 'etapa_anterior') THEN
        ALTER TABLE jornada_paciente ADD COLUMN etapa_anterior VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jornada_paciente' AND column_name = 'proxima_acao') THEN
        ALTER TABLE jornada_paciente ADD COLUMN proxima_acao TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jornada_paciente' AND column_name = 'prazo_acao') THEN
        ALTER TABLE jornada_paciente ADD COLUMN prazo_acao TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jornada_paciente' AND column_name = 'prioridade') THEN
        ALTER TABLE jornada_paciente ADD COLUMN prioridade VARCHAR(20) DEFAULT 'normal';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jornada_paciente' AND column_name = 'agendamento_id') THEN
        ALTER TABLE jornada_paciente ADD COLUMN agendamento_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jornada_paciente' AND column_name = 'orcamento_id') THEN
        ALTER TABLE jornada_paciente ADD COLUMN orcamento_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jornada_paciente' AND column_name = 'atualizado_em') THEN
        ALTER TABLE jornada_paciente ADD COLUMN atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ================================
-- CRIAR OUTRAS TABELAS SE NÃO EXISTIREM
-- ================================

-- Tabela prontuarios
CREATE TABLE IF NOT EXISTS prontuarios (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    numero_prontuario VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'ativo',
    total_fichas_atendimento INTEGER DEFAULT 0,
    total_orcamentos INTEGER DEFAULT 0,
    total_evolucoes INTEGER DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela fichas_atendimento
CREATE TABLE IF NOT EXISTS fichas_atendimento (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    prontuario_id INTEGER REFERENCES prontuarios(id) NOT NULL,
    agendamento_id INTEGER,
    peso DECIMAL(5,2),
    altura DECIMAL(3,2),
    imc DECIMAL(4,2),
    pressao_arterial VARCHAR(20),
    procedimento_desejado VARCHAR(255),
    motivo_principal TEXT,
    historico_medico TEXT,
    medicamentos_uso TEXT,
    alergias TEXT,
    observacoes_clinicas TEXT,
    status VARCHAR(50) DEFAULT 'em_andamento',
    finalizada_em TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER
);

-- Tabela orcamentos
CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    ficha_atendimento_id INTEGER REFERENCES fichas_atendimento(id),
    numero_orcamento VARCHAR(50) UNIQUE NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    descricao_procedimento TEXT,
    forma_pagamento VARCHAR(100),
    observacoes TEXT,
    status VARCHAR(50) DEFAULT 'pendente',
    enviado_em TIMESTAMP,
    aceito_em TIMESTAMP,
    vencimento DATE,
    etapa_jornada VARCHAR(50) DEFAULT 'elaboracao',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER
);

-- Tabela gestao_evolucao
CREATE TABLE IF NOT EXISTS gestao_evolucao (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    prontuario_id INTEGER REFERENCES prontuarios(id) NOT NULL,
    data_evolucao DATE NOT NULL,
    tipo_evolucao VARCHAR(50),
    descricao TEXT NOT NULL,
    fotos_antes TEXT[],
    fotos_depois TEXT[],
    anexos TEXT[],
    status VARCHAR(50) DEFAULT 'ativa',
    proxima_consulta DATE,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER
);

-- ================================
-- ATUALIZAR TABELA AGENDAMENTOS
-- ================================
DO $$ 
BEGIN
    -- Renomear consultas para agendamentos se necessário
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agendamentos') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'consultas') THEN
        ALTER TABLE consultas RENAME TO agendamentos;
    END IF;
    
    -- Renomear coluna data_consulta para data_agendamento se necessário
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'data_consulta') THEN
        ALTER TABLE agendamentos RENAME COLUMN data_consulta TO data_agendamento;
    END IF;
    
    -- Adicionar colunas de integração
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'caderno_criado') THEN
        ALTER TABLE agendamentos ADD COLUMN caderno_criado BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'caderno_id') THEN
        ALTER TABLE agendamentos ADD COLUMN caderno_id VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'etapa_jornada') THEN
        ALTER TABLE agendamentos ADD COLUMN etapa_jornada VARCHAR(50) DEFAULT 'agendado';
    END IF;
END $$;

-- ================================
-- ÍNDICES
-- ================================
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_acesso_dashboard ON pacientes(tem_acesso_dashboard);
CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente ON prontuarios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_jornada_paciente ON jornada_paciente(paciente_id);
CREATE INDEX IF NOT EXISTS idx_jornada_etapa ON jornada_paciente(etapa_atual);
CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente ON agendamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_fichas_paciente ON fichas_atendimento(paciente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_paciente ON orcamentos(paciente_id);

-- ================================
-- FUNÇÃO PARA GERAR NÚMERO DE PRONTUÁRIO
-- ================================
CREATE OR REPLACE FUNCTION gerar_numero_prontuario(p_paciente_id INTEGER)
RETURNS VARCHAR(50) AS $$
DECLARE
    ano INTEGER;
    sequencial VARCHAR(4);
BEGIN
    ano := EXTRACT(YEAR FROM CURRENT_DATE);
    sequencial := LPAD(p_paciente_id::TEXT, 4, '0');
    RETURN 'PRON' || ano || sequencial;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- ATUALIZAR DADOS EXISTENTES
-- ================================

-- Atualizar pacientes existentes com valores padrão
UPDATE pacientes 
SET tem_acesso_dashboard = false,
    total_consultas = 0,
    valor_total_tratamentos = 0
WHERE tem_acesso_dashboard IS NULL;

-- Criar prontuários para pacientes que não têm
INSERT INTO prontuarios (paciente_id, numero_prontuario)
SELECT 
    p.id,
    gerar_numero_prontuario(p.id)
FROM pacientes p
LEFT JOIN prontuarios pr ON p.id = pr.paciente_id
WHERE pr.id IS NULL;

-- Atualizar jornadas existentes com novos campos
UPDATE jornada_paciente 
SET etapa_atual = COALESCE(etapa_atual, 'cadastrado'),
    prioridade = COALESCE(prioridade, 'normal'),
    proxima_acao = COALESCE(proxima_acao, 'Paciente cadastrado no sistema')
WHERE etapa_atual IS NULL OR prioridade IS NULL;

-- Criar jornada para pacientes que não têm
INSERT INTO jornada_paciente (paciente_id, etapa_atual, proxima_acao, prioridade)
SELECT 
    p.id,
    'cadastrado',
    'Paciente já cadastrado no sistema',
    'normal'
FROM pacientes p
LEFT JOIN jornada_paciente jp ON p.id = jp.paciente_id
WHERE jp.id IS NULL;

-- ================================
-- CONFIGURAÇÕES DO SISTEMA
-- ================================
INSERT INTO system_config (config_key, config_value, is_locked) 
VALUES 
    ('jornada_prazo_orcamento_horas', '24', false),
    ('jornada_prazo_resposta_orcamento_dias', '7', false),
    ('jornada_prazo_confirmacao_consulta_horas', '2', false),
    ('jornada_notificacao_antecedencia_horas', '24', false)
ON CONFLICT (config_key) DO NOTHING;
