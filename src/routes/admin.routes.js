// src/routes/admin.routes.js
const express = require('express');
const Logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Middleware para verificar se é admin
const verificarAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.tipo !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.'
        });
    }
    next();
};

// Inicializar logger (será passado no server.js)
let logger;

function initializeRoutes(db) {
    logger = new Logger(db);
}

// ==========================================
// ROTA: LISTAR LOGS DO SISTEMA
// ==========================================
router.get('/logs', 
    authenticateToken,
    verificarAdmin,
    async (req, res) => {
        try {
            const filtros = {
                tipo: req.query.tipo,
                usuario_id: req.query.usuario_id,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim,
                limit: parseInt(req.query.limit) || 100
            };

            const logs = await logger.buscarLogs(filtros);

            res.json({
                success: true,
                data: {
                    logs,
                    total: logs.length,
                    filtros_aplicados: filtros
                }
            });

        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno ao buscar logs'
            });
        }
    }
);

// ==========================================
// ROTA: ESTATÍSTICAS DOS LOGS
// ==========================================
router.get('/logs/estatisticas',
    authenticateToken,
    verificarAdmin,
    async (req, res) => {
        try {
            const estatisticas = await logger.estatisticasLogs();

            res.json({
                success: true,
                data: estatisticas
            });

        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno ao buscar estatísticas'
            });
        }
    }
);

// ==========================================
// ROTA: LOGS POR TIPO
// ==========================================
router.get('/logs/tipo/:tipo',
    authenticateToken,
    verificarAdmin,
    async (req, res) => {
        try {
            const { tipo } = req.params;
            const limit = parseInt(req.query.limit) || 50;

            const logs = await logger.buscarLogs({
                tipo: tipo.toUpperCase(),
                limit
            });

            res.json({
                success: true,
                data: {
                    tipo,
                    logs,
                    total: logs.length
                }
            });

        } catch (error) {
            console.error('Erro ao buscar logs por tipo:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno ao buscar logs'
            });
        }
    }
);

// ==========================================
// ROTA: LOGS DE ATIVIDADE RECENTE
// ==========================================
router.get('/logs/recente',
    authenticateToken,
    verificarAdmin,
    async (req, res) => {
        try {
            const horas = parseInt(req.query.horas) || 24;
            const dataInicio = new Date();
            dataInicio.setHours(dataInicio.getHours() - horas);

            const logs = await logger.buscarLogs({
                data_inicio: dataInicio.toISOString(),
                limit: 100
            });

            res.json({
                success: true,
                data: {
                    periodo: `Últimas ${horas} horas`,
                    logs,
                    total: logs.length
                }
            });

        } catch (error) {
            console.error('Erro ao buscar logs recentes:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno ao buscar logs'
            });
        }
    }
);

// ==========================================
// ROTA: DASHBOARD DE MONITORAMENTO
// ==========================================
router.get('/dashboard',
    authenticateToken,
    verificarAdmin,
    async (req, res) => {
        try {
            const estatisticas = await logger.estatisticasLogs();
            
            // Logs recentes (últimas 24h)
            const dataInicio = new Date();
            dataInicio.setHours(dataInicio.getHours() - 24);
            
            const logsRecentes = await logger.buscarLogs({
                data_inicio: dataInicio.toISOString(),
                limit: 20
            });

            // Atividade por hora (últimas 24h)
            const atividadePorHora = await logger.db.query(`
                SELECT 
                    EXTRACT(HOUR FROM data_evento) as hora,
                    COUNT(*) as total
                FROM logs_sistema 
                WHERE data_evento >= NOW() - INTERVAL '24 hours'
                GROUP BY EXTRACT(HOUR FROM data_evento)
                ORDER BY hora
            `);

            res.json({
                success: true,
                data: {
                    estatisticas,
                    logs_recentes: logsRecentes,
                    atividade_por_hora: atividadePorHora.rows,
                    periodo: 'Últimas 24 horas'
                }
            });

        } catch (error) {
            console.error('Erro ao buscar dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno ao buscar dashboard'
            });
        }
    }
);

module.exports = { router, initializeRoutes };
