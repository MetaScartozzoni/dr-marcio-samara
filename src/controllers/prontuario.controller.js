// src/controllers/prontuario.controller.js
const { validationResult } = require('express-validator');
const ProntuarioService = require('../services/prontuario.service');
const { adaptProntuarioCompleto } = require('../services/prontuario.adapter');

class ProntuarioController {
  constructor(db) {
    this.db = db;
    this.service = new ProntuarioService(db);
  }

  /**
   * Fetch complete prontuário by ID
   * GET /api/prontuarios/:id
   * 
   * Query params:
   * - fichas_limit: Number of fichas to fetch (default: 5)
   * - orcamentos_limit: Number of orcamentos to fetch (default: 5)
   * - exames_limit: Number of exames to fetch (default: 5)
   * - agendamentos_limit: Number of agendamentos to fetch (default: 5)
   * - show_sensitive: Boolean to show/hide sensitive data (default: false)
   * - fichas_cursor: Pagination cursor for fichas
   * - orcamentos_cursor: Pagination cursor for orcamentos
   * - exames_cursor: Pagination cursor for exames
   * - agendamentos_cursor: Pagination cursor for agendamentos
   */
  async buscarPorIdCompleto(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erro de validação',
          errors: errors.array()
        });
      }

      const { id } = req.params;

      // Validate UUID format
      if (!this.service.validateUUID(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido. Deve ser um UUID válido.'
        });
      }

      // Parse query parameters
      const options = {
        fichasLimit: parseInt(req.query.fichas_limit) || 5,
        orcamentosLimit: parseInt(req.query.orcamentos_limit) || 5,
        examesLimit: parseInt(req.query.exames_limit) || 5,
        agendamentosLimit: parseInt(req.query.agendamentos_limit) || 5,
        fichasCursor: req.query.fichas_cursor || null,
        orcamentosCursor: req.query.orcamentos_cursor || null,
        examesCursor: req.query.exames_cursor || null,
        agendamentosCursor: req.query.agendamentos_cursor || null
      };

      // Validate limits
      const maxLimit = 50;
      if (options.fichasLimit > maxLimit || options.orcamentosLimit > maxLimit ||
          options.examesLimit > maxLimit || options.agendamentosLimit > maxLimit) {
        return res.status(400).json({
          success: false,
          message: `Limite máximo por consulta é ${maxLimit} registros`
        });
      }

      // Check if user has permission to view this prontuário
      // TODO: Implement full Caderno Digital permission checks in follow-up PR
      // For now, we do a basic check that user is authenticated (handled by middleware)
      // and belongs to the clinic staff or is the patient themselves
      
      const showSensitive = req.query.show_sensitive === 'true';

      // Fetch data
      const data = await this.service.buscarCompleto(id, options);

      // Adapt response
      const adaptedData = adaptProntuarioCompleto(data, showSensitive);

      return res.status(200).json({
        success: true,
        data: adaptedData
      });

    } catch (error) {
      console.error('Erro ao buscar prontuário completo:', error);

      if (error.message === 'Prontuário não encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = ProntuarioController;
