-- Migration: Estrutura integrada do sistema
-- Arquivo: migrations/001_estrutura_integrada.sql

-- ================================
-- TABELA PACIENTES (MASTER TABLE)
-- ================================
CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    data_nascimento DATE,
    endereco TEXT,
    convenio VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ativo',
    
    -- CONTROLE DE ACESSO AO DASHBOARD
    tem_acesso_dashboard BOOLEAN DEFAULT false,
    usuario_id INTEGER, -- Será FK depois que criar tabela usuarios
    
    -- METADADOS
    primeira_consulta DATE,
    total_consultas INTEGER DEFAULT 0,
    valor_total_tratamentos DECIMAL(10,2) DEFAULT 0,
    observacoes_gerais TEXT,
    
    -- AUDITORIA
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER -- Será FK para funcionarios
);

-- ================================
-- TABELA PRONTUARIOS
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
-- Verificar se a tabela agendamentos já existe
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agendamentos') THEN
        -- Adicionar colunas se não existirem
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'paciente_id') THEN
            ALTER TABLE agendamentos ADD COLUMN paciente_id INTEGER REFERENCES pacientes(id);
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'caderno_criado') THEN
            ALTER TABLE agendamentos ADD COLUMN caderno_criado BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'caderno_id') THEN
            ALTER TABLE agendamentos ADD COLUMN caderno_id VARCHAR(50);
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'etapa_jornada') THEN
            ALTER TABLE agendamentos ADD COLUMN etapa_jornada VARCHAR(50) DEFAULT 'agendado';
        END IF;
    ELSE
        -- Criar tabela agendamentos se não existir
        CREATE TABLE agendamentos (
            id SERIAL PRIMARY KEY,
            paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
            data_agendamento TIMESTAMP NOT NULL,
            tipo_consulta VARCHAR(100),
            status VARCHAR(50) DEFAULT 'agendado',
            observacoes TEXT,
            
            -- INTEGRAÇÃO COM CADERNO DIGITAL
            caderno_criado BOOLEAN DEFAULT false,
            caderno_id VARCHAR(50),
            
            -- JORNADA
            etapa_jornada VARCHAR(50) DEFAULT 'agendado',
            
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- ================================
-- TABELA FICHAS DE ATENDIMENTO
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
    criado_por INTEGER -- FK para funcionarios
);

-- ================================
-- TABELA ORÇAMENTOS
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
    status VARCHAR(50) DEFAULT 'pendente', -- pendente, enviado, aceito, recusado
    enviado_em TIMESTAMP,
    aceito_em TIMESTAMP,
    vencimento DATE,
    
    -- JORNADA INTEGRATION
    etapa_jornada VARCHAR(50) DEFAULT 'elaboracao',
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER -- FK para funcionarios
);

-- ================================
-- TABELA JORNADA DO PACIENTE
-- ================================
CREATE TABLE IF NOT EXISTS jornada_paciente (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    
    -- ETAPAS DO FLUXO
    etapa_atual VARCHAR(50) NOT NULL,
    etapa_anterior VARCHAR(50),
    proxima_acao TEXT,
    prazo_acao TIMESTAMP,
    prioridade VARCHAR(20) DEFAULT 'normal', -- normal, atencao, urgente
    
    -- REFERENCIAS
    agendamento_id INTEGER REFERENCES agendamentos(id),
    orcamento_id INTEGER REFERENCES orcamentos(id),
    
    -- CONTROLE
    status VARCHAR(50) DEFAULT 'ativo',
    observacoes TEXT,
    notificacao_enviada BOOLEAN DEFAULT false,
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- TABELA GESTÃO DE EVOLUÇÃO
-- ================================
CREATE TABLE IF NOT EXISTS gestao_evolucao (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    prontuario_id INTEGER REFERENCES prontuarios(id) NOT NULL,
    
    -- DADOS DA EVOLUÇÃO
    data_evolucao DATE NOT NULL,
    tipo_evolucao VARCHAR(50), -- consulta, retorno, pos_operatorio
    descricao TEXT NOT NULL,
    
    -- IMAGENS/ANEXOS
    fotos_antes TEXT[], -- URLs das fotos
    fotos_depois TEXT[],
    anexos TEXT[],
    
    -- STATUS
    status VARCHAR(50) DEFAULT 'ativa',
    proxima_consulta DATE,
    observacoes TEXT,
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER -- FK para funcionarios
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
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ================================
COMMENT ON TABLE pacientes IS 'Tabela principal de pacientes - todos os pacientes do sistema';
COMMENT ON COLUMN pacientes.tem_acesso_dashboard IS 'Define se o paciente tem acesso ao dashboard online';
COMMENT ON COLUMN pacientes.usuario_id IS 'ID do usuário se tem acesso ao dashboard, NULL caso contrário';

COMMENT ON TABLE prontuarios IS 'Prontuários médicos - um por paciente';
COMMENT ON TABLE fichas_atendimento IS 'Fichas de atendimento - registros de consultas';
COMMENT ON TABLE orcamentos IS 'Orçamentos elaborados para pacientes';
COMMENT ON TABLE jornada_paciente IS 'Controle de fluxo e etapas do paciente no sistema';
COMMENT ON TABLE gestao_evolucao IS 'Acompanhamento e evolução dos tratamentos';
