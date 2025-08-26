// 🚀 Portal Master Initializer - Orquestrador de Inicialização v20250811-1700
class PortalMasterInitializer {
    constructor() {
        this.components = [];
        this.features = [];
        this.integrations = [];
        this.initialized = false;
        this.initStartTime = Date.now();
        this.initResults = [];
    }

    // 🎯 Inicialização completa do portal
    async initializePortal() {
        console.log('🚀 PORTAL DR. MARCIO - INICIALIZANDO SISTEMA COMPLETO...');
        
        try {
            // Fase 1: Inicializar componentes básicos
            await this.initializeComponents();
            
            // Fase 2: Inicializar funcionalidades profissionais  
            await this.initializeFeatures();
            
            // Fase 3: Inicializar integrações
            await this.initializeIntegrations();
            
            // Fase 4: Inicializar Analytics
            await this.initializeAnalytics();
            
            // Fase 5: Inicializar PWA
            await this.initializePWA();
            
            // Fase 6: Configurações finais
            await this.finalizeInitialization();
            
            this.initialized = true;
            this.showInitializationComplete();
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.showInitializationError(error);
        }
    }

    // 🎨 Inicializar Componentes
    async initializeComponents() {
        console.log('🎨 Inicializando Portal Components...');

        // Aguarda até 2s por definição dos componentes globais
        await this.waitFor(() => typeof window.PortalComponents !== 'undefined' || typeof window.showModal === 'function', 2000);

        const componentTests = [
            {
                name: 'Portal Components System',
                test: () => typeof window.PortalComponents !== 'undefined',
                init: () => { /* Já inicializado automaticamente */ }
            },
            {
                name: 'Modal Component',
                test: () => typeof window.showModal === 'function',
                init: () => { /* Função global disponível */ }
            },
            {
                name: 'Alert Component', 
                test: () => typeof window.showAlert === 'function',
                init: () => { /* Função global disponível */ }
            },
            {
                name: 'Card Component',
                test: () => typeof window.createCard === 'function',
                init: () => { /* Função global disponível */ }
            },
            {
                name: 'Chart Component',
                test: () => typeof window.createChart === 'function',
                init: () => { /* Função global disponível */ }
            },
            {
                name: 'Calendar Component',
                test: () => typeof window.createCalendar === 'function',
                init: () => { /* Função global disponível */ }
            }
        ];

        for (const component of componentTests) {
            try {
                if (component.test()) {
                    component.init();
                    this.components.push({ name: component.name, status: 'success' });
                    console.log(`✅ ${component.name} inicializado`);
                } else {
                    this.components.push({ name: component.name, status: 'failed' });
                    console.log(`❌ ${component.name} não encontrado`);
                }
            } catch (error) {
                this.components.push({ name: component.name, status: 'error', error: error.message });
                console.log(`❌ Erro em ${component.name}:`, error.message);
            }
        }
    }

    // 🎯 Inicializar Funcionalidades Profissionais
    async initializeFeatures() {
        console.log('🎯 Inicializando Professional Features...');

        // Aguarda até 2s por definição das features globais
        await this.waitFor(() => typeof window.PortalProfessionalFeatures !== 'undefined' || typeof window.initDashboard === 'function', 2000);
        
        const featureTests = [
            {
                name: 'Dashboard Widgets',
                test: () => typeof window.initDashboard === 'function',
                init: () => {
                    const container = document.getElementById('professional-dashboard');
                    if (container && window.initDashboard) {
                        window.initDashboard(container);
                    }
                }
            },
            {
                name: 'Notification Center',
                test: () => typeof window.initNotifications === 'function',
                init: () => {
                    if (window.initNotifications) {
                        window.initNotifications();
                    }
                }
            },
            {
                name: 'Appointment Manager',
                test: () => typeof window.initAppointmentManager === 'function',
                init: () => {
                    const container = document.getElementById('appointment-manager');
                    if (container && window.initAppointmentManager) {
                        window.initAppointmentManager(container);
                    }
                }
            },
            {
                name: 'Professional Features System',
                test: () => typeof window.PortalProfessionalFeatures !== 'undefined',
                init: () => { /* Sistema já inicializado */ }
            }
        ];

        for (const feature of featureTests) {
            try {
                if (feature.test()) {
                    feature.init();
                    this.features.push({ name: feature.name, status: 'success' });
                    console.log(`✅ ${feature.name} inicializado`);
                } else {
                    this.features.push({ name: feature.name, status: 'failed' });
                    console.log(`❌ ${feature.name} não encontrado`);
                }
            } catch (error) {
                this.features.push({ name: feature.name, status: 'error', error: error.message });
                console.log(`❌ Erro em ${feature.name}:`, error.message);
            }
        }
    }

    // Utilitário: esperar condição
    async waitFor(conditionFn, timeout = 2000, interval = 100) {
        const start = Date.now();
        return new Promise(resolve => {
            const tick = () => {
                if (conditionFn()) return resolve(true);
                if (Date.now() - start >= timeout) return resolve(false);
                setTimeout(tick, interval);
            };
            tick();
        });
    }

