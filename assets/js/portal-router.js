// 🛣️ Sistema de Roteamento Portal Dr. Marcio

window.PortalRouter = (function() {
    // Definição das rotas e permissões necessárias
    const routes = {
        // Páginas públicas
        HOME: { path: 'index.html', public: true },
        LOGIN: { path: 'login.html', public: true },
        CADASTRO: { path: 'cadastro.html', public: true },
        RECUPERAR_SENHA: { path: 'recuperar-senha.html', public: true },
        ESQUECI_SENHA: { path: 'esqueci-senha.html', public: true },
        VERIFICAR_EMAIL: { path: 'verificar-email.html', public: true },
        CRIAR_SENHA: { path: 'criar-senha.html', public: true },
        AGUARDANDO_AUTORIZACAO: { path: 'aguardando-autorizacao.html', public: true },
        PENDING: { path: 'pending.html', public: true },
        
        // Páginas de dashboard
        DASHBOARD: { path: 'dashboard.html', permission: 'user' },
        DASHBOARD_ADMIN: { path: 'dashboard-admin.html', permission: 'admin' },
        DASHBOARD_FUNCIONARIO: { path: 'dashboard-funcionario.html', permission: 'funcionario' },
        
        // Agendamento
        AGENDAR: { path: 'agendar.html', permission: 'user' },
        AGENDAMENTO_DETALHES: { path: 'agendamento-detalhes.html', permission: 'user' },
        
        // Admin
        ADMIN: { path: 'admin.html', permission: 'admin' },
        ADMIN_AUTORIZACOES: { path: 'admin-autorizacoes.html', permission: 'admin' },
        APROVACOES: { path: 'aprovacoes.html', permission: 'admin' },
        CADASTRO_FUNCIONARIO: { path: 'cadastro-funcionario.html', permission: 'admin' },
        CONFIG_SISTEMA: { path: 'configuracoes-sistema.html', permission: 'admin' },
        
        // Funcionalidades
        CADERNO_DIGITAL: { path: 'caderno-digital.html', permission: 'user' },
        PRONTUARIOS: { path: 'prontuarios.html', permission: 'user' },
        QUADRO_EVOLUTIVO: { path: 'quadro-evolutivo.html', permission: 'user' },
        VIDEOCHAMADA: { path: 'videochamada.html', permission: 'user' },
        ORCAMENTO: { path: 'orcamento.html', permission: 'user' },
        GESTAO: { path: 'gestao.html', permission: 'user' },
        GESTAO_FINANCEIRA: { path: 'gestao-financeira.html', permission: 'user' },
        LEADS_MANAGER: { path: 'leads-manager.html', permission: 'user' },
        JORNADA_PACIENTE: { path: 'jornada-paciente.html', permission: 'user' },
        
        // Erros e especiais
        ERROR_404: { path: '404.html', public: true },
        ERROR_500: { path: '500.html', public: true }
    };
    
    // Função auxiliar para verificar permissões do usuário
    function verificarPermissao(requiredPermission) {
        // Se página é pública, permitir acesso
        if (!requiredPermission || requiredPermission === 'public') {
            return true;
        }
        
        try {
            // Obter tipo do usuário do localStorage ou sessionStorage
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const userType = userInfo.tipoUsuario || userInfo.tipo || '';
            
            // Verificar permissão baseada no tipo do usuário
            switch (requiredPermission) {
                case 'user':
                    // Qualquer usuário logado tem acesso
                    return !!userInfo.token;
                case 'admin':
                    // Apenas admins têm acesso
                    return userType === 'admin';
                case 'funcionario':
                    // Funcionários e admins têm acesso
                    return userType === 'funcionario' || userType === 'admin';
                default:
                    return false;
            }
        } catch (error) {
            console.error('Erro ao verificar permissões:', error);
            return false;
        }
    }
    
    // Função para navegar para outra página
    function navigateTo(routeKey, params = {}) {
        // Verificar se a rota existe
        if (!routes[routeKey]) {
            console.error(`Erro: Rota "${routeKey}" não definida`);
            return false;
        }
        
        const route = routes[routeKey];
        
        // Verificar permissões
        if (!route.public && !verificarPermissao(route.permission)) {
            console.warn(`Acesso negado: Usuário não tem permissão para acessar ${route.path}`);
            
            // Redirecionar para login
            window.location.href = `${routes.LOGIN.path}?redirect=${encodeURIComponent(route.path)}`;
            return false;
        }
        
        // Construir URL com parâmetros
        let url = route.path;
        const queryParams = [];
        
        // Adicionar parâmetros à URL
        if (params && Object.keys(params).length > 0) {
            for (const key in params) {
                if (params.hasOwnProperty(key) && params[key] !== undefined) {
                    queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
                }
            }
            
            if (queryParams.length > 0) {
                url += '?' + queryParams.join('&');
            }
        }
        
        // Registrar navegação para analytics
        if (window.trackEvent) {
            window.trackEvent('navegacao', {
                de: window.location.pathname,
                para: url,
                timestamp: new Date().toISOString()
            });
        }
        
        // Navegar para a página
        window.location.href = url;
        return true;
    }
    
    // Função para obter parâmetros da URL atual
    function getParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        
        if (queryString) {
            const pairs = queryString.split('&');
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i].split('=');
                params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
            }
        }
        
        return params;
    }
    
    // Função para voltar para a página anterior de forma segura
    function goBack(fallbackRoute = 'DASHBOARD') {
        // Tentar voltar ao histórico
        if (window.history.length > 1) {
            window.history.back();
            
            // Se após um breve intervalo ainda estivermos na mesma página, redirecionar
            setTimeout(() => {
                const currentUrl = window.location.href;
                setTimeout(() => {
                    if (window.location.href === currentUrl) {
                        navigateTo(fallbackRoute);
                    }
                }, 100);
            }, 100);
        } else {
            // Se não houver histórico, ir para a rota de fallback
            navigateTo(fallbackRoute);
        }
    }
    
    // Retornar API pública
    return {
        navigateTo,
        goBack,
        getParams,
        routes
    };
})();

console.log('🛣️ Sistema de Roteamento inicializado');
