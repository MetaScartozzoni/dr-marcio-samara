// src/routes/prontuarios.routes.js
const express = require('express');
const { param, query } = require('express-validator');
const ProntuarioController = require('../controllers/prontuario.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

const router = express.Router();

// Initialize controller
const prontuarioController = new ProntuarioController(pool);

// ==========================================
// VALIDAÇÕES
// ==========================================

const validarBuscarCompleto = [
  param('id')
    .notEmpty()
    .withMessage('ID do prontuário é obrigatório')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
  query('fichas_limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limite de fichas deve estar entre 1 e 50'),
  query('orcamentos_limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limite de orçamentos deve estar entre 1 e 50'),
  query('exames_limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limite de exames deve estar entre 1 e 50'),
  query('agendamentos_limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limite de agendamentos deve estar entre 1 e 50'),
  query('show_sensitive')
    .optional()
    .isBoolean()
    .withMessage('show_sensitive deve ser true ou false')
];

// ==========================================
// ROTAS
// ==========================================

/**
 * GET /api/prontuarios/:id
 * Buscar prontuário completo por ID com dados relacionados paginados
 * 
 * Requer autenticação via token JWT
 * 
 * TODO: Implementar verificação de permissão específica do Caderno Digital
 * em PR subsequente para garantir que:
 * - Staff da clínica pode ver todos os prontuários
 * - Pacientes podem ver apenas seus próprios prontuários
 * - Logs de acesso são registrados para compliance LGPD
 */
router.get(
  '/:id',
  authenticateToken,
  validarBuscarCompleto,
  async (req, res) => {
    await prontuarioController.buscarPorIdCompleto(req, res);
  }
);

module.exports = router;
