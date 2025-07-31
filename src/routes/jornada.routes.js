// src/routes/jornada.routes.js
const express = require('express');
const router = express.Router();
const JornadaController = require('../controllers/jornada.controller');

// Middleware de validação para prazos
const validarPrazos = (req, res, next) => {
    const requiredFields = [
        'prazo_primeira_consulta', 
        'prazo_retorno', 
        'prazo_exames', 
        'prazo_urgencia',
        'notificacao_antecedencia'
    ];
    
    for (const field of requiredFields) {
        if (!req.body[field] || isNaN(req.body[field])) {
            return res.status(400).json({
                success: false,
                message: `Campo ${field} é obrigatório e deve ser um número`
            });
        }
    }
    
    next();
};

// Rotas da jornada
router.post('/configurar-prazos', validarPrazos, JornadaController.configurarPrazos);
router.get('/prazos', JornadaController.buscarPrazos);
router.get('/verificar-prazos', JornadaController.verificarPrazos);
router.post('/gerar-notificacoes', JornadaController.gerarNotificacoes);

module.exports = router;
