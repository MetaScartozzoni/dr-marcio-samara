// src/middleware/index.js
const authMiddleware = require('./auth.middleware');
const validationMiddleware = require('./validation.middleware');
const errorMiddleware = require('./error.middleware');
const securityMiddleware = require('./security.middleware');

module.exports = {
  // Authentication & Authorization
  auth: authMiddleware,
  
  // Validation
  validation: validationMiddleware,
  
  // Error Handling
  error: errorMiddleware,
  
  // Security
  security: securityMiddleware,

  // Convenience methods for common middleware combinations
  
  // Middleware padrão para rotas públicas
  publicRoute: [
    securityMiddleware.corsValidation,
    securityMiddleware.helmetConfig(),
    securityMiddleware.generalRateLimit,
    securityMiddleware.sanitizeInput(),
    securityMiddleware.securityHeaders,
    securityMiddleware.validateUserAgent,
    securityMiddleware.sqlInjectionProtection,
    errorMiddleware.requestTimeout(),
    errorMiddleware.validateContentType()
  ],

  // Middleware padrão para rotas protegidas
  protectedRoute: [
    securityMiddleware.corsValidation,
    securityMiddleware.helmetConfig(),
    securityMiddleware.generalRateLimit,
    securityMiddleware.sanitizeInput(),
    securityMiddleware.securityHeaders,
    securityMiddleware.validateUserAgent,
    securityMiddleware.sqlInjectionProtection,
    authMiddleware.verificarToken,
    errorMiddleware.requestTimeout(),
    errorMiddleware.validateContentType()
  ],

  // Middleware para rotas administrativas
  adminRoute: [
    securityMiddleware.corsValidation,
    securityMiddleware.helmetConfig(),
    securityMiddleware.generalRateLimit,
    securityMiddleware.sanitizeInput(),
    securityMiddleware.securityHeaders,
    securityMiddleware.validateUserAgent,
    securityMiddleware.sqlInjectionProtection,
    authMiddleware.verificarToken,
    authMiddleware.verificarRole(['admin']),
    securityMiddleware.logSuspiciousActivity,
    errorMiddleware.requestTimeout(),
    errorMiddleware.validateContentType()
  ],

  // Middleware para autenticação (login/registro)
  authRoute: [
    securityMiddleware.corsValidation,
    securityMiddleware.helmetConfig(),
    securityMiddleware.loginRateLimit,
    securityMiddleware.sanitizeInput(),
    securityMiddleware.securityHeaders,
    securityMiddleware.validateUserAgent,
    securityMiddleware.sqlInjectionProtection,
    securityMiddleware.createUserRateLimit(),
    errorMiddleware.requestTimeout(),
    errorMiddleware.validateContentType()
  ],

  // Middleware para upload de arquivos
  uploadRoute: [
    securityMiddleware.corsValidation,
    securityMiddleware.helmetConfig(),
    securityMiddleware.sanitizeInput(),
    securityMiddleware.securityHeaders,
    authMiddleware.verificarToken,
    securityMiddleware.validatePayloadSize(5 * 1024 * 1024), // 5MB
    errorMiddleware.requestTimeout(60000) // 60 segundos para upload
  ]
};

// Configurar handlers globais de erro
errorMiddleware.setupGlobalHandlers();
