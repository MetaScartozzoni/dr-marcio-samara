// src/middleware/security.middleware.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

class SecurityMiddleware {
  // Configuração de helmet para segurança básica
  helmetConfig = () => {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.twilio.com"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  };

  // Rate limiting geral
  generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: {
      erro: 'Muitas requisições do mesmo IP',
      codigo: 'RATE_LIMIT_EXCEEDED',
      tentarNovamenteEm: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        erro: 'Muitas requisições do mesmo IP',
        codigo: 'RATE_LIMIT_EXCEEDED',
        tentarNovamenteEm: '15 minutos'
      });
    }
  });

  // Rate limiting específico para login
  loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas de login por IP
    skipSuccessfulRequests: true,
    message: {
      erro: 'Muitas tentativas de login falharam',
      codigo: 'LOGIN_RATE_LIMIT',
      tentarNovamenteEm: '15 minutos'
    }
  });

  // Rate limiting para registro
  registerRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 registros por IP por hora
    message: {
      erro: 'Muitas tentativas de registro',
      codigo: 'REGISTER_RATE_LIMIT',
      tentarNovamenteEm: '1 hora'
    }
  });

  // Rate limiting para reset de senha
  passwordResetRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 tentativas por IP por hora
    message: {
      erro: 'Muitas solicitações de reset de senha',
      codigo: 'PASSWORD_RESET_RATE_LIMIT',
      tentarNovamenteEm: '1 hora'
    }
  });

  // Slow down para requisições suspeitas
  speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutos
    delayAfter: 50, // depois de 50 requests, começar a atrasar
    delayMs: 500, // atrasar 500ms por request adicional
    maxDelayMs: 20000 // máximo 20 segundos de atraso
  });

  // Sanitização de dados de entrada
  sanitizeInput = () => {
    return [
      mongoSanitize(), // Remove operadores MongoDB/NoSQL
      this.xssProtection
    ];
  };

  // Proteção XSS customizada
  xssProtection = (req, res, next) => {
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }
    
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }
    
    if (req.params) {
      req.params = this.sanitizeObject(req.params);
    }

    next();
  };

  // Sanitizar objeto recursivamente
  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? xss(obj) : obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      }
    }

    return sanitized;
  }

  // Validação de origem da requisição
  corsValidation = (req, res, next) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://portal-dr-marcio.appspot.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    const origin = req.get('Origin');
    
    if (!origin || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  };

  // Validação de User-Agent
  validateUserAgent = (req, res, next) => {
    const userAgent = req.get('User-Agent');
    
    if (!userAgent) {
      return res.status(400).json({
        erro: 'User-Agent é obrigatório',
        codigo: 'MISSING_USER_AGENT'
      });
    }

    // Bloquear user agents suspeitos
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /python/i,
      /bot/i,
      /spider/i,
      /crawler/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        erro: 'Acesso negado',
        codigo: 'SUSPICIOUS_USER_AGENT'
      });
    }

    next();
  };

  // Validação de tamanho do payload
  validatePayloadSize = (maxSize = 1024 * 1024) => { // 1MB padrão
    return (req, res, next) => {
      const contentLength = parseInt(req.get('Content-Length') || '0');
      
      if (contentLength > maxSize) {
        return res.status(413).json({
          erro: 'Payload muito grande',
          codigo: 'PAYLOAD_TOO_LARGE',
          tamanhoMaximo: `${maxSize / 1024 / 1024}MB`
        });
      }

      next();
    };
  };

  // Proteção contra ataques de força bruta por usuário
  createUserRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();

    return (req, res, next) => {
      const identifier = req.user?.id || req.ip;
      const now = Date.now();
      const windowStart = now - windowMs;

      if (!attempts.has(identifier)) {
        attempts.set(identifier, []);
      }

      const userAttempts = attempts.get(identifier);
      
      // Remove tentativas antigas
      const recentAttempts = userAttempts.filter(timestamp => timestamp > windowStart);
      attempts.set(identifier, recentAttempts);

      if (recentAttempts.length >= maxAttempts) {
        return res.status(429).json({
          erro: 'Muitas tentativas de acesso',
          codigo: 'USER_RATE_LIMIT',
          tentarNovamenteEm: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
        });
      }

      // Registrar tentativa em caso de falha
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          recentAttempts.push(now);
          attempts.set(identifier, recentAttempts);
        }
      });

      next();
    };
  };

  // Proteção contra SQL Injection
  sqlInjectionProtection = (req, res, next) => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(;|\-\-|\/\*|\*\/)/,
      /(\b(OR|AND)\b.*[=<>])/i,
      /('|(\\')|(;)|(\-\-)|(\\\'))/
    ];

    const checkForSQLInjection = (value) => {
      if (typeof value === 'string') {
        return sqlPatterns.some(pattern => pattern.test(value));
      }
      return false;
    };

    const hasSQLInjection = (obj) => {
      for (const key in obj) {
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null) {
          if (hasSQLInjection(value)) return true;
        } else if (checkForSQLInjection(value) || checkForSQLInjection(key)) {
          return true;
        }
      }
      return false;
    };

    if (hasSQLInjection(req.body) || hasSQLInjection(req.query) || hasSQLInjection(req.params)) {
      return res.status(400).json({
        erro: 'Dados de entrada inválidos',
        codigo: 'INVALID_INPUT'
      });
    }

    next();
  };

  // Headers de segurança customizados
  securityHeaders = (req, res, next) => {
    // Prevenir clickjacking
    res.header('X-Frame-Options', 'DENY');
    
    // Prevenir MIME sniffing
    res.header('X-Content-Type-Options', 'nosniff');
    
    // Controle de referrer
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Política de permissões
    res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Cache control para dados sensíveis
    if (req.url.includes('/api/')) {
      res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.header('Pragma', 'no-cache');
      res.header('Expires', '0');
    }

    next();
  };

  // Middleware para logging de requisições suspeitas
  logSuspiciousActivity = (req, res, next) => {
    const suspiciousIndicators = [
      req.get('User-Agent')?.includes('bot'),
      req.url.includes('..'),
      req.url.includes('<script>'),
      Object.keys(req.query).length > 20,
      JSON.stringify(req.body).length > 50000
    ];

    if (suspiciousIndicators.some(Boolean)) {
      console.warn('Atividade suspeita detectada:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };

  // Validação de token CSRF simples
  csrfProtection = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const token = req.get('X-CSRF-Token') || req.body.csrfToken;
    const sessionToken = req.session?.csrfToken;

    if (!token || token !== sessionToken) {
      return res.status(403).json({
        erro: 'Token CSRF inválido',
        codigo: 'INVALID_CSRF_TOKEN'
      });
    }

    next();
  };
}

module.exports = new SecurityMiddleware();
