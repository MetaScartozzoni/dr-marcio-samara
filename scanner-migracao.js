#!/usr/bin/env node

/**
 * 🔍 SCANNER DE MIGRAÇÃO: Identifica arquivos que precisam ser atualizados
 * para usar a nova estrutura padronizada da tabela profiles
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO SCANNER DE MIGRAÇÃO...\n');

// Padrões a procurar (estrutura antiga problemática)
const PATTERNS_TO_FIND = [
    // Tabelas em português
    { pattern: /from\(['"`]usuarios['"`]\)/g, description: 'Tabela "usuarios" em português' },
    { pattern: /from\(['"`]user_profiles['"`]\)/g, description: 'Tabela "user_profiles" (problemática)' },

    // Campos em português
    { pattern: /nome_completo/g, description: 'Campo "nome_completo" (deve ser full_name)' },
    { pattern: /tipo_usuario/g, description: 'Campo "tipo_usuario" (deve ser role)' },
    { pattern: /telefone/g, description: 'Campo "telefone" (deve ser phone)' },
    { pattern: /data_nascimento/g, description: 'Campo "data_nascimento" (deve ser date_of_birth)' },

    // Acesso incorreto a profiles
    { pattern: /user\.profiles/g, description: 'Acesso incorreto user.profiles (não existe)' },
    { pattern: /profiles\.user/g, description: 'Acesso incorreto profiles.user (não existe)' },

    // Outros padrões problemáticos
    { pattern: /user_profile/g, description: 'Referência a user_profile (estrutura antiga)' },
    { pattern: /profile\.user/g, description: 'Acesso incorreto profile.user' }
];

const FILES_TO_SCAN = [
    'src',
    'js',
    'components',
    'modules',
    'api',
    'integrations',
    'features',
    'config'
];

const IGNORE_DIRS = [
    'node_modules',
    '_backup',
    '.git',
    'dist',
    'build'
];

const IGNORE_FILES = [
    'package-lock.json',
    'yarn.lock',
    '.DS_Store',
    'Thumbs.db'
];

function shouldIgnorePath(filePath) {
    const normalizedPath = path.normalize(filePath);

    // Ignorar diretórios
    for (const ignoreDir of IGNORE_DIRS) {
        if (normalizedPath.includes(ignoreDir)) {
            return true;
        }
    }

    // Ignorar arquivos específicos
    const fileName = path.basename(filePath);
    if (IGNORE_FILES.includes(fileName)) {
        return true;
    }

    return false;
}

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const issues = [];

        for (const { pattern, description } of PATTERNS_TO_FIND) {
            const matches = content.match(pattern);
            if (matches) {
                issues.push({
                    pattern: pattern.toString(),
                    description,
                    matches: matches.length,
                    lines: getLineNumbers(content, pattern)
                });
            }
        }

        return issues.length > 0 ? { filePath, issues } : null;
    } catch (error) {
        console.error(`Erro ao ler arquivo ${filePath}:`, error.message);
        return null;
    }
}

function getLineNumbers(content, pattern) {
    const lines = content.split('\n');
    const lineNumbers = [];

    lines.forEach((line, index) => {
        if (pattern.test(line)) {
            lineNumbers.push(index + 1);
        }
    });

    return lineNumbers;
}

function scanDirectory(dirPath) {
    const results = [];

    function scan(dir) {
        try {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (shouldIgnorePath(fullPath)) {
                    continue;
                }

                if (stat.isDirectory()) {
                    // Verificar se é um diretório que devemos escanear
                    const dirName = path.basename(fullPath);
                    if (FILES_TO_SCAN.includes(dirName) || fullPath.includes('src')) {
                        scan(fullPath);
                    }
                } else {
                    // Verificar se é um arquivo que devemos escanear
                    const ext = path.extname(fullPath);
                    if (['.js', '.jsx', '.ts', '.tsx', '.json', '.md'].includes(ext)) {
                        const result = scanFile(fullPath);
                        if (result) {
                            results.push(result);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Erro ao escanear diretório ${dir}:`, error.message);
        }
    }

    scan(dirPath);
    return results;
}

function generateReport(results) {
    console.log('\n📋 RELATÓRIO DE MIGRAÇÃO\n');
    console.log('='.repeat(60));

    if (results.length === 0) {
        console.log('✅ Nenhum arquivo problemático encontrado!');
        console.log('🎉 Seu código já está compatível com a nova estrutura.');
        return;
    }

    console.log(`🔧 Encontrados ${results.length} arquivos que precisam de atualização:\n`);

    results.forEach((result, index) => {
        console.log(`${index + 1}. 📁 ${path.relative(process.cwd(), result.filePath)}`);
        result.issues.forEach(issue => {
            console.log(`   ❌ ${issue.description}`);
            console.log(`      📍 Linhas: ${issue.lines.join(', ')}`);
            console.log(`      🔍 Padrão: ${issue.pattern}`);
        });
        console.log('');
    });

    // Estatísticas
    const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
    console.log('='.repeat(60));
    console.log(`📊 ESTATÍSTICAS:`);
    console.log(`   • Arquivos afetados: ${results.length}`);
    console.log(`   • Total de problemas: ${totalIssues}`);

    // Categorizar problemas
    const categories = {};
    results.forEach(result => {
        result.issues.forEach(issue => {
            categories[issue.description] = (categories[issue.description] || 0) + 1;
        });
    });

    console.log(`   • Problemas por categoria:`);
    Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
            console.log(`     - ${category}: ${count}`);
        });

    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Execute o SQL no Supabase (veja create-profiles-standard.js)');
    console.log('2. Atualize os arquivos listados acima usando o GUIA-MIGRACAO-CODIGO.md');
    console.log('3. Execute os testes para verificar se tudo funciona');
    console.log('4. Faça deploy das mudanças');

    // Gerar arquivo de relatório
    const reportPath = 'relatorio-migracao.json';
    fs.writeFileSync(reportPath, JSON.stringify({
        scanDate: new Date().toISOString(),
        summary: {
            filesAffected: results.length,
            totalIssues,
            categories
        },
        files: results
    }, null, 2));

    console.log(`\n💾 Relatório detalhado salvo em: ${reportPath}`);
}

// Executar scanner
const workspacePath = process.cwd();
console.log(`📂 Escaneando workspace: ${workspacePath}`);

const results = scanDirectory(workspacePath);
generateReport(results);

console.log('\n✅ Scanner concluído!');
