// ============================
// INTEGRADOR SEGURO - NÃO MODIFICA SERVER.JS PRINCIPAL
// ============================

const ServidorAutenticacaoSeguro = require('./servidor-auth-seguro');

class IntegradorSeguro {
    constructor(app) {
        this.app = app;
        this.servidorAuth = new ServidorAutenticacaoSeguro();
        this.init();
    }
    
    init() {
        console.log('🔒 Inicializando sistema seguro de autenticação...');
        
        // Registrar rotas seguras sem modificar server.js
        this.app.use('/secure', this.servidorAuth.getRouter());
        
        // Middleware de segurança global
        this.app.use(this.middlewareSeguranca.bind(this));
        
        console.log('✅ Sistema seguro inicializado');
    }
    
    middlewareSeguranca(req, res, next) {
        // Log de todas as requisições sensíveis
        if (this.isRotaSensivel(req.path)) {
            console.log(`🔍 Acesso a rota sensível: ${req.method} ${req.path} - IP: ${req.ip}`);
        }
        
        // Headers de segurança
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        next();
    }
    
    isRotaSensivel(path) {
        const rotasSensiveis = [
            '/api/auth',
            '/api/cadastrar',
            '/api/login',
            '/admin',
            '/secure'
        ];
        
        return rotasSensiveis.some(rota => path.startsWith(rota));
    }
}

// Função para integrar ao server.js existente
function integrarSeguranca(app) {
    new IntegradorSeguro(app);
}

module.exports = integrarSeguranca;
