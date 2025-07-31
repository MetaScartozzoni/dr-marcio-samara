// scripts/testar-sistema.js
/**
 * Script para testar todas as funcionalidades do sistema integrado
 * Execute: node scripts/testar-sistema.js
 */

const { pool } = require('../src/config/database');
const FuncionariosController = require('../src/controllers/funcionarios.controller');
const JornadaController = require('../src/controllers/jornada.controller');

async function testarSistema() {
    console.log('🧪 INICIANDO TESTES DO SISTEMA...\n');
    
    let testesPassados = 0;
    let testesFalharam = 0;
    
    // Mock objects para req/res
    const criarMockRequest = (body = {}, params = {}) => ({
        body,
        params,
        ip: '127.0.0.1',
        get: () => 'test-user-agent'
    });
    
    const criarMockResponse = () => {
        const res = {};
        res.status = (code) => {
            res.statusCode = code;
            return res;
        };
        res.json = (data) => {
            res.data = data;
            return res;
        };
        return res;
    };
    
    // Função auxiliar para testes
    const teste = async (nome, funcao) => {
        try {
            console.log(`🔍 Testando: ${nome}`);
            await funcao();
            console.log(`✅ PASSOU: ${nome}\n`);
            testesPassados++;
        } catch (error) {
            console.log(`❌ FALHOU: ${nome}`);
            console.log(`   Erro: ${error.message}\n`);
            testesFalharam++;
        }
    };
    
    // TESTE 1: Conexão com banco
    await teste('Conexão com PostgreSQL', async () => {
        const { testConnection } = require('../src/config/database');
        const conectado = await testConnection();
        if (!conectado) throw new Error('Falha na conexão');
    });
    
    // TESTE 2: Cadastro de funcionário
    await teste('Cadastro de funcionário', async () => {
        const req = criarMockRequest({
            nome: 'Teste Funcionário',
            email: `teste_${Date.now()}@test.com`,
            senha: 'senha123',
            telefone: '(11) 99999-9999',
            tipo: 'staff'
        });
        const res = criarMockResponse();
        
        await FuncionariosController.cadastrar(req, res);
        
        if (!res.data?.success) {
            throw new Error(res.data?.message || 'Falha no cadastro');
        }
    });
    
    // TESTE 3: Listar funcionários
    await teste('Listar funcionários', async () => {
        const req = criarMockRequest();
        const res = criarMockResponse();
        
        await FuncionariosController.listar(req, res);
        
        if (!res.data?.success) {
            throw new Error('Falha ao listar funcionários');
        }
        
        console.log(`   📋 Encontrados: ${res.data.funcionarios.length} funcionários`);
    });
    
    // TESTE 4: Configurar prazos da jornada
    await teste('Configurar prazos da jornada', async () => {
        const req = criarMockRequest({
            prazo_primeira_consulta: 7,
            prazo_retorno: 30,
            prazo_exames: 15,
            prazo_urgencia: 1,
            notificacao_antecedencia: 2
        });
        const res = criarMockResponse();
        
        await JornadaController.configurarPrazos(req, res);
        
        if (!res.data?.success) {
            throw new Error(res.data?.message || 'Falha na configuração');
        }
    });
    
    // TESTE 5: Buscar prazos configurados
    await teste('Buscar prazos configurados', async () => {
        const req = criarMockRequest();
        const res = criarMockResponse();
        
        await JornadaController.buscarPrazos(req, res);
        
        if (!res.data?.success) {
            throw new Error('Falha ao buscar prazos');
        }
        
        console.log(`   ⚙️ Prazos configurados:`, res.data.prazos);
    });
    
    // TESTE 6: Verificar estrutura das tabelas
    await teste('Verificar estrutura das tabelas', async () => {
        const client = await pool.connect();
        try {
            const tables = await client.query(`
                SELECT table_name, column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name IN ('funcionarios', 'pacientes', 'jornada_paciente', 'system_config', 'logs_sistema')
                ORDER BY table_name, ordinal_position
            `);
            
            if (tables.rows.length < 10) {
                throw new Error('Estrutura de tabelas incompleta');
            }
            
            console.log(`   🏗️ Encontradas ${tables.rows.length} colunas nas tabelas principais`);
        } finally {
            client.release();
        }
    });
    
    // TESTE 7: Sistema de logs
    await teste('Sistema de logs', async () => {
        const client = await pool.connect();
        try {
            await client.query(`
                INSERT INTO logs_sistema (tipo, descricao, detalhes)
                VALUES ($1, $2, $3)
            `, [
                'TESTE_SISTEMA',
                'Teste automatizado do sistema de logs',
                JSON.stringify({ timestamp: new Date().toISOString() })
            ]);
            
            const logs = await client.query(`
                SELECT * FROM logs_sistema
                WHERE tipo = 'TESTE_SISTEMA'
                ORDER BY data_evento DESC
                LIMIT 1
            `);
            
            if (logs.rows.length === 0) {
                throw new Error('Falha ao inserir/recuperar log');
            }
            
            console.log(`   📝 Log criado com ID: ${logs.rows[0].id}`);
        } finally {
            client.release();
        }
    });
    
    // TESTE 8: Verificar notificações
    await teste('Sistema de notificações', async () => {
        const req = criarMockRequest();
        const res = criarMockResponse();
        
        await JornadaController.gerarNotificacoes(req, res);
        
        if (!res.data?.success) {
            throw new Error('Falha no sistema de notificações');
        }
    });
    
    // Resultados finais
    console.log('🎯 RESULTADOS DOS TESTES:');
    console.log(`   ✅ Testes Passados: ${testesPassados}`);
    console.log(`   ❌ Testes Falharam: ${testesFalharam}`);
    console.log(`   📊 Total: ${testesPassados + testesFalharam}`);
    
    if (testesFalharam === 0) {
        console.log('\n🚀 TODOS OS TESTES PASSARAM! Sistema pronto para produção!');
    } else {
        console.log('\n⚠️  Alguns testes falharam. Verifique os erros acima.');
    }
    
    process.exit(testesFalharam > 0 ? 1 : 0);
}

// Executar testes
if (require.main === module) {
    testarSistema().catch(error => {
        console.error('❌ Erro fatal nos testes:', error);
        process.exit(1);
    });
}

module.exports = testarSistema;
