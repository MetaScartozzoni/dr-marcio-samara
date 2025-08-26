/**
 * SISTEMA DE EFEITOS VISUAIS AVANÇADOS
 * Arquivo: visual-effects.js
 * 
 * Sistema unificado para gerenciar efeitos de blur, hover, fade-in
 * e outras animações visuais em todas as páginas do portal.
 */

class VisualEffectsManager {
    constructor() {
        this.initialized = false;
        this.options = {
            blurEnabled: true,
            fadeInEnabled: true,
            shimmerEnabled: true,
            debugMode: false
        };
        
        this.init();
    }

    init() {
        if (this.initialized) return;
        
        console.log('🎨 Inicializando Sistema de Efeitos Visuais...');
        
        // Aguardar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.detectContainers();
        this.setupBlurEffects();
        this.setupFadeInEffects();
        this.setupPerformanceOptimizations();
        this.setupResponsiveEffects();
        
        this.initialized = true;
        console.log('✨ Efeitos visuais carregados com sucesso!');
    }

    // Detectar automaticamente containers de cards
    detectContainers() {
        const selectors = [
            '.stats-grid',
            '.cards-grid', 
            '.status-grid',
            '.funcionarios-grid',
            '.document-library',
            '#marcosPrincipais',
            '#agendamentosRecentes',
            '[class*="grid"]',
            '[class*="container"]'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(container => {
                if (!container.classList.contains('blur-container')) {
                    container.classList.add('blur-container');
                    
                    if (this.options.debugMode) {
                        container.classList.add('debug-blur-container');
                    }
                }
            });
        });
    }

    // Configurar efeitos de blur
    setupBlurEffects() {
        if (!this.options.blurEnabled) return;

        // Adicionar listeners para containers de blur
        document.querySelectorAll('.blur-container').forEach(container => {
            this.enhanceBlurContainer(container);
        });
    }

    enhanceBlurContainer(container) {
        const children = container.children;
        
        container.addEventListener('mouseenter', () => {
            Array.from(children).forEach(child => {
                if (!child.matches(':hover')) {
                    child.style.transition = 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
                }
            });
        });

        container.addEventListener('mouseleave', () => {
            Array.from(children).forEach(child => {
                child.style.filter = '';
                child.style.transform = '';
                child.style.opacity = '';
            });
        });
    }

    // Configurar efeitos de fade-in
    setupFadeInEffects() {
        if (!this.options.fadeInEnabled) return;

        // Observador de interseção para fade-in
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        // Adicionar fade-in a elementos relevantes
        const fadeElements = document.querySelectorAll(`
            .stat-card,
            .card-paciente,
            .status-card,
            .document-item,
            .marco-item,
            .agendamento-recente,
            .redirect-card
        `);

        fadeElements.forEach((element, index) => {
            element.style.animationDelay = `${index * 0.1}s`;
            observer.observe(element);
        });
    }

    // Otimizações de performance
    setupPerformanceOptimizations() {
        // Reduzir efeitos em dispositivos com baixa performance
        if (this.isLowPerformanceDevice()) {
            this.enableLowPerformanceMode();
        }

        // Pausar animações quando a aba não está ativa
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
    }

    // Efeitos responsivos
    setupResponsiveEffects() {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        
        const handleMobileView = (e) => {
            if (e.matches) {
                this.enableMobileMode();
            } else {
                this.enableDesktopMode();
            }
        };

        mediaQuery.addListener(handleMobileView);
        handleMobileView(mediaQuery);
    }

    // Detectar dispositivos com baixa performance
    isLowPerformanceDevice() {
        const navigator = window.navigator;
        
        // Verificar conexão
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && connection.effectiveType === 'slow-2g') {
            return true;
        }

        // Verificar memória
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            return true;
        }

        // Verificar cores de CPU
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            return true;
        }

        return false;
    }

    enableLowPerformanceMode() {
        console.log('📱 Modo de baixa performance ativado');
        document.body.classList.add('low-performance');
        
        // Reduzir duração das animações
        const style = document.createElement('style');
        style.textContent = `
            .low-performance * {
                animation-duration: 0.2s !important;
                transition-duration: 0.2s !important;
            }
            .low-performance .blur-container:hover > *:not(:hover) {
                filter: none !important;
                opacity: 0.8 !important;
                transform: scale(0.98) !important;
            }
        `;
        document.head.appendChild(style);
    }

    enableMobileMode() {
        document.body.classList.add('mobile-effects');
        console.log('📱 Efeitos móveis ativados');
    }

    enableDesktopMode() {
        document.body.classList.remove('mobile-effects');
        console.log('🖥️ Efeitos desktop ativados');
    }

    pauseAnimations() {
        document.body.style.animationPlayState = 'paused';
    }

    resumeAnimations() {
        document.body.style.animationPlayState = 'running';
    }

    // Método público para adicionar efeito shimmer a elemento específico
    addShimmerEffect(element) {
        element.addEventListener('mouseenter', () => {
            element.classList.add('shimmer-active');
        });

        element.addEventListener('animationend', () => {
            element.classList.remove('shimmer-active');
        });
    }

    // Método público para adicionar fade-in a novos elementos
    addFadeIn(elements, delay = 0) {
        const elementList = elements instanceof NodeList ? elements : [elements];
        
        elementList.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('fade-in');
            }, delay + (index * 100));
        });
    }

    // Método público para adicionar pulse a elemento
    addPulseEffect(element, duration = 2000) {
        element.classList.add('pulse-active');
        
        if (duration > 0) {
            setTimeout(() => {
                element.classList.remove('pulse-active');
            }, duration);
        }
    }

    // Toggle debug mode
    toggleDebugMode() {
        this.options.debugMode = !this.options.debugMode;
        
        document.querySelectorAll('.blur-container').forEach(container => {
            if (this.options.debugMode) {
                container.classList.add('debug-blur-container');
            } else {
                container.classList.remove('debug-blur-container');
            }
        });

        console.log(`🐛 Debug mode: ${this.options.debugMode ? 'ON' : 'OFF'}`);
    }

    // Método para desabilitar todos os efeitos
    disableAllEffects() {
        document.body.classList.add('no-effects');
        console.log('🚫 Todos os efeitos desabilitados');
    }

    // Método para reabilitar efeitos
    enableAllEffects() {
        document.body.classList.remove('no-effects', 'low-performance');
        console.log('✨ Efeitos reabilitados');
    }
}

// Inicializar automaticamente quando o script for carregado
const visualEffects = new VisualEffectsManager();

// Expor globalmente para uso em outras páginas
window.VisualEffects = visualEffects;

// Utilitários globais
window.VFX = {
    fadeIn: (elements, delay) => visualEffects.addFadeIn(elements, delay),
    pulse: (element, duration) => visualEffects.addPulseEffect(element, duration),
    shimmer: (element) => visualEffects.addShimmerEffect(element),
    debug: () => visualEffects.toggleDebugMode(),
    disable: () => visualEffects.disableAllEffects(),
    enable: () => visualEffects.enableAllEffects()
};

console.log('🎨 Sistema de Efeitos Visuais carregado! Use VFX.debug() para debug.');
