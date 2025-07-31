// src/config/database.js
const { Pool } = require('pg');

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:pFYtWUlDjHNTGWJGFUluAUyImYYqBGuf@yamabiko.proxy.rlwy.net:27448/railway',
    ssl: process.env.NODE_ENV === 'production' ? { 
        rejectUnauthorized: false,
        sslmode: 'require'
    } : false,
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
                    id SERIAL PRIMARY KEY,
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
                    id SERIAL PRIMARY KEY,
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
                    id SERIAL PRIMARY KEY,
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
                    paciente_id INTEGER,
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
                    id SERIAL PRIMARY KEY,
                    protocolo VARCHAR(50) UNIQUE NOT NULL,
                    paciente_id INTEGER,
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
                    prontuario_id INTEGER,
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
                    id SERIAL PRIMARY KEY,
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
                    id SERIAL PRIMARY KEY,
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
                    id SERIAL PRIMARY KEY,
                    config_key VARCHAR(100) UNIQUE NOT NULL,
                    config_value TEXT,
                    is_locked BOOLEAN DEFAULT false,
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }
        
        // Se não existir tabela logs_sistema, criar
        if (!tableNames.includes('logs_sistema')) {
            console.log('🔧 Criando tabela de logs...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS logs_sistema (
                    id SERIAL PRIMARY KEY,
                    tipo VARCHAR(50) NOT NULL,
                    descricao TEXT NOT NULL,
                    usuario_id INTEGER,
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
                    id SERIAL PRIMARY KEY,
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
                    cadastrado_por INTEGER,
                    FOREIGN KEY (cadastrado_por) REFERENCES funcionarios(id)
                )
            `);
        }
        
        // Criar tabela para jornada do paciente
        if (!tableNames.includes('jornada_paciente')) {
            console.log('🔧 Criando tabela de jornada do paciente...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS jornada_paciente (
                    id SERIAL PRIMARY KEY,
                    paciente_id INTEGER NOT NULL,
                    tipo_evento VARCHAR(50) NOT NULL,
                    data_prevista DATE NOT NULL,
                    data_realizada DATE,
                    status VARCHAR(30) DEFAULT 'pendente',
                    observacoes TEXT,
                    notificacao_enviada BOOLEAN DEFAULT false,
                    data_notificacao TIMESTAMP,
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    criado_por INTEGER,
                    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
                    FOREIGN KEY (criado_por) REFERENCES funcionarios(id)
                )
            `);
        }
        
        // Criar tabela de fichas de atendimento
        if (!tableNames.includes('fichas_atendimento')) {
            console.log('🔧 Criando tabela de fichas de atendimento...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS fichas_atendimento (
                    id SERIAL PRIMARY KEY,
                    paciente_id INTEGER NOT NULL,
                    prontuario_id INTEGER NOT NULL,
                    agendamento_id INTEGER,
                    peso DECIMAL(5,2),
                    altura DECIMAL(3,2),
                    imc DECIMAL(4,2),
                    pressao_arterial VARCHAR(20),
                    procedimento_desejado TEXT,
                    motivo_principal TEXT,
                    historico_medico TEXT,
                    medicamentos_uso TEXT,
                    alergias TEXT,
                    observacoes_clinicas TEXT,
                    exame_fisico TEXT,
                    plano_tratamento TEXT,
                    orientacoes TEXT,
                    retorno_recomendado DATE,
                    status VARCHAR(20) DEFAULT 'em_andamento',
                    finalizada BOOLEAN DEFAULT false,
                    data_finalizacao TIMESTAMP,
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    criado_por INTEGER NOT NULL,
                    atualizado_por INTEGER,
                    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
                    FOREIGN KEY (prontuario_id) REFERENCES prontuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE SET NULL,
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
                    id SERIAL PRIMARY KEY,
                    paciente_id INTEGER,
                    funcionario_id INTEGER,
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
                    id SERIAL PRIMARY KEY,
                    usuario_id INTEGER,
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
                    id SERIAL PRIMARY KEY,
                    usuario_id INTEGER NOT NULL,
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
                    id SERIAL PRIMARY KEY,
                    usuario_id INTEGER NOT NULL,
                    email_original VARCHAR(255),
                    nome_original VARCHAR(255),
                    motivo TEXT NOT NULL,
                    data_exclusao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    executado_por INTEGER,
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
