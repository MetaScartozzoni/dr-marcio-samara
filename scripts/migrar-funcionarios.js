// scripts/migrar-funcionarios.js
/**
 * Script para migrar funcionários do Google Sheets para PostgreSQL
 * Execute: node scripts/migrar-funcionarios.js
 */

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { pool } = require('../src/config/database');
const bcrypt = require('bcrypt');

// Configuração do Google Sheets
const SHEET_ID = '1KSZcXweNg7csm-Xi0YYg8v-3mHg6cB5xI2NympkTY4k';

async function migrarFuncionarios() {
    console.log('🚀 Iniciando migração de funcionários...');
    
    const client = await pool.connect();
    
    try {
        // 1. Conectar ao Google Sheets
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        
        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        
        // 2. Buscar planilha de funcionários
        const sheet = doc.sheetsByTitle['Funcionários'] || doc.sheetsByIndex[1];
        if (!sheet) {
            throw new Error('Planilha de funcionários não encontrada');
        }
        
        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();
        
        console.log(`📋 Encontrados ${rows.length} funcionários para migrar`);
        
        // 3. Migrar cada funcionário
        let migrados = 0;
        let erros = 0;
        
        for (const row of rows) {
            try {
                const nome = row.get('Nome') || row.get('nome');
                const email = row.get('Email') || row.get('email');
                const senha = row.get('Senha') || row.get('senha') || 'senha123'; // Senha padrão
                const telefone = row.get('Telefone') || row.get('telefone') || '';
                const cpf = row.get('CPF') || row.get('cpf') || '';
                const tipo = row.get('Tipo') || row.get('tipo') || 'staff';
                const ativo = (row.get('Ativo') || row.get('ativo') || 'true').toLowerCase() === 'true';
                
                if (!nome || !email) {
                    console.log(`⚠️  Pulando linha: nome ou email vazio`);
                    continue;
                }
                
                // Verificar se já existe
                const exists = await client.query(
                    'SELECT id FROM funcionarios WHERE email = $1',
                    [email]
                );
                
                if (exists.rows.length > 0) {
                    console.log(`⚠️  Funcionário ${email} já existe, pulando...`);
                    continue;
                }
                
                // Criptografar senha
                const senhaHash = await bcrypt.hash(senha, 10);
                
                // Inserir no banco
                await client.query(`
                    INSERT INTO funcionarios (nome, email, senha, telefone, cpf, tipo, ativo, cadastrado_por)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [nome, email, senhaHash, telefone, cpf, tipo, ativo, 'migração']);
                
                console.log(`✅ Migrado: ${nome} (${email})`);
                migrados++;
                
            } catch (error) {
                console.error(`❌ Erro ao migrar funcionário:`, error.message);
                erros++;
            }
        }
        
        // 4. Log da migração
        await client.query(`
            INSERT INTO logs_sistema (tipo, descricao, detalhes)
            VALUES ($1, $2, $3)
        `, [
            'MIGRACAO_FUNCIONARIOS',
            'Migração de funcionários do Google Sheets concluída',
            JSON.stringify({ 
                total_encontrados: rows.length,
                migrados,
                erros,
                data_migracao: new Date().toISOString()
            })
        ]);
        
        console.log(`\n🎯 MIGRAÇÃO CONCLUÍDA:`);
        console.log(`   ✅ Migrados: ${migrados}`);
        console.log(`   ❌ Erros: ${erros}`);
        console.log(`   📊 Total processados: ${rows.length}`);
        
    } catch (error) {
        console.error('❌ Erro durante migração:', error);
    } finally {
        client.release();
        process.exit();
    }
}

// Executar migração
if (require.main === module) {
    migrarFuncionarios();
}

module.exports = migrarFuncionarios;
