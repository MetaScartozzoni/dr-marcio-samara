-- =====================================================
-- PORTAL DR. MARCIO - SCHEMA POSTGRESQL ATUALIZADO
-- Data: 28/07/2025
-- Versão: 2.0 - Revisado e Otimizado
-- =====================================================

-- Criação do banco de dados
CREATE DATABASE portal_dr_marcio;

-- Conectar ao banco
\c portal_dr_marcio;

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELA: usuarios (Revisada e Otimizada)
-- =====================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'patient' CHECK (role IN ('patient', 'staff', 'admin')),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
    email_verified BOOLEAN DEFAULT false,
    
    -- Dados específicos para pacientes
    cpf VARCHAR(14),
    data_nascimento DATE,
    endereco JSONB,
    contato_emergencia JSONB,
    preferencia_contato VARCHAR(20) DEFAULT 'email' CHECK (preferencia_contato IN ('email', 'sms', 'whatsapp', 'telefone')),
    
    -- Dados médicos básicos
    alergias TEXT,
    medicamentos_uso TEXT,
    observacoes_gerais TEXT,
    
    -- Metadados
    foto_perfil TEXT,
    ultima_atividade TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: servicos (Nova - Serviços Oferecidos)
-- =====================================================
CREATE TABLE servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER NOT NULL DEFAULT 60,
    preco_base DECIMAL(10,2),
    categoria VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    cor_calendario VARCHAR(7) DEFAULT '#007bff', -- Para visualização no calendário
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: disponibilidade (Horários do Médico)
-- =====================================================
CREATE TABLE disponibilidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=domingo, 6=sábado
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN DEFAULT true,
    observacoes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_horario_dia UNIQUE (dia_semana, hora_inicio, hora_fim)
);

-- =====================================================
-- TABELA: bloqueios_agenda (Bloqueios e Feriados)
-- =====================================================
CREATE TABLE bloqueios_agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'bloqueio' CHECK (tipo IN ('bloqueio', 'feriado', 'ferias', 'evento')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_periodo CHECK (data_fim > data_inicio)
);

-- =====================================================
-- TABELA: agendamentos (Atualizada)
-- =====================================================
CREATE TABLE agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    servico_id UUID NOT NULL REFERENCES servicos(id),
    
    -- Dados temporais
    data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    duracao_real INTEGER, -- minutos reais utilizados
    
    -- Status e controle
    status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado', 'faltou', 'reagendado')),
    
    -- Detalhes
    observacoes TEXT,
    motivo_cancelamento TEXT,
    valor_consulta DECIMAL(10,2),
    forma_pagamento VARCHAR(50),
    
    -- Notificações
    lembrete_enviado BOOLEAN DEFAULT false,
    confirmacao_enviada BOOLEAN DEFAULT false,
    data_lembrete TIMESTAMP WITH TIME ZONE,
    
    -- Reagendamento
    agendamento_original_id UUID REFERENCES agendamentos(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para evitar conflitos de horário
    CONSTRAINT valid_duracao CHECK (data_fim > data_agendamento),
    EXCLUDE USING gist (
        tstzrange(data_agendamento, data_fim) WITH &&
    ) WHERE (status NOT IN ('cancelado', 'reagendado'))
);

-- =====================================================
-- TABELA: atendimentos (Atualizada)
-- =====================================================
CREATE TABLE atendimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agendamento_id UUID REFERENCES agendamentos(id),
    paciente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Dados temporais
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE,
    duracao_real INTEGER, -- minutos reais
    
    -- Dados médicos
    anamnese TEXT,
    diagnostico TEXT,
    procedimentos_realizados JSONB,
    observacoes_medicas TEXT,
    
    -- Archivos/Fotos
    fotos_antes JSONB, -- URLs das fotos
    fotos_depois JSONB, -- URLs das fotos
    documentos_anexos JSONB, -- URLs de documentos
    
    -- Status e follow-up
    status VARCHAR(50) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'interrompido')),
    retorno_recomendado BOOLEAN DEFAULT false,
    data_retorno_sugerida DATE,
    
    -- Satisfação
    avaliacao_paciente INTEGER CHECK (avaliacao_paciente >= 1 AND avaliacao_paciente <= 5),
    comentario_paciente TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: orcamentos (Atualizada)
