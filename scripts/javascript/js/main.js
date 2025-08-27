// 🏥 Portal Médico Dr. Marcio Scartozzoni - Sistema Principal Integrado com Supabase
// Sistema de inicialização com integração completa ao banco de dados

console.log('🏥 Portal Médico Dr. Marcio Scartozzoni - Iniciando...');

// Sistema principal do portal
window.PortalMedico = {
    // Estado da aplicação
    state: {
        loaded: false,
        user: null,
        currentModule: null,
        notifications: [],
        supabaseConnected: false,
        dashboardData: null
    },

    // Inicializar sistema
    init: async function() {
        console.log('🚀 Inicializando Portal Médico...');
        
        try {
            // Remover loading screen
            this.removeLoadingScreen();
            
            // Aguardar inicialização do Supabase
            await this.waitForSupabase();
            
            // Carregar dados do dashboard
            await this.loadDashboardData();
            
            // Inicializar interface
            await this.initUI();
            
            // Configurar eventos dos módulos
            this.setupModuleEvents();
            
            // Configurar eventos globais
            this.setupGlobalEvents();
            
            this.state.loaded = true;
            console.log('✅ Portal Médico inicializado com sucesso!');
            
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.showErrorMessage('Erro ao inicializar o sistema');
        }
    },

    // Aguardar inicialização do Supabase
    waitForSupabase: async function() {
        console.log('⏳ Aguardando Supabase...');
        
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!window.SupabaseAPI && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        if (window.SupabaseAPI) {
            // Aguardar inicialização completa
            let supabaseReady = false;
            attempts = 0;
            
            while (!supabaseReady && attempts < maxAttempts) {
                if (window.SupabaseAPI.initialized) {
                    supabaseReady = true;
                    this.state.supabaseConnected = true;
                    console.log('✅ Supabase conectado');
                } else {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    attempts++;
                }
            }
        }
        
        if (!this.state.supabaseConnected) {
            console.warn('⚠️ Supabase não conectado - usando modo offline');
        }
    },

    // Carregar dados do dashboard
    loadDashboardData: async function() {
        console.log('📊 Carregando dados do dashboard...');
        
        try {
            if (window.SupabaseAPI && this.state.supabaseConnected) {
                this.state.dashboardData = await window.SupabaseAPI.getDashboardStats();
                console.log('✅ Dados do dashboard carregados:', this.state.dashboardData);
            } else {
                console.log('📊 Usando dados mock do dashboard');
                this.state.dashboardData = this.getMockDashboardData();
            }
            this.updateDashboardUI();
        } catch (error) {
            console.error('❌ Erro ao carregar dashboard:', error);
            this.state.dashboardData = this.getMockDashboardData();
            this.updateDashboardUI();
        }
    },

    // Atualizar interface do dashboard
    updateDashboardUI: function() {
        if (!this.state.dashboardData) return;
        
        const data = this.state.dashboardData;
        console.log('📊 Atualizando interface do dashboard com dados:', data);
        
        // Atualizar números nos cards de status
        this.updateStatusCard('totalPacientes', data.totalPacientes || 0);
        this.updateStatusCard('agendamentosHoje', data.agendamentosHoje || 0);
        this.updateStatusCard('prontuariosAtivos', data.prontuariosAtivos || 0);
        this.updateStatusCard('consultasMes', data.consultasMes || 0);
        
        console.log('📊 Interface do dashboard atualizada');
    },

    // Atualizar card individual de status
    updateStatusCard: function(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            console.log(`📊 Atualizando ${elementId} para ${value}`);
            // Animação de contagem
            this.animateNumber(element, 0, value, 1500);
        } else {
            console.warn(`⚠️ Elemento ${elementId} não encontrado`);
        }
    },

    // Animação de números
    animateNumber: function(element, start, end, duration) {
        const startTime = performance.now();
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current.toLocaleString('pt-BR');
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };
        
        requestAnimationFrame(updateNumber);
    },

    // Configurar eventos dos módulos
    setupModuleEvents: function() {
        console.log('🔗 Configurando eventos dos módulos...');
        
        // Selecionar todos os cards de módulos
        const moduleCards = document.querySelectorAll('.module-card');
        
        moduleCards.forEach(card => {
            const moduleId = card.getAttribute('data-module');
            
            // Evento de click no card
            card.addEventListener('click', (e) => {
                // Prevenir click nos botões
                if (!e.target.closest('.module-actions')) {
                    this.openModule(moduleId);
                }
            });
            
            // Configurar botões do módulo
            const primaryBtn = card.querySelector('.btn-primary');
            const secondaryBtn = card.querySelector('.btn-secondary');
            
            if (primaryBtn) {
                primaryBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openModule(moduleId);
                });
            }
            
            if (secondaryBtn) {
                secondaryBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openModuleAction(moduleId, 'new');
                });
            }
            
            // Adicionar efeitos hover
            card.addEventListener('mouseenter', () => {
                this.highlightModule(card, true);
            });
            
            card.addEventListener('mouseleave', () => {
                this.highlightModule(card, false);
            });
        });
        
        console.log(`✅ ${moduleCards.length} módulos configurados`);
    },

    // Abrir módulo
    openModule: function(moduleId) {
        console.log(`📂 Abrindo módulo: ${moduleId}`);
        
        // Mostrar loading no card
        const card = document.querySelector(`[data-module="${moduleId}"]`);
        if (card) {
            this.showCardLoading(card, true);
        }
        
        // Simular carregamento e redirecionamento
        setTimeout(() => {
            const moduleUrl = `modules/${moduleId}.html`;
            console.log(`🔗 Redirecionando para: ${moduleUrl}`);
            window.location.href = moduleUrl;
        }, 800);
        
        // Analytics
        this.trackEvent('module_open', { module: moduleId });
    },

    // Abrir ação do módulo
    openModuleAction: function(moduleId, action) {
        console.log(`⚡ Ação ${action} no módulo: ${moduleId}`);
        
        switch (action) {
            case 'new':
                this.openNewItemModal(moduleId);
                break;
            default:
                this.openModule(moduleId);
        }
        
        // Analytics
        this.trackEvent('module_action', { module: moduleId, action: action });
    },

    // Modal para novo item
    openNewItemModal: function(moduleId) {
        const modalHtml = `
            <div class="modal-overlay" id="newItemModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-plus"></i> Novo ${this.getModuleName(moduleId)}</h3>
                        <button class="modal-close" onclick="PortalMedico.closeModal('newItemModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>Redirecionando para o módulo ${this.getModuleName(moduleId)}...</p>
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Redirecionar após animação
        setTimeout(() => {
            this.closeModal('newItemModal');
            this.openModule(moduleId);
        }, 1500);
    },

    // Obter nome do módulo
    getModuleName: function(moduleId) {
        const names = {
            'pacientes': 'Paciente',
            'agendamentos': 'Agendamento',
            'prontuarios': 'Prontuário',
            'caderno-digital': 'Registro',
            'jornada-paciente': 'Jornada',
            'quadro-evolutivo': 'Análise',
            'gestao': 'Relatório',
            'ficha-atendimento': 'Atendimento'
        };
        return names[moduleId] || 'Item';
    },

    // Destacar módulo
    highlightModule: function(card, highlight) {
        if (highlight) {
            card.style.transform = 'translateY(-8px) scale(1.02)';
            card.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.2)';
        } else {
            card.style.transform = '';
            card.style.boxShadow = '';
        }
    },

    // Mostrar loading no card
    showCardLoading: function(card, show) {
        if (show) {
            card.classList.add('loading');
            const icon = card.querySelector('.module-icon i');
            if (icon) {
                const originalClass = icon.className;
                icon.className = 'fas fa-spinner fa-spin';
                // Restaurar ícone original após 2 segundos
                setTimeout(() => {
                    icon.className = originalClass;
                    card.classList.remove('loading');
                }, 2000);
            }
        } else {
            card.classList.remove('loading');
        }
    },

    // Fechar modal
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        }
    },

    // Inicializar interface
    initUI: async function() {
        console.log('🎨 Inicializando interface...');
        
        // Configurar tema
        this.setupTheme();
        
        // Configurar tooltips
        this.setupTooltips();
        
        // Aplicar animações
        this.applyAnimations();
        
        console.log('✅ Interface inicializada');
    },

    // Configurar tema
    setupTheme: function() {
        const theme = localStorage.getItem('portal_theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
    },

    // Configurar tooltips
    setupTooltips: function() {
        const elementsWithTooltip = document.querySelectorAll('[title]');
        elementsWithTooltip.forEach(element => {
            element.addEventListener('mouseenter', this.showTooltip);
            element.addEventListener('mouseleave', this.hideTooltip);
        });
    },

    // Aplicar animações
    applyAnimations: function() {
        // Animação dos cards
        const cards = document.querySelectorAll('.module-card, .status-card');
        cards.forEach((card, index) => {
            card.style.animation = `slideInUp 0.6s ease forwards ${index * 0.1}s`;
        });
    },

    // Remover loading screen
    removeLoadingScreen: function() {
        console.log('🎬 Removendo tela de carregamento...');
        
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 500);
            }, 1000);
        }
    },

    // Configurar eventos globais
    setupGlobalEvents: function() {
        console.log('🌐 Configurando eventos globais...');
        
        // Configurar botão de login
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
        
        // Configurar botão do usuário
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', this.toggleUserMenu);
        }
        
        // Fechar menus ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                this.closeUserMenu();
            }
        });
        
        // Atalhos de teclado
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    },

    // Mostrar mensagem de boas-vindas
    showWelcomeMessage: function() {
        if (this.state.supabaseConnected) {
            this.showNotification('✅ Sistema conectado ao banco de dados', 'success');
        } else {
            this.showNotification('⚠️ Modo offline ativado', 'warning');
        }
    },

    // Mostrar erro
    showErrorMessage: function(message) {
        this.showNotification(`❌ ${message}`, 'error');
    },

    // Sistema de notificações
    showNotification: function(message, type) {
        type = type || 'info';
        
        const notification = document.createElement('div');
        notification.className = `toast toast-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remover
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    },

    // Ícone da notificação
    getNotificationIcon: function(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    // Dados mock para desenvolvimento
    getMockDashboardData: function() {
        return {
            totalPacientes: 247,
            agendamentosHoje: 12,
            prontuariosAtivos: 89,
            consultasMes: 156
        };
    },

    // Tracking de eventos (Analytics)
    trackEvent: function(eventName, properties) {
        properties = properties || {};
        
        if (window.PORTAL_CONFIG && window.PORTAL_CONFIG.SYSTEM && window.PORTAL_CONFIG.SYSTEM.DEBUG) {
            console.log(`📊 Evento: ${eventName}`, properties);
        }
        
        // Integração futura com Google Analytics
    },

    // Atalhos de teclado
    handleKeyboardShortcuts: function(e) {
        // Ctrl/Cmd + número para abrir módulo
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '8') {
            e.preventDefault();
            const moduleIndex = parseInt(e.key) - 1;
            const modules = ['pacientes', 'agendamentos', 'prontuarios', 'caderno-digital', 
                           'jornada-paciente', 'quadro-evolutivo', 'gestao', 'ficha-atendimento'];
            
            if (modules[moduleIndex]) {
                this.openModule(modules[moduleIndex]);
            }
        }
    },

    // Toggle menu do usuário
    toggleUserMenu: function() {
        console.log('👤 Menu do usuário');
        // Implementar menu do usuário quando necessário
    },

    // Fechar menu do usuário
    closeUserMenu: function() {
        // Implementar fechamento do menu quando necessário
    },

    // Mostrar tooltip
    showTooltip: function(e) {
        // Implementar tooltip personalizado se necessário
    },

    // Esconder tooltip
    hideTooltip: function(e) {
        // Implementar esconder tooltip se necessário
    }
};

