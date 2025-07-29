// src/routes/lgpd.routes.js
const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const lgpdController = require('../controllers/lgpd.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Validações personalizadas
const validarTipoConsentimento = body('tipo_consentimento')
  .isIn([
    'PROCESSAMENTO_DADOS',
    'COMUNICACAO_MARKETING', 
    'COOKIES',
    'COMPARTILHAMENTO_DADOS',
    'DADOS_SENSIVEIS',
    'PESQUISA_SATISFACAO'
  ])
  .withMessage('Tipo de consentimento inválido');

const validarFinalidade = body('finalidade')
  .isLength({ min: 10, max: 500 })
  .withMessage('Finalidade deve ter entre 10 e 500 caracteres');

const validarMotivo = body('motivo')
  .isLength({ min: 10, max: 1000 })
  .withMessage('Motivo deve ter entre 10 e 1000 caracteres');

// Middleware para validar datas
const validarPeriodoRelatorio = [
  query('data_inicio')
    .isISO8601()
    .withMessage('Data de início deve estar no formato ISO8601'),
  query('data_fim')
    .isISO8601()
    .withMessage('Data de fim deve estar no formato ISO8601')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.query.data_inicio)) {
        throw new Error('Data de fim deve ser posterior à data de início');
      }
      return true;
    })
];

// ========================================
// ROTAS PÚBLICAS (sem autenticação)
// ========================================

// Política de privacidade pública
router.get('/politica-privacidade', lgpdController.politicaPrivacidade);

// Gerenciar cookies (pode ser usado sem login)
router.post('/cookies', [
  body('aceitar_essenciais').isBoolean(),
  body('aceitar_funcionais').isBoolean(),
  body('aceitar_analiticos').isBoolean()
], lgpdController.gerenciarCookies);

// ========================================
// ROTAS PROTEGIDAS (requer autenticação)
// ========================================

// Middleware de autenticação para rotas protegidas
router.use(authMiddleware);

// Registrar consentimento
router.post('/consentimento', [
  validarTipoConsentimento,
  validarFinalidade
], lgpdController.registrarConsentimento);

// Revogar consentimento
router.delete('/consentimento', [
  validarTipoConsentimento,
  validarMotivo
], lgpdController.revogarConsentimento);

// Listar consentimentos do usuário logado
router.get('/consentimentos', lgpdController.listarConsentimentos);

// Verificar consentimento específico
router.get('/consentimento/:tipo_consentimento', [
  param('tipo_consentimento')
    .isIn([
      'PROCESSAMENTO_DADOS',
      'COMUNICACAO_MARKETING', 
      'COOKIES',
      'COMPARTILHAMENTO_DADOS',
      'DADOS_SENSIVEIS',
      'PESQUISA_SATISFACAO'
    ])
    .withMessage('Tipo de consentimento inválido')
], lgpdController.verificarConsentimento);

// Exportar dados pessoais (Portabilidade - Art. 20)
router.get('/exportar-dados', [
  query('formato')
    .optional()
    .isIn(['JSON', 'CSV', 'XML'])
    .withMessage('Formato deve ser JSON, CSV ou XML')
], lgpdController.exportarDados);

// Solicitar exclusão de dados (Direito ao Esquecimento - Art. 17)
router.delete('/excluir-dados', [
  validarMotivo,
  body('confirmar_exclusao')
    .isBoolean()
    .custom((value) => {
      if (value !== true) {
        throw new Error('É necessário confirmar a exclusão');
      }
      return true;
    })
], lgpdController.solicitarExclusao);

// ========================================
// ROTAS ADMINISTRATIVAS
// ========================================

// Relatório de conformidade LGPD (apenas admins)
router.get('/relatorio-conformidade', 
  validarPeriodoRelatorio,
  lgpdController.relatorioConformidade
);

// Middleware de validação de erros
router.use((error, req, res, next) => {
  if (error.type === 'validation') {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: error.details
    });
  }
  next(error);
});

module.exports = router;