-- =====================================================
CREATE TABLE orcamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atendimento_id UUID REFERENCES atendimentos(id),
    paciente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Identificação
    numero_orcamento VARCHAR(50) UNIQUE NOT NULL,
    
    -- Dados temporais
    data_orcamento DATE NOT NULL DEFAULT CURRENT_DATE,
    validade DATE NOT NULL,
    
    -- Valores
    itens JSONB NOT NULL, -- Array de itens detalhados
    valor_total DECIMAL(12,2) NOT NULL,
    desconto DECIMAL(12,2) DEFAULT 0,
    valor_final DECIMAL(12,2) NOT NULL,
    
    -- Status e aprovação
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'expirado', 'cancelado')),
    observacoes TEXT,
    condicoes_pagamento TEXT,
    
    -- Links e aprovação
    pdf_url VARCHAR(500),
    link_aceite VARCHAR(500),
    token_aprovacao VARCHAR(100) UNIQUE,
    aceito_em TIMESTAMP WITH TIME ZONE,
    rejeitado_em TIMESTAMP WITH TIME ZONE,
    motivo_rejeicao TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_valores CHECK (valor_final = valor_total - desconto),
    CONSTRAINT valid_validade CHECK (validade > data_orcamento)
);

-- =====================================================
-- TABELA: pagamentos (Atualizada)
-- =====================================================
CREATE TABLE pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orcamento_id UUID REFERENCES orcamentos(id),
    agendamento_id UUID REFERENCES agendamentos(id), -- Para pagamentos diretos de consulta
    paciente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Dados financeiros
    valor DECIMAL(12,2) NOT NULL,
    tipo_pagamento VARCHAR(50) NOT NULL, -- 'cartao', 'pix', 'boleto', 'dinheiro', 'transferencia'
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'aprovado', 'rejeitado', 'cancelado', 'estornado')),
    
    -- Integração com gateways
    gateway_pagamento VARCHAR(50), -- 'stripe', 'pagseguro', 'mercadopago'
    gateway_transaction_id VARCHAR(255),
    payment_intent_id VARCHAR(255),
    
    -- Datas e controle
    data_pagamento TIMESTAMP WITH TIME ZONE,
    data_vencimento DATE,
    data_confirmacao TIMESTAMP WITH TIME ZONE,
    
    -- Arquivos e comprovantes
    comprovante_url VARCHAR(500),
    nota_fiscal_url VARCHAR(500),
    
    -- Detalhes adicionais
    observacoes TEXT,
    ip_origem INET,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: notificacoes (Mantida com melhorias)
-- =====================================================
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Dados da notificação
    tipo VARCHAR(50) NOT NULL, -- 'lembrete_consulta', 'orcamento_aprovado', 'pagamento_confirmado'
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    
    -- Canal de envio
    canal VARCHAR(20) NOT NULL CHECK (canal IN ('email', 'sms', 'whatsapp', 'sistema', 'push')),
    
    -- Status de entrega
    enviada BOOLEAN DEFAULT false,
    data_envio TIMESTAMP WITH TIME ZONE,
    entregue BOOLEAN DEFAULT false,
    data_entrega TIMESTAMP WITH TIME ZONE,
    
    -- Interação do usuário
    lida BOOLEAN DEFAULT false,
    data_leitura TIMESTAMP WITH TIME ZONE,
    clicada BOOLEAN DEFAULT false,
    data_clique TIMESTAMP WITH TIME ZONE,
    
    -- Dados extras e contexto
    dados_extras JSONB,
    agendamento_id UUID REFERENCES agendamentos(id),
    orcamento_id UUID REFERENCES orcamentos(id),
    
    -- Agendamento de envio
    enviar_em TIMESTAMP WITH TIME ZONE,
    tentativas_envio INTEGER DEFAULT 0,
    max_tentativas INTEGER DEFAULT 3,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: configuracoes_sistema (Mantida)
