// 🚀 Configuração da API Supabase - Versão Produção
// Arquivo: /assets/js/supabase-client.js

(function() {
    // Carregar a biblioteca Supabase a partir do CDN se necessário
    async function loadSupabaseScript() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Inicializar cliente Supabase
    async function initializeSupabaseClient() {
        try {
            await loadSupabaseScript();
            
            // Obter configurações da janela global
            const config = window.PORTAL_CONFIG || {};
            const supabaseUrl = config.SUPABASE_URL;
            const supabaseKey = config.SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                throw new Error('Supabase URL ou chave anônima não configuradas');
            }
            
            // Criar cliente Supabase
            window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log('✅ Supabase Cliente inicializado com sucesso');
            
            // Disparar evento para notificar outros scripts que o Supabase está pronto
            const event = new CustomEvent('supabase_initialized');
            document.dispatchEvent(event);
            
            return window.supabaseClient;
        } catch (error) {
            console.error('❌ Erro ao inicializar cliente Supabase:', error);
            return null;
        }
    }
    
    // Função auxiliar para verificar o estado da conexão
    async function checkConnection() {
        try {
            if (!window.supabaseClient) {
                throw new Error('Cliente Supabase não inicializado');
            }
            
            // Teste simples de conexão
            const { data, error } = await window.supabaseClient.from('system_status').select('status').limit(1);
            
            if (error) throw error;
            return { connected: true, data };
        } catch (error) {
            console.warn('⚠️ Conexão com Supabase indisponível:', error.message);
            return { connected: false, error: error.message };
        }
    }
    
    // API pública para uso externo
    window.SupabaseAPI = {
        getClient: () => window.supabaseClient,
        initialize: initializeSupabaseClient,
        checkConnection
    };
    
    // Auto-inicializar quando o documento estiver pronto
    document.addEventListener('DOMContentLoaded', initializeSupabaseClient);
})();
