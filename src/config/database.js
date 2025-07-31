// src/config/database.js
const { Pool } = require('pg');

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ydKZVqeDdnQVSPOsAkcKJhoTHLsOEqxu@maglev.proxy.rlwy.net:39156/railway',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
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