-- =====================================================
CREATE TABLE configuracoes_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(20) DEFAULT 'string' CHECK (tipo IN ('string', 'integer', 'boolean', 'json', 'decimal')),
    descricao TEXT,
    categoria VARCHAR(50) DEFAULT 'geral',
    editavel BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: logs_sistema (Expandida)
-- =====================================================
CREATE TABLE logs_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id),
    
    -- Dados da ação
    acao VARCHAR(100) NOT NULL,
    recurso VARCHAR(100) NOT NULL, -- tabela ou endpoint afetado
    recurso_id UUID,
    
    -- Contexto da requisição
    metodo_http VARCHAR(10),
    url_endpoint VARCHAR(500),
    ip_address INET,
    user_agent TEXT,
    
    -- Dados da mudança
    dados_anteriores JSONB,
    dados_novos JSONB,
    
    -- Classificação
    nivel VARCHAR(20) DEFAULT 'info' CHECK (nivel IN ('debug', 'info', 'warning', 'error', 'critical')),
    categoria VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES OTIMIZADOS PARA PERFORMANCE
-- =====================================================

-- Usuários
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_role ON usuarios(role);
CREATE INDEX idx_usuarios_status ON usuarios(status);
CREATE INDEX idx_usuarios_email_verified ON usuarios(email_verified);

-- Serviços
CREATE INDEX idx_servicos_ativo ON servicos(ativo);
CREATE INDEX idx_servicos_categoria ON servicos(categoria);

-- Disponibilidade
CREATE INDEX idx_disponibilidade_dia_ativo ON disponibilidade(dia_semana, ativo);

-- Agendamentos (Críticos para performance)
CREATE INDEX idx_agendamentos_paciente_id ON agendamentos(paciente_id);
CREATE INDEX idx_agendamentos_servico_id ON agendamentos(servico_id);
CREATE INDEX idx_agendamentos_data ON agendamentos(data_agendamento);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_agendamentos_data_status ON agendamentos(data_agendamento, status);
CREATE INDEX idx_agendamentos_data_range ON agendamentos USING GIST (tstzrange(data_agendamento, data_fim));

-- Atendimentos
CREATE INDEX idx_atendimentos_paciente_id ON atendimentos(paciente_id);
CREATE INDEX idx_atendimentos_agendamento_id ON atendimentos(agendamento_id);
CREATE INDEX idx_atendimentos_data_inicio ON atendimentos(data_inicio);
CREATE INDEX idx_atendimentos_status ON atendimentos(status);

-- Orçamentos
CREATE INDEX idx_orcamentos_paciente_id ON orcamentos(paciente_id);
CREATE INDEX idx_orcamentos_numero ON orcamentos(numero_orcamento);
CREATE INDEX idx_orcamentos_status ON orcamentos(status);
CREATE INDEX idx_orcamentos_validade ON orcamentos(validade);
CREATE INDEX idx_orcamentos_data_status ON orcamentos(data_orcamento, status);

-- Pagamentos
CREATE INDEX idx_pagamentos_paciente_id ON pagamentos(paciente_id);
CREATE INDEX idx_pagamentos_orcamento_id ON pagamentos(orcamento_id);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);
CREATE INDEX idx_pagamentos_data ON pagamentos(data_pagamento);
CREATE INDEX idx_pagamentos_gateway_transaction ON pagamentos(gateway_transaction_id);

-- Notificações
CREATE INDEX idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_enviada ON notificacoes(enviada);
CREATE INDEX idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX idx_notificacoes_enviar_em ON notificacoes(enviar_em) WHERE enviada = false;

