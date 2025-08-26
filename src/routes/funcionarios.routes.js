// src/routes/funcionarios.routes.js
const express = require('express');
const router = express.Router();
const FuncionariosController = require('../controllers/funcionarios.controller');

// Middleware de validação básica
const validarFuncionario = (req, res, next) => {
    const { nome, email } = req.body;
    
    if (!nome || !email) {
        return res.status(400).json({
            success: false,
            message: 'Nome e email são obrigatórios'
        });
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Formato de email inválido'
        });
    }
    
    next();
};

// Rotas CRUD
router.post('/cadastrar', validarFuncionario, FuncionariosController.cadastrar);
router.get('/listar', FuncionariosController.listar);
router.get('/:id', FuncionariosController.buscarPorId);
router.put('/:id', validarFuncionario, FuncionariosController.atualizar);
router.delete('/:id', FuncionariosController.deletar);

// Rota de autenticação
router.post('/autenticar', FuncionariosController.autenticar);

module.exports = router;
