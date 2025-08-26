// Sistema Principal - Portal Médico Dr. Marcio Scartozzoni
console.log('🏥 Sistema Principal Carregado');

// Funções globais do sistema
window.PortalMedico = {
    // Inicializar sistema
    init: function() {
        console.log('🚀 Portal Médico Inicializado');
        this.verificarAutenticacao();
        this.carregarConfiguracoes();
    },

    // Verificar autenticação
    verificarAutenticacao: function() {
        // Sistema de autenticação básico
        if (typeof auth !== 'undefined' && auth.getCurrentUser) {
            const user = auth.getCurrentUser();
            if (user && user.id) {
                console.log('✅ Usuário autenticado:', user.nome);
                return true;
            }
        }
        console.log('⚠️ Usuário não autenticado');
        return false;
    },

    // Carregar configurações
    carregarConfiguracoes: function() {
        // Configurações padrão do sistema
        window.Config = {
            apiUrl: 'http://localhost:8000',
            version: '1.0.0',
            debug: true
        };
        console.log('⚙️ Configurações carregadas');
    },

    // Notificações
    notify: function(message, type = 'info') {
        if (typeof SecureNotification !== 'undefined') {
            SecureNotification.show(message);
        } else {
            alert(message);
        }
    },

    // Utilitários
    utils: {
        formatDate: function(date) {
            return new Date(date).toLocaleDateString('pt-BR');
        },
        
        formatCurrency: function(value) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value);
        },

        generateId: function() {
            return 'id_' + Math.random().toString(36).substr(2, 9);
        }
    }
};

// Auto-inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    PortalMedico.init();
});

// Funções globais para compatibilidade
function mostrarLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function esconderLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function salvarDados(dados, chave = 'dados_portal') {
    try {
        localStorage.setItem(chave, JSON.stringify(dados));
        return true;
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        return false;
    }
}

function carregarDados(chave = 'dados_portal') {
    try {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : null;
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        return null;
    }
}

console.log('✅ Main.js carregado com sucesso!');
