-- =====================================================
-- ESTRUTURA COMPLETA DO BANCO - PORTAL DR. MARCIO
-- Integração 100% com Frontend Existente
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA SYSTEM_CONFIG (Configurações do Sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'string', -- string, boolean, number, json
    categoria VARCHAR(50) DEFAULT 'geral',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configurações padrão
INSERT INTO system_config (chave, valor, descricao, categoria) VALUES 
('sistema_inicializado', 'false', 'Sistema foi configurado pela primeira vez', 'sistema'),
('primeiro_admin_criado', 'false', 'Primeiro administrador foi criado', 'sistema'),
('clinica_nome', 'Dr. Marcio Scartozzoni', 'Nome da clínica', 'clinica'),
('clinica_endereco', '', 'Endereço da clínica', 'clinica'),
('clinica_telefone', '', 'Telefone da clínica', 'clinica'),
('email_verificacao_obrigatoria', 'true', 'Verificação de email obrigatória', 'seguranca')
ON CONFLICT (chave) DO NOTHING;

-- =====================================================
-- 2. TABELA FUNCIONARIOS (Separada de pacientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS funcionarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14),
    
    -- Tipos específicos do sistema médico
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('admin', 'staff', 'recepcao', 'enfermeiro')),
    
    -- Status e permissões
    ativo BOOLEAN DEFAULT true,
    email_verificado BOOLEAN DEFAULT false,
    primeiro_acesso BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMP,
    
    -- Dados profissionais
    crm VARCHAR(20), -- Para médicos
    especialidade VARCHAR(100),
    horario_trabalho JSONB, -- {dias: ["seg", "ter"], inicio: "08:00", fim: "18:00"}
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES funcionarios(id)
);

-- =====================================================
-- 3. TABELA PACIENTES (Separada e específica)
-- =====================================================
CREATE TABLE IF NOT EXISTS pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telefone VARCHAR(20) NOT NULL, -- Obrigatório para contato
    cpf VARCHAR(14) UNIQUE,
    
    -- Dados pessoais específicos
    data_nascimento DATE,
    genero VARCHAR(20),
    endereco TEXT,
    cep VARCHAR(10),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    
    -- Dados médicos básicos
    convenio VARCHAR(100),
    numero_convenio VARCHAR(50),
    alergias TEXT,
    medicamentos_uso TEXT,
    observacoes_gerais TEXT,
    
    -- Status no sistema
    ativo BOOLEAN DEFAULT true,
    email_verificado BOOLEAN DEFAULT false,
    primeira_consulta BOOLEAN DEFAULT true,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES funcionarios(id)
);

-- =====================================================
-- 4. TABELA AGENDAMENTOS (Core do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    funcionario_id UUID REFERENCES funcionarios(id), -- Quem atende
    
    -- Dados do agendamento
    data_agendamento TIMESTAMP NOT NULL,
    data_fim TIMESTAMP, -- Calculado automaticamente
    tipo_consulta VARCHAR(100) NOT NULL DEFAULT 'consulta', -- consulta, retorno, cirurgia, avaliacao
    
    -- Status do agendamento
    status VARCHAR(50) NOT NULL DEFAULT 'agendado' CHECK (
        status IN ('agendado', 'confirmado', 'em_atendimento', 'realizado', 'cancelado', 'faltou', 'reagendado')
    ),
    
    -- Dados da consulta
    motivo TEXT,
    observacoes TEXT,
    valor_consulta DECIMAL(10,2) DEFAULT 0,
    
    -- Dados de contato
    telefone_contato VARCHAR(20),
    email_contato VARCHAR(255),
    
    -- Confirmações
    confirmado_paciente BOOLEAN DEFAULT false,
    confirmado_clinica BOOLEAN DEFAULT false,
    data_confirmacao TIMESTAMP,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES funcionarios(id)
);