// Utilitários globais
window.Utils = {
    // Formatação de datas
    formatDate: function(date, format) {
        format = format || 'DD/MM/YYYY';
        const d = new Date(date);
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('DD', day)
            .replace('MM', month)
            .replace('YYYY', year)
            .replace('HH', hours)
            .replace('mm', minutes);
    },

    // Formatação de CPF
    formatCPF: function(cpf) {
        if (!cpf) return '';
        cpf = cpf.replace(/\D/g, '');
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    // Formatação de telefone
    formatPhone: function(phone) {
        if (!phone) return '';
        phone = phone.replace(/\D/g, '');
        
        if (phone.length === 11) {
            return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (phone.length === 10) {
            return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        
        return phone;
    },

    // Validação de email
    validateEmail: function(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Capitalizar primeira letra
    capitalize: function(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    // Debounce para otimizar buscas
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// CSS Adicional para animações e toasts
const additionalCSS = `
/* Animações */
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

/* Loading states */
.loading {
    position: relative;
    pointer-events: none;
}

.loading::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    border-radius: inherit;
    z-index: 10;
}

/* Toasts/Notificações */
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    transition: all 0.3s ease;
    animation: slideInDown 0.3s ease;
}

.toast-success {
    background: linear-gradient(135deg, #10b981, #059669);
}

.toast-error {
    background: linear-gradient(135deg, #ef4444, #dc2626);
}

.toast-warning {
    background: linear-gradient(135deg, #f59e0b, #d97706);
}

.toast-info {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
}

@keyframes slideInDown {
    from {
        opacity: 0;
        transform: translateY(-100%);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Modal styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
}

.modal-content {
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    animation: slideInUp 0.3s ease;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
}

.modal-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #6b7280;
    padding: 8px;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.modal-close:hover {
    background: #f3f4f6;
    color: #374151;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Loading spinner */
.loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 10px auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// Adicionar CSS ao documento
document.head.insertAdjacentHTML('beforeend', `<style>${additionalCSS}</style>`);

// Aguardar DOM e inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => PortalMedico.init(), 100);
    });
} else {
    setTimeout(() => PortalMedico.init(), 100);
}

console.log('📋 Main.js carregado - Aguardando inicialização...');
