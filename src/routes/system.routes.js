// src/routes/system.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const FuncionariosController = require('../controllers/funcionarios.controller');
const JornadaController = require('../controllers/jornada.controller');

// Rota para testar todo o sistema
router.get('/test', async (req, res) => {
    const resultados = {
        timestamp: new Date().toISOString(),
        testes: [],
        resumo: {
            total: 0,
            passaram: 0,
            falharam: 0,
            tempo_execucao: 0
        }
    };
    
    const inicio = Date.now();
    
    // Função auxiliar para testes
    const executarTeste = async (nome, funcaoTeste) => {
        const inicioTeste = Date.now();
        try {
            await funcaoTeste();
            const tempo = Date.now() - inicioTeste;
            resultados.testes.push({
                nome,
                status: 'PASSOU',
                tempo: `${tempo}ms`,
                erro: null
            });
            resultados.resumo.passaram++;
        } catch (error) {
            const tempo = Date.now() - inicioTeste;
            resultados.testes.push({
                nome,
                status: 'FALHOU',
                tempo: `${tempo}ms`,
                erro: error.message
            });
            resultados.resumo.falharam++;
        }
        resultados.resumo.total++;
    };
    
    // Mock objects para req/res dos controllers
    const criarMockRequest = (body = {}, params = {}) => ({
        body,
        params,
        ip: req.ip,
        get: (header) => req.get(header)
    });
    
    const criarMockResponse = () => {
        const mockRes = {};
        mockRes.status = (code) => {
            mockRes.statusCode = code;
            return mockRes;
        };
        mockRes.json = (data) => {
            mockRes.data = data;
            return mockRes;
        };
        return mockRes;
    };
    
    // TESTE 1: Conexão com banco
    await executarTeste('Conexão PostgreSQL', async () => {
        const { testConnection } = require('../config/database');
        const conectado = await testConnection();
        if (!conectado) throw new Error('Falha na conexão');
    });
    
    // TESTE 2: Estrutura das tabelas
    await executarTeste('Estrutura do Banco', async () => {
        const client = await pool.connect();
        try {
            const tables = await client.query(`
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('funcionarios', 'pacientes', 'jornada_paciente', 'system_config', 'logs_sistema')
            `);
            
            if (tables.rows.length < 5) {
                throw new Error(`Apenas ${tables.rows.length}/5 tabelas encontradas`);
            }
        } finally {
            client.release();
        }
    });
    
    // TESTE 3: Cadastro de funcionário de teste
    await executarTeste('Cadastro de Funcionário', async () => {
        const mockReq = criarMockRequest({
            nome: `Teste Sistema ${Date.now()}`,
            email: `teste_${Date.now()}@sistema.com`,
            senha: 'senha123',
            telefone: '(11) 99999-9999',
            tipo: 'staff'
        });
        const mockRes = criarMockResponse();
        
        await FuncionariosController.cadastrar(mockReq, mockRes);
        
        if (!mockRes.data?.success) {
            throw new Error(mockRes.data?.message || 'Falha no cadastro');
        }
    });
    
    // TESTE 4: Listar funcionários
    await executarTeste('Listar Funcionários', async () => {
        const mockReq = criarMockRequest();
        const mockRes = criarMockResponse();
        
        await FuncionariosController.listar(mockReq, mockRes);
        
        if (!mockRes.data?.success) {
            throw new Error('Falha ao listar funcionários');
        }
    });
    
    // TESTE 5: Configurar prazos da jornada
    await executarTeste('Configurar Prazos Jornada', async () => {
        const mockReq = criarMockRequest({
            prazo_primeira_consulta: 7,
            prazo_retorno: 30,
            prazo_exames: 15,
            prazo_urgencia: 1,
            notificacao_antecedencia: 2
        });
        const mockRes = criarMockResponse();
        
        await JornadaController.configurarPrazos(mockReq, mockRes);
        
        if (!mockRes.data?.success) {
            throw new Error(mockRes.data?.message || 'Falha na configuração');
        }
    });
    
    // TESTE 6: Buscar prazos
    await executarTeste('Buscar Prazos Configurados', async () => {
        const mockReq = criarMockRequest();
        const mockRes = criarMockResponse();
        
        await JornadaController.buscarPrazos(mockReq, mockRes);
        
        if (!mockRes.data?.success) {
            throw new Error('Falha ao buscar prazos');
        }
    });
    
    // TESTE 7: Sistema de logs
    await executarTeste('Sistema de Logs', async () => {
        const client = await pool.connect();
        try {
            await client.query(`
                INSERT INTO logs_sistema (tipo, descricao, detalhes)
                VALUES ($1, $2, $3)
            `, [
                'TESTE_AUTOMATICO',
                'Teste do sistema via API',
                JSON.stringify({ origem: 'system/test', ip: req.ip })
            ]);
        } finally {
            client.release();
        }
    });
    
    // TESTE 8: Verificar notificações
    await executarTeste('Sistema de Notificações', async () => {
        const mockReq = criarMockRequest();
        const mockRes = criarMockResponse();
        
        await JornadaController.gerarNotificacoes(mockReq, mockRes);
        
        if (!mockRes.data?.success) {
            throw new Error('Falha no sistema de notificações');
        }
    });
    
    // Calcular tempo total
    resultados.resumo.tempo_execucao = `${Date.now() - inicio}ms`;
    
    // Status geral
    const statusGeral = resultados.resumo.falharam === 0 ? 'TODOS_PASSARAM' : 'ALGUNS_FALHARAM';
    
    res.json({
        success: resultados.resumo.falharam === 0,
        message: statusGeral === 'TODOS_PASSARAM' 
            ? '🚀 Todos os testes passaram! Sistema funcionando perfeitamente!' 
            : '⚠️ Alguns testes falharam. Verifique os detalhes.',
        status: statusGeral,
        resultados
    });
});

