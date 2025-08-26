// 🚀 Sistema de Autenticação Integrado com Supabase
// Implementa a lógica: Email cadastrado? Não? Então cadastro → login
// Usa toda a infraestrutura de roles do Supabase

class SupabaseAuthSystem {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        this.config = window.PORTAL_CONFIG || {};
        
        // URLs do Supabase - CONFIGURAR COM SUAS CREDENCIAIS REAIS
        this.supabaseUrl = this.config.SUPABASE_URL || 'https://SEU_PROJETO.supabase.co';
        this.supabaseAnonKey = this.config.SUPABASE_ANON_KEY || 'SUA_CHAVE_AQUI';
        
        this.initializeSupabase();
    }

    async initializeSupabase() {
        try {
            console.log('🔄 Inicializando Supabase Auth System...');
            
            // Carregar biblioteca Supabase se não estiver carregada
            if (!window.supabase) {
                await this.loadSupabaseScript();
            }
            
            // Criar cliente Supabase
            this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseAnonKey);
            this.initialized = true;
            
            console.log('✅ Supabase Auth System inicializado com sucesso');
            
            // Configurar listener de mudanças de autenticação
            this.setupAuthListener();
            
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar Supabase:', error);
            this.showOfflineMode();
            return false;
        }
    }

    async loadSupabaseScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupAuthListener() {
        if (!this.supabase) return;
        
        // Listen para mudanças no estado de autenticação
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔔 Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN') {
                this.handleSignedIn(session);
            } else if (event === 'SIGNED_OUT') {
                this.handleSignedOut();
            } else if (event === 'TOKEN_REFRESHED') {
                this.handleTokenRefreshed(session);
            }
        });
    }

    // ==========================================
    // 🔍 ROTA INICIAL - VERIFICAR STATUS DO EMAIL
    // ==========================================
    
    /**
     * Implementa a lógica principal:
     * Email cadastrado? → Login
     * Email não cadastrado? → Cadastro → Login
     */
    async verificarStatusEmail(email) {
        try {
            console.log(`🔍 Verificando status do email: ${email}`);
            
            if (!this.initialized) {
                throw new Error('Supabase não inicializado');
            }

            // 1. Primeiro verificar se o email existe na tabela auth.users
            const { data: authData, error: authError } = await this.supabase.auth.admin.getUserById(email);
            
            // Se não conseguiu verificar pelo admin, usar método alternativo
            let usuarioExiste = false;
            let dadosUsuario = null;
            
            // 2. Verificar na nossa tabela custom de usuários/funcionários
            const { data: userData, error: userError } = await this.supabase
                .from('funcionarios')
                .select(`
                    id,
                    email,
                    nome,
                    role,
                    ativo,
                    primeiro_acesso,
                    tipo,
                    data_criacao,
                    user_id
                `)
                .eq('email', email)
                .single();
            
            if (userData && !userError) {
                usuarioExiste = true;
                dadosUsuario = userData;
                
                console.log(`✅ Usuário encontrado na tabela funcionários:`, userData);
                
                return {
                    existe: true,
                    cadastrado: true,
                    usuario: userData,
                    acao: 'login',
                    mensagem: 'Email já cadastrado. Redirecionando para login...',
                    status: 'found'
                };
            }
            
            // 3. Se não existe, verificar se pode ser um admin (baseado no domínio)
            const isAdminEmail = this.isAdminEmail(email);
            
            if (isAdminEmail) {
                console.log(`👑 Email de admin detectado: ${email}`);
                return {
                    existe: false,
                    cadastrado: false,
                    tipo: 'admin',
                    primeiro_acesso: true,
                    acao: 'cadastro_admin',
                    mensagem: 'Email de administrador detectado. Redirecionando para cadastro...',
                    status: 'admin_signup'
                };
            }
            
            // 4. Email não cadastrado - usuário comum
            console.log(`❌ Email não encontrado: ${email} - Direcionando para cadastro`);
            return {
                existe: false,
                cadastrado: false,
                tipo: 'funcionario',
                primeiro_acesso: true,
                acao: 'cadastro',
                mensagem: 'Email não encontrado. Redirecionando para cadastro...',
                status: 'signup_needed'
            };
            
        } catch (error) {
            console.error('❌ Erro ao verificar status do email:', error);
            
            // Em caso de erro, assumir que precisa cadastrar
            return {
                existe: false,
                cadastrado: false,
                erro: error.message,
                acao: 'cadastro',
                mensagem: 'Erro na verificação. Redirecionando para cadastro...',
                status: 'error'
            };
        }
    }

    // ==========================================
    // 📝 CADASTRO INTEGRADO COM SUPABASE
    // ==========================================
    
    async cadastrarUsuario({ email, senha, nome, tipo = 'funcionario', role = 'funcionario' }) {
        try {
            console.log(`📝 Iniciando cadastro: ${email}`);
            
            if (!this.initialized) {
                throw new Error('Supabase não inicializado');
            }
            
            // 1. Criar usuário na autenticação do Supabase
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: email,
                password: senha,
                options: {
                    data: {
                        nome: nome,
                        tipo: tipo,
                        role: role
                    }
                }
            });
            
            if (authError) {
                throw new Error(`Erro na autenticação: ${authError.message}`);
            }
            
            console.log('✅ Usuário criado na autenticação:', authData);
            
            // 2. Criar registro na tabela funcionários
            const { data: funcionarioData, error: funcionarioError } = await this.supabase
                .from('funcionarios')
                .insert([{
                    user_id: authData.user.id,
                    email: email,
                    nome: nome,
                    role: role,
                    tipo: tipo,
                    ativo: true,
                    primeiro_acesso: true,
                    data_criacao: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (funcionarioError) {
                console.error('❌ Erro ao criar funcionário:', funcionarioError);
                // Tentar deletar o usuário criado na auth se falhou
                await this.supabase.auth.admin.deleteUser(authData.user.id);
                throw new Error(`Erro ao criar registro: ${funcionarioError.message}`);
            }
            
            console.log('✅ Cadastro realizado com sucesso:', funcionarioData);
            
            return {
                sucesso: true,
                usuario: {
                    id: funcionarioData.id,
                    user_id: authData.user.id,
                    email: email,
                    nome: nome,
                    role: role,
                    tipo: tipo
                },
                auth: authData,
                acao: 'login',
                mensagem: 'Cadastro realizado com sucesso! Redirecionando para login...'
            };
            
        } catch (error) {
            console.error('❌ Erro no cadastro:', error);
            throw error;
        }
    }

    // ==========================================
    // 🔐 LOGIN INTEGRADO COM SUPABASE
    // ==========================================
    
    async loginUsuario(email, senha) {
        try {
            console.log(`🔐 Tentativa de login: ${email}`);
            
            if (!this.initialized) {
                throw new Error('Supabase não inicializado');
            }
            
            // 1. Fazer login no Supabase Auth
            const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: senha
            });
            
            if (authError) {
                throw new Error(`Erro de autenticação: ${authError.message}`);
            }
            
            console.log('✅ Login realizado na autenticação:', authData);
            
            // 2. Buscar dados do funcionário
            const { data: funcionarioData, error: funcionarioError } = await this.supabase
                .from('funcionarios')
                .select('*')
                .eq('user_id', authData.user.id)
                .single();
            
            if (funcionarioError || !funcionarioData) {
                throw new Error('Dados do funcionário não encontrados');
            }
            
            if (!funcionarioData.ativo) {
                throw new Error('Conta desativada. Entre em contato com o administrador.');
            }
            
            console.log('✅ Login realizado com sucesso:', funcionarioData);
            
            // 3. Armazenar dados da sessão
            this.armazenarSessao(authData, funcionarioData);
            
            return {
                sucesso: true,
                usuario: funcionarioData,
                auth: authData,
                token: authData.session.access_token,
                acao: 'dashboard',
                mensagem: 'Login realizado com sucesso!'
            };
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            throw error;
        }
    }

    // ==========================================
    // 🔄 GERENCIAMENTO DE SESSÃO
    // ==========================================
    
    armazenarSessao(authData, funcionarioData) {
        // Armazenar no localStorage
        localStorage.setItem('portal_auth_session', JSON.stringify(authData.session));
        localStorage.setItem('portal_user_data', JSON.stringify(funcionarioData));
        localStorage.setItem('portal_access_token', authData.session.access_token);
        
        console.log('✅ Sessão armazenada com sucesso');
    }
    
    limparSessao() {
        localStorage.removeItem('portal_auth_session');
        localStorage.removeItem('portal_user_data');
        localStorage.removeItem('portal_access_token');
        
        console.log('✅ Sessão limpa');
    }
    
    obterSessaoAtual() {
        try {
            const session = localStorage.getItem('portal_auth_session');
            const userData = localStorage.getItem('portal_user_data');
            
            if (session && userData) {
                return {
                    session: JSON.parse(session),
                    usuario: JSON.parse(userData)
                };
            }
            return null;
        } catch (error) {
            console.error('Erro ao obter sessão:', error);
            return null;
        }
    }

    // ==========================================
    // 🔧 MÉTODOS AUXILIARES
    // ==========================================
    
    isAdminEmail(email) {
        const adminDomains = [
            'marcioplasticsurgery.com',
            'mscartozzoni.com.br',
            'admin@admin.com'
        ];
        
        const adminEmails = [
            'marcioscartozzoni@gmail.com',
            'admin@admin.com',
            'admin@mscartozzoni.com.br'
        ];
        
        // Verificar emails específicos
        if (adminEmails.includes(email.toLowerCase())) {
            return true;
        }
        
        // Verificar domínios
        const domain = email.split('@')[1];
        return adminDomains.some(adminDomain => 
            domain && domain.toLowerCase().includes(adminDomain)
        );
    }
    
    handleSignedIn(session) {
        console.log('✅ Usuário logado:', session);
        // Redirecionar para dashboard se necessário
    }
    
    handleSignedOut() {
        console.log('👋 Usuário deslogado');
        this.limparSessao();
        // Redirecionar para login se necessário
    }
    
    handleTokenRefreshed(session) {
        console.log('🔄 Token renovado:', session);
        // Atualizar token armazenado
        if (session) {
            localStorage.setItem('portal_access_token', session.access_token);
        }
    }
    
    showOfflineMode() {
        console.warn('⚠️ Modo offline ativo - Supabase indisponível');
        // Mostrar toast de aviso
        if (typeof window !== 'undefined' && document.body) {
            const toast = document.createElement('div');
            toast.className = 'alert alert-warning';
            toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
            toast.innerHTML = `
                <i class="fas fa-wifi-slash"></i>
                Sistema offline - Funcionalidade limitada
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 5000);
        }
    }

    // ==========================================
    // 🔄 LOGOUT
    // ==========================================
    
    async logout() {
        try {
            if (this.supabase) {
                await this.supabase.auth.signOut();
            }
            this.limparSessao();
            console.log('✅ Logout realizado com sucesso');
            
            // Redirecionar para página inicial
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            // Limpar sessão mesmo com erro
            this.limparSessao();
        }
    }
}

// ==========================================
// 🚀 INICIALIZAÇÃO GLOBAL
// ==========================================

// Criar instância global
window.SupabaseAuth = new SupabaseAuthSystem();

// Expor métodos principais
window.verificarStatusEmail = (email) => window.SupabaseAuth.verificarStatusEmail(email);
window.cadastrarUsuario = (dados) => window.SupabaseAuth.cadastrarUsuario(dados);
window.loginUsuario = (email, senha) => window.SupabaseAuth.loginUsuario(email, senha);
window.logoutUsuario = () => window.SupabaseAuth.logout();

console.log('🚀 Sistema de Autenticação Supabase carregado!');
console.log('📋 Métodos disponíveis globalmente:');
console.log('   - window.verificarStatusEmail(email)');
console.log('   - window.cadastrarUsuario({email, senha, nome, tipo, role})');
console.log('   - window.loginUsuario(email, senha)');
console.log('   - window.logoutUsuario()');