-- Logs
CREATE INDEX idx_logs_usuario_id ON logs_sistema(usuario_id);
CREATE INDEX idx_logs_acao ON logs_sistema(acao);
CREATE INDEX idx_logs_created_at ON logs_sistema(created_at);
CREATE INDEX idx_logs_nivel ON logs_sistema(nivel);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT E AUTOMAÇÕES
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para gerar número de orçamento
CREATE OR REPLACE FUNCTION generate_orcamento_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_orcamento IS NULL THEN
        NEW.numero_orcamento := 'ORC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                               LPAD(NEXTVAL('seq_orcamento')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Sequence para números de orçamento
CREATE SEQUENCE seq_orcamento START 1;

-- Aplicar triggers de updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON servicos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disponibilidade_updated_at BEFORE UPDATE ON disponibilidade
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_atendimentos_updated_at BEFORE UPDATE ON atendimentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orcamentos_updated_at BEFORE UPDATE ON orcamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON pagamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_sistema_updated_at BEFORE UPDATE ON configuracoes_sistema
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para gerar número de orçamento automaticamente
CREATE TRIGGER generate_orcamento_number_trigger BEFORE INSERT ON orcamentos
    FOR EACH ROW EXECUTE FUNCTION generate_orcamento_number();

-- =====================================================
-- DADOS INICIAIS (SEEDS) ATUALIZADOS
-- =====================================================

-- Configurações do sistema
INSERT INTO configuracoes_sistema (chave, valor, tipo, descricao, categoria) VALUES
-- Configurações gerais
('site_nome', 'Portal Dr. Marcio', 'string', 'Nome do site', 'geral'),
('email_contato', 'contato@drmarcio.com.br', 'string', 'Email de contato', 'geral'),
('telefone_contato', '(11) 99999-9999', 'string', 'Telefone de contato', 'geral'),
('endereco_clinica', '{"rua": "Rua Exemplo, 123", "cidade": "São Paulo", "cep": "01234-567"}', 'json', 'Endereço da clínica', 'geral'),

-- Configurações de agendamento
('duracao_consulta_padrao', '60', 'integer', 'Duração padrão da consulta em minutos', 'agendamento'),
('antecedencia_agendamento', '24', 'integer', 'Antecedência mínima para agendamento em horas', 'agendamento'),
('max_agendamentos_dia', '10', 'integer', 'Máximo de agendamentos por dia', 'agendamento'),
('intervalo_consultas', '15', 'integer', 'Intervalo entre consultas em minutos', 'agendamento'),

-- Horários de funcionamento
('horario_funcionamento', '{
  "segunda": {"inicio": "08:00", "fim": "18:00", "almoco": {"inicio": "12:00", "fim": "13:00"}},
  "terca": {"inicio": "08:00", "fim": "18:00", "almoco": {"inicio": "12:00", "fim": "13:00"}},
  "quarta": {"inicio": "08:00", "fim": "18:00", "almoco": {"inicio": "12:00", "fim": "13:00"}},
  "quinta": {"inicio": "08:00", "fim": "18:00", "almoco": {"inicio": "12:00", "fim": "13:00"}},
  "sexta": {"inicio": "08:00", "fim": "17:00", "almoco": {"inicio": "12:00", "fim": "13:00"}},
  "sabado": {"inicio": "08:00", "fim": "12:00"},
  "domingo": "fechado"
}', 'json', 'Horários de funcionamento detalhados', 'agendamento'),

-- Configurações financeiras
('validade_orcamento_dias', '30', 'integer', 'Validade do orçamento em dias', 'financeiro'),
('desconto_maximo_percent', '20', 'decimal', 'Desconto máximo permitido em %', 'financeiro'),
('taxa_cancelamento_percent', '10', 'decimal', 'Taxa de cancelamento em %', 'financeiro'),

-- Integrações - Pagamentos
('stripe_public_key', '', 'string', 'Chave pública do Stripe', 'pagamentos'),
('stripe_secret_key', '', 'string', 'Chave secreta do Stripe', 'pagamentos'),
('pagseguro_token', '', 'string', 'Token do PagSeguro', 'pagamentos'),
('mercadopago_public_key', '', 'string', 'Chave pública do Mercado Pago', 'pagamentos'),

