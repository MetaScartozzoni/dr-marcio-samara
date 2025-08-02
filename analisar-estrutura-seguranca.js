// Análise detalhada da estrutura das tabelas - Segurança e Conformidade
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 ANÁLISE DETALHADA DAS TABELAS - SEGURANÇA E CONFORMIDADE\n');

async function analisarEstruturaCompleta() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });
    
    try {
        const client = await pool.connect();
        
        // 1. ANÁLISE DA TABELA USUÁRIOS (LOGIN/AUTH)
        console.log('👤 ANÁLISE DA TABELA USUÁRIOS:');
        try {
            const usuarios = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
                FROM information_schema.columns 
                WHERE table_name = 'usuarios' AND table_schema = 'public'
                ORDER BY ordinal_position
            `);
            
            if (usuarios.rows.length > 0) {
                console.log('   ✅ Tabela usuários encontrada:');
                usuarios.rows.forEach(row => {
                    console.log(`   • ${row.column_name} (${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}) - ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
                });
                
                // Verificar se tem colunas de segurança
                const colunasSeguranca = usuarios.rows.map(r => r.column_name);
                console.log('\n   🔐 VERIFICAÇÃO DE SEGURANÇA:');
                console.log(`   • Email: ${colunasSeguranca.includes('email') ? '✅' : '❌'}`);
                console.log(`   • Password/Senha: ${colunasSeguranca.includes('password') || colunasSeguranca.includes('senha') ? '✅' : '❌'}`);
                console.log(`   • Salt: ${colunasSeguranca.includes('salt') ? '✅' : '❌'}`);
                console.log(`   • Data criação: ${colunasSeguranca.includes('created_at') || colunasSeguranca.includes('data_criacao') ? '✅' : '❌'}`);
                console.log(`   • Último login: ${colunasSeguranca.includes('ultimo_login') || colunasSeguranca.includes('last_login') ? '✅' : '❌'}`);
                console.log(`   • Status ativo: ${colunasSeguranca.includes('ativo') || colunasSeguranca.includes('status') ? '✅' : '❌'}`);
            } else {
                console.log('   ❌ Tabela usuários não encontrada');
            }
        } catch (error) {
            console.log('   ❌ Erro ao analisar usuários:', error.message);
        }
        
        // 2. ANÁLISE DA TABELA FUNCIONÁRIOS
        console.log('\n👩‍⚕️ ANÁLISE DA TABELA FUNCIONÁRIOS:');
        try {
            const funcionarios = await client.query(`
                SELECT column_name, data_type, is_nullable, character_maximum_length
                FROM information_schema.columns 
                WHERE table_name = 'funcionarios' AND table_schema = 'public'
                ORDER BY ordinal_position
            `);
            
            if (funcionarios.rows.length > 0) {
                console.log('   ✅ Tabela funcionários encontrada:');
                funcionarios.rows.forEach(row => {
                    console.log(`   • ${row.column_name} (${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}) - ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
                });
            }
        } catch (error) {
            console.log('   ❌ Erro ao analisar funcionários:', error.message);
        }
        
        // 3. ANÁLISE DA TABELA PACIENTES (LGPD)
        console.log('\n🏥 ANÁLISE DA TABELA PACIENTES (CONFORMIDADE LGPD):');
        try {
            const pacientes = await client.query(`
                SELECT column_name, data_type, is_nullable, character_maximum_length
                FROM information_schema.columns 
                WHERE table_name = 'pacientes' AND table_schema = 'public'
                ORDER BY ordinal_position
            `);
            
            if (pacientes.rows.length > 0) {
                console.log('   ✅ Tabela pacientes encontrada:');
                pacientes.rows.forEach(row => {
                    console.log(`   • ${row.column_name} (${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}) - ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
                });
                
                const colunasPacientes = pacientes.rows.map(r => r.column_name);
                console.log('\n   🛡️  VERIFICAÇÃO LGPD:');
                console.log(`   • CPF: ${colunasPacientes.includes('cpf') ? '✅' : '❌'}`);
                console.log(`   • Email: ${colunasPacientes.includes('email') ? '✅' : '❌'}`);
                console.log(`   • Telefone: ${colunasPacientes.includes('telefone') || colunasPacientes.includes('celular') ? '✅' : '❌'}`);
                console.log(`   • Data nascimento: ${colunasPacientes.includes('data_nascimento') ? '✅' : '❌'}`);
            }
        } catch (error) {
            console.log('   ❌ Erro ao analisar pacientes:', error.message);
        }
        
        // 4. VERIFICAR TABELAS DE LOGS (AUDITORIA)
        console.log('\n📊 ANÁLISE DE LOGS E AUDITORIA:');
        const tabelasLogs = ['logs_acesso', 'logs_sistema', 'logs_exclusao_lgpd'];
        
        for (const tabela of tabelasLogs) {
            try {
                const logs = await client.query(`
                    SELECT column_name, data_type
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND table_schema = 'public'
                    ORDER BY ordinal_position
                `, [tabela]);
                
                if (logs.rows.length > 0) {
                    console.log(`   ✅ ${tabela}:`);
                    logs.rows.forEach(row => {
                        console.log(`     • ${row.column_name} (${row.data_type})`);
                    });
                } else {
                    console.log(`   ❌ ${tabela}: não encontrada`);
                }
            } catch (error) {
                console.log(`   ❌ Erro ao analisar ${tabela}:`, error.message);
            }
        }
        
        // 5. VERIFICAR CONSTRAINTS E ÍNDICES DE SEGURANÇA
        console.log('\n🔒 ANÁLISE DE CONSTRAINTS E ÍNDICES:');
        try {
            const constraints = await client.query(`
                SELECT 
                    tc.table_name, 
                    tc.constraint_name, 
                    tc.constraint_type,
                    kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_schema = 'public' 
                AND tc.table_name IN ('usuarios', 'funcionarios', 'pacientes')
                ORDER BY tc.table_name, tc.constraint_type
            `);
            
            if (constraints.rows.length > 0) {
                console.log('   ✅ Constraints encontradas:');
                constraints.rows.forEach(row => {
                    console.log(`   • ${row.table_name}.${row.column_name}: ${row.constraint_type} (${row.constraint_name})`);
                });
            } else {
                console.log('   ⚠️  Nenhuma constraint encontrada');
            }
        } catch (error) {
            console.log('   ❌ Erro ao analisar constraints:', error.message);
        }
        
        // 6. VERIFICAR INTEGRAÇÃO ENTRE TABELAS
        console.log('\n🔗 ANÁLISE DE INTEGRAÇÃO ENTRE TABELAS:');
        try {
            const foreignKeys = await client.query(`
                SELECT 
                    tc.table_name, 
                    kcu.column_name, 
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name 
                FROM information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_schema = 'public'
                ORDER BY tc.table_name
            `);
            
            if (foreignKeys.rows.length > 0) {
                console.log('   ✅ Chaves estrangeiras encontradas:');
                foreignKeys.rows.forEach(row => {
                    console.log(`   • ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
                });
            } else {
                console.log('   ⚠️  Nenhuma chave estrangeira encontrada');
            }
        } catch (error) {
            console.log('   ❌ Erro ao analisar foreign keys:', error.message);
        }
        
        client.release();
        await pool.end();
        
        console.log('\n🎯 RESUMO DA ANÁLISE:');
        console.log('=====================================');
        console.log('📋 Verifique os itens acima para determinar:');
        console.log('   1. Se a tabela usuários tem estrutura segura para login');
        console.log('   2. Se existe integração adequada entre usuários/funcionários');
        console.log('   3. Se logs de auditoria estão implementados');
        console.log('   4. Se constraints de segurança estão ativas');
        console.log('   5. Se estrutura está conforme LGPD');
        
    } catch (error) {
        console.log('❌ Erro na análise:', error.message);
    }
}

analisarEstruturaCompleta();
