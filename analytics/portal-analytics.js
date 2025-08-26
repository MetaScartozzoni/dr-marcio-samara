// 📊 Portal Analytics - Sistema de Análise e Tracking v20250811-1700
class PortalAnalytics {
    constructor() {
        this.events = [];
        this.sessionStart = Date.now();
        this.userId = null;
        this.init();
    }

    init() {
        // Detectar ambiente
        this.environment = window.location.hostname.includes('localhost') ? 'development' : 'production';
        
        // Inicializar Google Analytics (se em produção)
        if (this.environment === 'production') {
            this.initGoogleAnalytics();
        }
        
        // Eventos automáticos
        this.trackPageView();
        this.trackUserInteractions();
        this.trackPerformance();
    }

    // 🔍 Rastreamento de Eventos
    track(event, properties = {}) {
        const eventData = {
            event,
            properties: {
                ...properties,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                sessionId: this.getSessionId(),
                userId: this.userId
            }
        };

        // Armazenar localmente
        this.events.push(eventData);
        
        // Enviar para analytics (se em produção)
        if (this.environment === 'production') {
            this.sendToAnalytics(eventData);
        }
        
        console.log('📊 Analytics Event:', eventData);
    }

    // 👤 Identificar Usuário
    identify(userId, properties = {}) {
        this.userId = userId;
        this.track('user_identified', { userId, ...properties });
    }

    // 📄 Rastrear Visualização de Página
    trackPageView(page = window.location.pathname) {
        this.track('page_view', { page });
    }

    // 🖱️ Rastrear Interações do Usuário
    trackUserInteractions() {
        // Cliques em botões
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.classList.contains('btn')) {
                this.track('button_click', {
                    buttonText: e.target.textContent,
                    buttonId: e.target.id,
                    buttonClass: e.target.className
                });
            }
        });

        // Formulários
        document.addEventListener('submit', (e) => {
            this.track('form_submit', {
                formId: e.target.id,
                formAction: e.target.action
            });
        });

        // Links
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                this.track('link_click', {
                    linkText: e.target.textContent,
                    linkUrl: e.target.href
                });
            }
        });
    }

    // ⚡ Rastrear Performance
    trackPerformance() {
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            this.track('page_performance', {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                firstByte: navigation.responseStart - navigation.requestStart
            });
        });
    }

    // 🎯 Eventos Específicos do Portal Médico
    trackMedicalEvent(eventType, data = {}) {
        const medicalEvents = {
            appointment_scheduled: 'Agendamento criado',
            appointment_cancelled: 'Agendamento cancelado',
            patient_registered: 'Paciente cadastrado',
            record_created: 'Prontuário criado',
            record_updated: 'Prontuário atualizado',
            login_success: 'Login realizado',
            login_failed: 'Falha no login',
            password_reset: 'Senha redefinida'
        };

        this.track(`medical_${eventType}`, {
            category: 'medical',
            description: medicalEvents[eventType] || eventType,
            ...data
        });
    }

    // 📤 Enviar para Serviços Analytics
    async sendToAnalytics(eventData) {
        try {
            // Google Analytics 4
            if (window.gtag) {
                window.gtag('event', eventData.event, eventData.properties);
            }

            // Supabase Analytics (custom)
            if (window.supabase) {
                await window.supabase
                    .from('analytics_events')
                    .insert([eventData]);
            }
        } catch (error) {
            console.error('Analytics Error:', error);
        }
    }

    // 🆔 Session ID
    getSessionId() {
        let sessionId = sessionStorage.getItem('portal_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('portal_session_id', sessionId);
        }
        return sessionId;
    }

    // 📊 Google Analytics Setup
    initGoogleAnalytics() {
        const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Substituir pelo ID real

        // Se o ID não estiver configurado, não tenta carregar GA (evita violar CSP)
        if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
            console.warn('Google Analytics não configurado. Pulei a carga do GA.');
            return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        window.gtag = gtag;

        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
            page_title: document.title,
            page_location: window.location.href
        });
    }

    // 📈 Relatórios
    generateReport() {
        return {
            totalEvents: this.events.length,
            sessionDuration: Date.now() - this.sessionStart,
            topEvents: this.getTopEvents(),
            userFlow: this.getUserFlow()
        };
    }

    getTopEvents() {
        const eventCounts = {};
        this.events.forEach(e => {
            eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
        });
        return Object.entries(eventCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
    }

    getUserFlow() {
        return this.events
            .filter(e => e.event === 'page_view')
            .map(e => e.properties.page);
    }
}

// 🚀 Inicializar Analytics
window.portalAnalytics = new PortalAnalytics();

// 📊 Métodos globais para uso fácil
window.trackEvent = (event, properties) => window.portalAnalytics.track(event, properties);
window.trackMedical = (eventType, data) => window.portalAnalytics.trackMedicalEvent(eventType, data);
window.identifyUser = (userId, properties) => window.portalAnalytics.identify(userId, properties);
