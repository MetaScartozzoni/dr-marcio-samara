// src/routes/orcamento.token.routes.js
const express = require('express');
const router = express.Router();
const OrcamentoTokenController = require('../controllers/orcamento.token.controller');
const { auth } = require('../middleware');

// controller will be created per-request so it has access to DI (db) from app context.
router.post('/:id/token',
  auth.verificarToken,
  auth.verificarRole(['admin', 'staff']),
  (req, res, next) => {
    // create controller with db from request/app (assumes req.app.get('db') or similar)
    const db = req.app.get('db') || req.db || req.pool;
    const ctrl = new OrcamentoTokenController(db);
    return ctrl.criarToken(req, res, next);
  }
);

router.delete('/:id/token',
  auth.verificarToken,
  auth.verificarRole(['admin', 'staff']),
  (req, res, next) => {
    const db = req.app.get('db') || req.db || req.pool;
    const ctrl = new OrcamentoTokenController(db);
    return ctrl.revogarToken(req, res, next);
  }
);

module.exports = router;