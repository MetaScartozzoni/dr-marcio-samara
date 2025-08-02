#!/usr/bin/env node
/**
 * 🔍 DIAGNÓSTICO PÓS-REDEPLOY
 * ===========================
 */

console.log('🔍 DIAGNÓSTICO PÓS-REDEPLOY');
console.log('===========================\n');

async function diagnosticar() {
    console.log('1️⃣ VERIFICANDO ARQUIVOS ESSENCIAIS');
    console.log('─'.repeat(40));
    
    const fs = require('fs');
    const path = require('path');
    
    // Verificar arquivos essenciais
    const arquivosEssenciais = [
        'server.js',
        'package.json',
        'index.html',
        'sistema-recuperacao-definitivo.js'
    ];
    
    for (const arquivo of arquivosEssenciais) {
        try {
            fs.accessSync(path.join(process.cwd(), arquivo));
            console.log(`✅ ${arquivo} - Presente`);
        } catch (error) {
            console.log(`❌ ${arquivo} - AUSENTE`);
        }
    }
    
    console.log('\n2️⃣ VERIFICANDO PACKAGE.JSON');
    console.log('─'.repeat(40));
    
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        console.log(`✅ Start script: ${pkg.scripts?.start || 'AUSENTE'}`);
        console.log(`✅ Main: ${pkg.main || 'AUSENTE'}`);
        console.log(`✅ Nome: ${pkg.name}`);
    } catch (error) {
        console.log('❌ Erro ao ler package.json:', error.message);
    }
    
    console.log('\n3️⃣ VERIFICANDO VARIÁVEIS DE AMBIENTE');
    console.log('─'.repeat(40));
    
    const varsEssenciais = [
        'DATABASE_URL_PROD',
        'SENDGRID_API_KEY',
        'PORT'
    ];
    
    for (const varEnv of varsEssenciais) {
        if (process.env[varEnv]) {
            console.log(`✅ ${varEnv} - Configurada`);
        } else {
            console.log(`⚠️ ${varEnv} - NÃO CONFIGURADA`);
        }
    }
    
    console.log('\n4️⃣ TESTANDO CONEXÃO COM BANCO');
    console.log('─'.repeat(40));
    
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL_PROD,
            ssl: { rejectUnauthorized: false, require: true }
        });
        
        const result = await pool.query('SELECT version()');
        console.log('✅ Banco de dados: Conectado');
        console.log(`   Versão: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
        await pool.end();
        
    } catch (error) {
        console.log('❌ Banco de dados: Erro de conexão');
        console.log(`   Erro: ${error.message}`);
    }
    
    console.log('\n5️⃣ RECOMENDAÇÕES');
    console.log('─'.repeat(40));
    
    if (!process.env.DATABASE_URL_PROD) {
        console.log('⚠️ Configure DATABASE_URL_PROD no Railway');
    }
    
    if (!process.env.PORT) {
        console.log('⚠️ Configure PORT=3000 no Railway');
    }
    
    console.log('💡 Verifique os logs do Railway para mais detalhes');
    console.log('💡 O PostgreSQL pode estar se recuperando ainda');
}

diagnosticar().catch(console.error);
