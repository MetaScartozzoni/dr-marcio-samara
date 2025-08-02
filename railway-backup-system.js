// =====================================================
// SISTEMA DE BACKUP AUTOMÁTICO RAILWAY
// Portal Dr. Marcio - Backup Inteligente
// Data: 01/08/2025
// =====================================================

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class RailwayBackupSystem {
    constructor() {
        // Configurações do sistema
        this.prodConfig = {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        };

        // Project 1 será configurado como backup
        this.backupConfig = {
            connectionString: process.env.DATABASE_URL_BACKUP || null,
            ssl: { rejectUnauthorized: false }
        };

        // Configurações de backup
        this.backupInterval = 6 * 60 * 60 * 1000; // 6 horas
        this.retentionDays = 30; // Manter 30 dias
        this.backupDir = path.join(__dirname, 'backups');
        this.logFile = path.join(__dirname, 'backup.log');

        this.isRunning = false;
        this.lastBackup = null;
        this.backupCount = 0;
    }

    async inicializar() {
        console.log('🔄 INICIALIZANDO SISTEMA DE BACKUP RAILWAY');
        console.log('=========================================\n');

        try {
            // Criar diretório de backup
            await this.criarDiretorioBackup();
            
            // Verificar conexões
            await this.verificarConexoes();
            
            // Configurar Project 1 se necessário
            if (!this.backupConfig.connectionString) {
                console.log('⚠️ Project 1 não configurado. Gerando configuração...');
                await this.gerarConfiguracaoProject1();
                return;
            }

            // Inicializar backup automático
            await this.iniciarBackupAutomatico();
            
            // Configurar monitoramento
            this.configurarMonitoramento();

            console.log('🎉 SISTEMA DE BACKUP INICIALIZADO COM SUCESSO!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error.message);
        }
    }

    async criarDiretorioBackup() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            console.log('✅ Diretório de backup criado');
        } catch (error) {
            console.log('📁 Diretório já existe');
        }
    }

    async verificarConexoes() {
        console.log('🔍 Verificando conexões...');

        // Testar produção
        try {
            const prodPool = new Pool(this.prodConfig);
            const client = await prodPool.connect();
            
            const result = await client.query('SELECT NOW(), pg_database_size(current_database()) as size');
            const size = parseInt(result.rows[0].size);
            const sizeFormatted = this.formatBytes(size);
            
            console.log('✅ PRODUÇÃO (Project 3):');
            console.log(`   📅 Conectado: ${result.rows[0].now}`);
            console.log(`   💾 Tamanho: ${sizeFormatted}`);
            
            client.release();
            await prodPool.end();
            
        } catch (error) {
            throw new Error(`Falha na conexão com produção: ${error.message}`);
        }

        // Testar backup (se configurado)
        if (this.backupConfig.connectionString) {
            try {
                const backupPool = new Pool(this.backupConfig);
                const client = await backupPool.connect();
                
                const result = await client.query('SELECT NOW()');
                console.log('✅ BACKUP (Project 1):');
                console.log(`   📅 Conectado: ${result.rows[0].now}`);
                
                client.release();
                await backupPool.end();
                
            } catch (error) {
                console.log('⚠️ Project 1 não acessível, será configurado');
            }
        }
    }

    async executarBackup() {
        if (this.isRunning) {
            console.log('⏳ Backup já em execução, aguardando...');
            return;
        }

        this.isRunning = true;
        const startTime = new Date();
        
        try {
            console.log(`\n🔄 INICIANDO BACKUP ${this.backupCount + 1}`);
            console.log(`⏰ Horário: ${startTime.toLocaleString('pt-BR')}`);
            console.log('================================');

            // 1. Criar dump da produção
            const dumpFile = await this.criarDumpProducao();
            
            // 2. Verificar integridade do dump
            await this.verificarIntegridade(dumpFile);
            
            // 3. Restaurar no backup (se Project 1 configurado)
            if (this.backupConfig.connectionString) {
                await this.restaurarNoBackup(dumpFile);
            }
            
            // 4. Limpar arquivos antigos
            await this.limparBackupsAntigos();
            
            // 5. Registrar sucesso
            const endTime = new Date();
            const duration = Math.round((endTime - startTime) / 1000);
            
            this.lastBackup = endTime;
            this.backupCount++;
            
            await this.registrarLog('SUCCESS', `Backup ${this.backupCount} concluído em ${duration}s`);
            
            console.log(`✅ BACKUP CONCLUÍDO EM ${duration}s`);
            console.log(`📊 Total de backups: ${this.backupCount}`);
            console.log(`📅 Próximo backup: ${new Date(Date.now() + this.backupInterval).toLocaleString('pt-BR')}`);
            
        } catch (error) {
            await this.registrarLog('ERROR', error.message);
            console.error('❌ Erro no backup:', error.message);
        } finally {
            this.isRunning = false;
        }
    }

    async criarDumpProducao() {
        console.log('1️⃣ Criando dump da produção...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dumpFile = path.join(this.backupDir, `backup-prod-${timestamp}.sql`);
        
        try {
            // Usar pg_dump com configurações otimizadas
            const cmd = `/opt/homebrew/opt/postgresql@16/bin/pg_dump "${this.prodConfig.connectionString}" --no-password --verbose --clean --no-owner --no-privileges -f "${dumpFile}"`;
            
            const { stdout, stderr } = await execAsync(cmd);
            
            // Verificar se arquivo foi criado
            const stats = await fs.stat(dumpFile);
            console.log(`   ✅ Dump criado: ${this.formatBytes(stats.size)}`);
            
            return dumpFile;
            
        } catch (error) {
            throw new Error(`Falha no pg_dump: ${error.message}`);
        }
    }

    async verificarIntegridade(dumpFile) {
        console.log('2️⃣ Verificando integridade...');
        
        try {
            const stats = await fs.stat(dumpFile);
            
            if (stats.size < 1000) { // Menos de 1KB é suspeito
                throw new Error('Arquivo de backup muito pequeno');
            }
            
            // Verificar se contém dados essenciais
            const content = await fs.readFile(dumpFile, 'utf8');
            
            const checks = [
                { name: 'CREATE TABLE', pattern: /CREATE TABLE/g },
                { name: 'Tabelas de usuários', pattern: /usuarios|pacientes|funcionarios/g },
                { name: 'Tabelas de recuperação', pattern: /recuperacao/g }
            ];
            
            for (const check of checks) {
                const matches = content.match(check.pattern);
                if (!matches) {
                    throw new Error(`Verificação falhou: ${check.name}`);
                }
                console.log(`   ✅ ${check.name}: ${matches.length} ocorrências`);
            }
            
            console.log('   ✅ Integridade verificada');
            
        } catch (error) {
            throw new Error(`Falha na verificação: ${error.message}`);
        }
    }

    async restaurarNoBackup(dumpFile) {
        if (!this.backupConfig.connectionString) {
            console.log('⚠️ Project 1 não configurado, pulando restore');
            return;
        }

        console.log('3️⃣ Restaurando no Project 1...');
        
        try {
            // Limpar banco de backup primeiro
            const cleanCmd = `/opt/homebrew/opt/postgresql@16/bin/psql "${this.backupConfig.connectionString}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`;
            await execAsync(cleanCmd);
            
            // Restaurar dump
            const restoreCmd = `/opt/homebrew/opt/postgresql@16/bin/psql "${this.backupConfig.connectionString}" -f "${dumpFile}"`;
            const { stdout, stderr } = await execAsync(restoreCmd);
            
            // Verificar restore
            const backupPool = new Pool(this.backupConfig);
            const client = await backupPool.connect();
            
            const result = await client.query(`
                SELECT COUNT(*) as tables 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);
            
            console.log(`   ✅ Restore concluído: ${result.rows[0].tables} tabelas`);
            
            client.release();
            await backupPool.end();
            
        } catch (error) {
            throw new Error(`Falha no restore: ${error.message}`);
        }
    }

    async limparBackupsAntigos() {
        console.log('4️⃣ Limpando backups antigos...');
        
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files.filter(f => f.startsWith('backup-prod-') && f.endsWith('.sql'));
            
            const cutoffDate = new Date(Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000));
            let removedCount = 0;
            
            for (const file of backupFiles) {
                const filePath = path.join(this.backupDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime < cutoffDate) {
                    await fs.unlink(filePath);
                    removedCount++;
                }
            }
            
            console.log(`   ✅ Removidos ${removedCount} backups antigos`);
            console.log(`   📁 Backups ativos: ${backupFiles.length - removedCount}`);
            
        } catch (error) {
            console.log(`   ⚠️ Erro na limpeza: ${error.message}`);
        }
    }

    async iniciarBackupAutomatico() {
        console.log('🔄 Iniciando backup automático...');
        console.log(`   ⏰ Intervalo: ${this.backupInterval / (60 * 60 * 1000)} horas`);
        console.log(`   📅 Retenção: ${this.retentionDays} dias`);
        
        // Executar primeiro backup imediatamente
        setTimeout(() => this.executarBackup(), 5000);
        
        // Configurar backup recorrente
        setInterval(() => {
            this.executarBackup();
        }, this.backupInterval);
        
        console.log('✅ Backup automático configurado');
    }

    configurarMonitoramento() {
        console.log('📊 Configurando monitoramento...');
        
        // Status a cada 30 minutos
        setInterval(() => {
            this.exibirStatus();
        }, 30 * 60 * 1000);
        
        // Verificação de saúde a cada hora
        setInterval(() => {
            this.verificarSaude();
        }, 60 * 60 * 1000);
        
        console.log('✅ Monitoramento ativo');
    }

    async exibirStatus() {
        console.log('\n📊 STATUS DO SISTEMA DE BACKUP');
        console.log('==============================');
        console.log(`⏰ Último backup: ${this.lastBackup ? this.lastBackup.toLocaleString('pt-BR') : 'Nenhum'}`);
        console.log(`📊 Total de backups: ${this.backupCount}`);
        console.log(`🔄 Em execução: ${this.isRunning ? 'Sim' : 'Não'}`);
        
        if (this.lastBackup) {
            const nextBackup = new Date(this.lastBackup.getTime() + this.backupInterval);
            console.log(`📅 Próximo backup: ${nextBackup.toLocaleString('pt-BR')}`);
        }
    }

    async verificarSaude() {
        try {
            await this.verificarConexoes();
            console.log('💚 Sistema de backup saudável');
        } catch (error) {
            console.error('🔴 Problema no sistema:', error.message);
            await this.registrarLog('WARNING', `Health check failed: ${error.message}`);
        }
    }

    async registrarLog(level, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level}: ${message}\n`;
        
        try {
            await fs.appendFile(this.logFile, logEntry);
        } catch (error) {
            console.error('Erro ao registrar log:', error.message);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async gerarConfiguracaoProject1() {
        console.log('\n🔧 CONFIGURAÇÃO DO PROJECT 1 (BACKUP)');
        console.log('=====================================');
        console.log('Para configurar o Project 1 como backup:');
        console.log('\n1️⃣ No Railway Dashboard:');
        console.log('   - Acesse Project 1');
        console.log('   - Add Service → PostgreSQL');
        console.log('   - Aguarde a criação');
        console.log('\n2️⃣ Copie a DATABASE_URL do Project 1');
        console.log('\n3️⃣ Adicione no .env:');
        console.log('   DATABASE_URL_BACKUP=postgresql://user:pass@host:port/db');
        console.log('\n4️⃣ Reinicie este sistema');
        console.log('\n🎯 Benefícios após configuração:');
        console.log('   ✅ Backup automático a cada 6 horas');
        console.log('   ✅ Disaster recovery < 1 hora');
        console.log('   ✅ Compliance LGPD/CFM');
        console.log('   ✅ Segurança total dos dados médicos');
    }

    // Método para backup manual (útil para testes)
    async backupManual() {
        console.log('🔧 EXECUTANDO BACKUP MANUAL...');
        await this.executarBackup();
    }

    // Método para restaurar de um backup específico
    async restaurarBackup(backupFile) {
        console.log(`🔄 Restaurando backup: ${backupFile}`);
        
        if (this.backupConfig.connectionString) {
            await this.restaurarNoBackup(backupFile);
        } else {
            console.log('❌ Project 1 não configurado');
        }
    }
}

// Verificar se é execução direta
if (require.main === module) {
    const backupSystem = new RailwayBackupSystem();
    backupSystem.inicializar();

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Encerrando sistema de backup...');
        process.exit(0);
    });
}

module.exports = RailwayBackupSystem;
