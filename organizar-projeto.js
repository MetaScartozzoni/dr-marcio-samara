#!/usr/bin/env node
/**
 * 🧹 LIMPEZA E ORGANIZAÇÃO DO PROJETO
 * ==================================
 */

const fs = require('fs').promises;
const path = require('path');

class ProjetoOrganizer {
    constructor() {
        this.baseDir = process.cwd();
        this.scriptsParaManter = [
            // Scripts principais funcionais
            'sistema-recuperacao-definitivo.js',
            'railway-backup-system.js',
            'alternar-ambiente.js',
            'conectar-project2.js',
            'copiar-estrutura-producao.js',
            
            // Scripts de verificação essenciais
            'testar-system-recuperacao.js', // Renomear para sistema
            'teste-railway-final.js',
            'testar-project1.js',
            'testar-project2-dev.js'
        ];
        
        this.scriptsParaRemover = [
            // Scripts de debug temporários
            'debug-project2-ssl.js',
            'diagnostico-project2.js',
            'help-project2-url.js',
            'test-railway-project2.js',
            
            // Scripts de teste duplicados
            'teste-sendgrid-completo.js',
            'teste-sendgrid-direto.js',
            
            // Scripts de setup já usados
            'setup-project2-dev.js',
            'setup-project1.js',
            
            // Scripts experimentais
            'configurar-project2-dados.js',
            'instalar-sistema-definitivo.js'
        ];
        
        this.pastasParaOrganizar = [
            'scripts/',
            'test/',
            'docs/',
            'backups/',
            'logs/'
        ];
    }

    async init() {
        console.log('🧹 LIMPEZA E ORGANIZAÇÃO DO PROJETO');
        console.log('===================================\\n');
        
        try {
            await this.analisarEstrutura();
            await this.criarEstruturaPastas();
            await this.organizarScripts();
            await this.limparArquivosTemporarios();
            await this.criarDocumentacao();
            
            console.log('\\n🎉 PROJETO ORGANIZADO COM SUCESSO!');
            
        } catch (error) {
            console.error('❌ Erro na organização:', error.message);
        }
    }

    async analisarEstrutura() {
        console.log('1️⃣ ANALISANDO ESTRUTURA ATUAL');
        console.log('─'.repeat(40));
        
        const files = await fs.readdir(this.baseDir);
        const jsFiles = files.filter(f => f.endsWith('.js') && !f.startsWith('.'));
        
        console.log(`📊 Arquivos JS encontrados: ${jsFiles.length}`);
        
        const testFiles = jsFiles.filter(f => f.includes('test') || f.includes('debug'));
        const setupFiles = jsFiles.filter(f => f.includes('setup'));
        const mainFiles = jsFiles.filter(f => !f.includes('test') && !f.includes('debug') && !f.includes('setup'));
        
        console.log(`   🧪 Scripts de teste/debug: ${testFiles.length}`);
        console.log(`   ⚙️  Scripts de setup: ${setupFiles.length}`);
        console.log(`   🎯 Scripts principais: ${mainFiles.length}`);
    }

    async criarEstruturaPastas() {
        console.log('\\n2️⃣ CRIANDO ESTRUTURA DE PASTAS');
        console.log('─'.repeat(40));
        
        const pastas = [
            'scripts/tests',
            'scripts/setup', 
            'scripts/utils',
            'docs/railway',
            'docs/api',
            'logs/backup',
            'logs/email'
        ];
        
        for (const pasta of pastas) {
            try {
                await fs.mkdir(path.join(this.baseDir, pasta), { recursive: true });
                console.log(`✅ Criada: ${pasta}/`);
            } catch (error) {
                console.log(`ℹ️  Já existe: ${pasta}/`);
            }
        }
    }

    async organizarScripts() {
        console.log('\\n3️⃣ ORGANIZANDO SCRIPTS');
        console.log('─'.repeat(40));
        
        // Mover scripts de teste
        const testScripts = [
            'testar-sistema-recuperacao.js',
            'teste-railway-final.js', 
            'testar-project1.js',
            'testar-project2-dev.js'
        ];
        
        for (const script of testScripts) {
            await this.moverArquivo(script, 'scripts/tests/');
        }
        
        // Mover scripts de setup/utils
        const utilScripts = [
            'alternar-ambiente.js',
            'conectar-project2.js',
            'copiar-estrutura-producao.js'
        ];
        
        for (const script of utilScripts) {
            await this.moverArquivo(script, 'scripts/utils/');
        }
    }

    async moverArquivo(arquivo, destino) {
        try {
            const origem = path.join(this.baseDir, arquivo);
            const destinoFull = path.join(this.baseDir, destino, arquivo);
            
            await fs.access(origem);
            await fs.rename(origem, destinoFull);
            console.log(`📁 Movido: ${arquivo} → ${destino}`);
        } catch (error) {
            console.log(`ℹ️  Não encontrado: ${arquivo}`);
        }
    }

    async limparArquivosTemporarios() {
        console.log('\\n4️⃣ REMOVENDO ARQUIVOS TEMPORÁRIOS');
        console.log('─'.repeat(40));
        
        for (const arquivo of this.scriptsParaRemover) {
            try {
                await fs.unlink(path.join(this.baseDir, arquivo));
                console.log(`🗑️  Removido: ${arquivo}`);
            } catch (error) {
                console.log(`ℹ️  Não encontrado: ${arquivo}`);
            }
        }
    }

    async criarDocumentacao() {
        console.log('\\n5️⃣ CRIANDO DOCUMENTAÇÃO');
        console.log('─'.repeat(40));
        
        const readme = `# 📊 ESTRUTURA ORGANIZADA DO PROJETO

## 🎯 SCRIPTS PRINCIPAIS
- \`sistema-recuperacao-definitivo.js\` - Sistema de recuperação de senha
- \`railway-backup-system.js\` - Backup automático Railway

## 🧪 SCRIPTS DE TESTE (\`scripts/tests/\`)
- \`testar-sistema-recuperacao.js\` - Teste do sistema de recuperação
- \`teste-railway-final.js\` - Teste Project 3 (Produção)
- \`testar-project1.js\` - Teste Project 1 (Backup)
- \`testar-project2-dev.js\` - Teste Project 2 (Desenvolvimento)

## 🛠️ UTILITÁRIOS (\`scripts/utils/\`)
- \`alternar-ambiente.js\` - Alternador de ambientes Railway
- \`conectar-project2.js\` - Conectar ao ambiente de desenvolvimento
- \`copiar-estrutura-producao.js\` - Copiar estrutura para desenvolvimento

## 📁 ESTRUTURA DE PASTAS
\`\`\`
projeto/
├── scripts/
│   ├── tests/          # Scripts de teste
│   ├── utils/          # Utilitários
│   └── setup/          # Scripts de configuração
├── docs/
│   ├── railway/        # Documentação Railway
│   └── api/            # Documentação da API
├── logs/
│   ├── backup/         # Logs de backup
│   └── email/          # Logs de email
└── src/                # Código fonte principal
\`\`\`

## 🎉 PROJETO LIMPO E ORGANIZADO!
`;
        
        await fs.writeFile(path.join(this.baseDir, 'ESTRUTURA-ORGANIZADA.md'), readme);
        console.log('✅ Criado: ESTRUTURA-ORGANIZADA.md');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const organizer = new ProjetoOrganizer();
    organizer.init().catch(console.error);
}

module.exports = ProjetoOrganizer;
