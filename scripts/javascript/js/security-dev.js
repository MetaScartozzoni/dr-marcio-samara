// 🔧 SISTEMA DE SEGURANÇA SIMPLIFICADO - MODO DESENVOLVIMENTO
// ⚠️  APENAS PARA TESTES - NÃO USAR EM PRODUÇÃO

// Modo desenvolvimento - Autenticação desabilitada
console.log('🔓 Portal em modo desenvolvimento - Autenticação desabilitada');

// Classe de autenticação simplificada
class AuthSystem {
    constructor() {
        this.devMode = false; // Habilitando autenticação real
        console.log('🔧 AuthSystem iniciado com login funcional');
    }

    checkAuth() {
        // Verificar se é página de login
        if (window.location.pathname.includes('login.html')) {
            return true; // Não verificar auth na página de login
        }

        const token = localStorage.getItem('clinica_auth_token') || 
                     sessionStorage.getItem('clinica_auth_token');
        const userData = JSON.parse(
            localStorage.getItem('clinica_user_data') || 
            sessionStorage.getItem('clinica_user_data') || '{}'
        );

        if (!token || !userData.id) {
            console.log('🔒 Usuário não autenticado, redirecionando para login');
            this.redirectToLogin();
            return false;
        }

        console.log('✅ Usuário autenticado:', userData.nome, '(' + userData.tipo + ')');
        return true;
    }

    redirectToLogin() {
        if (window.location.pathname !== '/login.html' && !window.location.pathname.endsWith('login.html')) {
            window.location.href = 'login.html';
        }
    }

    logout() {
        localStorage.removeItem('clinica_auth_token');
        localStorage.removeItem('clinica_user_data');
        sessionStorage.removeItem('clinica_auth_token');
        sessionStorage.removeItem('clinica_user_data');
        console.log('🚪 Logout realizado');
        this.redirectToLogin();
    }

    getCurrentUser() {
        return JSON.parse(
            localStorage.getItem('clinica_user_data') || 
            sessionStorage.getItem('clinica_user_data') || '{}'
        );
    }

    hasPermission(permission) {
        const userData = this.getCurrentUser();
        if (!userData.permissoes) return false;
        
        return userData.permissoes.includes('all') || userData.permissoes.includes(permission);
    }
}

// Sistema de notificações seguras
class SecureNotification {
    static show(message, type = 'info') {
        console.log(`📢 [${type.toUpperCase()}] ${message}`);
        
        // Criar notificação visual simples
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            font-family: 'Segoe UI', sans-serif;
            white-space: pre-line;
            word-wrap: break-word;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Permitir fechar clicando
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    static success(message) {
        this.show(message, 'success');
    }

    static error(message) {
        this.show(message, 'error');
    }

    static warning(message) {
        this.show(message, 'warning');
    }
}

// Validador de dados simplificado
class DataValidator {
    static validateCPF(cpf) {
        // Validação básica de CPF
        const cleanCPF = cpf.replace(/\D/g, '');
        return cleanCPF.length === 11 && !/^(\d)\1{10}$/.test(cleanCPF);
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePhone(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        return cleanPhone.length >= 10;
    }

    static sanitizeText(text) {
        return text.replace(/<script[^>]*>.*?<\/script>/gi, '')
                  .replace(/<[^>]+>/g, '')
                  .trim();
    }

    static validateCurrency(value) {
        return !isNaN(value) && value >= 0;
    }
}

// Sistema de auditoria simplificado
class AuditSystem {
    static log(action, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            user: 'dev-user',
            ip: 'localhost'
        };
        
        console.log('📝 Audit Log:', logEntry);
        
        // Em produção, isso seria enviado para o servidor
        if (typeof localStorage !== 'undefined') {
            const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
            logs.push(logEntry);
            // Manter apenas os últimos 100 logs
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }
            localStorage.setItem('audit_logs', JSON.stringify(logs));
        }
    }

    static getLogs() {
        if (typeof localStorage !== 'undefined') {
            return JSON.parse(localStorage.getItem('audit_logs') || '[]');
        }
        return [];
    }
}

// Inicializar sistema
const auth = new AuthSystem();

// Inicialização automática quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 Portal Dr. Marcio Scartozzoni - Sistema iniciado');
    
    // Verificar autenticação
    if (!auth.checkAuth()) {
        return; // Se não autenticado, já foi redirecionado
    }
    
    console.log('🔧 Modo: Produção com Login');
    console.log('🔒 Sistema de autenticação ativo');
    
    const userData = auth.getCurrentUser();
    if (userData.nome) {
        SecureNotification.show(`🏥 Bem-vindo, ${userData.nome}!\n\n✅ Acesso autorizado\n� Sessão segura ativa`, 'success');
    }
    
    // Log de auditoria
    AuditSystem.log('SYSTEM_START', {
        mode: 'production',
        user: userData.nome || 'unknown',
        timestamp: new Date().toISOString()
    });
});

// Exportar globalmente para compatibilidade
window.AuthSystem = AuthSystem;
window.SecureNotification = SecureNotification;
window.DataValidator = DataValidator;
window.AuditSystem = AuditSystem;
