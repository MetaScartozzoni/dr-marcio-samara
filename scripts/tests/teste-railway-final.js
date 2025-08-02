// Teste de conexão Railway - Diagnóstico final
require('dotenv').config();
const { Pool } = require('pg');

const url = process.env.DATABASE_URL;
console.log('🔍 URL de conexão:', url.replace(/:[^@]*@/, ':****@'));

async function testeConexao() {
    const config = {
        connectionString: url,
        ssl: false,
        connectionTimeoutMillis: 5000
    };
    
    console.log('🔌 Tentando conexão sem SSL...');
    const pool = new Pool(config);
    
    try {
        const client = await pool.connect();
        console.log('✅ CONECTADO!');
        
        const result = await client.query('SELECT version(), current_user, current_database()');
        console.log('📊 Info do banco:', result.rows[0]);
        
        client.release();
        await pool.end();
        
    } catch (error) {
        console.log('❌ Erro detalhado:');
        console.log('  Mensagem:', error.message);
        console.log('  Código:', error.code);
        console.log('  Severidade:', error.severity);
        console.log('  Detalhe:', error.detail);
    }
}

testeConexao();
