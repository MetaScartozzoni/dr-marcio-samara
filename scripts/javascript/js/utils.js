// Utilitários Gerais - Portal Médico Dr. Marcio Scartozzoni
// Funções auxiliares para todo o sistema

window.Utils = {
    
    // Formatação de dados
    format: {
        // Formatar CPF
        cpf: function(cpf) {
            if (!cpf) return '';
            cpf = cpf.replace(/\D/g, '');
            return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        },

        // Formatar telefone
        phone: function(phone) {
            if (!phone) return '';
            phone = phone.replace(/\D/g, '');
            if (phone.length === 11) {
                return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (phone.length === 10) {
                return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            }
            return phone;
        },

        // Formatar CEP
        cep: function(cep) {
            if (!cep) return '';
            cep = cep.replace(/\D/g, '');
            return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
        },

        // Formatar data
        date: function(date, format = 'DD/MM/YYYY') {
            if (!date) return '';
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            
            switch (format) {
                case 'DD/MM/YYYY':
                    return `${day}/${month}/${year}`;
                case 'MM/DD/YYYY':
                    return `${month}/${day}/${year}`;
                case 'YYYY-MM-DD':
                    return `${year}-${month}-${day}`;
                default:
                    return `${day}/${month}/${year}`;
            }
        },

        // Formatar moeda (Real Brasileiro)
        currency: function(value) {
            if (!value && value !== 0) return 'R$ 0,00';
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value);
        }
    },

    // Validações
    validate: {
        // Validar CPF
        cpf: function(cpf) {
            if (!cpf) return false;
            cpf = cpf.replace(/\D/g, '');
            
            if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
            
            let sum = 0;
            for (let i = 0; i < 9; i++) {
                sum += parseInt(cpf.charAt(i)) * (10 - i);
            }
            
            let remainder = (sum * 10) % 11;
            if (remainder === 10 || remainder === 11) remainder = 0;
            if (remainder !== parseInt(cpf.charAt(9))) return false;
            
            sum = 0;
            for (let i = 0; i < 10; i++) {
                sum += parseInt(cpf.charAt(i)) * (11 - i);
            }
            
            remainder = (sum * 10) % 11;
            if (remainder === 10 || remainder === 11) remainder = 0;
            return remainder === parseInt(cpf.charAt(10));
        },

        // Validar email
        email: function(email) {
            if (!email) return false;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        // Validar telefone
        phone: function(phone) {
            if (!phone) return false;
            phone = phone.replace(/\D/g, '');
            return phone.length >= 10 && phone.length <= 11;
        },

        // Validar CEP
        cep: function(cep) {
            if (!cep) return false;
            cep = cep.replace(/\D/g, '');
            return cep.length === 8;
        }
    },

    // Utilitários para DOM
    dom: {
        // Selecionar elemento
        $: function(selector) {
            return document.querySelector(selector);
        },

        // Selecionar múltiplos elementos
        $$: function(selector) {
            return document.querySelectorAll(selector);
        },

        // Adicionar event listener
        on: function(element, event, handler) {
            if (typeof element === 'string') {
                element = this.$(element);
            }
            if (element) {
                element.addEventListener(event, handler);
            }
        },

        // Remover event listener
        off: function(element, event, handler) {
            if (typeof element === 'string') {
                element = this.$(element);
            }
            if (element) {
                element.removeEventListener(event, handler);
            }
        },

        // Mostrar elemento
        show: function(element) {
            if (typeof element === 'string') {
                element = this.$(element);
            }
            if (element) {
                element.style.display = 'block';
            }
        },

        // Esconder elemento
        hide: function(element) {
            if (typeof element === 'string') {
                element = this.$(element);
            }
            if (element) {
                element.style.display = 'none';
            }
        },

        // Toggle elemento
        toggle: function(element) {
            if (typeof element === 'string') {
                element = this.$(element);
            }
            if (element) {
                element.style.display = element.style.display === 'none' ? 'block' : 'none';
            }
        }
    },

    // Utilitários para armazenamento local
    storage: {
        // Salvar no localStorage
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Erro ao salvar no localStorage:', e);
                return false;
            }
        },

        // Recuperar do localStorage
        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Erro ao recuperar do localStorage:', e);
                return defaultValue;
            }
        },

        // Remover do localStorage
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Erro ao remover do localStorage:', e);
                return false;
            }
        },

        // Limpar localStorage
        clear: function() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Erro ao limpar localStorage:', e);
                return false;
            }
        }
    },

    // Utilitários para URLs
    url: {
        // Obter parâmetros da URL
        getParams: function() {
            return new URLSearchParams(window.location.search);
        },

        // Obter parâmetro específico
        getParam: function(name) {
            return this.getParams().get(name);
        },

        // Navegar para URL
        goto: function(url) {
            window.location.href = url;
        },

        // Recarregar página
        reload: function() {
            window.location.reload();
        }
    },

    // Utilitários para notificações
    notify: {
        // Mostrar notificação de sucesso
        success: function(message, duration = 5000) {
            this.show(message, 'success', duration);
        },

        // Mostrar notificação de erro
        error: function(message, duration = 8000) {
            this.show(message, 'error', duration);
        },

        // Mostrar notificação de aviso
        warning: function(message, duration = 6000) {
            this.show(message, 'warning', duration);
        },

        // Mostrar notificação de informação
        info: function(message, duration = 5000) {
            this.show(message, 'info', duration);
        },

        // Mostrar notificação genérica
        show: function(message, type = 'info', duration = 5000) {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-${this.getIcon(type)}"></i>
                    <span class="notification-message">${message}</span>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            document.body.appendChild(notification);

            // Auto remover após duração especificada
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        },

        // Obter ícone para tipo de notificação
        getIcon: function(type) {
            const icons = {
                success: 'check-circle',
                error: 'exclamation-circle',
                warning: 'exclamation-triangle',
                info: 'info-circle'
            };
            return icons[type] || 'info-circle';
        }
    },

    // Utilitários gerais
    debounce: function(func, wait, immediate) {
        let timeout;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    },

    // Gerar ID único
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Copiar para clipboard
    copyToClipboard: function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.notify.success('Texto copiado para a área de transferência');
            });
        } else {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.notify.success('Texto copiado para a área de transferência');
        }
    }
};

console.log('🔧 Utilitários carregados');
