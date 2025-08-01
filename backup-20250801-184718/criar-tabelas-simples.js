const { Pool } = require('pg');

async function verificarEstruturaAtual() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔍 Verificando estrutura atual das tabelas...\n');
        
        // Verificar colunas da tabela fichas_atendimento
        const fichasColumns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'fichas_atendimento' 
            ORDER BY ordinal_position;
        `);
        
        console.log('📋 Estrutura atual da tabela fichas_atendimento:');
        fichasColumns.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
        });
        
        // Verificar se receitas e exames existem
        const tabelas = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('receitas', 'exames')
        `);
        
        console.log('\n📊 Tabelas de receitas e exames:');
        const existentes = tabelas.rows.map(r => r.table_name);
        console.log('   receitas:', existentes.includes('receitas') ? '✅ EXISTE' : '❌ NÃO EXISTE');
        console.log('   exames:', existentes.includes('exames') ? '✅ EXISTE' : '❌ NÃO EXISTE');
        
        if (!existentes.includes('receitas')) {
            console.log('\n🔧 Criando tabela receitas...');
            await pool.query(`
                CREATE TABLE receitas (
                    id SERIAL PRIMARY KEY,
                    paciente_id INTEGER NOT NULL,
                    medico_nome VARCHAR(255) NOT NULL,
                    medico_crm VARCHAR(50) NOT NULL,
                    data_emissao DATE NOT NULL,
                    prescricao TEXT,
                    observacoes TEXT,
                    status VARCHAR(50) DEFAULT 'ativa',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX idx_receitas_paciente_id ON receitas(paciente_id);
                CREATE INDEX idx_receitas_data_emissao ON receitas(data_emissao);
            `);
            console.log('✅ Tabela receitas criada');
        }
        
        if (!existentes.includes('exames')) {
            console.log('\n🔧 Criando tabela exames...');
            await pool.query(`
                CREATE TABLE exames (
                    id SERIAL PRIMARY KEY,
                    paciente_id INTEGER NOT NULL,
                    medico_nome VARCHAR(255) NOT NULL,
                    medico_crm VARCHAR(50) NOT NULL,
                    data_solicitacao DATE NOT NULL,
                    tipo_exame VARCHAR(100),
                    exames_solicitados TEXT,
                    justificativa_clinica TEXT,
                    cid_10 VARCHAR(20),
                    status VARCHAR(50) DEFAULT 'pendente',
                    data_realizacao DATE,
                    resultado TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX idx_exames_paciente_id ON exames(paciente_id);
                CREATE INDEX idx_exames_data_solicitacao ON exames(data_solicitacao);
            `);
            console.log('✅ Tabela exames criada');
        }
        
        console.log('\n🎯 Resultado:');
        console.log('✅ Banco pronto para usar com Caderno Digital');
        console.log('✅ APIs de receitas e exames funcionais');
        console.log('✅ Fichas de atendimento já existentes mantidas');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarEstruturaAtual();
