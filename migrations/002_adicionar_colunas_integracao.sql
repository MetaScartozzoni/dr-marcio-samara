-- Migration: Adicionar colunas para integração
-- Arquivo: migrations/002_adicionar_colunas_integracao.sql

-- ================================
-- ATUALIZAR TABELA PACIENTES
-- ================================

-- Adicionar colunas de integração se não existirem
DO $$ 
BEGIN
    -- Coluna de controle de acesso ao dashboard
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pacientes' AND column_name = 'tem_acesso_dashboard') THEN
        ALTER TABLE pacientes ADD COLUMN tem_acesso_dashboard BOOLEAN DEFAULT false;
        COMMENT ON COLUMN pacientes.tem_acesso_dashboard IS 'Define se o paciente tem acesso ao dashboard online';
    END IF;
    
    -- Referência ao usuário se tem acesso
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pacientes' AND column_name = 'usuario_id') THEN
        ALTER TABLE pacientes ADD COLUMN usuario_id INTEGER;
        COMMENT ON COLUMN pacientes.usuario_id IS 'ID do usuário se tem acesso ao dashboard, NULL caso contrário';
    END IF;
    
    -- Contador de consultas
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pacientes' AND column_name = 'total_consultas') THEN
        ALTER TABLE pacientes ADD COLUMN total_consultas INTEGER DEFAULT 0;
    END IF;
    
    -- Valor total de tratamentos
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pacientes' AND column_name = 'valor_total_tratamentos') THEN
        ALTER TABLE pacientes ADD COLUMN valor_total_tratamentos DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Observações gerais (renomear se necessário)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pacientes' AND column_name = 'observacoes_gerais') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pacientes' AND column_name = 'observacoes') THEN
            ALTER TABLE pacientes RENAME COLUMN observacoes TO observacoes_gerais;
        ELSE
            ALTER TABLE pacientes ADD COLUMN observacoes_gerais TEXT;
        END IF;
    END IF;
    
    -- Timestamps de auditoria
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pacientes' AND column_name = 'criado_em') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pacientes' AND column_name = 'data_cadastro') THEN
            ALTER TABLE pacientes RENAME COLUMN data_cadastro TO criado_em;
        ELSE
            ALTER TABLE pacientes ADD COLUMN criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pacientes' AND column_name = 'atualizado_em') THEN
        ALTER TABLE pacientes ADD COLUMN atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pacientes' AND column_name = 'criado_por') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pacientes' AND column_name = 'cadastrado_por') THEN
            ALTER TABLE pacientes RENAME COLUMN cadastrado_por TO criado_por;
        ELSE
            ALTER TABLE pacientes ADD COLUMN criado_por INTEGER;
        END IF;
    END IF;
END $$;

-- ================================
-- CRIAR TABELA PRONTUARIOS
-- ================================
CREATE TABLE IF NOT EXISTS prontuarios (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    numero_prontuario VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'ativo',
    
    -- DOCUMENTOS ASSOCIADOS
    total_fichas_atendimento INTEGER DEFAULT 0,
    total_orcamentos INTEGER DEFAULT 0,
    total_evolucoes INTEGER DEFAULT 0,
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- ATUALIZAR TABELA AGENDAMENTOS 
-- ================================
DO $$ 
BEGIN
    -- Usar consultas se agendamentos não existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agendamentos') THEN
        -- Renomear consultas para agendamentos se existir
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'consultas') THEN
            ALTER TABLE consultas RENAME TO agendamentos;
        ELSE
            -- Criar tabela agendamentos
            CREATE TABLE agendamentos (
                id SERIAL PRIMARY KEY,
                paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
                data_agendamento TIMESTAMP NOT NULL,
                tipo_consulta VARCHAR(100),
                status VARCHAR(50) DEFAULT 'agendado',
                observacoes TEXT,
                caderno_criado BOOLEAN DEFAULT false,
                caderno_id VARCHAR(50),
                etapa_jornada VARCHAR(50) DEFAULT 'agendado',
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        END IF;
    END IF;
    
    -- Adicionar colunas se não existirem
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'caderno_criado') THEN
        ALTER TABLE agendamentos ADD COLUMN caderno_criado BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'caderno_id') THEN
        ALTER TABLE agendamentos ADD COLUMN caderno_id VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'etapa_jornada') THEN
        ALTER TABLE agendamentos ADD COLUMN etapa_jornada VARCHAR(50) DEFAULT 'agendado';
    END IF;
    
    -- Padronizar nomes de colunas
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'data_consulta') THEN
        ALTER TABLE agendamentos RENAME COLUMN data_consulta TO data_agendamento;
    END IF;
END $$;

-- ================================
-- CRIAR TABELA FICHAS DE ATENDIMENTO
-- ================================
CREATE TABLE IF NOT EXISTS fichas_atendimento (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    prontuario_id INTEGER REFERENCES prontuarios(id) NOT NULL,
    agendamento_id INTEGER REFERENCES agendamentos(id),
    
    -- DADOS CLÍNICOS
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
    
    -- STATUS
    status VARCHAR(50) DEFAULT 'em_andamento',
    finalizada_em TIMESTAMP,
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER
);

-- ================================
-- CRIAR TABELA ORÇAMENTOS
-- ================================
CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    ficha_atendimento_id INTEGER REFERENCES fichas_atendimento(id),
    
    -- DADOS DO ORÇAMENTO
    numero_orcamento VARCHAR(50) UNIQUE NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    descricao_procedimento TEXT,
    forma_pagamento VARCHAR(100),
    observacoes TEXT,
    
    -- STATUS E CONTROLE
    status VARCHAR(50) DEFAULT 'pendente',
    enviado_em TIMESTAMP,
    aceito_em TIMESTAMP,
    vencimento DATE,
    
    -- JORNADA INTEGRATION
    etapa_jornada VARCHAR(50) DEFAULT 'elaboracao',
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER
);

