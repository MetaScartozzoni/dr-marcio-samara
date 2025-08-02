#!/usr/bin/env node
/**
 * 🔗 CONECTAR AO PROJECT 2 - DESENVOLVIMENTO
 * ==========================================
 */

const { Pool } = require('pg');
require('dotenv').config();

async function conectarProject2() {
    console.log('🔗 CONECTANDO AO PROJECT 2 - DESENVOLVIMENTO');
    console.log('============================================\n');

    const devUrl = process.env.DATABASE_URL_DEV;
    
    if (!devUrl) {
        console.log('❌ DATABASE_URL_DEV não configurada');
        return;
    }

    console.log('📋 Configuração Project 2:');
    console.log('─'.repeat(30));
    console.log(`Host: ${devUrl.split('@')[1].split(':')[0]}`);
    console.log(`Porta: ${devUrl.split(':')[3].split('/')[0]}`);
    console.log('');

    try {
        // Conectar ao Project 2
        const pool = new Pool({
            connectionString: devUrl,
            ssl: { 
                rejectUnauthorized: false,
                require: true 
            }
        });

        const client = await pool.connect();
        console.log('✅ CONECTADO AO PROJECT 2!');

        // Verificar estado atual
        const result = await client.query(`
            SELECT 
                NOW() as conectado_em,
                current_database() as database,
                version() as versao,
                pg_database_size(current_database()) as tamanho,
                (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tabelas
        `);

        const info = result.rows[0];
        console.log('');
        console.log('📊 STATUS DO PROJECT 2:');
        console.log('─'.repeat(30));
        console.log(`📅 Conectado: ${info.conectado_em}`);
        console.log(`🐘 PostgreSQL: ${info.versao.split(' ')[1]}`);
        console.log(`💾 Tamanho: ${formatBytes(info.tamanho)}`);
        console.log(`📊 Tabelas: ${info.tabelas}`);

        // Verificar se tem as tabelas principais do sistema
        const tabelas = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'pacientes', 'agendamentos', 'logs_recuperacao_senha')
            ORDER BY table_name
        `);

        console.log('');
        console.log('🔍 TABELAS DO SISTEMA:');
        console.log('─'.repeat(30));
        
        if (tabelas.rows.length === 0) {
            console.log('❌ Nenhuma tabela do sistema encontrada');
            console.log('💡 Precisa copiar estrutura da produção');
            
            // Oferecer para copiar estrutura
            console.log('');
            console.log('🔄 OPÇÕES:');
            console.log('1. Copiar estrutura da produção');
            console.log('2. Criar tabelas básicas para desenvolvimento');
            console.log('3. Usar como banco limpo para testes');

        } else {
            console.log('✅ Tabelas encontradas:');
            tabelas.rows.forEach(table => {
                console.log(`   • ${table.table_name}`);
            });

            // Verificar dados
            const dados = await client.query(`
                SELECT 
                    (SELECT COUNT(*) FROM users) as usuarios,
                    (SELECT COUNT(*) FROM pacientes) as pacientes
            `).catch(() => ({ rows: [{ usuarios: 0, pacientes: 0 }] }));

            console.log('');
            console.log('📈 DADOS:');
            console.log('─'.repeat(30));
            console.log(`👤 Usuários: ${dados.rows[0].usuarios}`);
            console.log(`👥 Pacientes: ${dados.rows[0].pacientes}`);
        }

        // Demonstrar uso prático
        console.log('');
        console.log('💻 COMO USAR O PROJECT 2:');
        console.log('─'.repeat(30));
        console.log('1. Para testes: NODE_ENV=development');
        console.log('2. URL de conexão: DATABASE_URL_DEV');
        console.log('3. Ambiente isolado da produção');
        console.log('4. Seguro para desenvolvimento');

        await client.release();
        await pool.end();

        console.log('');
        console.log('🎯 PROJECT 2 PRONTO PARA USO!');

    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
    }
}

function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

conectarProject2().catch(console.error);