    // 🔌 Inicializar Integrações
    async initializeIntegrations() {
        console.log('🔌 Inicializando Portal Integrations...');
        
        const integrationTests = [
            {
                name: 'Portal Integrations System',
                test: () => typeof window.portalIntegrations !== 'undefined',
                init: () => { /* Sistema já inicializado */ }
            },
            {
                name: 'WhatsApp Integration',
                test: () => typeof window.sendWhatsApp === 'function',
                init: () => { /* Função global disponível */ }
            },
            {
                name: 'Email Integration',
                test: () => typeof window.sendEmail === 'function',
                init: () => { /* Função global disponível */ }
            },
            {
                name: 'Calendar Integration',
                test: () => typeof window.createCalendarEvent === 'function',
                init: () => { /* Função global disponível */ }
            },
            {
                name: 'Payment Integration',
                test: () => typeof window.createPayment === 'function',
                init: () => { /* Função global disponível */ }
            }
        ];

        for (const integration of integrationTests) {
            try {
                if (integration.test()) {
                    integration.init();
                    this.integrations.push({ name: integration.name, status: 'success' });
                    console.log(`✅ ${integration.name} inicializada`);
                } else {
                    this.integrations.push({ name: integration.name, status: 'failed' });
                    console.log(`❌ ${integration.name} não encontrada`);
                }
            } catch (error) {
                this.integrations.push({ name: integration.name, status: 'error', error: error.message });
                console.log(`❌ Erro em ${integration.name}:`, error.message);
            }
        }
    }

    // 📊 Inicializar Analytics
    async initializeAnalytics() {
        console.log('📊 Inicializando Portal Analytics...');
        
        try {
            if (window.PortalAnalytics && window.PortalAnalytics.initialized) {
                console.log('✅ Portal Analytics inicializado');
                
                // Registrar evento de inicialização
                window.trackEvent('portal_initialization_started', {
                    timestamp: new Date().toISOString(),
                    components: this.components.length,
                    features: this.features.length,
                    integrations: this.integrations.length
                });
                
                this.initResults.push({ name: 'Portal Analytics', status: 'success' });
            } else {
                console.log('❌ Portal Analytics não inicializado');
                this.initResults.push({ name: 'Portal Analytics', status: 'failed' });
            }
        } catch (error) {
            console.log('❌ Erro no Portal Analytics:', error.message);
            this.initResults.push({ name: 'Portal Analytics', status: 'error', error: error.message });
        }
    }