-- ================================
-- ATUALIZAR TABELA JORNADA_PACIENTE
-- ================================
DO $$ 
BEGIN
    -- Adicionar colunas se não existirem
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jornada_paciente' AND column_name = 'agendamento_id') THEN
        ALTER TABLE jornada_paciente ADD COLUMN agendamento_id INTEGER REFERENCES agendamentos(id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jornada_paciente' AND column_name = 'orcamento_id') THEN
        ALTER TABLE jornada_paciente ADD COLUMN orcamento_id INTEGER REFERENCES orcamentos(id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jornada_paciente' AND column_name = 'etapa_anterior') THEN
        ALTER TABLE jornada_paciente ADD COLUMN etapa_anterior VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jornada_paciente' AND column_name = 'atualizado_em') THEN
        ALTER TABLE jornada_paciente ADD COLUMN atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ================================
-- CRIAR TABELA GESTÃO DE EVOLUÇÃO
-- ================================
CREATE TABLE IF NOT EXISTS gestao_evolucao (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    prontuario_id INTEGER REFERENCES prontuarios(id) NOT NULL,
    
    -- DADOS DA EVOLUÇÃO
    data_evolucao DATE NOT NULL,
    tipo_evolucao VARCHAR(50),
    descricao TEXT NOT NULL,
    
    -- IMAGENS/ANEXOS
    fotos_antes TEXT[],
    fotos_depois TEXT[],
    anexos TEXT[],
    
    -- STATUS
    status VARCHAR(50) DEFAULT 'ativa',
    proxima_consulta DATE,
    observacoes TEXT,
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER
);

-- ================================
-- ÍNDICES PARA PERFORMANCE
-- ================================
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_email ON pacientes(email);
CREATE INDEX IF NOT EXISTS idx_pacientes_acesso_dashboard ON pacientes(tem_acesso_dashboard);

CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente ON prontuarios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_numero ON prontuarios(numero_prontuario);

CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente ON agendamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);

CREATE INDEX IF NOT EXISTS idx_fichas_paciente ON fichas_atendimento(paciente_id);
CREATE INDEX IF NOT EXISTS idx_fichas_prontuario ON fichas_atendimento(prontuario_id);
CREATE INDEX IF NOT EXISTS idx_fichas_agendamento ON fichas_atendimento(agendamento_id);

CREATE INDEX IF NOT EXISTS idx_orcamentos_paciente ON orcamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_numero ON orcamentos(numero_orcamento);

CREATE INDEX IF NOT EXISTS idx_jornada_paciente ON jornada_paciente(paciente_id);
CREATE INDEX IF NOT EXISTS idx_jornada_etapa ON jornada_paciente(etapa_atual);
CREATE INDEX IF NOT EXISTS idx_jornada_prioridade ON jornada_paciente(prioridade);
CREATE INDEX IF NOT EXISTS idx_jornada_prazo ON jornada_paciente(prazo_acao);

CREATE INDEX IF NOT EXISTS idx_evolucao_paciente ON gestao_evolucao(paciente_id);
CREATE INDEX IF NOT EXISTS idx_evolucao_prontuario ON gestao_evolucao(prontuario_id);
CREATE INDEX IF NOT EXISTS idx_evolucao_data ON gestao_evolucao(data_evolucao);

-- ================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ================================

-- Trigger para atualizar updated_at em pacientes
CREATE OR REPLACE FUNCTION update_pacientes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pacientes_timestamp ON pacientes;
CREATE TRIGGER trigger_update_pacientes_timestamp
    BEFORE UPDATE ON pacientes
    FOR EACH ROW
    EXECUTE FUNCTION update_pacientes_timestamp();

-- Trigger para atualizar jornada_paciente timestamp
CREATE OR REPLACE FUNCTION update_jornada_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_jornada_timestamp ON jornada_paciente;
CREATE TRIGGER trigger_update_jornada_timestamp
    BEFORE UPDATE ON jornada_paciente
    FOR EACH ROW
    EXECUTE FUNCTION update_jornada_timestamp();

-- ================================
-- DADOS INICIAIS DE CONFIGURAÇÃO
-- ================================

-- Inserir configurações padrão de jornada se não existirem
INSERT INTO system_config (config_key, config_value, is_locked) 
VALUES 
    ('jornada_prazo_orcamento_horas', '24', false),
    ('jornada_prazo_resposta_orcamento_dias', '7', false),
    ('jornada_prazo_confirmacao_consulta_horas', '2', false),
    ('jornada_notificacao_antecedencia_horas', '24', false)
ON CONFLICT (config_key) DO NOTHING;

-- ================================
-- CRIAR PRONTUÁRIOS PARA PACIENTES EXISTENTES
-- ================================

-- Função para gerar número de prontuário
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

-- Criar prontuários para pacientes que não têm
INSERT INTO prontuarios (paciente_id, numero_prontuario)
SELECT 
    p.id,
    gerar_numero_prontuario(p.id)
FROM pacientes p
LEFT JOIN prontuarios pr ON p.id = pr.paciente_id
WHERE pr.id IS NULL;

-- Criar jornada inicial para pacientes que não têm
INSERT INTO jornada_paciente (paciente_id, etapa_atual, proxima_acao, prioridade)
SELECT 
    p.id,
    'cadastrado',
    'Paciente já cadastrado no sistema',
    'normal'
FROM pacientes p
LEFT JOIN jornada_paciente jp ON p.id = jp.paciente_id AND jp.status = 'ativo'
WHERE jp.id IS NULL;
