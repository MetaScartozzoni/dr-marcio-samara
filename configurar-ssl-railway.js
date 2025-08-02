// FASE 1.1: Configurar SSL Oficial Railway
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔒 CONFIGURANDO SSL OFICIAL RAILWAY...\n');

async function configurarSSLRailway() {
    // Testar configurações SSL conforme documentação oficial
    const configuracoes = [
        {
            nome: 'SSL rejectUnauthorized: false (OFICIAL)',
            config: {
                connectionString: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                }
            }
        },
        {
            nome: 'SSL require (Alternativa)',
            config: {
                connectionString: process.env.DATABASE_URL,
                ssl: 'require'
            }
        },
        {
            nome: 'SSL false (Atual funcionando)',
            config: {
                connectionString: process.env.DATABASE_URL,
                ssl: false
            }
        }
    ];
    
    let configuracaoFuncional = null;
    
    for (const { nome, config } of configuracoes) {
        console.log(`🧪 Testando: ${nome}`);
        
        const pool = new Pool(config);
        
        try {
            const client = await pool.connect();
            
            // Teste básico
            const result = await client.query('SELECT version(), now()');
            
            // Verificar se SSL está ativo
            try {
                const sslCheck = await client.query(`
                    SELECT ssl, version 
                    FROM pg_stat_ssl 
                    WHERE pid = pg_backend_pid()
                `);
                
                if (sslCheck.rows.length > 0) {
                    console.log(`   SSL Status: ${sslCheck.rows[0].ssl ? '✅ ATIVO' : '❌ INATIVO'}`);
                }
            } catch (sslError) {
                console.log('   SSL Status: ℹ️  Informação não disponível');
            }
            
            client.release();
            await pool.end();
            
            console.log(`   ✅ ${nome} FUNCIONOU!\n`);
            
            if (!configuracaoFuncional) {
                configuracaoFuncional = { nome, config };
            }
            
        } catch (error) {
            console.log(`   ❌ ${nome} falhou: ${error.message}\n`);
            await pool.end();
        }
    }
    
    if (configuracaoFuncional) {
        console.log('🎯 CONFIGURAÇÃO RECOMENDADA:');
        console.log(`   Nome: ${configuracaoFuncional.nome}`);
        console.log(`   Config:`, JSON.stringify(configuracaoFuncional.config.ssl, null, 2));
        
        // Salvar configuração no arquivo de database
        console.log('\n💾 Atualizando src/config/database.js...');
        
        const fs = require('fs');
        const configAtual = fs.readFileSync('./src/config/database.js', 'utf8');
        
        // Verificar se já tem a configuração SSL correta
        if (configuracaoFuncional.nome.includes('rejectUnauthorized: false')) {
            if (!configAtual.includes('rejectUnauthorized: false')) {
                console.log('   🔧 Atualizando para SSL oficial...');
                // A atualização será feita pelo usuário
                console.log('   ⚠️  Execute: Atualizar database.js com SSL oficial');
            } else {
                console.log('   ✅ Configuração SSL oficial já presente');
            }
        }
        
        return configuracaoFuncional;
        
    } else {
        console.log('❌ NENHUMA CONFIGURAÇÃO SSL FUNCIONOU');
        return null;
    }
}

configurarSSLRailway()
    .then((config) => {
        if (config) {
            console.log('\n🚀 PRÓXIMO PASSO:');
            console.log('   Execute: node instalar-sistema-recuperacao.js');
        } else {
            console.log('\n⚠️  Manter configuração atual sem SSL');
        }
    })
    .catch(error => {
        console.log('💥 Erro:', error.message);
    });
