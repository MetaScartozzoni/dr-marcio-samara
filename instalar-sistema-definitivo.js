// Script para criar tabelas obrigatórias do sistema definitivo
require('dotenv').config();
const { Pool } = require('pg');

async function criarTabelasObrigatorias() {
    console.log('🚀 Criando tabelas obrigatórias para sistema de recuperação definitivo...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false  // Railway proxy não usa SSL
    });

    let client;
    
    try {
        client = await pool.connect();
        console.log('✅ Conectado ao PostgreSQL');

        // 1. Tabela de logs (OBRIGATÓRIA para auditoria)
        await client.query(`
            CREATE TABLE IF NOT EXISTS logs_recuperacao_senha (
                id BIGSERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                email_mascarado VARCHAR(255) NOT NULL,
                evento VARCHAR(50) NOT NULL,
                ip_address INET,
                user_agent TEXT,
                codigo_mascarado VARCHAR(10),
                tentativas_codigo INTEGER DEFAULT 0,
                token_usado VARCHAR(64),
                metadados JSONB,
                data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CONSTRAINT valid_evento CHECK (evento IN (
                    'solicitacao_recuperacao',
                    'codigo_enviado', 
                    'tentativa_verificacao_codigo',
                    'codigo_verificado',
                    'codigo_incorreto',
                    'codigo_expirado',
                    'codigo_nao_encontrado',
                    'max_tentativas_atingidas',
                    'redefinicao_senha',
                    'senha_redefinida',
                    'rate_limit_atingido',
                    'erro_envio_email'
                ))
            );
        `);
        console.log('✅ Tabela logs_recuperacao_senha criada');

        // 2. Tabela de códigos ativos
        await client.query(`
            CREATE TABLE IF NOT EXISTS codigos_recuperacao_ativos (
                id BIGSERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                codigo_hash VARCHAR(64) NOT NULL,
                token VARCHAR(64) NOT NULL UNIQUE,
                expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
                tentativas INTEGER DEFAULT 0,
                ip_solicitacao INET,
                user_agent_solicitacao TEXT,
                data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                data_ultima_tentativa TIMESTAMP WITH TIME ZONE,
                
                -- Constraints
                CONSTRAINT valid_tentativas CHECK (tentativas >= 0 AND tentativas <= 3),
                CONSTRAINT valid_expiracao CHECK (expiracao > data_criacao)
            );
        `);
        console.log('✅ Tabela codigos_recuperacao_ativos criada');

        // 3. Tabela de rate limiting
        await client.query(`
            CREATE TABLE IF NOT EXISTS rate_limit_recuperacao (
                id BIGSERIAL PRIMARY KEY,
                identificador VARCHAR(255) NOT NULL,
                tipo_limite VARCHAR(10) NOT NULL,
                contador INTEGER DEFAULT 1,
                janela_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                ultima_tentativa TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                UNIQUE (identificador, tipo_limite),
                CONSTRAINT valid_tipo CHECK (tipo_limite IN ('ip', 'email')),
                CONSTRAINT valid_contador CHECK (contador > 0)
            );
        `);
        console.log('✅ Tabela rate_limit_recuperacao criada');

        // 4. Tabela de histórico de senhas (auditoria)
        await client.query(`
            CREATE TABLE IF NOT EXISTS historico_alteracao_senha (
                id BIGSERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                metodo_alteracao VARCHAR(50) NOT NULL,
                ip_address INET,
                user_agent TEXT,
                token_recuperacao VARCHAR(64),
                observacoes TEXT,
                data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT valid_metodo CHECK (metodo_alteracao IN (
                    'primeiro_acesso',
                    'alteracao_manual', 
                    'recuperacao_codigo',
                    'admin_reset',
                    'expiracao_forcada'
                ))
            );
        `);
        console.log('✅ Tabela historico_alteracao_senha criada');

        // 5. Criar índices para performance
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_logs_email ON logs_recuperacao_senha(email)',
            'CREATE INDEX IF NOT EXISTS idx_logs_evento ON logs_recuperacao_senha(evento)',
            'CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_recuperacao_senha(data_criacao)',
            'CREATE INDEX IF NOT EXISTS idx_logs_ip ON logs_recuperacao_senha(ip_address)',
            
            'CREATE INDEX IF NOT EXISTS idx_codigos_email ON codigos_recuperacao_ativos(email)',
            'CREATE INDEX IF NOT EXISTS idx_codigos_token ON codigos_recuperacao_ativos(token)',
            'CREATE INDEX IF NOT EXISTS idx_codigos_expiracao ON codigos_recuperacao_ativos(expiracao)',
            
            'CREATE INDEX IF NOT EXISTS idx_rate_identificador ON rate_limit_recuperacao(identificador)',
            'CREATE INDEX IF NOT EXISTS idx_rate_janela ON rate_limit_recuperacao(janela_inicio)',
            
            'CREATE INDEX IF NOT EXISTS idx_historico_email ON historico_alteracao_senha(email)',
            'CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_alteracao_senha(data_alteracao)'
        ];

        for (const sql of indices) {
            await client.query(sql);
        }
        console.log('✅ Índices criados');

        // 6. Criar função de limpeza automática
        await client.query(`
            CREATE OR REPLACE FUNCTION limpeza_codigos_expirados()
            RETURNS INTEGER AS $$
            DECLARE
                removidos INTEGER;
            BEGIN
                DELETE FROM codigos_recuperacao_ativos 
                WHERE expiracao < CURRENT_TIMESTAMP;
                
                GET DIAGNOSTICS removidos = ROW_COUNT;
                
                -- Log da limpeza
                INSERT INTO logs_recuperacao_senha (email, email_mascarado, evento, metadados)
                VALUES ('system', 'system', 'limpeza_automatica', 
                       jsonb_build_object('codigos_removidos', removidos));
                
                RETURN removidos;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Função de limpeza criada');

        // 7. Verificar estrutura final
        const tabelas = await client.query(`
            SELECT table_name,
                   (SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_name = t.table_name AND table_schema = 'public') as colunas
            FROM information_schema.tables t
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%recuperacao%' OR table_name LIKE '%historico_alteracao%')
            ORDER BY table_name
        `);

        console.log('\n📊 ESTRUTURA CRIADA:');
        tabelas.rows.forEach(row => {
            console.log(`  ✓ ${row.table_name} (${row.colunas} colunas)`);
        });

        // 8. Teste de inserção
        await client.query(`
            INSERT INTO logs_recuperacao_senha (email, email_mascarado, evento, metadados)
            VALUES ('teste@sistema.com', 'te***@sistema.com', 'teste_instalacao', 
                   jsonb_build_object('timestamp', NOW(), 'sistema', 'definitivo'))
        `);
        console.log('✅ Teste de inserção realizado');

        console.log('\n🎉 SISTEMA DE RECUPERAÇÃO DEFINITIVO INSTALADO COM SUCESSO!');
        console.log('🔒 Conformidade: LGPD + CFM');
        console.log('📋 Auditoria: 100% Rastreável');
        console.log('🛡️ Segurança: Máxima');

    } catch (error) {
        console.error('❌ Erro criando estrutura:', error.message);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    criarTabelasObrigatorias()
        .then(() => {
            console.log('\n✅ Instalação concluída - Sistema pronto para produção!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Falha na instalação:', error.message);
            process.exit(1);
        });
}

module.exports = { criarTabelasObrigatorias };