-- Integrações - Comunicação
('twilio_account_sid', '', 'string', 'Account SID do Twilio', 'comunicacao'),
('twilio_auth_token', '', 'string', 'Auth Token do Twilio', 'comunicacao'),
('sendgrid_api_key', '', 'string', 'API Key do SendGrid', 'comunicacao'),
('whatsapp_business_token', '', 'string', 'Token da API do WhatsApp Business', 'comunicacao'),

-- Integrações - Armazenamento
('google_storage_bucket', 'portal-dr-marcio-files', 'string', 'Bucket do Google Cloud Storage', 'armazenamento'),
('max_upload_size_mb', '10', 'integer', 'Tamanho máximo de upload em MB', 'armazenamento'),

-- Notificações
('notificacao_lembrete_horas', '24', 'integer', 'Horas antes para enviar lembrete', 'notificacoes'),
('notificacao_confirmacao_horas', '2', 'integer', 'Horas antes para solicitar confirmação', 'notificacoes'),
('max_tentativas_notificacao', '3', 'integer', 'Máximo de tentativas de envio', 'notificacoes');

-- Horários de disponibilidade padrão
INSERT INTO disponibilidade (dia_semana, hora_inicio, hora_fim, observacoes) VALUES
(1, '08:00', '12:00', 'Manhã - Segunda-feira'),
(1, '13:00', '18:00', 'Tarde - Segunda-feira'),
(2, '08:00', '12:00', 'Manhã - Terça-feira'),
(2, '13:00', '18:00', 'Tarde - Terça-feira'),
(3, '08:00', '12:00', 'Manhã - Quarta-feira'),
(3, '13:00', '18:00', 'Tarde - Quarta-feira'),
(4, '08:00', '12:00', 'Manhã - Quinta-feira'),
(4, '13:00', '18:00', 'Tarde - Quinta-feira'),
(5, '08:00', '12:00', 'Manhã - Sexta-feira'),
(5, '13:00', '17:00', 'Tarde - Sexta-feira'),
(6, '08:00', '12:00', 'Manhã - Sábado');

-- Serviços básicos
INSERT INTO servicos (nome, descricao, duracao_minutos, preco_base, categoria, cor_calendario) VALUES
('Consulta Inicial', 'Primeira consulta e avaliação completa', 90, 200.00, 'Consulta', '#007bff'),
('Consulta de Retorno', 'Consulta de acompanhamento', 60, 150.00, 'Consulta', '#28a745'),
('Procedimento Estético', 'Procedimentos estéticos diversos', 120, 500.00, 'Procedimento', '#ffc107'),
('Consulta de Urgência', 'Consulta para casos urgentes', 45, 250.00, 'Urgência', '#dc3545'),
('Avaliação Pós-Procedimento', 'Acompanhamento após procedimento', 30, 100.00, 'Acompanhamento', '#6c757d');

-- Usuário administrador padrão
INSERT INTO usuarios (email, full_name, password_hash, role, status, email_verified) VALUES
('admin@drmarcio.com.br', 'Dr. Marcio Scartozzoni', '$2b$10$example_hash_here', 'admin', 'ativo', true),
('secretaria@drmarcio.com.br', 'Secretária', '$2b$10$example_hash_here', 'staff', 'ativo', true);

-- =====================================================
-- VIEWS ÚTEIS ATUALIZADAS
-- =====================================================

-- View de agendamentos completos
CREATE VIEW v_agendamentos_completo AS
SELECT 
    a.id,
    a.data_agendamento,
    a.data_fim,
    a.status,
    a.observacoes,
    a.valor_consulta,
    u.full_name as paciente_nome,
    u.email as paciente_email,
    u.telefone as paciente_telefone,
    s.nome as servico_nome,
    s.categoria as servico_categoria,
    s.duracao_minutos as servico_duracao,
    a.lembrete_enviado,
    a.confirmacao_enviada
