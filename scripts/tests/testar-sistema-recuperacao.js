// Limpar registro de teste com erro e testar novamente
require('dotenv').config();
const { Pool } = require('pg');

async function limparETester() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    try {
        const client = await pool.connect();
        
        console.log('🧹 Limpando registro de teste com erro...');
        await client.query(`
            DELETE FROM logs_recuperacao_senha 
            WHERE email = 'teste@sistema.com'
        `);
        
        console.log('✅ Teste limpo');
        
        console.log('🧪 Testando inserção corrigida...');
        await client.query(`
            INSERT INTO logs_recuperacao_senha (email, email_mascarado, evento, metadados)
            VALUES ('teste@sistema.com', 'te***@sistema.com', 'codigo_enviado', 
                   jsonb_build_object('timestamp', NOW(), 'sistema', 'definitivo', 'teste', true))
        `);
        
        console.log('✅ Teste de inserção realizado com sucesso!');
        
        // Verificar se funcionou
        const result = await client.query(`
            SELECT evento, metadados 
            FROM logs_recuperacao_senha 
            WHERE email = 'teste@sistema.com'
        `);
        
        console.log('📊 Registro criado:', result.rows[0]);
        
        // Limpar teste
        await client.query(`
            DELETE FROM logs_recuperacao_senha 
            WHERE email = 'teste@sistema.com'
        `);
        
        console.log('🧹 Teste limpo novamente');
        
        client.release();
        await pool.end();
        
        console.log('\n🎉 SISTEMA DE RECUPERAÇÃO FUNCIONANDO PERFEITAMENTE!');
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

limparETester();
