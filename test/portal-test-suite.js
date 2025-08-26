// 🧪 Portal Test Suite - Sistema de Testes Automatizados
class PortalTestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
        this.startTime = null;
        this.endTime = null;
    }

    // 🚀 Executar todos os testes
    async runAllTests() {
        console.log('🧪 Iniciando Portal Test Suite...');
        this.startTime = Date.now();

        // Testes de Componentes
        await this.testComponents();
        
        // Testes de Funcionalidades
        await this.testFeatures();
        
        // Testes de Integrações
        await this.testIntegrations();
        
        // Testes de Analytics
        await this.testAnalytics();
        
        // Testes de PWA
        await this.testPWA();

        this.endTime = Date.now();
        this.generateReport();
    }

    // 🎨 Testar Componentes
    async testComponents() {
        console.log('🎨 Testando Portal Components...');
        
        // Teste Modal Component
        this.addTest('Modal Component', () => {
            const modal = window.PortalComponents?.create('modal', {
                title: 'Teste Modal',
                content: 'Conteúdo de teste',
                size: 'medium'
            });
            
            if (modal && typeof modal.open === 'function') {
                modal.open();
                setTimeout(() => modal.close(), 1000);
                return true;
            }
            return false;
        });

        // Teste Alert Component
        this.addTest('Alert Component', () => {
            if (typeof window.showAlert === 'function') {
                showAlert({
                    type: 'info',
                    title: 'Teste Alert',
                    message: 'Componente funcionando!',
                    timeout: 2000
                });
                return true;
            }
            return false;
        });

        // Teste Card Component
        this.addTest('Card Component', () => {
            if (typeof window.createCard === 'function') {
                const card = createCard({
                    title: 'Teste Card',
                    content: 'Conteúdo do card de teste'
                });
                return card && typeof card.render === 'function';
            }
            return false;
        });

        // Teste Calendar Component
        this.addTest('Calendar Component', () => {
            if (typeof window.createCalendar === 'function') {
                const calendar = createCalendar({
                    events: [
                        {
                            id: 'test-1',
                            date: '2025-08-11',
                            title: 'Evento de Teste'
                        }
                    ]
                });
                return calendar && typeof calendar.mount === 'function';
            }
            return false;
        });

        await this.executeTests('Components');
    }

    // 🎯 Testar Funcionalidades Profissionais
    async testFeatures() {
        console.log('🎯 Testando Professional Features...');

        // Teste Dashboard Widgets
        this.addTest('Dashboard Widgets', () => {
            if (window.PortalProfessionalFeatures) {
                const dashboardWidgets = window.PortalProfessionalFeatures.getFeature('dashboard-widgets');
                return dashboardWidgets && typeof dashboardWidgets.init === 'function';
            }
            return false;
        });

        // Teste Notification Center
        this.addTest('Notification Center', () => {
            if (window.PortalProfessionalFeatures) {
                const notificationCenter = window.PortalProfessionalFeatures.getFeature('notification-center');
                return notificationCenter && typeof notificationCenter.init === 'function';
            }
            return false;
        });

        // Teste Appointment Manager
        this.addTest('Appointment Manager', () => {
            if (window.PortalProfessionalFeatures) {
                const appointmentManager = window.PortalProfessionalFeatures.getFeature('appointment-manager');
                return appointmentManager && typeof appointmentManager.init === 'function';
            }
            return false;
        });

        // Teste de inicialização do dashboard
        this.addTest('Dashboard Initialization', () => {
            return typeof window.initDashboard === 'function' &&
                   typeof window.initNotifications === 'function';
        });

        await this.executeTests('Professional Features');
    }

    // 🔌 Testar Integrações
    async testIntegrations() {
        console.log('🔌 Testando Integrations...');

        // Teste WhatsApp Integration
        this.addTest('WhatsApp Integration', () => {
            if (window.portalIntegrations) {
                const whatsapp = window.portalIntegrations.integrations.get('whatsapp');
                return whatsapp && typeof whatsapp.sendMessage === 'function';
            }
            return false;
        });

        // Teste Email Integration
        this.addTest('Email Integration', () => {
            if (window.portalIntegrations) {
                const email = window.portalIntegrations.integrations.get('email');
                return email && typeof email.sendEmail === 'function';
            }
            return false;
        });

        // Teste Google Calendar Integration
        this.addTest('Google Calendar Integration', () => {
            if (window.portalIntegrations) {
                const calendar = window.portalIntegrations.integrations.get('google-calendar');
                return calendar && typeof calendar.createEvent === 'function';
            }
            return false;
        });

        // Teste Payment Integration
        this.addTest('Payment Integration', () => {
            if (window.portalIntegrations) {
                const payment = window.portalIntegrations.integrations.get('payment');
                return payment && typeof payment.createPayment === 'function';
            }
            return false;
        });

        // Teste funções globais
        this.addTest('Global Integration Functions', () => {
            return typeof window.sendWhatsApp === 'function' &&
                   typeof window.sendEmail === 'function' &&
                   typeof window.createCalendarEvent === 'function' &&
                   typeof window.createPayment === 'function';
        });

        await this.executeTests('Integrations');
    }

    // 📊 Testar Analytics
    async testAnalytics() {
        console.log('📊 Testando Analytics...');

        // Teste Portal Analytics
        this.addTest('Portal Analytics Initialization', () => {
            return typeof window.PortalAnalytics !== 'undefined' &&
                   window.PortalAnalytics.initialized === true;
        });

        // Teste Track Event
        this.addTest('Track Event Function', () => {
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('test_event', { testData: 'teste' });
                return true;
            }
            return false;
        });

        // Teste Google Analytics
        this.addTest('Google Analytics Integration', () => {
            return typeof window.gtag !== 'undefined' || 
                   typeof window.ga !== 'undefined';
        });

        // Teste Performance Monitoring
        this.addTest('Performance Monitoring', () => {
            if (window.PortalAnalytics) {
                return typeof window.PortalAnalytics.trackPerformance === 'function';
            }
            return false;
        });

        await this.executeTests('Analytics');
    }

    // 📱 Testar PWA
    async testPWA() {
        console.log('📱 Testando PWA Features...');

        // Teste Service Worker
        this.addTest('Service Worker Registration', async () => {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.getRegistration();
                    return registration !== undefined;
                } catch (error) {
                    return false;
                }
            }
            return false;
        });

        // Teste Web App Manifest
        this.addTest('Web App Manifest', () => {
            const manifestLink = document.querySelector('link[rel="manifest"]');
            return manifestLink !== null;
        });

        // Teste Notification API
        this.addTest('Notification API Support', () => {
            return 'Notification' in window;
        });

        // Teste Offline Support
        this.addTest('Offline Support', () => {
            return 'navigator' in window && 'onLine' in navigator;
        });

        // Teste IndexedDB
        this.addTest('IndexedDB Support', () => {
            return 'indexedDB' in window;
        });

        await this.executeTests('PWA');
    }

    // 🔧 Utilitários
    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    async executeTests(category) {
        const categoryTests = this.tests.filter(test => !this.results.some(r => r.name === test.name));
        
        for (const test of categoryTests) {
            try {
                console.log(`  🧪 Executando: ${test.name}`);
                const result = await test.testFunction();
                
                this.results.push({
                    category,
                    name: test.name,
                    passed: result,
                    error: null
                });
                
                console.log(`  ${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASSOU' : 'FALHOU'}`);
            } catch (error) {
                this.results.push({
                    category,
                    name: test.name,
                    passed: false,
                    error: error.message
                });
                
                console.log(`  ❌ ${test.name}: ERRO - ${error.message}`);
            }
        }
        
        // Limpar testes já executados
        this.tests = [];
    }

    // 📊 Gerar Relatório
    generateReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const duration = this.endTime - this.startTime;

        console.log('\n🏁 RELATÓRIO FINAL DOS TESTES');
        console.log('================================');
        console.log(`⏱️  Duração: ${duration}ms`);
        console.log(`📊 Total de testes: ${totalTests}`);
        console.log(`✅ Passou: ${passedTests}`);
        console.log(`❌ Falhou: ${failedTests}`);
        console.log(`📈 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        console.log('================================\n');

        // Agrupar por categoria
        const categories = [...new Set(this.results.map(r => r.category))];
        
        categories.forEach(category => {
            const categoryResults = this.results.filter(r => r.category === category);
            const categoryPassed = categoryResults.filter(r => r.passed).length;
            
            console.log(`📦 ${category}: ${categoryPassed}/${categoryResults.length} testes passaram`);
            
            categoryResults.forEach(result => {
                const status = result.passed ? '✅' : '❌';
                const errorMsg = result.error ? ` (${result.error})` : '';
                console.log(`   ${status} ${result.name}${errorMsg}`);
            });
            
            console.log('');
        });

        // Mostrar modal com resultado
        this.showTestResults(passedTests, totalTests, duration);

        // Analytics do teste
        window.trackEvent('portal_tests_completed', {
            totalTests,
            passedTests,
            failedTests,
            duration,
            successRate: (passedTests / totalTests) * 100
        });
    }

    showTestResults(passed, total, duration) {
        const successRate = ((passed / total) * 100).toFixed(1);
        const status = successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'error';
        
        showModal({
            title: '🧪 Relatório de Testes',
            content: `
                <div class="test-results">
                    <div class="test-summary">
                        <h3>Resumo dos Testes</h3>
                        <div class="test-stats">
                            <div class="stat-item">
                                <span class="stat-number">${passed}/${total}</span>
                                <span class="stat-label">Testes Passaram</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${successRate}%</span>
                                <span class="stat-label">Taxa de Sucesso</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${duration}ms</span>
                                <span class="stat-label">Duração</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="test-categories">
                        ${this.generateCategoryHTML()}
                    </div>
                    
                    <div class="test-actions" style="margin-top: 20px; text-align: center;">
                        <button onclick="location.reload()" class="btn-secondary">
                            🔄 Executar Novamente
                        </button>
                        <button onclick="closeModal()" class="btn-primary">
                            ✅ Fechar
                        </button>
                    </div>
                </div>
            `,
            size: 'large'
        });

        // Alert de resultado
        showAlert({
            type: status,
            title: status === 'success' ? '🎉 Testes Concluídos!' : '⚠️ Testes Concluídos',
            message: `${passed}/${total} testes passaram (${successRate}% de sucesso)`,
            timeout: 6000
        });
    }

    generateCategoryHTML() {
        const categories = [...new Set(this.results.map(r => r.category))];
        
        return categories.map(category => {
            const categoryResults = this.results.filter(r => r.category === category);
            const categoryPassed = categoryResults.filter(r => r.passed).length;
            
            return `
                <div class="test-category">
                    <h4>${category} (${categoryPassed}/${categoryResults.length})</h4>
                    <div class="test-list">
                        ${categoryResults.map(result => `
                            <div class="test-item ${result.passed ? 'passed' : 'failed'}">
                                <span class="test-status">${result.passed ? '✅' : '❌'}</span>
                                <span class="test-name">${result.name}</span>
                                ${result.error ? `<span class="test-error">${result.error}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// 🚀 Função global para executar testes
window.runPortalTests = async function() {
    const testSuite = new PortalTestSuite();
    await testSuite.runAllTests();
};

// 🎯 Testes rápidos específicos
window.testComponents = function() {
    console.log('🎨 Teste rápido de componentes...');
    
    // Teste modal
    showModal({
        title: '🧪 Teste Modal',
        content: '<p>Modal funcionando perfeitamente!</p>',
        size: 'medium'
    });
    
    setTimeout(() => {
        showAlert({
            type: 'success',
            title: 'Teste Alert',
            message: 'Sistema de alertas funcionando!',
            timeout: 3000
        });
    }, 1000);
};

window.testIntegrations = function() {
    console.log('🔌 Teste rápido de integrações...');
    
    // Simular envio WhatsApp
    console.log('📱 Testando WhatsApp:', typeof window.sendWhatsApp === 'function');
    
    // Simular envio Email
    console.log('📧 Testando Email:', typeof window.sendEmail === 'function');
    
    showAlert({
        type: 'info',
        title: 'Teste de Integrações',
        message: 'Verifique o console para resultados detalhados',
        timeout: 4000
    });
};

// 🎯 Auto-teste ao carregar (apenas em desenvolvimento)
if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            console.log('🧪 Portal em modo de desenvolvimento - Testes disponíveis');
            console.log('Execute: runPortalTests() para teste completo');
            console.log('Execute: testComponents() para testar componentes');
            console.log('Execute: testIntegrations() para testar integrações');
        }, 3000);
    });
}