// Rota para status rápido do sistema
router.get('/status', async (req, res) => {
    try {
        const client = await pool.connect();
        
        // Verificar conexão e contar registros principais
        const [funcionarios, configs, logs] = await Promise.all([
            client.query('SELECT COUNT(*) as total FROM funcionarios WHERE ativo = true'),
            client.query('SELECT COUNT(*) as total FROM system_config'),
            client.query('SELECT COUNT(*) as total FROM logs_sistema WHERE data_evento > NOW() - INTERVAL \'1 day\'')
        ]);
        
        client.release();
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            sistema: {
                database: '✅ Conectado',
                funcionarios_ativos: funcionarios.rows[0].total,
                configuracoes: configs.rows[0].total,
                logs_hoje: logs.rows[0].total
            },
            apis_disponiveis: [
                'GET /api/system/status - Status do sistema',
                'GET /api/system/test - Testes automatizados',
                'GET /api/funcionarios/listar - Listar funcionários',
                'POST /api/funcionarios/cadastrar - Cadastrar funcionário',
                'GET /api/jornada/prazos - Configurações da jornada'
            ]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar status do sistema',
            error: error.message
        });
    }
});

// Rota para informações do banco
router.get('/database-info', async (req, res) => {
    try {
        const client = await pool.connect();
        
        // Informações das tabelas
        const tables = await client.query(`
            SELECT 
                t.table_name,
                (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as colunas,
                COALESCE(s.n_tup_ins, 0) as registros_inseridos,
                COALESCE(s.n_tup_upd, 0) as registros_atualizados
            FROM information_schema.tables t
            LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
            WHERE t.table_schema = 'public' 
            AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_name
        `);
        
        client.release();
        
        res.json({
            success: true,
            database: {
                host: 'Railway PostgreSQL',
                status: '✅ Conectado',
                total_tabelas: tables.rows.length
            },
            tabelas: tables.rows
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter informações do banco',
            error: error.message
        });
    }
});

module.exports = router;
