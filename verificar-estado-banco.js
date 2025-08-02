// Verificação do estado atual do banco Railway Project 3
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Verificando estado atual do banco Railway Project 3...\n');

async function verificarEstadoBanco() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false // Testamos que funciona sem SSL
    });
    
    try {
        const client = await pool.connect();
        console.log('✅ Conectado ao banco Railway Project 3');
        
        // 1. Informações básicas do banco
        console.log('\n📊 INFORMAÇÕES DO BANCO:');
        const info = await client.query('SELECT version(), current_user, current_database(), now()');
        console.log(`   • Versão: ${info.rows[0].version}`);
        console.log(`   • Usuário: ${info.rows[0].current_user}`);
        console.log(`   • Database: ${info.rows[0].current_database}`);
        console.log(`   • Hora atual: ${info.rows[0].now}`);
        
        // 2. Listar todas as tabelas existentes
        console.log('\n📋 TABELAS EXISTENTES:');
        const tabelas = await client.query(`
            SELECT schemaname, tablename, tableowner 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        `);
        
        if (tabelas.rows.length === 0) {
            console.log('   ⚠️  Nenhuma tabela encontrada no schema public');
        } else {
            console.log(`   • Total de tabelas: ${tabelas.rows.length}`);
            tabelas.rows.forEach(row => {
                console.log(`   • ${row.tablename} (owner: ${row.tableowner})`);
            });
        }
        
        // 3. Verificar se existem tabelas do sistema de recuperação
        console.log('\n🔍 VERIFICANDO SISTEMA DE RECUPERAÇÃO:');
        const tabelasRecuperacao = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('logs_recuperacao_senha', 'codigos_recuperacao_ativos', 'tentativas_recuperacao')
        `);
        
        if (tabelasRecuperacao.rows.length === 0) {
            console.log('   ❌ Sistema de recuperação NÃO instalado');
        } else {
            console.log('   ✅ Tabelas do sistema de recuperação encontradas:');
            tabelasRecuperacao.rows.forEach(row => {
                console.log(`   • ${row.table_name}`);
            });
        }
        
        // 4. Verificar outras tabelas importantes
        console.log('\n🔍 VERIFICANDO OUTRAS ESTRUTURAS:');
        const outrasTabelas = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('usuarios', 'pacientes', 'funcionarios', 'auth_users')
        `);
        
        if (outrasTabelas.rows.length > 0) {
            console.log('   ✅ Tabelas do sistema principal encontradas:');
            outrasTabelas.rows.forEach(row => {
                console.log(`   • ${row.table_name}`);
            });
        } else {
            console.log('   ⚠️  Nenhuma tabela do sistema principal encontrada');
        }
        
        // 5. Verificar espaço e estatísticas
        console.log('\n📈 ESTATÍSTICAS DO BANCO:');
        const stats = await client.query(`
            SELECT 
                pg_size_pretty(pg_database_size(current_database())) as tamanho_banco,
                (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tabelas,
                (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public') as total_colunas
        `);
        
        console.log(`   • Tamanho do banco: ${stats.rows[0].tamanho_banco}`);
        console.log(`   • Total de tabelas: ${stats.rows[0].total_tabelas}`);
        console.log(`   • Total de colunas: ${stats.rows[0].total_colunas}`);
        
        client.release();
        await pool.end();
        
        console.log('\n🎯 RESUMO:');
        if (tabelas.rows.length === 0) {
            console.log('   📝 Banco está VAZIO - pronto para instalação inicial');
        } else {
            console.log('   📝 Banco tem dados - verificar se precisa atualizar estrutura');
        }
        
        if (tabelasRecuperacao.rows.length === 0) {
            console.log('   🔧 Sistema de recuperação precisa ser INSTALADO');
        } else {
            console.log('   ✅ Sistema de recuperação já está INSTALADO');
        }
        
    } catch (error) {
        console.log('❌ Erro ao verificar banco:', error.message);
    }
}

verificarEstadoBanco();
