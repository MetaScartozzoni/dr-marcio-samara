// =====================================================
// TESTADOR DE CONEXÃO PROJECT 1
// Portal Dr. Marcio - Verificar URL Pública
// =====================================================

require('dotenv').config();
const { Pool } = require('pg');

async function testarConexaoProject1() {
    console.log('🧪 TESTANDO CONEXÃO COM PROJECT 1');
    console.log('=================================\n');

    const urlBackup = process.env.DATABASE_URL_BACKUP;
    
    if (!urlBackup) {
        console.log('❌ DATABASE_URL_BACKUP não configurada no .env');
        return;
    }

    console.log('📋 URL configurada:');
    // Mascarar senha para log seguro
    const urlMasked = urlBackup.replace(/:([^:@]+)@/, ':****@');
    console.log(`   ${urlMasked}`);

    // Verificar se é URL interna (não funciona externamente)
    if (urlBackup.includes('railway.internal')) {
        console.log('\n⚠️ PROBLEMA DETECTADO:');
        console.log('   A URL contém "railway.internal" que é apenas para uso interno');
        console.log('   Você precisa da URL PÚBLICA que termina com algo como:');
        console.log('   - xxx.proxy.rlwy.net:porta');
        console.log('   - viaduct.proxy.rlwy.net:porta');
        console.log('   - monorail.proxy.rlwy.net:porta');
        console.log('\n💡 COMO OBTER A URL PÚBLICA:');
        console.log('   1. No Railway Dashboard → Project 1');
        console.log('   2. Clique no PostgreSQL');
        console.log('   3. Aba "Connect" (não "Variables")');
        console.log('   4. Procure por "Public Networking" ou "External URL"');
        console.log('   5. Copie a URL que termina com .proxy.rlwy.net');
        return;
    }

    // Testar conexão
    try {
        console.log('\n🔍 Testando conexão...');
        
        const pool = new Pool({
            connectionString: urlBackup,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();
        
        // Teste básico
        const result = await client.query('SELECT NOW(), version()');
        console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!');
        console.log(`   📅 Horário: ${result.rows[0].now}`);
        console.log(`   🐘 PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);

        // Verificar estrutura
        const tablesResult = await client.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log(`   📊 Tabelas: ${tablesResult.rows[0].count}`);

        // Verificar se pode criar tabelas (permissões)
        try {
            await client.query('CREATE TABLE IF NOT EXISTS backup_test (id SERIAL, created_at TIMESTAMP DEFAULT NOW())');
            await client.query('DROP TABLE backup_test');
            console.log('   ✅ Permissões: OK (pode criar/deletar tabelas)');
        } catch (permError) {
            console.log('   ⚠️ Permissões: Limitadas');
        }

        client.release();
        await pool.end();

        console.log('\n🎉 PROJECT 1 PRONTO PARA BACKUP!');
        console.log('✅ Próximo passo: Executar sistema de backup');
        console.log('   Comando: node railway-backup-system.js');

    } catch (error) {
        console.log('\n❌ ERRO NA CONEXÃO:');
        console.log(`   ${error.message}`);
        
        if (error.code === 'ENOTFOUND') {
            console.log('\n💡 POSSÍVEIS CAUSAS:');
            console.log('   - Host não encontrado (URL incorreta)');
            console.log('   - PostgreSQL ainda sendo criado');
            console.log('   - URL interna em vez da pública');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 POSSÍVEIS CAUSAS:');
            console.log('   - Porta incorreta');
            console.log('   - Serviço não inicializado');
        } else if (error.message.includes('authentication')) {
            console.log('\n💡 POSSÍVEIS CAUSAS:');
            console.log('   - Credenciais incorretas');
            console.log('   - Senha com caracteres especiais');
        }
    }
}

// Executar teste
testarConexaoProject1();
