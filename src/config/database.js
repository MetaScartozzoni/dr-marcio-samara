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
