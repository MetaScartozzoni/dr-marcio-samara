// Script simplificado para conectar ao Railway usando .env
require('dotenv').config();
const { Client } = require('pg');

console.log('🚀 Conectando ao Railway PostgreSQL...');
console.log('📍 Host:', process.env.RAILWAY_DB_HOST || 'Não definido');
console.log('🔌 Porta:', process.env.RAILWAY_DB_PORT || 'Não definida');
console.log('🗄️ Database:', process.env.RAILWAY_DB_NAME || 'Não definido');

async function conectarRailway() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 20000
    });

    try {
        console.log('🔌 Estabelecendo conexão...');
        await client.connect();
        console.log('✅ Conectado com sucesso ao Railway!');

        // Testar conexão
        const result = await client.query('SELECT NOW() as timestamp, version() as version');
        console.log('📅 Timestamp servidor:', result.rows[0].timestamp);
        console.log('🗄️ PostgreSQL:', result.rows[0].version.split(' ')[0]);

        return client;
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        throw error;
    }
}

async function criarTabelasRecuperacao(client) {
    console.log('\n📊 Criando tabelas para sistema de recuperação...');
    
    const sql = `
        -- Tabela principal de logs
        CREATE TABLE IF NOT EXISTS logs_recuperacao_senha (
            id BIGSERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            evento VARCHAR(50) NOT NULL,
            ip_address VARCHAR(45),
            sucesso BOOLEAN DEFAULT false,
            detalhes TEXT,
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de códigos ativos
        CREATE TABLE IF NOT EXISTS codigos_recuperacao_ativos (
            id BIGSERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            codigo_hash VARCHAR(64) NOT NULL,
            tentativas INTEGER DEFAULT 0,
            expiracao TIMESTAMP NOT NULL,
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de controle de tentativas por IP
        CREATE TABLE IF NOT EXISTS tentativas_recuperacao_ip (
            id BIGSERIAL PRIMARY KEY,
            ip_address VARCHAR(45) NOT NULL UNIQUE,
            tentativas INTEGER DEFAULT 1,
            bloqueado_ate TIMESTAMP,
            primeira_tentativa TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ultima_tentativa TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Índices para performance
        CREATE INDEX IF NOT EXISTS idx_logs_email ON logs_recuperacao_senha(email);
        CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_recuperacao_senha(data_criacao);
        CREATE INDEX IF NOT EXISTS idx_codigos_email ON codigos_recuperacao_ativos(email);
        CREATE INDEX IF NOT EXISTS idx_codigos_expiracao ON codigos_recuperacao_ativos(expiracao);
        CREATE INDEX IF NOT EXISTS idx_tentativas_ip ON tentativas_recuperacao_ip(ip_address);
    `;

    try {
        await client.query(sql);
        console.log('✅ Tabelas criadas com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro criando tabelas:', error.message);
        return false;
    }
}

async function verificarTabelas(client) {
    console.log('\n🔍 Verificando tabelas criadas...');
    
    try {
        const result = await client.query(`
            SELECT 
                table_name,
                (SELECT COUNT(*) FROM information_schema.columns 
                 WHERE table_name = t.table_name AND table_schema = 'public') as colunas
            FROM information_schema.tables t
            WHERE table_schema = 'public' 
            AND table_name LIKE '%recuperacao%'
            ORDER BY table_name
        `);

        console.log('📋 Tabelas encontradas:');
        result.rows.forEach(row => {
            console.log(`  ✓ ${row.table_name} (${row.colunas} colunas)`);
        });

        return result.rows.length > 0;
    } catch (error) {
        console.error('❌ Erro verificando tabelas:', error.message);
        return false;
    }
}

async function testarSistema(client) {
    console.log('\n🧪 Testando funcionalidades básicas...');
    
    try {
        // Inserir log de teste
        await client.query(`
            INSERT INTO logs_recuperacao_senha (email, evento, ip_address, sucesso, detalhes)
            VALUES ($1, $2, $3, $4, $5)
        `, ['teste@example.com', 'teste_conexao', '127.0.0.1', true, 'Teste de conexão do script']);
        
        console.log('✅ Inserção de log funcionando');

        // Contar registros
        const count = await client.query('SELECT COUNT(*) as total FROM logs_recuperacao_senha');
        console.log(`📊 Total de logs: ${count.rows[0].total}`);

        return true;
    } catch (error) {
        console.error('❌ Erro testando sistema:', error.message);
        return false;
    }
}

async function executar() {
    let client;
    
    try {
        client = await conectarRailway();
        const tabelasCriadas = await criarTabelasRecuperacao(client);
        
        if (tabelasCriadas) {
            const tabelasVerificadas = await verificarTabelas(client);
            
            if (tabelasVerificadas) {
                const testeOK = await testarSistema(client);
                
                if (testeOK) {
                    console.log('\n🎉 Sistema configurado e testado com sucesso!');
                    console.log('✅ Railway PostgreSQL pronto para uso');
                    console.log('✅ Tabelas de recuperação criadas');
                    console.log('✅ Funcionalidades básicas testadas');
                }
            }
        }
        
    } catch (error) {
        console.error('\n💥 Erro durante execução:', error.message);
        console.log('\n🔧 Sugestões:');
        console.log('1. Verificar se o serviço Railway está ativo');
        console.log('2. Confirmar credenciais no arquivo .env');
        console.log('3. Testar conectividade de rede');
    } finally {
        if (client) {
            await client.end();
            console.log('🔌 Conexão fechada');
        }
    }
}

// Executar
if (require.main === module) {
    executar();
}

module.exports = { conectarRailway, criarTabelasRecuperacao, executar };
