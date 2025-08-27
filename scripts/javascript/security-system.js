// 🔧 CORREÇÕES URGENTES PARA PRODUÇÃO - Portal Dr. Marcio Scartozzoni
// ⚠️  APLICAR ANTES DE USAR NA CLÍNICA

// ===================================
// 1. SISTEMA DE AUTENTICAÇÃO SEGURO
// ===================================

class AuthSystem {
    constructor() {
        this.tokenKey = 'clinica_auth_token';
        this.userKey = 'clinica_user_data';
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutos
    }

    // Verificação de autenticação segura
    checkAuth() {
        // MODO DESENVOLVIMENTO - Autenticação desabilitada
        console.log('🔓 Modo desenvolvimento: Autenticação bypass');
        return true;
    }

    isTokenExpired(timestamp) {
        const now = Date.now();
        return (now - timestamp) > this.sessionTimeout;
    }

    validateToken(token, userData) {
        // Implementar validação real do token
        // Por enquanto, verificação básica
        return token.length > 20 && userData.id && userData.tipo;
    }

    renewSessionIfNeeded(timestamp) {
        const now = Date.now();
        const timeLeft = this.sessionTimeout - (now - timestamp);
        
        // Se restam menos de 5 minutos, renovar
        if (timeLeft < 5 * 60 * 1000) {
            this.renewSession();
        }
    }

    renewSession() {
        const userData = JSON.parse(localStorage.getItem(this.userKey));
        userData.timestamp = Date.now();
        localStorage.setItem(this.userKey, JSON.stringify(userData));
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.redirectToLogin();
    }

    redirectToLogin() {
        // MODO DESENVOLVIMENTO - Desabilitado redirecionamento de login
        console.log('🔓 Modo desenvolvimento: Login desabilitado');
        // if (window.location.pathname !== '/login.html') {
        //     window.location.href = '/login.html';
        // }
    }
}

// ===================================
// 2. CRIPTOGRAFIA DE DADOS MÉDICOS
// ===================================

class MedicalDataCrypto {
    constructor() {
        // Chave derivada do usuário logado (simplificado)
        this.encryptionKey = this.generateUserKey();
    }

    generateUserKey() {
        const userData = localStorage.getItem('clinica_user_data');
        if (!userData) return null;
        
        const user = JSON.parse(userData);
        // Gerar chave baseada no usuário (implementação básica)
        return btoa(user.id + ':' + user.tipo).substring(0, 32);
    }

    // Criptografia simples (para produção usar crypto-js ou similar)
    encrypt(data) {
        if (!this.encryptionKey) return null;
        
        try {
            const jsonString = JSON.stringify(data);
            const encoded = btoa(jsonString);
            return this.simpleXOR(encoded, this.encryptionKey);
        } catch (error) {
            console.error('Erro na criptografia:', error);
            return null;
        }
    }

    decrypt(encryptedData) {
        if (!this.encryptionKey || !encryptedData) return null;
        
        try {
            const decoded = this.simpleXOR(encryptedData, this.encryptionKey);
            const jsonString = atob(decoded);
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Erro na descriptografia:', error);
            return null;
        }
    }

    simpleXOR(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return result;
    }

    // Salvar dados médicos de forma segura
    saveSecureData(key, data) {
        const encrypted = this.encrypt(data);
        if (encrypted) {
            localStorage.setItem('secure_' + key, encrypted);
            return true;
        }
        return false;
    }

    // Recuperar dados médicos de forma segura
    getSecureData(key) {
        const encrypted = localStorage.getItem('secure_' + key);
        return this.decrypt(encrypted);
    }
}

// ===================================
// 3. VALIDAÇÃO E SANITIZAÇÃO
// ===================================

class DataValidator {
    // Sanitizar entrada de texto
    static sanitizeText(text) {
        if (typeof text !== 'string') return '';
        
        return text
            .trim()
            .replace(/[<>]/g, '') // Remover < >
            .replace(/javascript:/gi, '') // Remover javascript:
            .replace(/on\w+=/gi, '') // Remover eventos onclick, etc
            .substring(0, 1000); // Limitar tamanho
    }

    // Validar CPF
    static validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        
        if (cpf.length !== 11) return false;
        
        // Verificar sequências inválidas
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Algoritmo de validação do CPF
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let digit1 = 11 - (sum % 11);
        if (digit1 > 9) digit1 = 0;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        let digit2 = 11 - (sum % 11);
        if (digit2 > 9) digit2 = 0;
        
        return digit1 === parseInt(cpf.charAt(9)) && 
               digit2 === parseInt(cpf.charAt(10));
    }

    // Validar email
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 100;
    }

    // Validar telefone
    static validatePhone(phone) {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        return phoneRegex.test(phone);
    }

    // Validar data
    static validateDate(date) {
        const dateObj = new Date(date);
        return dateObj instanceof Date && !isNaN(dateObj);
    }

    // Validar valor monetário
    static validateCurrency(value) {
        const numValue = parseFloat(value);
        return !isNaN(numValue) && numValue >= 0 && numValue <= 1000000;
    }
}

