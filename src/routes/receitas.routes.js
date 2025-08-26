const express = require('express');
const router = express.Router();
const ReceitasController = require('../controllers/receitas.controller');

// Instanciar o controller
const receitasController = new ReceitasController();

// === ROTAS PARA RECEITAS ===

// Criar nova receita
router.post('/', async (req, res) => {
    try {
        await receitasController.criarReceita(req, res);
    } catch (error) {
        console.error('Erro na rota POST /:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar receitas
router.get('/', async (req, res) => {
    try {
        await receitasController.listarReceitas(req, res);
    } catch (error) {
        console.error('Erro na rota GET /:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar receita por ID
router.get('/:id', async (req, res) => {
    try {
        await receitasController.buscarReceitaPorId(req, res);
    } catch (error) {
        console.error('Erro na rota GET /:id:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Enviar receita por email
router.post('/enviar-email', async (req, res) => {
    try {
        await receitasController.enviarReceitaPorEmail(req, res);
    } catch (error) {
        console.error('Erro na rota POST /enviar-email:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
