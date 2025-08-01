// Integração com banco PostgreSQL existente
const { pool } = require('./src/config/database');

// Adicionar tabelas de recuperação ao sistema existente
async function adicionarTabelasRecuperacao() {
    console.log('🔧 Adicionando tabelas de recuperação de senha ao PostgreSQL...');
    
    const client = await pool.connect();
    
    try {
        // 1. Tabela de logs de recuperação
        await client.query(`
            CREATE TABLE IF NOT EXISTS logs_recuperacao_senha (
                id BIGSERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                evento VARCHAR(50) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                detalhes JSONB,
                
                -- Índices inline
                FOREIGN KEY (email) REFERENCES usuarios(email) ON DELETE CASCADE
            );
        `);
        console.log('✅ Tabela logs_recuperacao_senha criada');
        
        // 2. Tabela de códigos ativos
        await client.query(`
            CREATE TABLE IF NOT EXISTS codigos_recuperacao_ativos (
                id BIGSERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                codigo_hash VARCHAR(64) NOT NULL,
                tentativas INTEGER DEFAULT 0,
                expiracao TIMESTAMP NOT NULL,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(email),
                FOREIGN KEY (email) REFERENCES usuarios(email) ON DELETE CASCADE
            );
        `);
        console.log('✅ Tabela codigos_recuperacao_ativos criada');
        
        // 3. Tabela de histórico de senhas
        await client.query(`
            CREATE TABLE IF NOT EXISTS historico_senhas (
                id BIGSERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                hash_senha_anterior TEXT NOT NULL,
                data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (email) REFERENCES usuarios(email) ON DELETE CASCADE
            );
        `);
        console.log('✅ Tabela historico_senhas criada');
        
        // 4. Tabela de tentativas por IP
        await client.query(`
            CREATE TABLE IF NOT EXISTS tentativas_recuperacao (
                id BIGSERIAL PRIMARY KEY,
                ip_address VARCHAR(45) NOT NULL,
                email VARCHAR(255),
                tentativas INTEGER DEFAULT 1,
                bloqueado_ate TIMESTAMP,
                data_primeira_tentativa TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_ultima_tentativa TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabela tentativas_recuperacao criada');
        
        // 5. Criar índices para performance
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_logs_email ON logs_recuperacao_senha(email)',
            'CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_recuperacao_senha(data_criacao)',
            'CREATE INDEX IF NOT EXISTS idx_codigos_email ON codigos_recuperacao_ativos(email)',
            'CREATE INDEX IF NOT EXISTS idx_codigos_expiracao ON codigos_recuperacao_ativos(expiracao)',
            'CREATE INDEX IF NOT EXISTS idx_tentativas_ip ON tentativas_recuperacao(ip_address)',
            'CREATE INDEX IF NOT EXISTS idx_tentativas_email ON tentativas_recuperacao(email)'
        ];
        
        for (const sql of indices) {
            await client.query(sql);
        }
        console.log('✅ Índices criados');
        
        // 6. Verificar estrutura
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%recuperacao%'
            ORDER BY table_name
        `);
        
        console.log('📊 Tabelas de recuperação:', result.rows.map(r => r.table_name));
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro criando tabelas:', error.message);
        return false;
    } finally {
        client.release();
    }
}

module.exports = { adicionarTabelasRecuperacao };
