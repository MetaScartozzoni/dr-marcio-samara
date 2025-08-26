
// Middleware de autenticação JWT com blacklist, refresh token e auditoria
// Segue boas práticas de segurança

const jwt = require('jsonwebtoken');
const blacklist = new Set(); // Blacklist de tokens revogados
const auditLog = []; // Auditoria simples em memória (substitua por banco em produção)

const JWT_SECRET = process.env.JWT_SECRET || 'troque-esta-chave';
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '2h';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'troque-esta-chave-refresh';
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d';

// Middleware para proteger rotas
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        registrarAuditoria(req, false, 'Token não fornecido');
        return res.status(401).json({ erro: 'Token não fornecido' });
    }
    if (blacklist.has(token)) {
        registrarAuditoria(req, false, 'Token revogado');
        return res.status(403).json({ erro: 'Token revogado' });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        registrarAuditoria(req, true, 'Token válido');
        next();
    } catch (err) {
        registrarAuditoria(req, false, 'Token inválido ou expirado');
        return res.status(403).json({ erro: 'Token inválido ou expirado' });
    }
}

// Função para gerar token JWT
function gerarToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
}

// Função para gerar refresh token
function gerarRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });
}

// Função para validar refresh token e gerar novo access token
function renovarToken(refreshToken) {
    try {
        const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        return gerarToken({ id: payload.id, email: payload.email });
    } catch (err) {
        return null;
    }
}

// Função para revogar token (adicionar à blacklist)
function revogarToken(token) {
    blacklist.add(token);
}

// Função para registrar auditoria
function registrarAuditoria(req, sucesso, motivo) {
    auditLog.push({
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        url: req.originalUrl,
        sucesso,
        motivo,
        data: new Date().toISOString()
    });
}

// Função para consultar auditoria
function consultarAuditoria() {
    return auditLog;
}

module.exports = {
    authMiddleware,
    gerarToken,
    gerarRefreshToken,
    renovarToken,
    revogarToken,
    consultarAuditoria
};