    // 📱 Inicializar PWA
    async initializePWA() {
        console.log('📱 Inicializando PWA Features...');
        
        try {
            // Service Worker
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registrado');
                this.initResults.push({ name: 'Service Worker', status: 'success' });
            } else {
                console.log('❌ Service Worker não suportado');
                this.initResults.push({ name: 'Service Worker', status: 'not_supported' });
            }
            
            // Web App Manifest
            const manifestLink = document.querySelector('link[rel="manifest"]');
            if (manifestLink) {
                console.log('✅ Web App Manifest configurado');
                this.initResults.push({ name: 'Web App Manifest', status: 'success' });
            } else {
                console.log('❌ Web App Manifest não encontrado');
                this.initResults.push({ name: 'Web App Manifest', status: 'failed' });
            }
            
            // Notification API
            if ('Notification' in window) {
                console.log('✅ Notification API disponível');
                this.initResults.push({ name: 'Notification API', status: 'success' });
            } else {
                console.log('❌ Notification API não suportada');
                this.initResults.push({ name: 'Notification API', status: 'not_supported' });
            }
            
        } catch (error) {
            console.log('❌ Erro na inicialização PWA:', error.message);
            this.initResults.push({ name: 'PWA Features', status: 'error', error: error.message });
        }
    }

    // 🏁 Finalizar Inicialização
    async finalizeInitialization() {
        console.log('🏁 Finalizando inicialização...');
        
        const initTime = Date.now() - this.initStartTime;
        
        // Estatísticas da inicialização
        const totalComponents = this.components.length + this.features.length + this.integrations.length + this.initResults.length;
        const successComponents = this.components.filter(c => c.status === 'success').length +
                                  this.features.filter(f => f.status === 'success').length +
                                  this.integrations.filter(i => i.status === 'success').length +
                                  this.initResults.filter(r => r.status === 'success').length;
        
        console.log('📊 ESTATÍSTICAS DA INICIALIZAÇÃO:');
        console.log(`⏱️  Tempo total: ${initTime}ms`);
        console.log(`📦 Total de componentes: ${totalComponents}`);
        console.log(`✅ Inicializados com sucesso: ${successComponents}`);
        console.log(`📈 Taxa de sucesso: ${((successComponents / totalComponents) * 100).toFixed(1)}%`);
        
        // Analytics da inicialização completa
        if (window.trackEvent) {
            window.trackEvent('portal_initialization_completed', {
                initTime,
                totalComponents,
                successComponents,
                successRate: (successComponents / totalComponents) * 100,
                timestamp: new Date().toISOString()
            });
        }
        
        // Salvar estatísticas
        this.initStats = {
            initTime,
            totalComponents,
            successComponents,
            successRate: (successComponents / totalComponents) * 100
        };
    }

    // 🎉 Mostrar Inicialização Completa
    showInitializationComplete() {
        const { initTime, totalComponents, successComponents, successRate } = this.initStats;
        
        console.log('🎉 PORTAL DR. MARCIO INICIALIZADO COM SUCESSO!');
        
        // Mostrar notificação de sucesso
        setTimeout(() => {
            if (typeof window.showAlert === 'function') {
                window.showAlert({
                    type: successRate >= 80 ? 'success' : 'warning',
                    title: '🚀 Portal Inicializado!',
                    message: `Sistema carregado em ${initTime}ms com ${successRate.toFixed(1)}% de sucesso`,
                    timeout: 6000,
                    actions: [
                        {
                            id: 'view-details',
                            label: 'Ver Detalhes',
                            callback: () => this.showInitializationDetails()
                        }
                    ]
                });
            } else {
                // Fallback se showAlert não estiver disponível
                alert(`🚀 Portal Inicializado!\nSistema carregado em ${initTime}ms com ${successRate.toFixed(1)}% de sucesso`);
            }
        }, 2000); // Aumentar delay para garantir carregamento
    }

    // 📋 Mostrar Detalhes da Inicialização
    showInitializationDetails() {
        if (typeof window.showModal !== 'function') {
            // Fallback se showModal não estiver disponível
            alert('Detalhes da inicialização disponíveis no console (F12)');
            console.log('📊 Detalhes da Inicialização:', {
                components: this.components,
                features: this.features,
                integrations: this.integrations,
                results: this.initResults,
                stats: this.initStats
            });
            return;
        }
        
        const categories = [
            { name: 'Componentes', items: this.components },
            { name: 'Funcionalidades', items: this.features },
            { name: 'Integrações', items: this.integrations },
            { name: 'Sistemas', items: this.initResults }
        ];

        const categoriesHTML = categories.map(category => `
            <div class="init-category">
                <h4>${category.name} (${category.items.filter(i => i.status === 'success').length}/${category.items.length})</h4>
                <div class="init-items">
                    ${category.items.map(item => `
                        <div class="init-item ${item.status}">
                            <span class="init-status">${this.getStatusIcon(item.status)}</span>
                            <span class="init-name">${item.name}</span>
                            ${item.error ? `<span class="init-error">${item.error}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        showModal({
            title: '🚀 Detalhes da Inicialização',
            content: `
                <div class="initialization-details">
                    <div class="init-summary">
                        <h3>Resumo da Inicialização</h3>
                        <div class="init-stats">
                            <div class="stat-item">
                                <span class="stat-number">${this.initStats.initTime}ms</span>
                                <span class="stat-label">Tempo de Carregamento</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${this.initStats.successComponents}/${this.initStats.totalComponents}</span>
                                <span class="stat-label">Componentes Carregados</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${this.initStats.successRate.toFixed(1)}%</span>
                                <span class="stat-label">Taxa de Sucesso</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="init-categories">
                        ${categoriesHTML}
                    </div>
                    
                    <div class="init-actions" style="margin-top: 20px; text-align: center;">
                        <button onclick="runPortalTests()" class="btn-primary">
                            🧪 Executar Testes
                        </button>
                        <button onclick="closeModal()" class="btn-secondary">
                            ✅ Fechar
                        </button>
                    </div>
                </div>
            `,
            size: 'large'
        });
    }

    // 🚨 Mostrar Erro de Inicialização
    showInitializationError(error) {
        if (typeof window.showAlert === 'function') {
            window.showAlert({
                type: 'error',
                title: '❌ Erro na Inicialização',
                message: `Falha ao inicializar o portal: ${error.message}`,
                timeout: 0,
                actions: [
                    {
                        id: 'retry',
                        label: 'Tentar Novamente',
                        callback: () => location.reload()
                    },
                    {
                        id: 'details',
                        label: 'Ver Detalhes',
                        callback: () => console.error('Erro detalhado:', error)
                    }
                ]
            });
        } else {
            // Fallback se showAlert não estiver disponível
            console.error('❌ Erro na Inicialização:', error.message);
            alert('Erro na inicialização do portal. Verifique o console para detalhes.');
        }
    }

    // 🎯 Utilitários
    getStatusIcon(status) {
        const icons = {
            'success': '✅',
            'failed': '❌', 
            'error': '💥',
            'not_supported': '⚠️'
        };
        return icons[status] || '❓';
    }
}

// 🌟 Instância global do inicializador
window.PortalMasterInitializer = new PortalMasterInitializer();

// 🚀 Função global para inicialização
window.initializePortalComplete = function() {
    return window.PortalMasterInitializer.initializePortal();
};

// 🎯 Auto-inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para todos os scripts carregarem
    setTimeout(() => {
        console.log('🎯 Iniciando Portal Master Initializer...');
        window.initializePortalComplete();
    }, 1500); // 1.5 segundos de delay para garantir carregamento
});

console.log('🚀 Portal Master Initializer carregado');
