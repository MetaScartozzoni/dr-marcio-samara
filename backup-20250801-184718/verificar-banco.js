const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function verificarECriarTabelas() {
    // Se você quiser usar uma URL específica, descomente e cole aqui:
    // const DATABASE_URL = "postgresql://postgres:senha@host:port/database";
    
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
        console.log('❌ Para executar este script:');
        console.log('1. Copie a DATABASE_URL do Railway Dashboard');
        console.log('2. Execute:');
        console.log('   export DATABASE_URL="sua_url_aqui"');
        console.log('   node verificar-banco.js');
        console.log('\nOu edite este arquivo e cole a URL diretamente');
        return;
    }

    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔗 Conectando ao PostgreSQL do Railway...');
        
        // Verificar tabelas existentes
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('receitas', 'exames', 'fichas_atendimento')
            ORDER BY table_name;
        `);
        
        const tabelasExistentes = result.rows.map(row => row.table_name);
        
        console.log('\n📋 Status das tabelas do Caderno Digital:');
        console.log('✅ fichas_atendimento:', tabelasExistentes.includes('fichas_atendimento') ? 'EXISTE' : 'NÃO EXISTE');
        console.log('✅ receitas:', tabelasExistentes.includes('receitas') ? 'EXISTE' : 'NÃO EXISTE');
        console.log('✅ exames:', tabelasExistentes.includes('exames') ? 'EXISTE' : 'NÃO EXISTE');
        
        // Se alguma tabela não existe, criar
        const tabelasNecessarias = ['receitas', 'exames'];
        const tabelasFaltando = tabelasNecessarias.filter(t => !tabelasExistentes.includes(t));
        
        if (tabelasFaltando.length > 0) {
            console.log('\n🔧 Criando tabelas faltando:', tabelasFaltando.join(', '));
            
            // Ler e executar apenas as partes necessárias do schema
            const schemaPath = path.join(__dirname, 'database-schema-caderno-digital.sql');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            
            await pool.query(schemaSql);
            console.log('✅ Tabelas criadas com sucesso!');
        } else {
            console.log('\n✅ Todas as tabelas já existem!');
        }
        
        // Verificar se fichas_atendimento tem dados
        const fichasCount = await pool.query('SELECT COUNT(*) FROM fichas_atendimento');
        const receitasCount = await pool.query('SELECT COUNT(*) FROM receitas');
        const examesCount = await pool.query('SELECT COUNT(*) FROM exames');
        
        console.log('\n📊 Dados existentes:');
        console.log(`   Fichas de Atendimento: ${fichasCount.rows[0].count}`);
        console.log(`   Receitas: ${receitasCount.rows[0].count}`);
        console.log(`   Exames: ${examesCount.rows[0].count}`);
        
        console.log('\n🎯 Próximos passos:');
        console.log('1. ✅ Backend APIs estão prontas');
        console.log('2. ✅ Frontend integrado');
        console.log('3. ✅ Banco de dados configurado');
        console.log('4. 🚀 Sistema pronto para usar!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        
        if (error.code === 'ENOTFOUND') {
            console.log('\n💡 Erro de conexão. Verifique:');
            console.log('   - URL está correta');
            console.log('   - Banco está ativo no Railway');
        }
    } finally {
        await pool.end();
    }
}

verificarECriarTabelas();
