// src/routes/orcamento.routes.js
const express = require('express');
const router = express.Router();
const orcamentoController = require('../controllers/orcamento.controller');
const { auth, validation } = require('../middleware');

// Aplicar middleware de autenticação em todas as rotas
router.use(auth.verificarToken);

// Validações customizadas para orçamentos
const validarCriacaoOrcamento = [
  validation.validarOrcamento(),
  validation.handleValidationErrors
];

const validarIdOrcamento = [
  validation.validarId(),
  validation.handleValidationErrors
];

const validarPaginacao = [
  validation.validarPaginacao(),
  validation.handleValidationErrors
];

const validarFiltroData = [
  validation.validarFiltroData(),
  validation.handleValidationErrors
];

// =============================================
// ROTAS PÚBLICAS (COM TOKEN DE ACEITE)
// =============================================

// Aceitar orçamento (via link enviado por email/SMS)
router.put('/aceitar/:id', validarIdOrcamento, orcamentoController.aceitarOrcamento);

// =============================================
// ROTAS PROTEGIDAS (REQUER AUTENTICAÇÃO)
// =============================================

// Criar novo orçamento (apenas staff/admin)
router.post('/', 
  auth.verificarRole(['admin', 'staff']),
  validarCriacaoOrcamento,
  orcamentoController.criarOrcamento
);

// Listar orçamentos (com filtros e paginação)
router.get('/', 
  validarPaginacao,
  validarFiltroData,
  orcamentoController.listarOrcamentos
);

// Buscar orçamento específico por ID
router.get('/:id', 
  validarIdOrcamento,
  orcamentoController.buscarOrcamento
);

// Download do PDF do orçamento
router.get('/:id/pdf', 
  validarIdOrcamento,
  orcamentoController.downloadPDF
);

// Duplicar orçamento (apenas staff/admin)
router.post('/:id/duplicar', 
  auth.verificarRole(['admin', 'staff']),
  validarIdOrcamento,
  orcamentoController.duplicarOrcamento
);

// Reenviar orçamento (apenas staff/admin)
router.post('/:id/reenviar', 
  auth.verificarRole(['admin', 'staff']),
  validarIdOrcamento,
  orcamentoController.reenviarOrcamento
);

// Rejeitar orçamento
router.put('/:id/rejeitar', 
  validarIdOrcamento,
  orcamentoController.rejeitarOrcamento
);

// Atualizar status do orçamento (apenas staff/admin)
router.patch('/:id/status', 
  auth.verificarRole(['admin', 'staff']),
  validarIdOrcamento,
  orcamentoController.atualizarStatus
);

// =============================================
// ROTAS DE RELATÓRIOS E ESTATÍSTICAS
// =============================================

// Gerar relatório de orçamentos (apenas staff/admin)
router.get('/relatorios/geral', 
  auth.verificarRole(['admin', 'staff']),
  validarFiltroData,
  orcamentoController.gerarRelatorio
);

// Estatísticas do dashboard (apenas staff/admin)
router.get('/estatisticas/dashboard', 
  auth.verificarRole(['admin', 'staff']),
  orcamentoController.estatisticas
);

// =============================================
// ROTAS ESPECÍFICAS POR USUÁRIO
// =============================================

// Meus orçamentos (apenas para pacientes)
router.get('/meus/orcamentos', 
  auth.verificarRole(['patient']),
  validarPaginacao,
  (req, res, next) => {
    // Garantir que só veja os próprios orçamentos
    req.query.paciente_id = req.user.id;
    next();
  },
  orcamentoController.listarOrcamentos
);

// Estatísticas pessoais do paciente
router.get('/meus/estatisticas', 
  auth.verificarRole(['patient']),
  (req, res, next) => {
    req.query.usuario_id = req.user.id;
    next();
  },
  orcamentoController.estatisticas
);

// =============================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// =============================================

// Handler de erros específico para orçamentos
router.use((error, req, res, next) => {
  console.error('Erro nas rotas de orçamento:', error);

  // Erros de validação
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: error.details,
      codigo: 'VALIDATION_ERROR'
    });
  }

  // Erros de PDF
  if (error.message.includes('PDF') || error.message.includes('puppeteer')) {
    return res.status(500).json({
      erro: 'Erro na geração do PDF',
      message: 'Tente novamente em alguns minutos',
      codigo: 'PDF_GENERATION_ERROR'
    });
  }

  // Erros de upload
  if (error.message.includes('S3') || error.message.includes('upload')) {
    return res.status(500).json({
      erro: 'Erro no upload do arquivo',
      message: 'Tente novamente em alguns minutos',
      codigo: 'UPLOAD_ERROR'
    });
  }

  // Erro padrão
  res.status(500).json({
    erro: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'production' ? 'Erro interno' : error.message,
    codigo: 'INTERNAL_SERVER_ERROR'
  });
});

module.exports = router;
