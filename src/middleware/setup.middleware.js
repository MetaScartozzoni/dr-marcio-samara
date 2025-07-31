const { pool } = require('../config/database');

/**
 * Middleware para verificar se o sistema precisa ser configurado
 * Redireciona para setup se não houver admin criado
 */
async function checkSystemSetup(req, res, next) {
    // Pular verificação para rotas de setup e assets
    const skipRoutes = ['/setup', '/api/setup', '/style.css', '/favicon.ico'];
    if (skipRoutes.some(route => req.path.startsWith(route))) {
        return next();
    }

    try {
        // Verificar se existe pelo menos um admin
        const result = await pool.query(
            "SELECT COUNT(*) as count FROM funcionarios WHERE tipo = 'admin'"
        );
        
        const adminCount = parseInt(result.rows[0].count);
        
        // Se não existe admin, redirecionar para setup
        if (adminCount === 0) {
            // Para requisições AJAX, retornar JSON
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
                return res.status(503).json({
                    error: 'Sistema não configurado',
                    redirect: '/setup'
                });
            }
            
            // Para navegação normal, redirecionar
            return res.redirect('/setup');
        }
        
        // Sistema já configurado, continuar normalmente
        next();
        
    } catch (error) {
        console.error('Erro ao verificar setup do sistema:', error);
        
        // Em caso de erro, assumir que precisa de setup
        if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.status(503).json({
                error: 'Erro de configuração do sistema',
                redirect: '/setup'
            });
        }
        
        return res.redirect('/setup');
    }
}

/**
 * Verificar se o sistema já foi configurado (para proteger rota de setup)
 */
async function checkSetupCompleted(req, res, next) {
    try {
        const result = await pool.query(
            "SELECT COUNT(*) as count FROM funcionarios WHERE tipo = 'admin'"
        );
        
        const adminCount = parseInt(result.rows[0].count);
        
        // Se já existe admin, redirecionar para login
        if (adminCount > 0) {
            return res.redirect('/login.html');
        }
        
        // Setup ainda não foi feito, continuar
        next();
        
    } catch (error) {
        console.error('Erro ao verificar setup:', error);
        // Em caso de erro, permitir acesso ao setup
        next();
    }
}

module.exports = {
    checkSystemSetup,
    checkSetupCompleted
};