-- =====================================================
-- 5. TABELA CONSULTAS (Resultado dos agendamentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS consultas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    medico_id UUID NOT NULL REFERENCES funcionarios(id),
    
    -- Dados da consulta realizada
    data_consulta TIMESTAMP NOT NULL,
    anamnese TEXT, -- História do paciente
    exame_fisico TEXT, -- Exame físico realizado
    diagnostico TEXT, -- Diagnóstico
    
    -- Prescrições e recomendações
    prescricao_medicamentos TEXT,
    procedimentos_recomendados TEXT,
    exames_solicitados TEXT,
    orientacoes TEXT,
    
    -- Próximos passos
    necessita_cirurgia BOOLEAN DEFAULT false,
    necessita_retorno BOOLEAN DEFAULT false,
    data_retorno_sugerida DATE,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. TABELA ORCAMENTOS (Sistema de orçamentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS orcamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_orcamento VARCHAR(20) UNIQUE NOT NULL, -- ORC001, ORC002, etc
    
    -- Relacionamentos
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    consulta_id UUID REFERENCES consultas(id),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id), -- Quem criou
    
    -- Dados do orçamento (compatível com gestao-script.js)
    data_consulta DATE NOT NULL,
    data_orcamento DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Procedimentos
    procedimento_principal VARCHAR(255) NOT NULL,
    procedimentos_adicionais TEXT,
    
    -- Valores detalhados
    valor_total DECIMAL(10,2) NOT NULL,
    valor_anestesia DECIMAL(10,2) DEFAULT 0,
    valor_hospital DECIMAL(10,2) DEFAULT 0,
    valor_material DECIMAL(10,2) DEFAULT 0,
    valor_honorarios DECIMAL(10,2) DEFAULT 0,
    
    -- Status e forma de pagamento
    status_orcamento VARCHAR(50) DEFAULT 'Pendente' CHECK (
        status_orcamento IN ('Pendente', 'Enviado', 'Aceito', 'Rejeitado', 'Expirado', 'Cancelado')
    ),
    forma_pagamento VARCHAR(100), -- à vista, 3x, 6x, 12x, etc
    validade DATE NOT NULL, -- Data de validade do orçamento
    
    -- Pagamento
    pagamento_status VARCHAR(50) DEFAULT 'Pendente' CHECK (
        pagamento_status IN ('Pendente', 'Entrada Paga', 'Pago', 'Cancelado')
    ),
    valor_entrada DECIMAL(10,2) DEFAULT 0,
    data_pagamento_entrada DATE,
    
    -- Documentos e links
    orcamento_pdf_url TEXT,
    link_aceite TEXT,
    
    -- Observações
    observacoes TEXT,
    observacoes_internas TEXT, -- Visível apenas para funcionários
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. TABELA CIRURGIAS (Agendamento de cirurgias)
-- =====================================================
CREATE TABLE IF NOT EXISTS cirurgias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    orcamento_id UUID NOT NULL REFERENCES orcamentos(id),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    cirurgiao_id UUID NOT NULL REFERENCES funcionarios(id),
    
    -- Dados da cirurgia
    data_cirurgia TIMESTAMP NOT NULL,
    local_cirurgia VARCHAR(255) NOT NULL, -- Hospital, clínica
    procedimentos TEXT NOT NULL,
    anestesista VARCHAR(255),
    equipe_apoio TEXT,
    
    -- Pré-operatório
    exames_pre_op TEXT,
    medicamentos_pre_op TEXT,
    instrucoes_pre_op TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'agendada' CHECK (
        status IN ('agendada', 'confirmada', 'realizada', 'cancelada', 'reagendada')
    ),
    
    -- Pós-operatório
    relatorio_cirurgico TEXT,
    instrucoes_pos_op TEXT,
    medicamentos_pos_op TEXT,
    data_retorno_pos_op DATE,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. TABELA EMAIL_VERIFICATIONS (Verificação de emails)
-- =====================================================
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- cadastro, recuperacao, alteracao
    
    -- Relacionamentos opcionais
    funcionario_id UUID REFERENCES funcionarios(id),
    paciente_id UUID REFERENCES pacientes(id),
    
    -- Controle
    tentativas INTEGER DEFAULT 0,
    max_tentativas INTEGER DEFAULT 3,
    expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 minutes'),
    verificado BOOLEAN DEFAULT false,
    verificado_em TIMESTAMP,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. TABELA LOGS_SISTEMA (Auditoria e logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS logs_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Quem fez a ação
    usuario_id UUID, -- Pode ser funcionario ou paciente
    usuario_tipo VARCHAR(20), -- 'funcionario' ou 'paciente'
    usuario_email VARCHAR(255),
    
    -- O que foi feito
    acao VARCHAR(100) NOT NULL, -- login, logout, criar_orcamento, etc
    entidade VARCHAR(50), -- orcamento, paciente, agendamento
    entidade_id UUID,
    
    -- Detalhes
    descricao TEXT,
    dados_anteriores JSONB, -- Estado anterior (para rollback)
    dados_novos JSONB, -- Estado novo
    
    -- Contexto técnico
    ip_address INET,
    user_agent TEXT,
    endpoint VARCHAR(255),
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 10. TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON funcionarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON pacientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orcamentos_updated_at BEFORE UPDATE ON orcamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cirurgias_updated_at BEFORE UPDATE ON cirurgias 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para funcionarios
CREATE INDEX IF NOT EXISTS idx_funcionarios_email ON funcionarios(email);
CREATE INDEX IF NOT EXISTS idx_funcionarios_tipo ON funcionarios(tipo);
CREATE INDEX IF NOT EXISTS idx_funcionarios_ativo ON funcionarios(ativo);

-- Índices para pacientes
CREATE INDEX IF NOT EXISTS idx_pacientes_email ON pacientes(email);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_telefone ON pacientes(telefone);

-- Índices para agendamentos
CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente ON agendamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_funcionario ON agendamentos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);

-- Índices para orçamentos
CREATE INDEX IF NOT EXISTS idx_orcamentos_paciente ON orcamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status_orcamento);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data ON orcamentos(data_orcamento);
CREATE INDEX IF NOT EXISTS idx_orcamentos_codigo ON orcamentos(codigo_orcamento);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_sistema(usuario_id, usuario_tipo);
CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs_sistema(acao);
CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_sistema(created_at);

