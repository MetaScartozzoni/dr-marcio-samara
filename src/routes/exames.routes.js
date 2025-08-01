const express = require('express');
const router = express.Router();
const ExamesController = require('../controllers/exames.controller');

// Instanciar o controller
const examesController = new ExamesController();

// === ROTAS PARA EXAMES ===

// Criar nova solicitação de exame
router.post('/', async (req, res) => {
    try {
        await examesController.criarSolicitacao(req, res);
    } catch (error) {
        console.error('Erro na rota POST /:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar exames
router.get('/', async (req, res) => {
    try {
        await examesController.listarExames(req, res);
    } catch (error) {
        console.error('Erro na rota GET /:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar exame por ID
router.get('/:id', async (req, res) => {
    try {
        await examesController.buscarExamePorId(req, res);
    } catch (error) {
        console.error('Erro na rota GET /:id:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Enviar exame por email
router.post('/enviar-email', async (req, res) => {
    try {
        await examesController.enviarExamePorEmail(req, res);
    } catch (error) {
        console.error('Erro na rota POST /enviar-email:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
