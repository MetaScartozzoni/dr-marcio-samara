#!/usr/bin/env node
// scripts/railway-deploy.js
const { pool, testConnection, initializeDatabase } = require('../src/config/database');

async function deployToRailway() {
    console.log('🚀 Iniciando deploy no Railway...');
    
    try {
        // 1. Testar conexão
        console.log('🔗 Testando conexão com banco...');
        const connectionOk = await testConnection();
        
        if (!connectionOk) {
            throw new Error('Falha na conexão com o banco');
        }
        
        // 2. Inicializar banco
        console.log('🏗️ Inicializando estrutura do banco...');
        await initializeDatabase();
        
        // 3. Verificar variáveis de ambiente
        console.log('🔍 Verificando variáveis de ambiente...');
        const requiredEnvs = [
            'DATABASE_URL',
            'EMAIL_HOST',
            'EMAIL_USER', 
            'EMAIL_PASSWORD',
            'JWT_SECRET'
        ];
        
        const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
        
        if (missingEnvs.length > 0) {
            console.warn('⚠️ Variáveis faltando:', missingEnvs.join(', '));
        }
        
        console.log('✅ Deploy Railway concluído com sucesso!');
        
        // 4. Status final
        console.log('\n📊 Status do Sistema:');
        console.log('- Database:', process.env.DATABASE_URL ? '✅ Conectado' : '❌ Não conectado');
        console.log('- Email:', process.env.EMAIL_HOST ? '✅ Configurado' : '❌ Não configurado');
        console.log('- JWT:', process.env.JWT_SECRET ? '✅ Configurado' : '❌ Não configurado');
        
    } catch (error) {
        console.error('❌ Erro no deploy Railway:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    deployToRailway();
}

module.exports = { deployToRailway };