-- =====================================================
-- 12. VIEWS PARA COMPATIBILIDADE COM FRONTEND
-- =====================================================

-- View para compatibilidade com sistema atual (tabela usuarios)
CREATE OR REPLACE VIEW usuarios AS
SELECT 
    id,
    nome,
    email,
    senha_hash as senha,
    telefone,
    cpf,
    'funcionario' as tipo,
    ativo as autorizado,
    created_at,
    updated_at
FROM funcionarios
UNION ALL
SELECT 
    id,
    nome,
    email,
    NULL as senha, -- Pacientes não fazem login no sistema principal
    telefone,
    cpf,
    'paciente' as tipo,
    ativo as autorizado,
    created_at,
    updated_at
FROM pacientes;

-- =====================================================
-- 13. DADOS INICIAIS ESSENCIAIS
-- =====================================================

-- Gerar código sequencial para orçamentos
CREATE SEQUENCE IF NOT EXISTS seq_orcamento_codigo START 1;

-- Função para gerar código do orçamento
CREATE OR REPLACE FUNCTION gerar_codigo_orcamento()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ORC' || LPAD(nextval('seq_orcamento_codigo')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automaticamente
CREATE OR REPLACE FUNCTION set_codigo_orcamento()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo_orcamento IS NULL OR NEW.codigo_orcamento = '' THEN
        NEW.codigo_orcamento := gerar_codigo_orcamento();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_codigo_orcamento 
    BEFORE INSERT ON orcamentos 
    FOR EACH ROW EXECUTE FUNCTION set_codigo_orcamento();

-- =====================================================
-- 14. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE funcionarios IS 'Funcionários da clínica: admin, staff, recepção, enfermeiros';
COMMENT ON TABLE pacientes IS 'Pacientes da clínica - dados pessoais e médicos básicos';
COMMENT ON TABLE agendamentos IS 'Agendamentos de consultas, retornos e procedimentos';
COMMENT ON TABLE consultas IS 'Registro das consultas realizadas';
COMMENT ON TABLE orcamentos IS 'Orçamentos para procedimentos e cirurgias';
COMMENT ON TABLE cirurgias IS 'Agendamento e controle de cirurgias';
COMMENT ON TABLE email_verifications IS 'Sistema de verificação de emails com códigos temporários';
COMMENT ON TABLE logs_sistema IS 'Auditoria completa de todas as ações do sistema';
COMMENT ON TABLE system_config IS 'Configurações gerais do sistema';

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
