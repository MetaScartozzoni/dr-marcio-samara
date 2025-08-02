#!/usr/bin/env node
/**
 * 📋 COPIAR ESTRUTURA DA PRODUÇÃO PARA PROJECT 2
 * =============================================
 */

const { Pool } = require('pg');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

async function copiarEstrutura() {
    console.log('📋 COPIANDO ESTRUTURA PRODUÇÃO → PROJECT 2');
    console.log('==========================================\n');

    const prodUrl = process.env.DATABASE_URL;
    const devUrl = process.env.DATABASE_URL_DEV;

    if (!prodUrl || !devUrl) {
        console.log('❌ URLs não configuradas');
        return;
    }

    try {
        console.log('1️⃣ GERANDO DUMP DA ESTRUTURA (PRODUÇÃO)');
        console.log('─'.repeat(40));

        // Gerar dump apenas da estrutura (sem dados)
        const dumpFile = '/tmp/structure-dump.sql';
        const dumpCmd = `/opt/homebrew/opt/postgresql@16/bin/pg_dump "${prodUrl}" --schema-only --no-owner --no-privileges -f "${dumpFile}"`;
        
        await execAsync(dumpCmd);
        console.log('✅ Estrutura exportada');

        console.log('\n2️⃣ IMPORTANDO ESTRUTURA (PROJECT 2)');
        console.log('─'.repeat(40));

        // Importar estrutura no Project 2
        const restoreCmd = `/opt/homebrew/opt/postgresql@16/bin/psql "${devUrl}" -f "${dumpFile}"`;
        await execAsync(restoreCmd);
        console.log('✅ Estrutura importada');

        console.log('\n3️⃣ VERIFICANDO RESULTADO');
        console.log('─'.repeat(40));

        // Verificar resultado
        const devPool = new Pool({
            connectionString: devUrl,
            ssl: { rejectUnauthorized: false, require: true }
        });

        const client = await devPool.connect();

        const result = await client.query(`
            SELECT 
                COUNT(*) as tabelas,
                string_agg(table_name, ', ' ORDER BY table_name) as nomes
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        console.log(`✅ ${result.rows[0].tabelas} tabelas copiadas:`);
        console.log(`   ${result.rows[0].nomes || 'Nenhuma'}`);

        // Verificar tabelas específicas
        const sistemaTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'pacientes', 'agendamentos', 'logs_recuperacao_senha', 'codigos_recuperacao_ativos')
            ORDER BY table_name
        `);

        console.log('\n✅ TABELAS DO SISTEMA:');
        sistemaTables.rows.forEach(table => {
            console.log(`   • ${table.table_name}`);
        });

        await client.release();
        await devPool.end();

        // Limpar arquivo temporário
        await execAsync(`rm -f ${dumpFile}`);

        console.log('\n🎉 ESTRUTURA COPIADA COM SUCESSO!');
        console.log('✅ Project 2 agora tem a mesma estrutura da produção');
        console.log('✅ Banco vazio e pronto para desenvolvimento');
        console.log('✅ Todas as tabelas disponíveis');

        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('1. Criar dados de teste: node criar-dados-teste.js');
        console.log('2. Testar sistema: node test-project2-sistema.js');
        console.log('3. Desenvolver novas features com segurança');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

copiarEstrutura().catch(console.error);
