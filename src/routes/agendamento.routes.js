// src/routes/agendamento.routes.js
const express = require('express');
const { body, query, param } = require('express-validator');
const agendamentoController = require('../controllers/agendamento.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.verificarToken);

// Validações
const validarCriarAgendamento = [
  body('paciente_id')
    .isUUID()
    .withMessage('ID do paciente deve ser um UUID válido'),
  body('servico_id')
    .isUUID()
    .withMessage('ID do serviço deve ser um UUID válido'),
  body('data_agendamento')
    .isISO8601()
    .withMessage('Data do agendamento deve estar no formato ISO 8601')
    .custom((value) => {
      const agendamento = new Date(value);
      const agora = new Date();
      if (agendamento <= agora) {
        throw new Error('Data do agendamento deve ser no futuro');
      }
      return true;
    }),
  body('observacoes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres')
];

const validarReagendar = [
  param('id')
    .isUUID()
    .withMessage('ID do agendamento deve ser um UUID válido'),
  body('nova_data')
    .isISO8601()
    .withMessage('Nova data deve estar no formato ISO 8601')
    .custom((value) => {
      const agendamento = new Date(value);
      const agora = new Date();
      if (agendamento <= agora) {
        throw new Error('Nova data deve ser no futuro');
      }
      return true;
    }),
  body('motivo')
    .notEmpty()
    .withMessage('Motivo do reagendamento é obrigatório')
    .isLength({ max: 200 })
    .withMessage('Motivo deve ter no máximo 200 caracteres')
];

const validarCancelar = [
  param('id')
    .isUUID()
    .withMessage('ID do agendamento deve ser um UUID válido'),
  body('motivo')
    .notEmpty()
    .withMessage('Motivo do cancelamento é obrigatório')
    .isLength({ max: 200 })
    .withMessage('Motivo deve ter no máximo 200 caracteres')
];

const validarDisponibilidade = [
  query('data_inicio')
    .isISO8601()
    .withMessage('Data de início deve estar no formato ISO 8601'),
  query('data_fim')
    .isISO8601()
    .withMessage('Data de fim deve estar no formato ISO 8601')
    .custom((value, { req }) => {
      const inicio = new Date(req.query.data_inicio);
      const fim = new Date(value);
      if (fim <= inicio) {
        throw new Error('Data de fim deve ser posterior à data de início');
      }
      return true;
    })
];

const validarListagem = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro maior que 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),
  query('data_inicio')
    .optional()
    .isISO8601()
    .withMessage('Data de início deve estar no formato ISO 8601'),
  query('data_fim')
    .optional()
    .isISO8601()
    .withMessage('Data de fim deve estar no formato ISO 8601'),
  query('status')
    .optional()
    .isIn(['agendado', 'confirmado', 'cancelado', 'realizado', 'faltou', 'reagendado'])
    .withMessage('Status inválido'),
  query('paciente_id')
    .optional()
    .isUUID()
    .withMessage('ID do paciente deve ser um UUID válido')
];

// Rotas

/**
 * @route GET /api/agendamentos/disponibilidade
 * @desc Obter disponibilidade de horários
 * @access Private
 */
router.get('/disponibilidade', validarDisponibilidade, agendamentoController.getDisponibilidade);

/**
 * @route GET /api/agendamentos
 * @desc Listar agendamentos com filtros
 * @access Private
 */
router.get('/', validarListagem, agendamentoController.listarAgendamentos);

/**
 * @route POST /api/agendamentos
 * @desc Criar novo agendamento
 * @access Private
 */
router.post('/', validarCriarAgendamento, agendamentoController.criarAgendamento);

/**
 * @route PUT /api/agendamentos/:id/reagendar
 * @desc Reagendar um agendamento
 * @access Private
 */
router.put('/:id/reagendar', validarReagendar, agendamentoController.reagendarConsulta);

/**
 * @route PUT /api/agendamentos/:id/cancelar
 * @desc Cancelar um agendamento
 * @access Private
 */
router.put('/:id/cancelar', validarCancelar, agendamentoController.cancelarAgendamento);

/**
 * @route PUT /api/agendamentos/:id/confirmar
 * @desc Confirmar presença em um agendamento
 * @access Private
 */
router.put('/:id/confirmar', 
  param('id').isUUID().withMessage('ID do agendamento deve ser um UUID válido'),
  agendamentoController.confirmarPresenca
);

/**
 * @route GET /api/agendamentos/:id
 * @desc Obter detalhes de um agendamento específico
 * @access Private
 */
