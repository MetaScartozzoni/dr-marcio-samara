// src/controllers/orcamento.token.controller.js
// Small controller that exposes token endpoints for orcamentos.
const TokenService = require('../services/token.service');

class OrcamentoTokenController {
  constructor(db) {
    this.db = db;
    this.tokenService = new TokenService(db);
  }

  // POST /api/orcamentos/:id/token
  async criarToken(req, res) {
    try {
      const { id } = req.params;
      const { expiresInMinutes } = req.body || {};

      // authorization check (assumes req.user and role available)
      if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Permissão negada' });
      }

      const result = await this.tokenService.generateTokenForOrcamento(id, {
        expiresInMinutes: expiresInMinutes || null,
        createdBy: req.user.id
      });

      // Return raw token only once
      return res.status(201).json({
        success: true,
        message: 'Token criado com sucesso. Guarde-o agora: será exibido apenas uma vez.',
        data: {
          orcamento_id: result.orcamentoId,
          token: result.rawToken,
          token_enabled: result.token_enabled,
          token_expires_at: result.token_expires_at
        }
      });
    } catch (err) {
      console.error('Erro criar token:', err);
      return res.status(500).json({ success: false, message: 'Erro interno ao criar token' });
    }
  }

  // DELETE /api/orcamentos/:id/token
  async revogarToken(req, res) {
    try {
      const { id } = req.params;

      if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Permissão negada' });
      }

      const ok = await this.tokenService.revokeOrcamentoToken(id);
      if (!ok) return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });

      return res.json({ success: true, message: 'Token revogado com sucesso' });
    } catch (err) {
      console.error('Erro revogar token:', err);
      return res.status(500).json({ success: false, message: 'Erro interno ao revogar token' });
    }
  }
}

module.exports = OrcamentoTokenController;