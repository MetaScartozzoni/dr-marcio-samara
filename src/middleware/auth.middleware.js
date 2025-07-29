// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

class AuthMiddleware {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  // Verificar token JWT
  verificarToken = async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '') || 
                   req.cookies?.token ||
                   req.session?.token;

      if (!token) {
        return res.status(401).json({ erro: 'Token de acesso requerido' });
      }

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      // Buscar usuário no banco
      const userQuery = `
        SELECT id, email, full_name, role, status, email_verified
        FROM usuarios 
        WHERE id = $1 AND status = 'ativo'
      `;
      
      const { rows: usuarios } = await this.db.query(userQuery, [decoded.userId]);
      
      if (usuarios.length === 0) {
        return res.status(401).json({ erro: 'Usuário não encontrado ou inativo' });
      }

      const usuario = usuarios[0];
      
      // Verificar se email foi verificado para certas ações
      if (!usuario.email_verified && req.path !== '/verificar-email') {
        return res.status(403).json({ erro: 'Email não verificado' });
      }

      // Adicionar usuário à requisição
      req.user = {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.full_name,
        role: usuario.role,
        emailVerificado: usuario.email_verified
      };

      // Atualizar última atividade
      await this.atualizarUltimaAtividade(usuario.id);

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ erro: 'Token inválido' });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ erro: 'Token expirado' });
      }

      console.error('Erro na verificação do token:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  };

  // Verificar role do usuário
  verificarRole = (rolesPermitidas) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ erro: 'Usuário não autenticado' });
      }

      if (!rolesPermitidas.includes(req.user.role)) {
        return res.status(403).json({ 
          erro: 'Acesso negado',
          roleNecessaria: rolesPermitidas,
          roleAtual: req.user.role
        });
      }

      next();
    };
  };

  // Verificar se é o próprio usuário ou admin
  verificarProprioUsuarioOuAdmin = (req, res, next) => {
    const { id } = req.params;
    
    if (req.user.id === id || req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({ erro: 'Acesso negado: você só pode acessar seus próprios dados' });
  };

  // Middleware opcional (não retorna erro se não autenticado)
  verificarTokenOpcional = async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '') || 
                   req.cookies?.token ||
                   req.session?.token;

      if (!token) {
        return next(); // Continua sem usuário
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      const userQuery = `
        SELECT id, email, full_name, role, status, email_verified
        FROM usuarios 
        WHERE id = $1 AND status = 'ativo'
      `;
      
      const { rows: usuarios } = await this.db.query(userQuery, [decoded.userId]);
      
      if (usuarios.length > 0) {
        const usuario = usuarios[0];
        req.user = {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.full_name,
          role: usuario.role,
          emailVerificado: usuario.email_verified
        };

        await this.atualizarUltimaAtividade(usuario.id);
      }

      next();
    } catch (error) {
      // Em caso de erro, continua sem usuário
      next();
    }
  };

  // Rate limiting por usuário
  rateLimitPorUsuario = (limitePorMinuto = 60) => {
    const usuarios = new Map();

    return (req, res, next) => {
      const userId = req.user?.id || req.ip;
      const agora = Date.now();
      const umMinutoAtras = agora - 60000;

      if (!usuarios.has(userId)) {
        usuarios.set(userId, []);
      }

      const requisicoes = usuarios.get(userId);
      
      // Remove requisições antigas (mais de 1 minuto)
      const requisicoesRecentes = requisicoes.filter(tempo => tempo > umMinutoAtras);
      usuarios.set(userId, requisicoesRecentes);

      if (requisicoesRecentes.length >= limitePorMinuto) {
        return res.status(429).json({ 
          erro: 'Muitas requisições',
          tentarNovamenteEm: Math.ceil((requisicoesRecentes[0] + 60000 - agora) / 1000)
        });
      }

      requisicoesRecentes.push(agora);
      usuarios.set(userId, requisicoesRecentes);

      next();
    };
  };

  // Gerar token JWT
  gerarToken = (usuario) => {
    const payload = {
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret',
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'portal-dr-marcio',
        audience: usuario.email
      }
    );
  };

  // Gerar refresh token
  gerarRefreshToken = (usuario) => {
    const payload = {
      userId: usuario.id,
      type: 'refresh'
    };

    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
      { 
        expiresIn: '7d',
        issuer: 'portal-dr-marcio'
      }
    );
  };

  // Verificar refresh token
  verificarRefreshToken = async (req, res, next) => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ erro: 'Refresh token requerido' });
      }

      const decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret'
      );

      if (decoded.type !== 'refresh') {
        return res.status(401).json({ erro: 'Token inválido' });
      }

      const userQuery = `
        SELECT id, email, full_name, role, status 
        FROM usuarios 
        WHERE id = $1 AND status = 'ativo'
      `;
      
      const { rows: usuarios } = await this.db.query(userQuery, [decoded.userId]);
      
      if (usuarios.length === 0) {
        return res.status(401).json({ erro: 'Usuário não encontrado' });
      }

      req.user = usuarios[0];
      next();
    } catch (error) {
      return res.status(401).json({ erro: 'Refresh token inválido' });
    }
  };

  // Atualizar última atividade do usuário
  async atualizarUltimaAtividade(userId) {
    try {
      await this.db.query(
        'UPDATE usuarios SET ultima_atividade = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Erro ao atualizar última atividade:', error);
    }
  }

  // Middleware para logout (blacklist de token)
  logout = async (req, res, next) => {
    try {
      // Aqui você pode implementar uma blacklist de tokens
      // Por exemplo, salvando o token em Redis com TTL
      
      // Por simplicidade, vamos apenas limpar cookies
      res.clearCookie('token');
      res.clearCookie('refreshToken');
      
      res.json({ sucesso: true, message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  };

  // Verificar permissões específicas
  verificarPermissao = (permissao) => {
    return (req, res, next) => {
      const permissoesPorRole = {
        admin: ['*'], // Admin tem todas as permissões
        staff: [
          'agendamentos.listar',
          'agendamentos.criar',
          'agendamentos.editar',
          'agendamentos.cancelar',
          'pacientes.listar',
          'pacientes.ver',
          'orcamentos.criar',
          'orcamentos.editar'
        ],
        patient: [
          'agendamentos.meus',
          'agendamentos.criar',
          'agendamentos.cancelar_proprio',
          'perfil.editar',
          'orcamentos.meus'
        ]
      };

      const permissoesUsuario = permissoesPorRole[req.user.role] || [];
      
      if (permissoesUsuario.includes('*') || permissoesUsuario.includes(permissao)) {
        return next();
      }

      return res.status(403).json({ 
        erro: 'Permissão insuficiente',
        permissaoNecessaria: permissao,
        permissoesUsuario
      });
    };
  };
}

module.exports = new AuthMiddleware();
