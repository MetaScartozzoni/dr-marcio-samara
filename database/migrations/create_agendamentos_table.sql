-- Criar tabela agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY,
    protocolo VARCHAR(50) UNIQUE NOT NULL,
    paciente_id INTEGER,
    paciente_nome VARCHAR(255) NOT NULL,
    paciente_email VARCHAR(255),
    paciente_telefone VARCHAR(20),
    data_agendamento DATE NOT NULL,
    hora_agendamento TIME NOT NULL,
    tipo_consulta VARCHAR(50) DEFAULT 'consulta' CHECK (tipo_consulta IN ('consulta', 'retorno', 'exame', 'teleconsulta')),
    status VARCHAR(30) DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'realizado', 'cancelado', 'falta', 'reagendado')),
    origem VARCHAR(30) DEFAULT 'secretaria' CHECK (origem IN ('secretaria', 'auto_agendamento', 'sistema')),
    observacoes TEXT,
    valor_consulta DECIMAL(10,2),
    valor_pago DECIMAL(10,2) DEFAULT 0,
    forma_pagamento VARCHAR(50),
    confirmado BOOLEAN DEFAULT false,
    lembrete_enviado BOOLEAN DEFAULT false,
    prontuario_criado BOOLEAN DEFAULT false,
    prontuario_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- Foreign key para usuários (se existir)
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Criar tabela para configurações do calendário
CREATE TABLE IF NOT EXISTS calendario_config (
    id SERIAL PRIMARY KEY,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    intervalo_consulta INTEGER DEFAULT 30, -- minutos
    ativo BOOLEAN DEFAULT true,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela para bloqueios/indisponibilidades
CREATE TABLE IF NOT EXISTS calendario_bloqueios (
    id SERIAL PRIMARY KEY,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(20) DEFAULT 'bloqueio' CHECK (tipo IN ('bloqueio', 'feriado', 'ferias', 'evento')),
    recorrente BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente ON agendamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_origem ON agendamentos(origem);
CREATE INDEX IF NOT EXISTS idx_agendamentos_protocolo ON agendamentos(protocolo);

CREATE INDEX IF NOT EXISTS idx_calendario_config_dia ON calendario_config(dia_semana);
CREATE INDEX IF NOT EXISTS idx_calendario_bloqueios_data ON calendario_bloqueios(data_inicio, data_fim);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_agendamentos_updated_at 
    BEFORE UPDATE ON agendamentos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendario_config_updated_at 
    BEFORE UPDATE ON calendario_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão do calendário (Segunda a Sexta, 8h às 18h)
INSERT INTO calendario_config (dia_semana, hora_inicio, hora_fim, intervalo_consulta, ativo) VALUES
(1, '08:00', '12:00', 30, true), -- Segunda manhã
(1, '14:00', '18:00', 30, true), -- Segunda tarde
(2, '08:00', '12:00', 30, true), -- Terça manhã
(2, '14:00', '18:00', 30, true), -- Terça tarde
(3, '08:00', '12:00', 30, true), -- Quarta manhã
(3, '14:00', '18:00', 30, true), -- Quarta tarde
(4, '08:00', '12:00', 30, true), -- Quinta manhã
(4, '14:00', '18:00', 30, true), -- Quinta tarde
(5, '08:00', '12:00', 30, true), -- Sexta manhã
(5, '14:00', '18:00', 30, true)  -- Sexta tarde
ON CONFLICT DO NOTHING;
