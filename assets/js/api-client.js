// 🚀 API Client - Versão Produção
// Arquivo: /assets/js/api-client.js

window.ApiClient = (function() {
    // Obter configurações da janela global
    const config = window.PORTAL_CONFIG || {};
    
    // Configuração padrão
    const API_CONFIG = {
        baseUrl: config.API?.BASE_URL || '/api',
        timeout: config.API?.TIMEOUT || 30000,
        retryAttempts: config.API?.RETRY_ATTEMPTS || 3,
        retryDelay: config.API?.RETRY_DELAY || 1000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    };
    
    // Controle de tokens de autenticação
    let authToken = null;
    
    // Utilitário para carregar token do localStorage
    function loadAuthToken() {
        try {
            const userData = JSON.parse(localStorage.getItem('clinica_user_data'));
            if (userData && userData.token) {
                authToken = userData.token;
                return true;
            }
        } catch (error) {
            console.warn('Erro ao carregar token:', error);
        }
        return false;
    }
    
    // Inicializar token na carga do script
    loadAuthToken();
    
    // Configurar função para atualizar token
    function setAuthToken(token) {
        authToken = token;
    }
    
    // Utilitário para adicionar token de autenticação
    function getAuthHeaders() {
        if (!authToken) {
            loadAuthToken();
        }
        
        return authToken ? { 
            'Authorization': `Bearer ${authToken}` 
        } : {};
    }
    
    // Função base para requisições fetch com retry
    async function fetchWithRetry(url, options, attempts = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
            
            const fetchOptions = { 
                ...options,
                signal: controller.signal
            };
            
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            
            // Se a resposta for 401 (não autorizado), limpar token
            if (response.status === 401) {
                authToken = null;
            }
            
            return response;
        } catch (error) {
            // Se ainda temos tentativas e não foi cancelamento manual
            if (attempts < API_CONFIG.retryAttempts && error.name !== 'AbortError') {
                // Esperar antes de tentar novamente
                await new Promise(r => setTimeout(r, API_CONFIG.retryDelay * Math.pow(2, attempts)));
                return fetchWithRetry(url, options, attempts + 1);
            }
            
            throw error;
        }
    }
    
    // Criar URL completa com base URL
    function createUrl(endpoint) {
        // Remover barras duplicadas entre base e endpoint
        const baseUrl = API_CONFIG.baseUrl.endsWith('/') 
            ? API_CONFIG.baseUrl.slice(0, -1) 
            : API_CONFIG.baseUrl;
            
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${baseUrl}${path}`;
    }
    
    // Métodos públicos para requisições HTTP
    return {
        // Configuração
        setAuthToken,
        
        // GET request
        async get(endpoint, options = {}) {
            const url = createUrl(endpoint);
            const headers = { 
                ...API_CONFIG.headers, 
                ...getAuthHeaders(), 
                ...options.headers 
            };
            
            const response = await fetchWithRetry(url, {
                method: 'GET',
                headers,
                credentials: 'include',
                ...options
            });
            
            return response.json();
        },
        
        // POST request
        async post(endpoint, data = {}, options = {}) {
            const url = createUrl(endpoint);
            const headers = { 
                ...API_CONFIG.headers, 
                ...getAuthHeaders(), 
                ...options.headers 
            };
            
            const response = await fetchWithRetry(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
                credentials: 'include',
                ...options
            });
            
            return response.json();
        },
        
        // PUT request
        async put(endpoint, data = {}, options = {}) {
            const url = createUrl(endpoint);
            const headers = { 
                ...API_CONFIG.headers, 
                ...getAuthHeaders(), 
                ...options.headers 
            };
            
            const response = await fetchWithRetry(url, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data),
                credentials: 'include',
                ...options
            });
            
            return response.json();
        },
        
        // DELETE request
        async delete(endpoint, options = {}) {
            const url = createUrl(endpoint);
            const headers = { 
                ...API_CONFIG.headers, 
                ...getAuthHeaders(), 
                ...options.headers 
            };
            
            const response = await fetchWithRetry(url, {
                method: 'DELETE',
                headers,
                credentials: 'include',
                ...options
            });
            
            return response.json();
        }
    };
})();
