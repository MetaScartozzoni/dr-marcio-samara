// src/middleware/error.middleware.js
const fs = require('fs').promises;
const path = require('path');

class ErrorMiddleware {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.initializeLogDirectory();
  }

  // Inicializar diretório de logs
  async initializeLogDirectory() {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }

  // Middleware principal de tratamento de erros
  handleError = async (error, req, res, next) => {
    // Log do erro
    await this.logError(error, req);

    // Não expor detalhes internos em produção
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Determinar tipo de erro e resposta apropriada
    const errorResponse = this.determineErrorResponse(error, isProduction);
    
    // Responder com o erro formatado
    res.status(errorResponse.status).json(errorResponse);
  };

  // Determinar resposta baseada no tipo de erro
  determineErrorResponse(error, isProduction) {
    // Erros de validação
    if (error.name === 'ValidationError') {
      return {
        status: 400,
        erro: 'Erro de validação',
        detalhes: isProduction ? undefined : error.details,
        codigo: 'VALIDATION_ERROR'
      };
    }

    // Erros de autenticação JWT
    if (error.name === 'JsonWebTokenError') {
      return {
        status: 401,
        erro: 'Token de autenticação inválido',
        codigo: 'INVALID_TOKEN'
      };
    }

    if (error.name === 'TokenExpiredError') {
      return {
        status: 401,
        erro: 'Token de autenticação expirado',
        codigo: 'EXPIRED_TOKEN'
      };
    }

    // Erros de banco de dados PostgreSQL
    if (error.code) {
      return this.handleDatabaseError(error, isProduction);
    }

    // Erros de não encontrado
    if (error.status === 404 || error.message.includes('não encontrado')) {
      return {
        status: 404,
        erro: 'Recurso não encontrado',
        codigo: 'NOT_FOUND'
      };
    }

    // Erros de permissão
    if (error.status === 403 || error.message.includes('permissão')) {
      return {
        status: 403,
        erro: 'Acesso negado',
        codigo: 'FORBIDDEN'
      };
    }

    // Erros de rate limiting
    if (error.status === 429) {
      return {
        status: 429,
        erro: 'Muitas requisições',
        codigo: 'RATE_LIMIT_EXCEEDED',
        tentarNovamenteEm: error.retryAfter
      };
    }

    // Erro genérico de servidor
    return {
      status: error.status || 500,
      erro: isProduction ? 'Erro interno do servidor' : error.message,
      codigo: 'INTERNAL_SERVER_ERROR',
      stack: isProduction ? undefined : error.stack
    };
  }

  // Tratar erros específicos do PostgreSQL
  handleDatabaseError(error, isProduction) {
    switch (error.code) {
      case '23505': // Unique violation
        return {
          status: 409,
          erro: 'Dados já existem no sistema',
          codigo: 'DUPLICATE_ENTRY',
          campo: this.extractFieldFromError(error.detail)
        };

      case '23503': // Foreign key violation
        return {
          status: 400,
          erro: 'Referência inválida',
          codigo: 'FOREIGN_KEY_VIOLATION'
        };

      case '23502': // Not null violation
        return {
          status: 400,
          erro: 'Campo obrigatório não informado',
          codigo: 'REQUIRED_FIELD_MISSING',
          campo: error.column
        };

      case '23514': // Check constraint violation
        return {
          status: 400,
          erro: 'Valor inválido para o campo',
          codigo: 'CHECK_CONSTRAINT_VIOLATION'
        };

      case '42P01': // Undefined table
        return {
          status: 500,
          erro: isProduction ? 'Erro interno do servidor' : 'Tabela não encontrada',
          codigo: 'DATABASE_SCHEMA_ERROR'
        };

      case '42703': // Undefined column
        return {
          status: 500,
          erro: isProduction ? 'Erro interno do servidor' : 'Campo não encontrado',
          codigo: 'DATABASE_SCHEMA_ERROR'
        };

      case '08003': // Connection does not exist
      case '08006': // Connection failure
        return {
          status: 503,
          erro: 'Serviço temporariamente indisponível',
          codigo: 'DATABASE_CONNECTION_ERROR'
        };

      default:
        return {
          status: 500,
          erro: isProduction ? 'Erro interno do servidor' : error.message,
          codigo: 'DATABASE_ERROR'
        };
    }
  }

  // Extrair nome do campo de erro de violação unique
  extractFieldFromError(detail) {
    if (!detail) return undefined;
    
    const match = detail.match(/Key \(([^)]+)\)/);
    return match ? match[1] : undefined;
  }

  // Middleware para rotas não encontradas
  handleNotFound = (req, res, next) => {
    const error = new Error(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
    error.status = 404;
    next(error);
  };

  // Log de erros
  async logError(error, req) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      body: this.sanitizeLogData(req.body),
      params: req.params,
      query: req.query
    };

    try {
      const logFile = path.join(this.logDir, `error-${timestamp.split('T')[0]}.log`);
      const logLine = JSON.stringify(logData) + '\n';
      
      await fs.appendFile(logFile, logLine);
    } catch (logError) {
      console.error('Erro ao escrever log:', logError);
    }

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.error('\n=== ERRO ===');
      console.error('Timestamp:', timestamp);
      console.error('URL:', `${req.method} ${req.originalUrl}`);
      console.error('Usuário:', req.user?.id || 'Não autenticado');
      console.error('Erro:', error.message);
      console.error('Stack:', error.stack);
      console.error('=============\n');
    }
  }

  // Sanitizar dados sensíveis dos logs
  sanitizeLogData(data) {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = ['password', 'senha', 'token', 'secret', 'cpf', 'rg'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  // Middleware para capturar exceções não tratadas
  handleUncaughtException = (error) => {
    console.error('Exceção não tratada:', error);
    
    // Log crítico
    this.logCriticalError(error);
    
    // Graceful shutdown
    process.exit(1);
  };

  // Middleware para rejeições não tratadas de Promise
  handleUnhandledRejection = (reason, promise) => {
    console.error('Promise rejeitada não tratada:', reason);
    
    // Log crítico
    this.logCriticalError(reason);
    
    // Graceful shutdown
    process.exit(1);
  };

  // Log de erros críticos
  async logCriticalError(error) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      type: 'CRITICAL',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };

    try {
      const logFile = path.join(this.logDir, 'critical.log');
      const logLine = JSON.stringify(logData) + '\n';
      
      await fs.appendFile(logFile, logLine);
    } catch (logError) {
      console.error('Erro ao escrever log crítico:', logError);
    }
  }

  // Middleware de timeout para requisições
  requestTimeout = (timeoutMs = 30000) => {
    return (req, res, next) => {
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(408).json({
            erro: 'Tempo limite da requisição excedido',
            codigo: 'REQUEST_TIMEOUT'
          });
        }
      }, timeoutMs);

      res.on('finish', () => {
        clearTimeout(timeout);
      });

      next();
    };
  };

  // Middleware para validar Content-Type
  validateContentType = (allowedTypes = ['application/json']) => {
    return (req, res, next) => {
      if (req.method === 'GET' || req.method === 'DELETE') {
        return next();
      }

      const contentType = req.get('Content-Type');
      
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(415).json({
          erro: 'Tipo de conteúdo não suportado',
          codigo: 'UNSUPPORTED_MEDIA_TYPE',
          tiposAceitos: allowedTypes
        });
      }

      next();
    };
  };

  // Configurar handlers globais
  setupGlobalHandlers() {
    process.on('uncaughtException', this.handleUncaughtException);
    process.on('unhandledRejection', this.handleUnhandledRejection);
  }
}

module.exports = new ErrorMiddleware();
