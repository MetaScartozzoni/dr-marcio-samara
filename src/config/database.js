// src/config/database.js
const { Pool } = require('pg');

// Configuração do pool de conexões PostgreSQL
// SSL configurado conforme documentação oficial Railway - ATIVO E FUNCIONANDO
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ydKZVqeDdnQVSPOsAkcKJhoTHLsOEqxu@maglev.proxy.rlwy.net:39156/railway',
    ssl: {
        rejectUnauthorized: false  // Railway usa certificados self-signed - SSL ATIVO
    },
    max: process.env.NODE_ENV === 'production' ? 10 : 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // Configurações específicas para Railway
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});

// Tratamento de eventos
pool.on('connect', () => {
    console.log('✅ Nova conexão estabelecida com PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Erro no pool de conexões PostgreSQL:', err);
});

// Função para testar conexão
async function testConnection() {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Conexão com banco de dados testada com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao testar conexão:', error);
        return false;
    }
}

// Função para inicializar banco se necessário
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Enable UUID extension first
        console.log('🔧 Habilitando extensão uuid-ossp...');
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        
        // Verificar se as tabelas existem
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
        
        const tableNames = tables.rows.map(row => row.table_name);
        console.log('📋 Tabelas existentes:', tableNames);
        
        // Se não existir tabela funcionarios, criar estrutura básica
        if (!tableNames.includes('funcionarios')) {
            console.log('🔧 Criando estrutura básica de funcionários...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS funcionarios (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    nome VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    senha VARCHAR(255) NOT NULL,
                    telefone VARCHAR(20),
                    cpf VARCHAR(14),
                    tipo VARCHAR(50) NOT NULL DEFAULT 'staff',
                    ativo BOOLEAN DEFAULT true,
                    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    cadastrado_por VARCHAR(50) DEFAULT 'system'
                )
            `);
        }
        
        // Criar tabela usuarios (substituir Google Sheets)
        if (!tableNames.includes('usuarios')) {
            console.log('🔧 Criando tabela de usuários...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS usuarios (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    telefone VARCHAR(20),
                    role VARCHAR(20) DEFAULT 'patient',
                    status VARCHAR(20) DEFAULT 'ativo',
                    autorizado VARCHAR(10) DEFAULT 'nao',
                    password_hash TEXT,
                    last_login TIMESTAMP,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    observacoes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Criar índices
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
                CREATE INDEX IF NOT EXISTS idx_usuarios_user_id ON usuarios(user_id);
                CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
            `);
        }
        
        // Criar tabela leads (captura de leads)
        if (!tableNames.includes('leads')) {
            console.log('🔧 Criando tabela de leads...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS leads (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    protocolo VARCHAR(50) UNIQUE NOT NULL,
                    nome VARCHAR(255) NOT NULL,
                    telefone VARCHAR(20),
                    email VARCHAR(255),
                    idade INTEGER,
                    procedimento VARCHAR(255) NOT NULL,
                    observacoes TEXT,
                    origem VARCHAR(100) DEFAULT 'landing-publica',
                    status VARCHAR(20) DEFAULT 'novo',
                    data_captura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    convertido_em_paciente BOOLEAN DEFAULT false,
                    paciente_id UUID,
                    data_conversao TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Criar índices para leads
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_leads_protocolo ON leads(protocolo);
                CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
                CREATE INDEX IF NOT EXISTS idx_leads_origem ON leads(origem);
                CREATE INDEX IF NOT EXISTS idx_leads_data_captura ON leads(data_captura);
            `);
        }
        
        // Criar tabela agendamentos
        if (!tableNames.includes('agendamentos')) {
            console.log('🔧 Criando tabela de agendamentos...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS agendamentos (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    protocolo VARCHAR(50) UNIQUE NOT NULL,
                    paciente_id UUID,
                    paciente_nome VARCHAR(255) NOT NULL,
                    paciente_email VARCHAR(255),
                    paciente_telefone VARCHAR(20),
                    data_agendamento DATE NOT NULL,
                    hora_agendamento TIME NOT NULL,
                    tipo_consulta VARCHAR(50) DEFAULT 'consulta',
                    status VARCHAR(30) DEFAULT 'agendado',
                    origem VARCHAR(30) DEFAULT 'secretaria',
                    observacoes TEXT,
                    valor_consulta DECIMAL(10,2),
                    valor_pago DECIMAL(10,2) DEFAULT 0,
                    forma_pagamento VARCHAR(50),
                    confirmado BOOLEAN DEFAULT false,
                    lembrete_enviado BOOLEAN DEFAULT false,
                    prontuario_criado BOOLEAN DEFAULT false,
                    prontuario_id UUID,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(100),
                    updated_by VARCHAR(100)
                )
            `);
            
            // Criar índices para agendamentos
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_agendamento);
                CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
                CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente ON agendamentos(paciente_id);
                CREATE INDEX IF NOT EXISTS idx_agendamentos_origem ON agendamentos(origem);
                CREATE INDEX IF NOT EXISTS idx_agendamentos_protocolo ON agendamentos(protocolo);
            `);
        }
        
        // Criar tabela configurações do calendário
        if (!tableNames.includes('calendario_config')) {
            console.log('🔧 Criando configurações do calendário...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS calendario_config (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
                    hora_inicio TIME NOT NULL,
                    hora_fim TIME NOT NULL,
                    intervalo_consulta INTEGER DEFAULT 30,
                    ativo BOOLEAN DEFAULT true,
                    observacoes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Inserir configuração padrão
            await client.query(`
                INSERT INTO calendario_config (dia_semana, hora_inicio, hora_fim, intervalo_consulta, ativo) VALUES
                (1, '08:00', '12:00', 30, true),
                (1, '14:00', '18:00', 30, true),
                (2, '08:00', '12:00', 30, true),
                (2, '14:00', '18:00', 30, true),
                (3, '08:00', '12:00', 30, true),
                (3, '14:00', '18:00', 30, true),
                (4, '08:00', '12:00', 30, true),
                (4, '14:00', '18:00', 30, true),
                (5, '08:00', '12:00', 30, true),
                (5, '14:00', '18:00', 30, true)
                ON CONFLICT DO NOTHING
            `);
        }
        
        // Criar tabela bloqueios do calendário
        if (!tableNames.includes('calendario_bloqueios')) {
            console.log('🔧 Criando tabela de bloqueios do calendário...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS calendario_bloqueios (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    data_inicio TIMESTAMP NOT NULL,
                    data_fim TIMESTAMP NOT NULL,
                    motivo VARCHAR(255) NOT NULL,
                    descricao TEXT,
                    tipo VARCHAR(20) DEFAULT 'bloqueio',
                    recorrente BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(100)
                )
            `);
            
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_calendario_bloqueios_data ON calendario_bloqueios(data_inicio, data_fim);
            `);
        }
        
        // Se não existir tabela system_config, criar
        if (!tableNames.includes('system_config')) {
            console.log('🔧 Criando tabela de configurações...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS system_config (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    config_key VARCHAR(100) UNIQUE NOT NULL,
                    config_value TEXT,
                    is_locked BOOLEAN DEFAULT false,
                    created_by UUID,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }
        
        // Se não existir tabela logs_sistema, criar
        if (!tableNames.includes('logs_sistema')) {
            console.log('🔧 Criando tabela de logs...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS logs_sistema (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    tipo VARCHAR(50) NOT NULL,
                    descricao TEXT NOT NULL,
                    usuario_id UUID,
                    data_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    detalhes JSONB
                )
            `);
        }
        
        // Criar tabela para pacientes (futura migração)
        if (!tableNames.includes('pacientes')) {
            console.log('🔧 Criando estrutura de pacientes...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS pacientes (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    nome VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE,
                    telefone VARCHAR(20),
                    cpf VARCHAR(14) UNIQUE,
                    data_nascimento DATE,
                    endereco TEXT,
                    convenio VARCHAR(100),
                    numero_convenio VARCHAR(50),
                    status VARCHAR(50) DEFAULT 'ativo',
                    primeira_consulta DATE,
                    ultima_consulta DATE,
                    proximo_retorno DATE,
                    observacoes TEXT,
                    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    cadastrado_por UUID,
                    FOREIGN KEY (cadastrado_por) REFERENCES funcionarios(id)
                )
            `);
        }
        
        // Criar tabela para jornada do paciente
        if (!tableNames.includes('jornada_paciente')) {
            console.log('🔧 Criando tabela de jornada do paciente...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS jornada_paciente (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    paciente_id UUID NOT NULL,
                    tipo_evento VARCHAR(50) NOT NULL,
                    data_prevista DATE NOT NULL,
                    data_realizada DATE,
                    status VARCHAR(30) DEFAULT 'pendente',
                    observacoes TEXT,
                    notificacao_enviada BOOLEAN DEFAULT false,
                    data_notificacao TIMESTAMP,
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    criado_por UUID,
                    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
                    FOREIGN KEY (criado_por) REFERENCES funcionarios(id)
                )
            `);
        }
        
        // Criar tabela de prontuários
        if (!tableNames.includes('prontuarios')) {
            console.log('🔧 Criando tabela de prontuários...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS prontuarios (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    paciente_id UUID NOT NULL,
                    numero_prontuario VARCHAR(20) UNIQUE NOT NULL,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ativo BOOLEAN DEFAULT true,
                    observacoes TEXT,
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
                )
            `);
            
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente ON prontuarios(paciente_id);
                CREATE INDEX IF NOT EXISTS idx_prontuarios_numero ON prontuarios(numero_prontuario);
            `);
        }
        
        // Criar tabela de orçamentos (ANTES das tabelas que a referenciam)
        if (!tableNames.includes('orcamentos')) {
            console.log('🔧 Criando tabela de orçamentos...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS orcamentos (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    protocolo VARCHAR(50) UNIQUE NOT NULL,
                    paciente_id UUID NOT NULL,
                    paciente_nome VARCHAR(255) NOT NULL,
                    paciente_email VARCHAR(255),
                    paciente_telefone VARCHAR(20),
                    
                    -- Procedimentos e valores
                    procedimentos JSONB DEFAULT '[]',
                    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
                    desconto_percentual DECIMAL(5,2) DEFAULT 0,
                    desconto_valor DECIMAL(10,2) DEFAULT 0,
                    valor_final DECIMAL(10,2) NOT NULL DEFAULT 0,
                    
                    -- Status e controle
                    status VARCHAR(30) DEFAULT 'rascunho', -- rascunho, enviado, aceito, rejeitado, expirado
                    data_validade DATE,
                    data_envio TIMESTAMP,
                    data_resposta TIMESTAMP,
                    
                    -- Observações
                    observacoes TEXT,
                    observacoes_internas TEXT,
                    
                    -- Auditoria
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    criado_por UUID NOT NULL,
                    atualizado_por UUID,
                    
                    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
                    FOREIGN KEY (criado_por) REFERENCES funcionarios(id),
                    FOREIGN KEY (atualizado_por) REFERENCES funcionarios(id)
                )
            `);
            
            // Criar índices para orçamentos
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_orcamentos_protocolo ON orcamentos(protocolo);
                CREATE INDEX IF NOT EXISTS idx_orcamentos_paciente ON orcamentos(paciente_id);
                CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
                CREATE INDEX IF NOT EXISTS idx_orcamentos_data ON orcamentos(criado_em);
                CREATE INDEX IF NOT EXISTS idx_orcamentos_validade ON orcamentos(data_validade);
            `);
        }
        
        // Criar tabela de fichas de atendimento
        if (!tableNames.includes('fichas_atendimento')) {
            console.log('🔧 Criando tabela de fichas de atendimento...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS fichas_atendimento (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    paciente_id UUID NOT NULL,
                    prontuario_id UUID NOT NULL,
                    agendamento_id UUID,
                    
                    -- Dados básicos
                    peso DECIMAL(5,2),
                    altura DECIMAL(3,2),
                    imc DECIMAL(4,2),
                    pressao_arterial VARCHAR(20),
                    
                    -- Específicos para cirurgia plástica
                    queixa_principal TEXT,
                    cirurgia_interesse VARCHAR(255),
                    area_corpo VARCHAR(255),
                    expectativa_resultado TEXT,
                    pontos_esteticos TEXT,
                    alteracoes_posturais TEXT,
                    indicacao_cirurgica TEXT,
                    informacoes_adicionais TEXT,
                    
                    -- Dados médicos gerais
                    historico_medico TEXT,
                    medicamentos_uso TEXT,
                    alergias TEXT,
                    observacoes_clinicas TEXT,
                    exame_fisico TEXT,
                    plano_tratamento TEXT,
                    orientacoes TEXT,
                    retorno_recomendado DATE,
                    
                    -- Status e controle
                    status VARCHAR(20) DEFAULT 'em_andamento',
                    finalizada BOOLEAN DEFAULT false,
                    data_finalizacao TIMESTAMP,
                    orcamento_gerado BOOLEAN DEFAULT false,
                    orcamento_id UUID,
                    
                    -- Auditoria
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    criado_por UUID NOT NULL,
                    atualizado_por UUID,
                    
                    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
                    FOREIGN KEY (prontuario_id) REFERENCES prontuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE SET NULL,
                    FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE SET NULL,
                    FOREIGN KEY (criado_por) REFERENCES funcionarios(id),
                    FOREIGN KEY (atualizado_por) REFERENCES funcionarios(id)
                )
            `);
            
            // Criar índices para fichas de atendimento
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_fichas_paciente ON fichas_atendimento(paciente_id);
                CREATE INDEX IF NOT EXISTS idx_fichas_prontuario ON fichas_atendimento(prontuario_id);
                CREATE INDEX IF NOT EXISTS idx_fichas_agendamento ON fichas_atendimento(agendamento_id);
                CREATE INDEX IF NOT EXISTS idx_fichas_data ON fichas_atendimento(criado_em);
            `);
        }
        
        // Criar tabela para notificações
        if (!tableNames.includes('notificacoes')) {
            console.log('🔧 Criando tabela de notificações...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS notificacoes (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    paciente_id UUID,
                    funcionario_id UUID,
                    tipo VARCHAR(50) NOT NULL,
                    titulo VARCHAR(255) NOT NULL,
                    mensagem TEXT NOT NULL,
                    canais JSONB DEFAULT '["email"]',
                    enviada BOOLEAN DEFAULT false,
                    data_envio TIMESTAMP,
                    erro_envio TEXT,
                    tentativas INTEGER DEFAULT 0,
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
                    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
                )
            `);
        }
        
        // Criar tabelas LGPD
        if (!tableNames.includes('logs_acesso')) {
            console.log('🔧 Criando tabela de logs de acesso (LGPD)...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS logs_acesso (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    usuario_id UUID,
                    ip_acesso INET,
                    user_agent TEXT,
                    url_acessada VARCHAR(500),
                    metodo_http VARCHAR(10),
                    data_acesso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    sessao_id VARCHAR(255),
                    duracao_sessao INTEGER,
                    dados_acessados TEXT,
                    finalidade_acesso VARCHAR(255),
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
                )
            `);
            
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_logs_acesso_usuario ON logs_acesso(usuario_id);
                CREATE INDEX IF NOT EXISTS idx_logs_acesso_data ON logs_acesso(data_acesso);
                CREATE INDEX IF NOT EXISTS idx_logs_acesso_ip ON logs_acesso(ip_acesso);
            `);
        }
        
        if (!tableNames.includes('consentimentos_lgpd')) {
            console.log('🔧 Criando tabela de consentimentos LGPD...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS consentimentos_lgpd (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    usuario_id UUID NOT NULL,
                    tipo_consentimento VARCHAR(100) NOT NULL,
                    finalidade TEXT NOT NULL,
                    data_consentimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    data_revogacao TIMESTAMP,
                    ip_origem INET,
                    ativo BOOLEAN DEFAULT true,
                    versao_termos VARCHAR(20) DEFAULT '1.0',
                    detalhes_consentimento JSONB,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
                )
            `);
            
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_consentimentos_usuario ON consentimentos_lgpd(usuario_id);
                CREATE INDEX IF NOT EXISTS idx_consentimentos_tipo ON consentimentos_lgpd(tipo_consentimento);
                CREATE INDEX IF NOT EXISTS idx_consentimentos_ativo ON consentimentos_lgpd(ativo);
            `);
        }
        
        if (!tableNames.includes('logs_exclusao_lgpd')) {
            console.log('🔧 Criando tabela de logs de exclusão LGPD...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS logs_exclusao_lgpd (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    usuario_id UUID NOT NULL,
                    email_original VARCHAR(255),
                    nome_original VARCHAR(255),
                    motivo TEXT NOT NULL,
                    data_exclusao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    executado_por UUID,
                    status VARCHAR(20) DEFAULT 'INICIADO',
                    dados_backup JSONB,
                    ip_solicitacao INET,
                    observacoes TEXT,
                    FOREIGN KEY (executado_por) REFERENCES funcionarios(id)
                )
            `);
            
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_logs_exclusao_usuario ON logs_exclusao_lgpd(usuario_id);
                CREATE INDEX IF NOT EXISTS idx_logs_exclusao_data ON logs_exclusao_lgpd(data_exclusao);
                CREATE INDEX IF NOT EXISTS idx_logs_exclusao_status ON logs_exclusao_lgpd(status);
            `);
        }
        
        // Criar tabela de configuração de procedimentos cirúrgicos
        if (!tableNames.includes('procedimentos_config')) {
            console.log('🔧 Criando tabela de configuração de procedimentos...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS procedimentos_config (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    nome VARCHAR(255) NOT NULL UNIQUE,
                    tipo VARCHAR(50) NOT NULL, -- 'cirurgico' ou 'estetico'
                    area_corpo VARCHAR(100),
                    descricao TEXT,
                    
                    -- Valores base
                    valor_equipe DECIMAL(10,2) DEFAULT 0,
                    valor_hospital DECIMAL(10,2) DEFAULT 0,
                    valor_anestesista DECIMAL(10,2) DEFAULT 0,
                    valor_instrumentador DECIMAL(10,2) DEFAULT 0,
                    valor_assistente DECIMAL(10,2) DEFAULT 0,
                    
                    -- Pós-operatório
                    pos_operatorio_dias INTEGER DEFAULT 0,
                    pos_operatorio_valor_dia DECIMAL(10,2) DEFAULT 0,
                    pos_operatorio_pacote BOOLEAN DEFAULT false,
                    pos_operatorio_valor_pacote DECIMAL(10,2) DEFAULT 0,
                    
                    -- Configurações
                    ativo BOOLEAN DEFAULT true,
                    tempo_estimado_minutos INTEGER,
                    observacoes TEXT,
                    
                    -- Auditoria
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    criado_por UUID,
                    
                    FOREIGN KEY (criado_por) REFERENCES funcionarios(id)
                )
            `);
            
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_procedimentos_tipo ON procedimentos_config(tipo);
                CREATE INDEX IF NOT EXISTS idx_procedimentos_area ON procedimentos_config(area_corpo);
                CREATE INDEX IF NOT EXISTS idx_procedimentos_ativo ON procedimentos_config(ativo);
            `);
        }
        
        // Criar tabela de adicionais para procedimentos
        if (!tableNames.includes('procedimentos_adicionais')) {
            console.log('🔧 Criando tabela de adicionais de procedimentos...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS procedimentos_adicionais (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    procedimento_id UUID NOT NULL,
                    nome VARCHAR(255) NOT NULL,
                    tipo VARCHAR(50) NOT NULL, -- 'protese', 'laser', 'medicamento', 'material', 'outros'
                    valor DECIMAL(10,2) NOT NULL,
                    obrigatorio BOOLEAN DEFAULT false,
                    ativo BOOLEAN DEFAULT true,
                    observacoes TEXT,
                    
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    criado_por UUID,
                    
                    FOREIGN KEY (procedimento_id) REFERENCES procedimentos_config(id) ON DELETE CASCADE,
                    FOREIGN KEY (criado_por) REFERENCES funcionarios(id)
                )
            `);
        }
        
        // Criar tabela de acessórios para procedimentos
        if (!tableNames.includes('procedimentos_acessorios')) {
            console.log('🔧 Criando tabela de acessórios de procedimentos...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS procedimentos_acessorios (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    procedimento_id UUID NOT NULL,
                    nome VARCHAR(255) NOT NULL,
                    sem_custo BOOLEAN DEFAULT true,
                    valor DECIMAL(10,2) DEFAULT 0,
                    quantidade_incluida INTEGER DEFAULT 1,
                    ativo BOOLEAN DEFAULT true,
                    observacoes TEXT,
                    
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    criado_por UUID,
                    
                    FOREIGN KEY (procedimento_id) REFERENCES procedimentos_config(id) ON DELETE CASCADE,
                    FOREIGN KEY (criado_por) REFERENCES funcionarios(id)
                )
            `);
        }
        
        // Criar tabela de contas a receber (cirurgias)
        if (!tableNames.includes('contas_receber')) {
            console.log('🔧 Criando tabela de contas a receber...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS contas_receber (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    paciente_id UUID NOT NULL,
                    orcamento_id UUID,
                    procedimento VARCHAR(255),
                    valor_total DECIMAL(10,2) NOT NULL,
                    valor_pago DECIMAL(10,2) DEFAULT 0,
                    valor_pendente DECIMAL(10,2) NOT NULL,
                    
                    data_vencimento DATE,
                    data_pagamento TIMESTAMP,
                    forma_pagamento VARCHAR(50),
                    status VARCHAR(30) DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado', 'cancelado'
                    
                    observacoes TEXT,
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    criado_por UUID,
                    
                    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
                    FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id),
                    FOREIGN KEY (criado_por) REFERENCES funcionarios(id)
                )
            `);
            
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(status);
                CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON contas_receber(data_vencimento);
                CREATE INDEX IF NOT EXISTS idx_contas_receber_paciente ON contas_receber(paciente_id);
            `);
        }
        
        // Criar tabela de contas a pagar (funcionários)
        if (!tableNames.includes('contas_pagar')) {
            console.log('🔧 Criando tabela de contas a pagar...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS contas_pagar (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    funcionario_id UUID,
                    tipo VARCHAR(50) NOT NULL, -- 'salario', 'comissao', 'bonus', 'reembolso', 'outros'
                    descricao VARCHAR(255) NOT NULL,
                    valor DECIMAL(10,2) NOT NULL,
                    
                    data_vencimento DATE NOT NULL,
                    data_pagamento TIMESTAMP,
                    forma_pagamento VARCHAR(50),
                    status VARCHAR(30) DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado', 'cancelado'
                    
                    orcamento_relacionado UUID, -- Referência ao orçamento se for comissão
                    observacoes TEXT,
                    
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    criado_por UUID,
                    
                    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id),
                    FOREIGN KEY (orcamento_relacionado) REFERENCES orcamentos(id),
                    FOREIGN KEY (criado_por) REFERENCES funcionarios(id)
                )
            `);
            
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar(status);
                CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON contas_pagar(data_vencimento);
                CREATE INDEX IF NOT EXISTS idx_contas_pagar_funcionario ON contas_pagar(funcionario_id);
                CREATE INDEX IF NOT EXISTS idx_contas_pagar_tipo ON contas_pagar(tipo);
            `);
        }
        
        // Criar tabela de pagamentos
        if (!tableNames.includes('pagamentos')) {
            console.log('🔧 Criando tabela de pagamentos...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS pagamentos (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    orcamento_id UUID NOT NULL,
                    valor DECIMAL(10,2) NOT NULL,
                    tipo_pagamento VARCHAR(50) NOT NULL,
                    status VARCHAR(30) DEFAULT 'pendente',
                    gateway_transaction_id VARCHAR(255),
                    data_pagamento TIMESTAMP,
                    data_vencimento DATE,
                    parcela_numero INTEGER DEFAULT 1,
                    parcela_total INTEGER DEFAULT 1,
                    metodo_pagamento VARCHAR(50),
                    observacoes TEXT,
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    criado_por UUID,
                    FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE CASCADE,
                    FOREIGN KEY (criado_por) REFERENCES funcionarios(id)
                )
            `);
            
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_pagamentos_orcamento ON pagamentos(orcamento_id);
                CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
                CREATE INDEX IF NOT EXISTS idx_pagamentos_data ON pagamentos(data_pagamento);
                CREATE INDEX IF NOT EXISTS idx_pagamentos_transaction ON pagamentos(gateway_transaction_id);
            `);
        }
        
        console.log('✅ Estrutura do banco verificada/criada');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar banco:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    testConnection,
    initializeDatabase
};
