// src/routes/ficha.routes.js
const express = require('express');
const { body } = require('express-validator');
const { pool } = require('../config/database');
const FichaController = require('../controllers/ficha.controller');

const router = express.Router();
const fichaController = new FichaController(pool);

// Validações para criação de ficha
const validateFicha = [
    body('paciente_id').isInt({ min: 1 }).withMessage('ID do paciente é obrigatório'),
    body('peso').optional().isFloat({ min: 0 }).withMessage('Peso deve ser um número válido'),
    body('altura').optional().isFloat({ min: 0 }).withMessage('Altura deve ser um número válido'),
    body('pressao_arterial').optional().isLength({ max: 20 }).withMessage('Pressão arterial deve ter no máximo 20 caracteres'),
    body('procedimento_desejado').optional().isLength({ max: 1000 }).withMessage('Procedimento desejado deve ter no máximo 1000 caracteres'),
    body('motivo_principal').optional().isLength({ max: 1000 }).withMessage('Motivo principal deve ter no máximo 1000 caracteres'),
    body('historico_medico').optional().isLength({ max: 2000 }).withMessage('Histórico médico deve ter no máximo 2000 caracteres'),
    body('medicamentos_uso').optional().isLength({ max: 1000 }).withMessage('Medicamentos em uso deve ter no máximo 1000 caracteres'),
    body('alergias').optional().isLength({ max: 500 }).withMessage('Alergias deve ter no máximo 500 caracteres'),
    body('observacoes_clinicas').optional().isLength({ max: 2000 }).withMessage('Observações clínicas deve ter no máximo 2000 caracteres')
];

// ==========================================
// ROTAS DE FICHAS DE ATENDIMENTO
// ==========================================

// POST /api/fichas - Criar nova ficha de atendimento
router.post('/', validateFicha, (req, res) => {
    fichaController.criarFicha(req, res);
});

// GET /api/fichas/:id - Buscar ficha por ID
router.get('/:id', (req, res) => {
    fichaController.buscarFichaPorId(req, res);
});

// PUT /api/fichas/:id - Atualizar ficha de atendimento
router.put('/:id', validateFicha, (req, res) => {
    fichaController.atualizarFicha(req, res);
});

// DELETE /api/fichas/:id - Deletar ficha de atendimento
router.delete('/:id', (req, res) => {
    fichaController.deletarFicha(req, res);
});

// GET /api/fichas/paciente/:pacienteId - Listar fichas por paciente
router.get('/paciente/:pacienteId', (req, res) => {
    fichaController.listarFichasPorPaciente(req, res);
});

// GET /api/fichas/prontuario/:prontuarioId - Listar fichas por prontuário
router.get('/prontuario/:prontuarioId', (req, res) => {
    fichaController.listarFichasPorProntuario(req, res);
});

// PUT /api/fichas/:id/finalizar - Finalizar ficha de atendimento
router.put('/:id/finalizar', (req, res) => {
    fichaController.finalizarFicha(req, res);
});

// GET /api/fichas - Listar todas as fichas (com filtros)
router.get('/', (req, res) => {
    fichaController.listarFichas(req, res);
});

// GET /api/fichas/:id/historico - Buscar histórico de alterações da ficha
router.get('/:id/historico', (req, res) => {
    fichaController.buscarHistoricoFicha(req, res);
});

// POST /api/fichas/:id/anexo - Adicionar anexo à ficha
router.post('/:id/anexo', (req, res) => {
    fichaController.adicionarAnexo(req, res);
});

module.exports = router;