router.get('/:id', 
  param('id').isUUID().withMessage('ID do agendamento deve ser um UUID válido'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          a.*,
          u.full_name as paciente_nome,
          u.email as paciente_email,
          u.telefone as paciente_telefone,
          s.nome as servico_nome,
          s.categoria as servico_categoria,
          s.duracao_minutos,
          s.preco_base,
          s.cor_calendario
        FROM agendamentos a
        JOIN usuarios u ON a.paciente_id = u.id
        JOIN servicos s ON a.servico_id = s.id
        WHERE a.id = $1
      `;
      
      const { rows: agendamentos } = await agendamentoController.db.query(query, [id]);
      
      if (agendamentos.length === 0) {
        return res.status(404).json({ erro: 'Agendamento não encontrado' });
      }
      
      res.json(agendamentos[0]);
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/agendamentos/calendario/:mes/:ano
 * @desc Obter agendamentos para o calendário
 * @access Private
 */
router.get('/calendario/:mes/:ano', 
  param('mes').isInt({ min: 1, max: 12 }).withMessage('Mês deve ser entre 1 e 12'),
  param('ano').isInt({ min: 2020, max: 2030 }).withMessage('Ano deve ser entre 2020 e 2030'),
  async (req, res) => {
    try {
      const { mes, ano } = req.params;
      
      // Primeiro e último dia do mês
      const primeiroDia = new Date(ano, mes - 1, 1);
      const ultimoDia = new Date(ano, mes, 0);
      
      const query = `
        SELECT 
          a.id,
          a.data_agendamento as start,
          a.data_fim as end,
          a.status,
          u.full_name as title,
          s.nome as servico,
          s.cor_calendario as color,
          CASE 
            WHEN a.status = 'cancelado' THEN '#dc3545'
            WHEN a.status = 'realizado' THEN '#28a745'
            WHEN a.status = 'confirmado' THEN '#007bff'
            ELSE s.cor_calendario
          END as backgroundColor
        FROM agendamentos a
        JOIN usuarios u ON a.paciente_id = u.id
        JOIN servicos s ON a.servico_id = s.id
        WHERE a.data_agendamento BETWEEN $1 AND $2
        ORDER BY a.data_agendamento
      `;
      
      const { rows: eventos } = await agendamentoController.db.query(query, [
        primeiroDia.toISOString(),
        ultimoDia.toISOString()
      ]);
      
      res.json(eventos);
    } catch (error) {
      console.error('Erro ao buscar eventos do calendário:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/agendamentos/estatisticas/dashboard
 * @desc Obter estatísticas para o dashboard
 * @access Private (Admin/Staff)
 */
router.get('/estatisticas/dashboard', 
  authMiddleware.verificarRole(['admin', 'staff']),
  async (req, res) => {
    try {
      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      const query = `
        SELECT 
          -- Hoje
          COUNT(*) FILTER (WHERE DATE(data_agendamento) = CURRENT_DATE AND status != 'cancelado') as agendamentos_hoje,
          COUNT(*) FILTER (WHERE DATE(data_agendamento) = CURRENT_DATE AND status = 'realizado') as atendimentos_hoje,
          
          -- Semana
          COUNT(*) FILTER (WHERE data_agendamento >= $1 AND status != 'cancelado') as agendamentos_semana,
          COUNT(*) FILTER (WHERE data_agendamento >= $1 AND status = 'realizado') as atendimentos_semana,
          
          -- Mês
          COUNT(*) FILTER (WHERE data_agendamento >= $2 AND status != 'cancelado') as agendamentos_mes,
          COUNT(*) FILTER (WHERE data_agendamento >= $2 AND status = 'realizado') as atendimentos_mes,
          
          -- Status
          COUNT(*) FILTER (WHERE status = 'agendado') as total_agendados,
          COUNT(*) FILTER (WHERE status = 'confirmado') as total_confirmados,
          COUNT(*) FILTER (WHERE status = 'cancelado') as total_cancelados,
          
          -- Faturamento
          COALESCE(SUM(valor_consulta) FILTER (WHERE data_agendamento >= $2 AND status = 'realizado'), 0) as faturamento_mes
        FROM agendamentos
      `;
      
      const { rows: [estatisticas] } = await agendamentoController.db.query(query, [
        inicioSemana.toISOString(),
        inicioMes.toISOString()
      ]);
      
      res.json(estatisticas);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  }
);

module.exports = router;
