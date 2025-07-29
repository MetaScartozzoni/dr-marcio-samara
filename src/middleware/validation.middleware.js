// src/middleware/validation.middleware.js
const { body, param, query, validationResult } = require('express-validator');

class ValidationMiddleware {
  // Middleware para processar erros de validação
  handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        campo: error.path,
        valor: error.value,
        mensagem: error.msg,
        localizacao: error.location
      }));

      return res.status(400).json({
        erro: 'Dados de entrada inválidos',
        detalhes: formattedErrors
      });
    }

    next();
  };

  // Validações para usuário
  validarCadastroUsuario = () => [
    body('email')
      .isEmail()
      .withMessage('Email deve ter um formato válido')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Senha deve ter pelo menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
    
    body('full_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres')
      .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
      .withMessage('Nome deve conter apenas letras e espaços'),
    
    body('phone')
      .optional()
      .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
      .withMessage('Telefone deve estar no formato (11) 99999-9999'),
    
    body('birth_date')
      .optional()
      .isISO8601()
      .withMessage('Data de nascimento deve estar no formato YYYY-MM-DD')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 0 || age > 150) {
          throw new Error('Data de nascimento inválida');
        }
        
        return true;
      }),

    this.handleValidationErrors
  ];

  // Validações para login
  validarLogin = () => [
    body('email')
      .isEmail()
      .withMessage('Email deve ter um formato válido')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Senha é obrigatória'),

    this.handleValidationErrors
  ];

  // Validações para agendamento
  validarAgendamento = () => [
    body('data_hora')
      .isISO8601()
      .withMessage('Data e hora devem estar no formato ISO 8601')
      .custom((value) => {
        const agendamento = new Date(value);
        const agora = new Date();
        const limiteMaximo = new Date();
        limiteMaximo.setMonth(limiteMaximo.getMonth() + 6); // Máximo 6 meses no futuro

        if (agendamento <= agora) {
          throw new Error('Data e hora devem ser no futuro');
        }

        if (agendamento > limiteMaximo) {
          throw new Error('Agendamento não pode ser feito com mais de 6 meses de antecedência');
        }

        // Verificar se é horário comercial (8h às 18h, seg-sex)
        const diaSemana = agendamento.getDay();
        const hora = agendamento.getHours();
        
        if (diaSemana === 0 || diaSemana === 6) {
          throw new Error('Agendamentos apenas de segunda a sexta-feira');
        }

        if (hora < 8 || hora >= 18) {
          throw new Error('Agendamentos apenas entre 8h e 18h');
        }

        return true;
      }),
    
    body('tipo_consulta')
      .isIn(['primeira_consulta', 'retorno', 'procedimento', 'emergencia'])
      .withMessage('Tipo de consulta inválido'),
    
    body('descricao')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Descrição deve ter no máximo 500 caracteres'),
    
    body('observacoes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Observações devem ter no máximo 1000 caracteres'),

    this.handleValidationErrors
  ];

  // Validações para reagendamento
  validarReagendamento = () => [
    param('id')
      .isUUID()
      .withMessage('ID do agendamento deve ser um UUID válido'),
    
    body('nova_data_hora')
      .isISO8601()
      .withMessage('Nova data e hora devem estar no formato ISO 8601')
      .custom((value) => {
        const novaData = new Date(value);
        const agora = new Date();
        
        // Deve ser pelo menos 24h no futuro
        const limite24h = new Date();
        limite24h.setHours(limite24h.getHours() + 24);

        if (novaData <= limite24h) {
          throw new Error('Reagendamento deve ser feito com pelo menos 24h de antecedência');
        }

        return true;
      }),
    
    body('motivo')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Motivo do reagendamento deve ter entre 5 e 200 caracteres'),

    this.handleValidationErrors
  ];

  // Validações para orçamento
  validarOrcamento = () => [
    body('paciente_id')
      .isUUID()
      .withMessage('ID do paciente deve ser um UUID válido'),
    
    body('procedimentos')
      .isArray({ min: 1 })
      .withMessage('Deve haver pelo menos um procedimento'),
    
    body('procedimentos.*.nome')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome do procedimento deve ter entre 2 e 100 caracteres'),
    
    body('procedimentos.*.valor')
      .isFloat({ min: 0 })
      .withMessage('Valor do procedimento deve ser um número positivo'),
    
    body('procedimentos.*.descricao')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('Descrição do procedimento deve ter no máximo 300 caracteres'),
    
    body('observacoes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Observações devem ter no máximo 500 caracteres'),
    
    body('validade_dias')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Validade deve ser entre 1 e 365 dias'),

    this.handleValidationErrors
  ];

  // Validações para atualização de perfil
  validarAtualizacaoPerfil = () => [
    body('full_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    
    body('phone')
      .optional()
      .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
      .withMessage('Telefone deve estar no formato (11) 99999-9999'),
    
    body('birth_date')
      .optional()
      .isISO8601()
      .withMessage('Data de nascimento deve estar no formato YYYY-MM-DD'),
    
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Endereço deve ter no máximo 200 caracteres'),

    this.handleValidationErrors
  ];

  // Validações para mudança de senha
  validarMudancaSenha = () => [
    body('senha_atual')
      .notEmpty()
      .withMessage('Senha atual é obrigatória'),
    
    body('nova_senha')
      .isLength({ min: 8 })
      .withMessage('Nova senha deve ter pelo menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
    
    body('confirmar_senha')
      .custom((value, { req }) => {
        if (value !== req.body.nova_senha) {
          throw new Error('Confirmação de senha não confere');
        }
        return true;
      }),

    this.handleValidationErrors
  ];

  // Validações para parâmetros de ID
  validarId = () => [
    param('id')
      .isUUID()
      .withMessage('ID deve ser um UUID válido'),

    this.handleValidationErrors
  ];

  // Validações para query de paginação
  validarPaginacao = () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número inteiro positivo'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser um número entre 1 e 100'),
    
    query('sortBy')
      .optional()
      .isIn(['created_at', 'updated_at', 'data_hora', 'nome', 'email'])
      .withMessage('Campo de ordenação inválido'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Ordem deve ser "asc" ou "desc"'),

    this.handleValidationErrors
  ];

  // Validações para filtros de data
  validarFiltroData = () => [
    query('data_inicio')
      .optional()
      .isISO8601()
      .withMessage('Data de início deve estar no formato YYYY-MM-DD'),
    
    query('data_fim')
      .optional()
      .isISO8601()
      .withMessage('Data de fim deve estar no formato YYYY-MM-DD')
      .custom((value, { req }) => {
        if (req.query.data_inicio && value) {
          const inicio = new Date(req.query.data_inicio);
          const fim = new Date(value);
          
          if (fim <= inicio) {
            throw new Error('Data de fim deve ser posterior à data de início');
          }
        }
        return true;
      }),

    this.handleValidationErrors
  ];

  // Validação para upload de arquivos
  validarUploadArquivo = (tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf']) => {
    return (req, res, next) => {
      if (!req.file && !req.files) {
        return res.status(400).json({ erro: 'Nenhum arquivo foi enviado' });
      }

      const arquivo = req.file || (req.files && req.files[0]);
      
      if (!tiposPermitidos.includes(arquivo.mimetype)) {
        return res.status(400).json({ 
          erro: 'Tipo de arquivo não permitido',
          tiposPermitidos,
          tipoEnviado: arquivo.mimetype
        });
      }

      // Limite de 5MB
      if (arquivo.size > 5 * 1024 * 1024) {
        return res.status(400).json({ erro: 'Arquivo muito grande. Máximo: 5MB' });
      }

      next();
    };
  };

  // Sanitização de dados de entrada
  sanitizarDados = () => [
    body('*').trim(), // Remove espaços em branco
    body('*').escape() // Escapa caracteres HTML
  ];
}

module.exports = new ValidationMiddleware();