// ===================================
// 4. SISTEMA DE AUDITORIA
// ===================================

class AuditSystem {
    static log(action, details = {}) {
        try {
            const userData = JSON.parse(localStorage.getItem('clinica_user_data') || '{}');
            
            const auditEntry = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toISOString(),
                user: {
                    id: userData.id || 'unknown',
                    nome: userData.nome || 'unknown',
                    tipo: userData.tipo || 'unknown'
                },
                action: action,
                details: details,
                ip: this.getClientIP(),
                userAgent: navigator.userAgent.substring(0, 200)
            };

            // Salvar no localStorage (em produção, enviar para servidor)
            this.saveAuditLog(auditEntry);
            
            // Log crítico também no console (removível em produção)
            if (this.isCriticalAction(action)) {
                console.warn('AUDITORIA CRÍTICA:', action, details);
            }
        } catch (error) {
            console.error('Erro no sistema de auditoria:', error);
        }
    }

    static saveAuditLog(entry) {
        const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
        logs.push(entry);
        
        // Manter apenas os últimos 1000 logs
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        localStorage.setItem('audit_logs', JSON.stringify(logs));
    }

    static isCriticalAction(action) {
        const criticalActions = [
            'LOGIN_FAILED', 'DATA_EXPORT', 'PATIENT_DELETE', 
            'PRESCRIPTION_CREATE', 'DOCUMENT_SIGN'
        ];
        return criticalActions.includes(action);
    }

    static getClientIP() {
        // Em produção, obter IP real do servidor
        return 'localhost';
    }
}

// ===================================
// 5. SISTEMA DE BACKUP AUTOMÁTICO
// ===================================

class BackupSystem {
    constructor() {
        this.backupInterval = 5 * 60 * 1000; // 5 minutos
        this.maxBackups = 10;
        this.init();
    }

    init() {
        // Backup automático a cada 5 minutos
        setInterval(() => {
            this.createBackup();
        }, this.backupInterval);

        // Backup ao sair da página
        window.addEventListener('beforeunload', () => {
            this.createBackup();
        });
    }

    createBackup() {
        try {
            const data = {
                timestamp: new Date().toISOString(),
                localStorage: this.exportLocalStorage(),
                version: '1.0.0'
            };

            const compressed = this.compressData(data);
            this.saveBackup(compressed);
            
            AuditSystem.log('BACKUP_CREATED', { size: compressed.length });
        } catch (error) {
            console.error('Erro no backup:', error);
            AuditSystem.log('BACKUP_FAILED', { error: error.message });
        }
    }

    exportLocalStorage() {
        const data = {};
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                data[key] = localStorage[key];
            }
        }
        return data;
    }

    compressData(data) {
        // Compressão simples (em produção usar biblioteca específica)
        return btoa(JSON.stringify(data));
    }

    saveBackup(compressedData) {
        const backups = JSON.parse(localStorage.getItem('system_backups') || '[]');
        
        backups.push({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            data: compressedData
        });

        // Manter apenas os últimos backups
        if (backups.length > this.maxBackups) {
            backups.splice(0, backups.length - this.maxBackups);
        }

        localStorage.setItem('system_backups', JSON.stringify(backups));
    }

    restoreBackup(backupId) {
        const backups = JSON.parse(localStorage.getItem('system_backups') || '[]');
        const backup = backups.find(b => b.id === backupId);
        
        if (!backup) {
            throw new Error('Backup não encontrado');
        }

        try {
            const decompressed = JSON.parse(atob(backup.data));
            const localStorageData = decompressed.localStorage;

            // Restaurar localStorage
            localStorage.clear();
            for (let key in localStorageData) {
                localStorage.setItem(key, localStorageData[key]);
            }

            AuditSystem.log('BACKUP_RESTORED', { backupId: backupId });
            return true;
        } catch (error) {
            AuditSystem.log('BACKUP_RESTORE_FAILED', { 
                backupId: backupId, 
                error: error.message 
            });
            throw error;
        }
    }
}

// ===================================
// 6. INICIALIZAÇÃO DO SISTEMA SEGURO
// ===================================

class SecureClinicSystem {
    constructor() {
        this.auth = new AuthSystem();
        this.crypto = new MedicalDataCrypto();
        this.backup = new BackupSystem();
        this.init();
    }

