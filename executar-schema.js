const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function executarSchema() {
    // Configurar conexão com o banco
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('🔗 Conectando ao banco de dados...');
        
        // Ler o arquivo SQL
        const schemaPath = path.join(__dirname, 'database-schema-caderno-digital.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('📄 Executando schema do Caderno Digital...');
        
        // Executar o schema
        await pool.query(schemaSql);
        
        console.log('✅ Schema executado com sucesso!');
        console.log('📋 Tabelas criadas:');
        console.log('   - receitas');
        console.log('   - receita_medicamentos');
        console.log('   - exames');
        console.log('   - fichas_atendimento');
        console.log('📊 Índices e triggers criados');
        console.log('🌱 Dados de exemplo inseridos (se tabelas estavam vazias)');
        
    } catch (error) {
        console.error('❌ Erro ao executar schema:', error.message);
        
        // Se for erro de conexão, mostrar dica
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.log('\n💡 Dicas para resolver:');
            console.log('   1. Verifique se DATABASE_URL está configurada');
            console.log('   2. Teste a conexão com o banco');
            console.log('   3. Verifique as credenciais do Railway');
        }
        
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Verificar se há DATABASE_URL (pode usar Railway ou local)
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL ou DATABASE_PUBLIC_URL não configurada');
    console.log('💡 Para Railway:');
    console.log('   1. Copie DATABASE_URL do Railway Dashboard');
    console.log('   2. Execute: export DATABASE_URL="valor_copiado"');
    console.log('   3. Ou execute: railway run node executar-schema.js');
    process.exit(1);
}

// Configurar URL do banco para usar a variável correta
process.env.DATABASE_URL = databaseUrl;

console.log('🚀 Conectando com Railway PostgreSQL...');

// Executar
executarSchema();
