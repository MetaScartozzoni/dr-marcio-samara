const express = require('express');
const router = express.Router();
const FichasController = require('../controllers/fichas.controller');

// Instanciar o controller
const fichasController = new FichasController();

// Middleware de validação
const validarFicha = (req, res, next) => {
    const { paciente_id, pacienteNome, dataAtendimento } = req.body;
    
    if (!paciente_id || !pacienteNome || !dataAtendimento) {
        return res.status(400).json({
            error: 'Campos obrigatórios: paciente_id, pacienteNome, dataAtendimento'
        });
    }
    
    next();
};

// === ROTAS PARA FICHAS DE ATENDIMENTO ===

// Criar nova ficha de atendimento
router.post('/', async (req, res) => {
    try {
        await fichasController.criarFicha(req, res);
    } catch (error) {
        console.error('Erro na rota POST /:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar fichas de atendimento
router.get('/', async (req, res) => {
    try {
        await fichasController.listarFichas(req, res);
    } catch (error) {
        console.error('Erro na rota GET /:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar ficha por ID
router.get('/:id', async (req, res) => {
    try {
        await fichasController.buscarFichaPorId(req, res);
    } catch (error) {
        console.error('Erro na rota GET /:id:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
