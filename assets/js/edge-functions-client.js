// 🚀 Edge Functions Client - Wrapper para facilitar chamadas às Edge Functions do Supabase
// Este arquivo facilita o consumo das Edge Functions em todo o projeto

window.EdgeFunctionsClient = (function() {
    // Obter configurações da janela global
    const config = window.PORTAL_CONFIG || {};
    
    // Configuração padrão para requisições
    const DEFAULT_CONFIG = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
            'apikey': config.SUPABASE_ANON_KEY
        },
        timeout: config.API?.TIMEOUT || 30000,
        retryAttempts: config.API?.RETRY_ATTEMPTS || 3,
        retryDelay: config.API?.RETRY_DELAY || 1000
    };
    
    // Função utilitária para obter token de autenticação
    function getAuthToken() {
        try {
            // Tenta recuperar do localStorage
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            return userInfo.token || '';
        } catch (error) {
            console.warn('Erro ao recuperar token de autenticação:', error);
            return '';
        }
    }
    
    // Função genérica para chamadas às Edge Functions
    async function callEdgeFunction(url, data = {}, options = {}) {
        try {
            // Configurar headers com token de autenticação
            const headers = { 
                ...DEFAULT_CONFIG.headers, 
                ...options.headers 
            };
            
            // Adicionar token de usuário se disponível
            const authToken = getAuthToken();
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            // Timeout para a requisição
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(), 
                options.timeout || DEFAULT_CONFIG.timeout
            );
            
            // Fazer a requisição
            const response = await fetch(url, {
                method: options.method || 'POST',
                headers,
                body: JSON.stringify(data),
                signal: controller.signal
            });
            
            // Limpar timeout
            clearTimeout(timeoutId);
            
            // Checar se a resposta foi bem-sucedida
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Erro ao chamar Edge Function [${url}]:`, error);
            
            // Implementar retentativas para erros de rede
            if (
                options.retry !== false && 
                (options.retryCount || 0) < (options.retryAttempts || DEFAULT_CONFIG.retryAttempts) &&
                (error.name === 'AbortError' || error.message.includes('network'))
            ) {
                // Esperar antes de tentar novamente
                const delay = (options.retryDelay || DEFAULT_CONFIG.retryDelay) * Math.pow(2, options.retryCount || 0);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Recursivamente tentar novamente com contador incrementado
                return callEdgeFunction(url, data, {
                    ...options,
                    retryCount: (options.retryCount || 0) + 1
                });
            }
            
            // Retornar erro estruturado
            return { 
                success: false, 
                error: error.message || 'Erro desconhecido',
                code: error.code || 'UNKNOWN_ERROR'
            };
        }
    }
    
    // API pública exposta
    return {
        // Autenticação e administração
        adminAuth: (data) => callEdgeFunction(config.EDGE_FUNCTIONS.ADMIN_AUTH, data),
        
        // Agendamento
        findAvailableSlots: (data) => callEdgeFunction(config.EDGE_FUNCTIONS.FIND_AVAILABLE_SLOTS, data),
        bookSlot: (data) => callEdgeFunction(config.EDGE_FUNCTIONS.BOOK_SLOT, data),
        createAppointment: (data) => callEdgeFunction(config.EDGE_FUNCTIONS.CREATE_APPOINTMENT, data),
        getMonthlyAppointments: (data) => callEdgeFunction(config.EDGE_FUNCTIONS.GET_MONTHLY_APPOINTMENTS, data),
        getSimplifiedSchedule: (data) => callEdgeFunction(config.EDGE_FUNCTIONS.SIMPLIFIED_SCHEDULE, data),
        
        // Videochamada
        createWherebyMeeting: (data) => callEdgeFunction(config.EDGE_FUNCTIONS.CREATE_WHEREBY_MEETING, data),
        
        // Comunicações
        resendEmail: (data) => callEdgeFunction(config.EDGE_FUNCTIONS.RESEND_EMAIL, data),
        
        // Método genérico para permitir chamadas a qualquer Edge Function
        call: (url, data, options = {}) => callEdgeFunction(url, data, options)
    };
})();

// Adicionar log de inicialização
console.log('🚀 Edge Functions Client inicializado');
