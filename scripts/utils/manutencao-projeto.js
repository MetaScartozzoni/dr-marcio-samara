#!/usr/bin/env node
/**
 * 🔧 MANUTENÇÃO DO PROJETO - ROTINA DIÁRIA
 * =======================================
 */

const fs = require('fs').promises;
const path = require('path');

class ManutencaoProjeto {
    constructor() {
        this.baseDir = process.cwd();
        this.logFile = path.join(this.baseDir, 'logs', 'manutencao.log');
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        
        try {
            await fs.appendFile(this.logFile, logEntry);
        } catch (error) {
            console.log(`⚠️  Não foi possível escrever no log: ${error.message}`);
        }
        
        console.log(`📝 ${message}`);
    }

    async init() {
        console.log('🔧 MANUTENÇÃO DO PROJETO');
        console.log('========================\n');
        
        await this.log('🚀 Iniciando manutenção diária');
        
        try {
            await this.verificarEstrutura();
            await this.limparLogFiles();
            await this.verificarBackups();
            await this.relatórioFinal();
            
            await this.log('✅ Manutenção concluída com sucesso');
            
        } catch (error) {
            await this.log(`❌ Erro na manutenção: ${error.message}`);
        }
    }

    async verificarEstrutura() {
        await this.log('1️⃣ Verificando estrutura de pastas');
        
        const pastasEssenciais = [
            'scripts/tests',
            'scripts/utils', 
            'docs/railway',
            'logs/backup',
            'logs/email'
        ];
        
        for (const pasta of pastasEssenciais) {
            try {
                await fs.access(path.join(this.baseDir, pasta));
                await this.log(`✅ ${pasta}/ - OK`);
            } catch (error) {
                await this.log(`⚠️  ${pasta}/ - AUSENTE`);
                await fs.mkdir(path.join(this.baseDir, pasta), { recursive: true });
                await this.log(`🔧 ${pasta}/ - CRIADA`);
            }
        }
    }

    async limparLogFiles() {
        await this.log('2️⃣ Limpando arquivos de log antigos');
        
        const logsDir = path.join(this.baseDir, 'logs');
        const arquivos = await fs.readdir(logsDir, { withFileTypes: true });
        const agora = Date.now();
        const seteDias = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms
        
        let removidos = 0;
        
        for (const arquivo of arquivos) {
            if (arquivo.isFile() && arquivo.name.endsWith('.log')) {
                const caminhoArquivo = path.join(logsDir, arquivo.name);
                const stats = await fs.stat(caminhoArquivo);
                
                if ((agora - stats.mtime.getTime()) > seteDias) {
                    await fs.unlink(caminhoArquivo);
                    removidos++;
                    await this.log(`🗑️  Log removido: ${arquivo.name}`);
                }
            }
        }
        
        if (removidos === 0) {
            await this.log('✅ Nenhum log antigo para remover');
        }
    }

    async verificarBackups() {
        await this.log('3️⃣ Verificando sistema de backup');
        
        try {
            // Verificar se o arquivo de backup existe
            const backupScript = path.join(this.baseDir, 'railway-backup-system.js');
            await fs.access(backupScript);
            await this.log('✅ Sistema de backup presente');
            
            // Verificar logs de backup recentes
            const backupLogsDir = path.join(this.baseDir, 'logs', 'backup');
            try {
                const backupFiles = await fs.readdir(backupLogsDir);
                await this.log(`📊 Arquivos de backup encontrados: ${backupFiles.length}`);
            } catch (error) {
                await this.log('⚠️  Diretório de logs de backup não encontrado');
            }
            
        } catch (error) {
            await this.log('❌ Sistema de backup não encontrado');
        }
    }

    async relatórioFinal() {
        await this.log('4️⃣ Gerando relatório final');
        
        const baseFiles = await fs.readdir(this.baseDir);
        const jsFiles = baseFiles.filter(f => f.endsWith('.js') && !f.startsWith('.'));
        
        await this.log(`📊 Arquivos JS na raiz: ${jsFiles.length}`);
        
        // Contar scripts organizados
        try {
            const testsDir = path.join(this.baseDir, 'scripts', 'tests');
            const testFiles = await fs.readdir(testsDir);
            await this.log(`🧪 Scripts de teste: ${testFiles.length}`);
        } catch (error) {
            await this.log('⚠️  Pasta de testes não encontrada');
        }
        
        try {
            const utilsDir = path.join(this.baseDir, 'scripts', 'utils');
            const utilFiles = await fs.readdir(utilsDir);
            await this.log(`🛠️  Scripts utilitários: ${utilFiles.length}`);
        } catch (error) {
            await this.log('⚠️  Pasta de utilitários não encontrada');
        }
    }
}

// Menu interativo
async function menu() {
    console.log('\n🔧 MANUTENÇÃO DO PROJETO');
    console.log('========================');
    console.log('1. 🧹 Executar manutenção completa');
    console.log('2. 📊 Relatório de status');
    console.log('3. 🗑️  Limpar apenas logs antigos');
    console.log('4. ❌ Sair');
    console.log('========================');
}

// Executar se chamado diretamente
if (require.main === module) {
    const manutencao = new ManutencaoProjeto();
    manutencao.init().catch(console.error);
}

module.exports = ManutencaoProjeto;