FROM agendamentos a
JOIN usuarios u ON a.paciente_id = u.id
JOIN servicos s ON a.servico_id = s.id;

-- View de disponibilidade formatada
CREATE VIEW v_disponibilidade_semana AS
SELECT 
    dia_semana,
    CASE dia_semana 
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Segunda-feira'
        WHEN 2 THEN 'Terça-feira'
        WHEN 3 THEN 'Quarta-feira'
        WHEN 4 THEN 'Quinta-feira'
        WHEN 5 THEN 'Sexta-feira'
        WHEN 6 THEN 'Sábado'
    END as nome_dia,
    hora_inicio,
    hora_fim,
    ativo,
    observacoes
FROM disponibilidade
ORDER BY dia_semana, hora_inicio;

-- View de estatísticas do dashboard
CREATE VIEW v_dashboard_stats AS
SELECT 
    -- Agendamentos
    (SELECT COUNT(*) FROM agendamentos 
     WHERE status = 'agendado' 
     AND data_agendamento::date = CURRENT_DATE) as agendamentos_hoje,
    
    (SELECT COUNT(*) FROM agendamentos 
     WHERE status = 'agendado' 
     AND data_agendamento >= CURRENT_DATE 
     AND data_agendamento < CURRENT_DATE + INTERVAL '7 days') as agendamentos_semana,
    
    -- Pacientes
    (SELECT COUNT(*) FROM usuarios WHERE role = 'patient') as total_pacientes,
    (SELECT COUNT(*) FROM usuarios WHERE role = 'patient' 
     AND created_at >= CURRENT_DATE - INTERVAL '30 days') as novos_pacientes_mes,
    
    -- Orçamentos
    (SELECT COUNT(*) FROM orcamentos WHERE status = 'pendente') as orcamentos_pendentes,
    (SELECT COUNT(*) FROM orcamentos WHERE status = 'aprovado' 
     AND EXTRACT(MONTH FROM data_orcamento) = EXTRACT(MONTH FROM CURRENT_DATE)) as orcamentos_aprovados_mes,
    
    -- Financeiro
    (SELECT COALESCE(SUM(valor_final), 0) FROM orcamentos 
     WHERE status = 'aprovado' 
     AND EXTRACT(MONTH FROM data_orcamento) = EXTRACT(MONTH FROM CURRENT_DATE)) as faturamento_mes,
    
    (SELECT COALESCE(SUM(valor), 0) FROM pagamentos 
     WHERE status = 'aprovado' 
     AND EXTRACT(MONTH FROM data_pagamento) = EXTRACT(MONTH FROM CURRENT_DATE)) as pagamentos_recebidos_mes;

-- View de orçamentos com detalhes
CREATE VIEW v_orcamentos_detalhados AS
SELECT 
    o.id,
    o.numero_orcamento,
    o.data_orcamento,
    o.validade,
    o.status,
    o.valor_total,
    o.desconto,
    o.valor_final,
    u.full_name as paciente_nome,
    u.email as paciente_email,
    u.telefone as paciente_telefone,
    o.pdf_url,
    o.aceito_em,
    CASE 
        WHEN o.validade < CURRENT_DATE AND o.status = 'pendente' THEN 'expirado'
        ELSE o.status 
    END as status_atual
FROM orcamentos o
JOIN usuarios u ON o.paciente_id = u.id;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

-- Este schema PostgreSQL foi projetado para:
-- 1. Suportar todas as funcionalidades do Portal Dr. Marcio
-- 2. Garantir integridade referencial
-- 3. Otimizar performance com índices apropriados
-- 4. Permitir auditoria com logs
-- 5. Facilitar relatórios com views
-- 6. Suportar escalabilidade futura

COMMENT ON DATABASE portal_dr_marcio IS 'Banco de dados do Portal Dr. Marcio - Sistema de gestão médica completo';
