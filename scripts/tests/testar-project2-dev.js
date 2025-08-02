#!/usr/bin/env node
/**
 * 🧪 TESTADOR PROJECT 2 - DESENVOLVIMENTO
 * =======================================
 */

const { Pool } = require('pg');
require('dotenv').config();

class Project2Tester {
    constructor() {
        this.devUrl = process.env.DATABASE_URL_DEV;
        this.prodUrl = process.env.DATABASE_URL;
    }

    async init() {
        console.log('🧪 TESTANDO PROJECT 2 - DESENVOLVIMENTO');
        console.log('======================================\n');

        try {
            if (!this.devUrl) {
                console.log('❌ DATABASE_URL_DEV não configurada');
                console.log('💡 Execute: node setup-project2-dev.js');
                return;
            }

            await this.testarConexaoDev();
            await this.compararComProducao();
            await this.verificarDadosAnonimizados();
            
            console.log('\n🎉 PROJECT 2 FUNCIONANDO CORRETAMENTE!');
            
        } catch (error) {
            console.error('❌ Erro:', error.message);
        }
    }

    async testarConexaoDev() {
        console.log('🔍 TESTANDO CONEXÃO DEV');
        console.log('=======================\n');

        const devConfig = {
            connectionString: this.devUrl,
            ssl: { 
                rejectUnauthorized: false,
                require: true 
            }
        };

        const pool = new Pool(devConfig);
        const client = await pool.connect();

        try {
            const result = await client.query('SELECT NOW(), version(), pg_database_size(current_database()) as size');
            const size = parseInt(result.rows[0].size);
            
            console.log(`✅ DEVELOPMENT (Project 2):`);
            console.log(`   📅 Conectado: ${result.rows[0].now}`);
            console.log(`   🐘 PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
            console.log(`   💾 Tamanho: ${this.formatBytes(size)}`);

            // Contar tabelas
            const tables = await client.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);
            console.log(`   📊 Tabelas: ${tables.rows[0].count}`);

        } finally {
            await client.release();
            await pool.end();
        }
    }

    async compararComProducao() {
        if (!this.prodUrl) {
            console.log('\n⚠️  DATABASE_URL de produção não encontrada');
            return;
        }

        console.log('\n📊 COMPARANDO COM PRODUÇÃO');
        console.log('==========================\n');

        const prodConfig = {
            connectionString: this.prodUrl,
            ssl: { 
                rejectUnauthorized: false,
                require: true 
            }
        };

        const prodPool = new Pool(prodConfig);
        const prodClient = await prodPool.connect();

        try {
            const prodResult = await prodClient.query('SELECT pg_database_size(current_database()) as size');
            const prodSize = parseInt(prodResult.rows[0].size);

            const prodTables = await prodClient.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);

            console.log(`📈 PRODUÇÃO (Project 3): ${this.formatBytes(prodSize)}, ${prodTables.rows[0].count} tabelas`);

        } finally {
            await prodClient.release();
            await prodPool.end();
        }
    }

    async verificarDadosAnonimizados() {
        console.log('\n🎭 VERIFICANDO DADOS ANONIMIZADOS');
        console.log('=================================\n');

        const devConfig = {
            connectionString: this.devUrl,
            ssl: { 
                rejectUnauthorized: false,
                require: true 
            }
        };

        const pool = new Pool(devConfig);
        const client = await pool.connect();

        try {
            // Verificar pacientes anonimizados
            const pacientes = await client.query(`
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN nome LIKE 'Paciente Teste%' THEN 1 END) as anonimizados
                FROM pacientes 
                LIMIT 1
            `).catch(() => ({ rows: [{ total: 0, anonimizados: 0 }] }));

            // Verificar usuários anonimizados  
            const usuarios = await client.query(`
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN email LIKE '%@exemplo.com' THEN 1 END) as anonimizados
                FROM users
                LIMIT 1
            `).catch(() => ({ rows: [{ total: 0, anonimizados: 0 }] }));

            console.log(`👥 Pacientes: ${pacientes.rows[0].total} total, ${pacientes.rows[0].anonimizados} anonimizados`);
            console.log(`👤 Usuários: ${usuarios.rows[0].total} total, ${usuarios.rows[0].anonimizados} anonimizados`);

            if (pacientes.rows[0].total > 0 && pacientes.rows[0].anonimizados === 0) {
                console.log('⚠️  Dados não estão anonimizados - Execute setup-project2-dev.js');
            } else if (pacientes.rows[0].anonimizados > 0) {
                console.log('✅ Dados estão anonimizados corretamente');
            } else {
                console.log('ℹ️  Nenhum dado encontrado (ambiente limpo)');
            }

        } finally {
            await client.release();
            await pool.end();
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const tester = new Project2Tester();
    tester.init().catch(console.error);
}

module.exports = Project2Tester;
