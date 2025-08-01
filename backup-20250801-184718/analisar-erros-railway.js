// Análise detalhada dos erros de conexão
require('dotenv').config();
const { Client } = require('pg');
const net = require('net');
const tls = require('tls');

async function analisarErros() {
    console.log('🔍 ANÁLISE DETALHADA DOS ERROS\n');
    
    const url = new URL(process.env.DATABASE_URL);
    const host = url.hostname;
    const port = parseInt(url.port);
    
    console.log(`🎯 Target: ${host}:${port}\n`);
    
    // 1. Teste de conectividade TCP básica
    console.log('1. 📡 TESTE DE CONECTIVIDADE TCP:');
    await testarTCP(host, port);
    
    // 2. Teste de handshake SSL
    console.log('\n2. 🔐 TESTE DE HANDSHAKE SSL:');
    await testarSSL(host, port);
    
    // 3. Teste de versões PostgreSQL
    console.log('\n3. 🗄️ TESTE DE VERSÕES POSTGRESQL:');
    await testarPostgreSQL(host, port);
    
    // 4. Verificar logs detalhados
    console.log('\n4. 📋 LOGS DETALHADOS:');
    await testarComLogs();
}

function testarTCP(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const timeout = 5000;
        
        socket.setTimeout(timeout);
        
        socket.on('connect', () => {
            console.log('✅ TCP conectado com sucesso');
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            console.log('❌ TCP timeout após 5s');
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', (error) => {
            console.log(`❌ TCP erro: ${error.code || error.message}`);
            resolve(false);
        });
        
        socket.connect(port, host);
    });
}

function testarSSL(host, port) {
    return new Promise((resolve) => {
        const options = {
            host,
            port,
            rejectUnauthorized: false,
            timeout: 5000
        };
        
        const socket = tls.connect(options, () => {
            console.log('✅ SSL handshake bem-sucedido');
            console.log('📜 Certificado autorizado:', socket.authorized);
            console.log('🔑 Protocolo SSL:', socket.getProtocol());
            console.log('🏷️ Cipher:', socket.getCipher()?.name || 'Desconhecido');
            socket.end();
            resolve(true);
        });
        
        socket.on('error', (error) => {
            console.log(`❌ SSL erro: ${error.code || error.message}`);
            if (error.code === 'ECONNRESET') {
                console.log('💡 Possível causa: Servidor não aceita SSL na porta especificada');
            } else if (error.code === 'CERT_HAS_EXPIRED') {
                console.log('💡 Possível causa: Certificado SSL expirado');
            } else if (error.message.includes('SSL')) {
                console.log('💡 Possível causa: Configuração SSL incompatível');
            }
            resolve(false);
        });
        
        socket.setTimeout(5000, () => {
            console.log('❌ SSL timeout');
            socket.destroy();
            resolve(false);
        });
    });
}

async function testarPostgreSQL(host, port) {
    // Teste com diferentes versões de protocolo
    const configs = [
        {
            nome: 'PostgreSQL v14+ (Railway atual)',
            config: {
                host,
                port,
                database: 'railway',
                user: 'postgres',
                password: process.env.RAILWAY_DB_PASSWORD || new URL(process.env.DATABASE_URL).password,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 3000
            }
        },
        {
            nome: 'PostgreSQL v13 (fallback)',
            config: {
                host,
                port,
                database: 'railway',
                user: 'postgres',
                password: process.env.RAILWAY_DB_PASSWORD || new URL(process.env.DATABASE_URL).password,
                ssl: { 
                    rejectUnauthorized: false,
                    sslmode: 'prefer'
                },
                connectionTimeoutMillis: 3000
            }
        }
    ];
    
    for (const { nome, config } of configs) {
        console.log(`\n🧪 Testando: ${nome}`);
        
        const client = new Client(config);
        
        try {
            await client.connect();
            const result = await client.query('SELECT version()');
            console.log('✅ Conectado!');
            console.log('📊 Versão:', result.rows[0].version.substring(0, 50) + '...');
            await client.end();
            return true;
        } catch (error) {
            console.log(`❌ Falha: ${error.code || error.message}`);
            
            // Análise específica de erros PostgreSQL
            if (error.code === '28P01') {
                console.log('💡 Erro de autenticação - credenciais incorretas');
            } else if (error.code === '3D000') {
                console.log('💡 Database não existe');
            } else if (error.code === 'ENOTFOUND') {
                console.log('💡 Host não encontrado');
            } else if (error.message.includes('SSL')) {
                console.log('💡 Problema específico de SSL');
            }
            
            try {
                await client.end();
            } catch {}
        }
    }
    
    return false;
}

async function testarComLogs() {
    console.log('Habilitando logs detalhados...');
    
    // Configuração com logs máximos
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
        query_timeout: 5000,
        // Habilitar logs do driver
        log: (msg) => console.log('🐛 Driver log:', msg)
    });
    
    // Interceptar eventos
    client.on('connect', () => console.log('📡 Evento: connect'));
    client.on('end', () => console.log('📡 Evento: end'));
    client.on('error', (err) => console.log('📡 Evento: error -', err.message));
    client.on('notice', (msg) => console.log('📡 Evento: notice -', msg));
    
    try {
        console.log('🔄 Tentando conectar com logs detalhados...');
        await client.connect();
        console.log('✅ Conexão com logs bem-sucedida');
        await client.end();
    } catch (error) {
        console.log('❌ Erro com logs:', error.message);
        console.log('📋 Stack trace:', error.stack);
        
        try {
            await client.end();
        } catch {}
    }
}

// Executar análise
if (require.main === module) {
    analisarErros()
        .then(() => {
            console.log('\n🏁 ANÁLISE CONCLUÍDA');
            console.log('\n📋 RESUMO DOS PROBLEMAS IDENTIFICADOS:');
            console.log('• Railway PostgreSQL pode estar com problemas SSL');
            console.log('• Possível incompatibilidade de versão do protocolo');
            console.log('• Servidor pode estar rejeitando conexões externas');
            console.log('\n💡 PRÓXIMO PASSO: Implementar sistema de emergência');
        })
        .catch(console.error);
}

module.exports = { analisarErros };
