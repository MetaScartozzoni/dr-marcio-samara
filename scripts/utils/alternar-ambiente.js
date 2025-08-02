#!/usr/bin/env node
/**
 * 🔄 ALTERNADOR DE AMBIENTES RAILWAY
 * =================================
 */

const readline = require('readline');
require('dotenv').config();

class AmbienteSwitcher {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.ambientes = {
            '1': {
                nome: 'PRODUÇÃO (Project 3)',
                url: process.env.DATABASE_URL,
                host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'N/A',
                descricao: 'Portal-Dr-Marcio - Produção ativa'
            },
            '2': {
                nome: 'DESENVOLVIMENTO (Project 2)', 
                url: process.env.DATABASE_URL_DEV,
                host: process.env.DATABASE_URL_DEV?.split('@')[1]?.split(':')[0] || 'N/A',
                descricao: 'Porta-Desenvolvimento - Testes e staging'
            },
            '3': {
                nome: 'BACKUP (Project 1)',
                url: process.env.DATABASE_URL_BACKUP,
                host: process.env.DATABASE_URL_BACKUP?.split('@')[1]?.split(':')[0] || 'N/A',
                descricao: 'romantic-growth - Backup automático'
            }
        };
    }

    async init() {
        console.log('🔄 ALTERNADOR DE AMBIENTES RAILWAY');
        console.log('=================================\n');
        
        this.mostrarAmbientes();
        
        const escolha = await this.pergunta('\n🎯 Escolha o ambiente (1-3): ');
        
        if (this.ambientes[escolha]) {
            await this.selecionarAmbiente(escolha);
        } else {
            console.log('❌ Opção inválida');
        }
        
        this.rl.close();
    }

    mostrarAmbientes() {
        console.log('📊 AMBIENTES DISPONÍVEIS:');
        console.log('─'.repeat(50));
        
        Object.entries(this.ambientes).forEach(([key, env]) => {
            const status = env.url ? '✅' : '❌';
            console.log(`${key}. ${status} ${env.nome}`);
            console.log(`   Host: ${env.host}`);
            console.log(`   Desc: ${env.descricao}`);
            console.log('');
        });
    }

    async selecionarAmbiente(escolha) {
        const ambiente = this.ambientes[escolha];
        
        console.log(`\n🎯 SELECIONADO: ${ambiente.nome}`);
        console.log('─'.repeat(50));
        
        if (!ambiente.url) {
            console.log('❌ URL não configurada para este ambiente');
            return;
        }

        // Testar conexão
        console.log('🔍 Testando conexão...');
        
        try {
            const { Pool } = require('pg');
            const pool = new Pool({
                connectionString: ambiente.url,
                ssl: { rejectUnauthorized: false, require: true }
            });
            
            const client = await pool.connect();
            const result = await client.query('SELECT NOW(), current_database(), version()');
            
            console.log('✅ CONEXÃO SUCESSO!');
            console.log(`   📅 Conectado: ${result.rows[0].now}`);
            console.log(`   🐘 PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
            console.log(`   💾 Database: ${result.rows[0].current_database}`);
            
            await client.release();
            await pool.end();
            
            // Mostrar como usar
            console.log('\n💻 COMO USAR ESTE AMBIENTE:');
            console.log('─'.repeat(50));
            
            if (escolha === '1') {
                console.log('export DATABASE_URL="$DATABASE_URL"');
                console.log('# Para produção - CUIDADO com alterações!');
            } else if (escolha === '2') {
                console.log('export DATABASE_URL="$DATABASE_URL_DEV"');
                console.log('# Para desenvolvimento - Ambiente seguro');
            } else if (escolha === '3') {
                console.log('export DATABASE_URL="$DATABASE_URL_BACKUP"');
                console.log('# Para backup - Apenas consultas');
            }
            
            console.log('\n🎯 COMANDOS SUGERIDOS:');
            console.log('─'.repeat(50));
            
            if (escolha === '2') {
                console.log('node criar-dados-teste.js     # Criar dados de teste');
                console.log('npm run dev                   # Iniciar desenvolvimento');
                console.log('node testar-sistema-recuperacao.js  # Testar funcionalidades');
            } else if (escolha === '1') {
                console.log('npm start                     # Iniciar produção');
                console.log('node verificar-estado-banco.js # Verificar estado');
            } else if (escolha === '3') {
                console.log('node railway-backup-system.js --status  # Status backup');
                console.log('# Ambiente apenas para consultas');
            }
            
        } catch (error) {
            console.log('❌ Erro na conexão:', error.message);
        }
    }

    async pergunta(texto) {
        return new Promise((resolve) => {
            this.rl.question(texto, resolve);
        });
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const switcher = new AmbienteSwitcher();
    switcher.init().catch(console.error);
}

module.exports = AmbienteSwitcher;