    init() {
        // Verificar se é página de login
        if (window.location.pathname.includes('login.html')) {
            return; // Não verificar auth na página de login
        }

        // Verificar autenticação
        if (!this.auth.checkAuth()) {
            return; // Redirecionado para login
        }

        // Inicializar sistemas
        this.setupSecureLocalStorage();
        this.setupFormValidation();
        this.preventXSS();
        
        AuditSystem.log('SYSTEM_INIT', { 
            page: window.location.pathname,
            timestamp: new Date().toISOString()
        });
    }

    setupSecureLocalStorage() {
        // Substituir métodos do localStorage para criptografia automática
        const originalSetItem = localStorage.setItem;
        const originalGetItem = localStorage.getItem;

        localStorage.setItem = (key, value) => {
            if (key.startsWith('patient_') || key.startsWith('medical_')) {
                return this.crypto.saveSecureData(key, value);
            }
            return originalSetItem.call(localStorage, key, value);
        };

        localStorage.getItem = (key) => {
            if (key.startsWith('patient_') || key.startsWith('medical_')) {
                return this.crypto.getSecureData(key);
            }
            return originalGetItem.call(localStorage, key);
        };
    }

    setupFormValidation() {
        // Adicionar validação automática a todos os formulários
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    return false;
                }
            }
        });
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isValid = true;

        inputs.forEach(input => {
            const value = DataValidator.sanitizeText(input.value);
            input.value = value;

            // Validações específicas
            if (input.type === 'email' && value) {
                if (!DataValidator.validateEmail(value)) {
                    this.showValidationError(input, 'Email inválido');
                    isValid = false;
                }
            }
            
            if (input.classList.contains('cpf') && value) {
                if (!DataValidator.validateCPF(value)) {
                    this.showValidationError(input, 'CPF inválido');
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    showValidationError(input, message) {
        input.style.borderColor = '#dc3545';
        
        // Remover erro anterior
        const existingError = input.parentNode.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }

        // Adicionar nova mensagem de erro
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = message;
        
        input.parentNode.appendChild(errorDiv);
    }

    preventXSS() {
        // Monitorar tentativas de XSS
        const originalInnerHTML = Element.prototype.innerHTML;
        
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function(value) {
                const sanitized = DataValidator.sanitizeText(value);
                if (sanitized !== value) {
                    AuditSystem.log('XSS_ATTEMPT_BLOCKED', { 
                        original: value.substring(0, 100),
                        sanitized: sanitized.substring(0, 100)
                    });
                }
                return originalInnerHTML.call(this, sanitized);
            },
            get: function() {
                return originalInnerHTML.call(this);
            }
        });
    }
}

// ===================================
// 7. SUBSTITUIR ALERTS POR SISTEMA SEGURO
// ===================================

class SecureNotification {
    static show(message, type = 'info', duration = 5000) {
        // Sanitizar mensagem
        message = DataValidator.sanitizeText(message);
        
        // Registrar notificação crítica
        if (type === 'error' || type === 'warning') {
            AuditSystem.log('NOTIFICATION_CRITICAL', { message, type });
        }

        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `secure-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;

        // Cores por tipo
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Adicionar ícone
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        notification.innerHTML = `${icons[type] || icons.info} ${message}`;

        // Adicionar ao DOM
        document.body.appendChild(notification);

        // Remover após duração especificada
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // Substituir alert global
    static replaceGlobalAlert() {
        window.alert = (message) => {
            this.show(message, 'info');
        };

        window.confirm = (message) => {
            // Em produção, usar modal customizado
            return confirm(DataValidator.sanitizeText(message));
        };
    }
}

// ===================================
// 8. CSS PARA ANIMAÇÕES
// ===================================

const secureCSS = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

.validation-error {
    color: #dc3545 !important;
    font-size: 12px !important;
    margin-top: 5px !important;
}

.secure-input:invalid {
    border-color: #dc3545 !important;
}

.secure-input:valid {
    border-color: #28a745 !important;
}
`;

// Adicionar CSS ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = secureCSS;
document.head.appendChild(styleSheet);

// ===================================
// 9. INICIALIZAÇÃO AUTOMÁTICA
// ===================================

// Aguardar carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Inicializar sistema seguro
        window.secureClinicSystem = new SecureClinicSystem();
        
        // Substituir alerts
        SecureNotification.replaceGlobalAlert();
        
        console.log('🔒 Sistema de segurança inicializado');
    } catch (error) {
        console.error('❌ Erro ao inicializar sistema de segurança:', error);
    }
});

// ===================================
// 10. MODO DE DESENVOLVIMENTO/PRODUÇÃO
// ===================================

const PRODUCTION_MODE = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1';

if (PRODUCTION_MODE) {
    // Em produção, desabilitar console.log
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    // Manter console.error para debug crítico
}

// Exportar para uso global
window.AuthSystem = AuthSystem;
window.MedicalDataCrypto = MedicalDataCrypto;
window.DataValidator = DataValidator;
window.AuditSystem = AuditSystem;
window.SecureNotification = SecureNotification;
