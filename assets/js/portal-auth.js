// 🔐 Sistema de Autenticação Portal Dr. Marcio

window.PortalAuth = (function() {
    // Chaves de armazenamento
    const STORAGE_KEYS = {
        USER_INFO: 'userInfo',
        TOKEN: 'authToken',
        REFRESH_TOKEN: 'refreshToken',
        SESSION_EXPIRY: 'sessionExpiry'
    };
    
    // Tipos de usuário
    const USER_TYPES = {
        ADMIN: 'admin',
        FUNCIONARIO: 'funcionario',
        PACIENTE: 'paciente',
        GUEST: 'guest'
    };
    
    // Tempo padrão de expiração da sessão (24 horas)
    const DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000;
    
    // Estado interno
    let currentUser = null;
    let isInitialized = false;
    
    // Carregar usuário do armazenamento local
    function loadUserFromStorage() {
        try {
            const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
            if (userInfoStr) {
                const userInfo = JSON.parse(userInfoStr);
                
                // Verificar expiração da sessão
                const sessionExpiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
                if (sessionExpiry && parseInt(sessionExpiry) > Date.now()) {
                    currentUser = userInfo;
                    return userInfo;
                } else {
                    // Sessão expirada, limpar dados
                    clearAuthData();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            clearAuthData();
        }
        
        return null;
    }
    
    // Salvar usuário no armazenamento local
    function saveUserToStorage(userInfo, token, refreshToken, rememberMe = false) {
        try {
            // Determinar duração da sessão
            const duration = rememberMe ? 
                DEFAULT_SESSION_DURATION * 30 : // 30 dias se "lembrar de mim"
                DEFAULT_SESSION_DURATION;       // 1 dia padrão
                
            const expiry = Date.now() + duration;
            
            // Salvar dados
            localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
            if (refreshToken) {
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            }
            localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, expiry.toString());
            
            // Atualizar estado interno
            currentUser = userInfo;
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados do usuário:', error);
            return false;
        }
    }
    
    // Limpar dados de autenticação
    function clearAuthData() {
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY);
        currentUser = null;
    }
    
    // Inicializar sistema de autenticação
    function init() {
        if (isInitialized) return;
        
        // Carregar usuário do armazenamento
        loadUserFromStorage();
        
        // Configurar verificação periódica de sessão
        setInterval(() => {
            const sessionExpiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
            
            if (sessionExpiry && parseInt(sessionExpiry) < Date.now()) {
                // Sessão expirada
                console.log('Sessão expirada. Fazendo logout...');
                clearAuthData();
                
                // Verificar se não estamos em uma página pública
                if (window.PortalRouter && !isOnPublicPage()) {
                    window.PortalRouter.navigateTo('LOGIN', {
                        expired: true,
                        redirect: window.location.pathname
                    });
                }
            }
        }, 60000); // Verificar a cada minuto
        
        isInitialized = true;
    }
    
    // Verificar se estamos em uma página pública
    function isOnPublicPage() {
        const publicPages = [
            'login.html', 
            'index.html', 
            'cadastro.html', 
            'esqueci-senha.html',
            'recuperar-senha.html',
            'verificar-email.html',
            'criar-senha.html',
            'aguardando-autorizacao.html',
            'pending.html',
            '404.html',
            '500.html'
        ];
        
        const currentPath = window.location.pathname.split('/').pop();
        return publicPages.includes(currentPath);
    }
    
    // Login
    async function login(email, senha, rememberMe = false) {
        try {
            // Validações básicas
            if (!email || !senha) {
                return {
                    success: false,
                    error: 'Email e senha são obrigatórios'
                };
            }
            
            // Chamar API de autenticação usando Edge Function
            const authData = {
                email: email.toLowerCase().trim(),
                password: senha,
                remember_me: rememberMe
            };
            
            // Usar Edge Function para autenticação
            const result = await window.EdgeFunctionsClient.call(
                window.PORTAL_CONFIG.EDGE_FUNCTIONS.AUTH_LOGIN,
                authData
            );
            
            if (!result.success || !result.user || !result.token) {
                return {
                    success: false,
                    error: result.error || 'Credenciais inválidas'
                };
            }
            
            // Salvar dados do usuário
            saveUserToStorage(
                result.user,
                result.token,
                result.refresh_token,
                rememberMe
            );
            
            // Registrar evento de login
            if (window.trackEvent) {
                window.trackEvent('auth_login', {
                    user_type: result.user.tipoUsuario,
                    timestamp: new Date().toISOString()
                });
            }
            
            return {
                success: true,
                user: result.user,
                redirectUrl: determineRedirectUrl(result.user)
            };
            
        } catch (error) {
            console.error('Erro durante login:', error);
            return {
                success: false,
                error: 'Erro ao processar login. Tente novamente.'
            };
        }
    }
    
    // Determinar URL de redirecionamento com base no tipo de usuário
    function determineRedirectUrl(user) {
        if (!user) return '/login.html';
        
        switch (user.tipoUsuario || user.tipo) {
            case USER_TYPES.ADMIN:
                return '/dashboard-admin.html';
            case USER_TYPES.FUNCIONARIO:
                return '/dashboard-funcionario.html';
            case USER_TYPES.PACIENTE:
            default:
                return '/dashboard.html';
        }
    }
    
    // Logout
    function logout(redirectToLogin = true) {
        try {
            // Registrar evento de logout
            if (window.trackEvent && currentUser) {
                window.trackEvent('auth_logout', {
                    user_type: currentUser.tipoUsuario || currentUser.tipo,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Limpar dados de autenticação
            clearAuthData();
            
            // Redirecionar para login
            if (redirectToLogin && window.PortalRouter) {
                window.PortalRouter.navigateTo('LOGIN', { logout: 'success' });
            } else if (redirectToLogin) {
                window.location.href = '/login.html?logout=success';
            }
            
            return true;
        } catch (error) {
            console.error('Erro durante logout:', error);
            return false;
        }
    }
    
    // Verificar se usuário está autenticado
    function isAuthenticated() {
        const user = currentUser || loadUserFromStorage();
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const expiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
        
        return !!(user && token && expiry && parseInt(expiry) > Date.now());
    }
    
    // Verificar se usuário é de um determinado tipo
    function isUserType(type) {
        if (!isAuthenticated()) return false;
        
        const user = currentUser || loadUserFromStorage();
        const userType = user.tipoUsuario || user.tipo;
        
        if (type === USER_TYPES.ADMIN) {
            return userType === USER_TYPES.ADMIN;
        }
        
        if (type === USER_TYPES.FUNCIONARIO) {
            return userType === USER_TYPES.FUNCIONARIO || userType === USER_TYPES.ADMIN;
        }
        
        return userType === type;
    }
    
    // Obter dados do usuário atual
    function getCurrentUser() {
        return currentUser || loadUserFromStorage();
    }
    
    // Obter token de autenticação atual
    function getAuthToken() {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }
    
    // Verificar se é o primeiro acesso (sem administradores cadastrados)
    async function checkFirstAccess() {
        try {
            const result = await window.EdgeFunctionsClient.call(
                window.PORTAL_CONFIG.EDGE_FUNCTIONS.SYSTEM_STATUS,
                { check: 'first_access' }
            );
            
            return {
                success: true,
                isFirstAccess: result.is_first_access === true,
                hasAdmins: result.has_admins === true
            };
        } catch (error) {
            console.error('Erro ao verificar primeiro acesso:', error);
            return {
                success: false,
                error: 'Erro ao verificar status do sistema',
                isFirstAccess: false,
                hasAdmins: true // Assumir que há admins por segurança
            };
        }
    }
    
    // Registrar novo usuário
    async function registerUser(userData, senhaChave) {
        try {
            // Validação básica
            if (!userData.email || !userData.nome || !userData.senha) {
                return {
                    success: false,
                    error: 'Dados incompletos para cadastro'
                };
            }
            
            // Preparar dados para envio
            const registrationData = {
                ...userData,
                email: userData.email.toLowerCase().trim(),
                senha_chave: senhaChave
            };
            
            // Usar Edge Function para registro
            const result = await window.EdgeFunctionsClient.call(
                window.PORTAL_CONFIG.EDGE_FUNCTIONS.AUTH_REGISTER,
                registrationData
            );
            
            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Erro ao registrar usuário'
                };
            }
            
            // Registrar evento de cadastro
            if (window.trackEvent) {
                window.trackEvent('user_registration', {
                    user_type: userData.tipo || result.user_type,
                    timestamp: new Date().toISOString()
                });
            }
            
            return {
                success: true,
                message: result.message || 'Cadastro realizado com sucesso',
                user: result.user,
                needsApproval: result.needs_approval === true
            };
            
        } catch (error) {
            console.error('Erro durante cadastro:', error);
            return {
                success: false,
                error: 'Erro ao processar cadastro. Tente novamente.'
            };
        }
    }
    
    // Verificar requisitos de senha
    function checkPasswordStrength(password) {
        if (!password) return { valid: false, score: 0, message: 'Senha não fornecida' };
        
        let score = 0;
        let message = '';
        
        // Verificar tamanho mínimo
        if (password.length < 6) {
            return { 
                valid: false, 
                score: 0, 
                message: 'A senha deve ter pelo menos 6 caracteres' 
            };
        }
        
        // Pontuação básica pelo comprimento
        score += Math.min(password.length, 10) / 2;
        
        // Verificar complexidade
        if (/[A-Z]/.test(password)) score += 1; // Maiúsculas
        if (/[a-z]/.test(password)) score += 1; // Minúsculas
        if (/[0-9]/.test(password)) score += 1; // Números
        if (/[^A-Za-z0-9]/.test(password)) score += 1; // Símbolos
        
        // Determinar mensagem e validade
        if (score < 3) {
            message = 'Senha fraca';
        } else if (score < 5) {
            message = 'Senha média';
        } else {
            message = 'Senha forte';
        }
        
        return {
            valid: score >= 3,
            score: score,
            message: message
        };
    }
    
    // API Pública
    return {
        init,
        login,
        logout,
        isAuthenticated,
        isUserType,
        getCurrentUser,
        getAuthToken,
        registerUser,
        checkPasswordStrength,
        checkFirstAccess,
        USER_TYPES
    };
})();

// Inicializar automaticamente
document.addEventListener('DOMContentLoaded', () => {
    if (window.PortalAuth) {
        window.PortalAuth.init();
    }
});

console.log('🔐 Sistema de Autenticação inicializado');
