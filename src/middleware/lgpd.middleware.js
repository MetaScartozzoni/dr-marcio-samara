// src/middleware/lgpd.middleware.js
const lgpdService = require('../services/lgpd.service');

class LGPDMiddleware {
  
  // Middleware para logar acessos
  static logAccess() {
    return async (req, res, next) => {
      try {
        // Capturar informações do acesso
        const accessInfo = {
          usuario_id: req.user ? req.user.id : null,
          email: req.user ? req.user.email : null,
          ip_origem: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          acao: `${req.method} ${req.path}`,
          recurso_acessado: req.originalUrl,
          sucesso: true // Será atualizado se houver erro
        };

        // Log assíncrono para não bloquear a request
        setImmediate(async () => {
          try {
            await lgpdService.db.query(`
              INSERT INTO logs_acesso (
                usuario_id, email, ip_origem, user_agent, 
                acao, recurso_acessado, sucesso, detalhes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              accessInfo.usuario_id,
              accessInfo.email,
              accessInfo.ip_origem,
              accessInfo.user_agent,
              accessInfo.acao,
              accessInfo.recurso_acessado,
              accessInfo.sucesso,
              JSON.stringify({ 
                headers: req.headers,
                query: req.query,
                timestamp: new Date().toISOString()
              })
            ]);
          } catch (logError) {
            console.error('Erro ao registrar log de acesso:', logError);
          }
        });

        next();
      } catch (error) {
        console.error('Erro no middleware de log:', error);
        next();
      }
    };
  }

  // Middleware para verificar consentimento antes de processar dados sensíveis
  static requireConsent(tipoConsentimento) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            erro: 'Usuário não autenticado',
            codigo_lgpd: 'AUTH_REQUIRED'
          });
        }

        const temConsentimento = await lgpdService.temConsentimento(
          req.user.id,
          tipoConsentimento
        );

        if (!temConsentimento) {
          await lgpdService.logAcaoLGPD(req.user.id, 'ACESSO_NEGADO_SEM_CONSENTIMENTO', {
            tipo_consentimento: tipoConsentimento,
            recurso: req.originalUrl,
            ip: req.ip
          });

          return res.status(403).json({
            erro: 'Consentimento necessário',
            codigo_lgpd: 'CONSENT_REQUIRED',
            tipo_consentimento: tipoConsentimento,
            mensagem: `É necessário consentimento para ${tipoConsentimento} para acessar este recurso`,
            acao_requerida: {
              endpoint: '/api/lgpd/consentimento',
              metodo: 'POST',
              body: {
                tipo_consentimento: tipoConsentimento,
                finalidade: 'Necessário para utilizar esta funcionalidade'
              }
            }
          });
        }

        // Log do acesso autorizado
        await lgpdService.logAcaoLGPD(req.user.id, 'ACESSO_AUTORIZADO', {
          tipo_consentimento: tipoConsentimento,
          recurso: req.originalUrl
        });

        next();
      } catch (error) {
        console.error('Erro ao verificar consentimento:', error);
        res.status(500).json({
          erro: 'Erro interno do servidor',
          codigo_lgpd: 'CONSENT_CHECK_ERROR'
        });
      }
    };
  }

  // Middleware para verificar se dados podem ser coletados
  static validateDataCollection() {
    return async (req, res, next) => {
      try {
        // Verificar se há dados sensíveis na requisição
        const dadosSensiveis = this.identificarDadosSensiveis(req.body);
        
        if (dadosSensiveis.length > 0 && req.user) {
          const temConsentimentoDados = await lgpdService.temConsentimento(
            req.user.id,
            'DADOS_SENSIVEIS'
          );

          if (!temConsentimentoDados) {
            return res.status(403).json({
              erro: 'Consentimento para dados sensíveis necessário',
              codigo_lgpd: 'SENSITIVE_DATA_CONSENT_REQUIRED',
              dados_sensiveis_detectados: dadosSensiveis,
              orientacao: 'Registre consentimento para DADOS_SENSIVEIS antes de prosseguir'
            });
          }

          // Log da coleta de dados sensíveis
          await lgpdService.logAcaoLGPD(req.user.id, 'DADOS_SENSIVEIS_COLETADOS', {
            tipos_dados: dadosSensiveis,
            endpoint: req.originalUrl
          });
        }

        next();
      } catch (error) {
        console.error('Erro na validação de coleta de dados:', error);
        next();
      }
    };
  }

  // Middleware para anonimizar dados em logs
  static sanitizeResponse() {
    return (req, res, next) => {
      const originalJson = res.json;

      res.json = function(data) {
        // Anonimizar dados sensíveis na resposta se necessário
        if (data && typeof data === 'object') {
          const dadosLimpos = LGPDMiddleware.anonimizarResposta(data);
          return originalJson.call(this, dadosLimpos);
        }
        return originalJson.call(this, data);
      };

      next();
    };
  }

  // Middleware para controle de cookies
  static cookieConsent() {
    return async (req, res, next) => {
      try {
        // Verificar preferências de cookies do usuário (com fallback seguro)
        const cookies = req.cookies || {};
        const cookiePrefs = {
          essenciais: cookies.cookie_essenciais !== 'false',
          funcionais: cookies.cookie_funcionais === 'true',
          analiticos: cookies.cookie_analiticos === 'true'
        };

        // Adicionar preferências ao request para uso posterior
        req.cookiePreferences = cookiePrefs;

        // Se não há preferências definidas, retornar aviso (com fallback seguro)
        if (!cookies.cookie_essenciais && req.path !== '/api/lgpd/cookies') {
          res.setHeader('X-Cookie-Consent-Required', 'true');
        }

        next();
      } catch (error) {
        console.error('Erro no middleware de cookies:', error);
        next();
      }
    };
  }

  // Middleware para rate limiting específico por usuário (prevenção de abuso)
  static rateLimitByUser() {
    const userRequests = new Map();

    return (req, res, next) => {
      if (!req.user) return next();

      const userId = req.user.id;
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutos
      const maxRequests = 100; // máximo de requests por usuário

      if (!userRequests.has(userId)) {
        userRequests.set(userId, []);
      }

      const userRequestTimes = userRequests.get(userId);
      
      // Remover requests antigas
      const validRequests = userRequestTimes.filter(
        timestamp => now - timestamp < windowMs
      );

      if (validRequests.length >= maxRequests) {
        // Log de tentativa de abuso
        lgpdService.logAcaoLGPD(userId, 'TENTATIVA_ABUSO_DETECTADA', {
          requests_em_janela: validRequests.length,
          ip: req.ip,
          endpoint: req.originalUrl
        });

        return res.status(429).json({
          erro: 'Muitas requisições',
          codigo_lgpd: 'RATE_LIMIT_EXCEEDED',
          mensagem: 'Limite de requisições por usuário excedido',
          tente_novamente_em: Math.ceil(windowMs / 1000) + ' segundos'
        });
      }

      // Adicionar request atual
      validRequests.push(now);
      userRequests.set(userId, validRequests);

      next();
    };
  }

  // Middleware para detectar tentativas de acesso não autorizado
  static detectUnauthorizedAccess() {
    const suspiciousActivities = new Map();

    return async (req, res, next) => {
      try {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minuto
        const maxFailures = 5;

        // Interceptar respostas 401/403
        const originalStatus = res.status;
        res.status = function(code) {
          if (code === 401 || code === 403) {
            if (!suspiciousActivities.has(ip)) {
              suspiciousActivities.set(ip, []);
            }

            const activities = suspiciousActivities.get(ip);
            activities.push(now);

            // Manter apenas atividades recentes
            const recentActivities = activities.filter(
              timestamp => now - timestamp < windowMs
            );
            suspiciousActivities.set(ip, recentActivities);

            // Se muitas tentativas falharam, logar como suspeita
            if (recentActivities.length >= maxFailures) {
              lgpdService.logAcaoLGPD(null, 'ATIVIDADE_SUSPEITA', {
                ip: ip,
                tentativas_falhas: recentActivities.length,
                endpoints_acessados: req.originalUrl,
                user_agent: req.get('User-Agent')
              });
            }
          }
          return originalStatus.call(this, code);
        };

        next();
      } catch (error) {
        console.error('Erro na detecção de acesso não autorizado:', error);
        next();
      }
    };
  }

  // Métodos utilitários
  static identificarDadosSensiveis(data) {
    const dadosSensiveis = [];
    const camposSensiveis = [
      'cpf', 'rg', 'password', 'senha', 'telefone', 'endereco',
      'diagnostico', 'prescricao', 'observacoes_medicas', 'historico_medico'
    ];

    if (typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (camposSensiveis.some(campo => 
          key.toLowerCase().includes(campo.toLowerCase())
        )) {
          dadosSensiveis.push(key);
        }
      }
    }

    return dadosSensiveis;
  }

  static anonimizarResposta(data) {
    // Implementar lógica de anonimização conforme necessário
    if (data.password_hash) {
      delete data.password_hash;
    }
    
    if (data.telefone && typeof data.telefone === 'string') {
      data.telefone = data.telefone.replace(/(\d{2})(\d{5})(\d{4})/, '$1*****$3');
    }

    return data;
  }

  // Middleware para aplicar headers de privacidade
  static privacyHeaders() {
    return (req, res, next) => {
      // Headers relacionados à privacidade
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('X-Privacy-Policy', '/api/lgpd/politica-privacidade');
      
      // Header indicando conformidade LGPD
      res.setHeader('X-LGPD-Compliant', 'true');
      res.setHeader('X-Data-Protection', 'Lei 13.709/2018');

      next();
    };
  }
}

module.exports = LGPDMiddleware;
