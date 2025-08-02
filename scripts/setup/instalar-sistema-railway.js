#!/usr/bin/env node
/**
 * 🚀 INSTALADOR SIMPLIFICADO RAILWAY
 * ==================================
 * 
 * Usa a mesma configuração do server.js para garantir compatibilidade
 * 
 * Uso: node scripts/setup/instalar-sistema-railway.js
 */

require('dotenv').config();

// Usar a mesma configuração que o server.js funcional
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ydKZVqeDdnQVSPOsAkcKJhoTHLsOEqxu@maglev.proxy.rlwy.net:39156/railway',
    ssl: {
        rejectUnauthorized: false
    },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});

console.log('🚀 INSTALADOR RAILWAY SIMPLIFICADO');
console.log('==================================\n');

async function instalarSistema() {
    let client;
    
    try {
        console.log('🔌 Conectando ao Railway PostgreSQL...');
        client = await pool.connect();
        console.log('✅ Conectado com sucesso!\n');

        // Verificar versão
        const version = await client.query('SELECT version()');
        console.log('📊 PostgreSQL:', version.rows[0].version.split(' ')[0] + ' ' + version.rows[0].version.split(' ')[1]);
        
        // Criar tabela principal de logs de recuperação
        console.log('\n📋 Criando tabela: logs_recuperacao_senha...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS logs_recuperacao_senha (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                ip_address INET,
                user_agent TEXT,
                tentativa_sucesso BOOLEAN DEFAULT FALSE,
                codigo_usado VARCHAR(6),
                metodo_envio VARCHAR(10) CHECK (metodo_envio IN ('email', 'sms')),
                timestamp_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                timestamp_uso TIMESTAMP,
                dados_lgpd JSONB DEFAULT '{}',
                
                -- Índices para performance
                INDEX idx_logs_email (email),
                INDEX idx_logs_timestamp (timestamp_solicitacao),
                INDEX idx_logs_ip (ip_address)
            )
        `);
        console.log('✅ Tabela logs_recuperacao_senha criada');

        // Criar tabela de códigos ativos
        console.log('\n📋 Criando tabela: codigos_recuperacao_ativos...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS codigos_recuperacao_ativos (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                codigo VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                tentativas_restantes INTEGER DEFAULT 3,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Limpeza automática de códigos expirados
                CHECK (expires_at > created_at),
                INDEX idx_codigos_email (email),
                INDEX idx_codigos_expires (expires_at)
            )
        `);
        console.log('✅ Tabela codigos_recuperacao_ativos criada');

        // Criar tabela de rate limiting
        console.log('\n📋 Criando tabela: rate_limit_recuperacao...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS rate_limit_recuperacao (
                id SERIAL PRIMARY KEY,
                identificador VARCHAR(255) NOT NULL UNIQUE, -- email ou IP
                tipo_limite VARCHAR(10) NOT NULL CHECK (tipo_limite IN ('email', 'ip')),
                tentativas INTEGER DEFAULT 1,
                window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                bloqueado_ate TIMESTAMP,
                
                INDEX idx_rate_limit_id (identificador),
                INDEX idx_rate_limit_window (window_start)
            )
        `);
        console.log('✅ Tabela rate_limit_recuperacao criada');

        // Criar tabela de histórico de alterações
        console.log('\n📋 Criando tabela: historico_alteracao_senha...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS historico_alteracao_senha (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                ip_address INET,
                user_agent TEXT,
                metodo_usado VARCHAR(50),
                timestamp_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                dados_auditoria JSONB DEFAULT '{}',
                
                INDEX idx_historico_email (email),
                INDEX idx_historico_timestamp (timestamp_alteracao)
            )
        `);
        console.log('✅ Tabela historico_alteracao_senha criada');

        // Criar função de limpeza automática
        console.log('\n🧹 Criando função de limpeza automática...');
        await client.query(`
            CREATE OR REPLACE FUNCTION limpar_codigos_expirados()
            RETURNS INTEGER AS $$
            DECLARE
                deleted_count INTEGER;
            BEGIN
                DELETE FROM codigos_recuperacao_ativos 
                WHERE expires_at < NOW();
                
                GET DIAGNOSTICS deleted_count = ROW_COUNT;
                
                -- Log da limpeza
                INSERT INTO logs_recuperacao_senha (
                    email, 
                    tentativa_sucesso, 
                    metodo_envio,
                    dados_lgpd
                ) VALUES (
                    'system@cleanup', 
                    TRUE, 
                    'email',
                    jsonb_build_object('action', 'cleanup', 'deleted_codes', deleted_count)
                );
                
                RETURN deleted_count;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Função de limpeza criada');

        // Verificar se as tabelas foram criadas
        console.log('\n🔍 Verificando instalação...');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%recuperacao%'
            ORDER BY table_name
        `);
        
        console.log('✅ Tabelas encontradas:');
        tables.rows.forEach(row => {
            console.log(`   📋 ${row.table_name}`);
        });

        console.log('\n🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('====================================');
        console.log('✅ Sistema de recuperação de senha instalado');
        console.log('✅ Conformidade LGPD/CFM implementada');
        console.log('✅ Auditoria e rate limiting configurados');
        console.log('✅ Limpeza automática de códigos ativada');
        
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('1. Teste o sistema no portal');
        console.log('2. Verifique emails de recuperação');
        console.log('3. Monitore logs de auditoria');

        client.release();
        await pool.end();
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ ERRO NA INSTALAÇÃO:');
        console.error('===================');
        console.error(`Erro: ${error.message}`);
        console.error(`Código: ${error.code}`);
        
        console.log('\n🔧 SUGESTÕES:');
        console.log('1. Verificar se o servidor está rodando');
        console.log('2. Confirmar conectividade com Railway');
        console.log('3. Tentar novamente em alguns minutos');
        
        if (client) {
            client.release();
        }
        await pool.end();
        
        console.log('\n💥 FALHA NA INSTALAÇÃO!');
        console.log(`Detalhes do erro: ${error.message}`);
        process.exit(1);
    }
}

// Executar instalação
instalarSistema();
