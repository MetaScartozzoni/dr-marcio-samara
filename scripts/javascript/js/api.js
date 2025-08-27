// API Client - Portal Médico Dr. Marcio Scartozzoni
// Cliente para comunicação com a API FastAPI

window.API = {
    baseURL: window.PORTAL_CONFIG?.API?.BASE_URL || '/api',
    timeout: window.PORTAL_CONFIG?.API?.TIMEOUT || 30000,

    // Headers padrão
    getHeaders: function() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Adicionar token de autenticação se disponível
        const token = Utils.storage.get(window.PORTAL_CONFIG?.AUTH?.TOKEN_KEY || 'portal_medico_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    },

    // Método genérico para fazer requisições
    request: async function(method, endpoint, data = null) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            method: method.toUpperCase(),
            headers: this.getHeaders(),
            signal: AbortSignal.timeout(this.timeout)
        };

        if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            config.body = JSON.stringify(data);
        }

        try {
            console.log(`🔄 ${method.toUpperCase()} ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ ${method.toUpperCase()} ${url} - Success`);
            return result;

        } catch (error) {
            console.error(`❌ ${method.toUpperCase()} ${url} - Error:`, error);
            
            // Tratamento de erros específicos
            if (error.name === 'AbortError') {
                Utils.notify.error('Requisição expirou. Tente novamente.');
            } else if (error.message.includes('401')) {
                Utils.notify.error('Sessão expirada. Faça login novamente.');
                // Redirecionar para login se necessário
            } else if (error.message.includes('403')) {
                Utils.notify.error('Acesso negado.');
            } else if (error.message.includes('404')) {
                Utils.notify.error('Recurso não encontrado.');
            } else if (error.message.includes('500')) {
                Utils.notify.error('Erro interno do servidor. Tente novamente.');
            } else {
                Utils.notify.error(error.message || 'Erro na comunicação com o servidor.');
            }
            
            throw error;
        }
    },

    // Métodos HTTP específicos
    get: function(endpoint) {
        return this.request('GET', endpoint);
    },

    post: function(endpoint, data) {
        return this.request('POST', endpoint, data);
    },

    put: function(endpoint, data) {
        return this.request('PUT', endpoint, data);
    },

    patch: function(endpoint, data) {
        return this.request('PATCH', endpoint, data);
    },

    delete: function(endpoint) {
        return this.request('DELETE', endpoint);
    },

    // APIs específicas do sistema
    
    // Health Check
    health: function() {
        return this.get('/health');
    },

    // Info da API
    info: function() {
        return this.get('/info');
    },

    // === PACIENTES ===
    pacientes: {
        // Listar todos os pacientes
        list: function(page = 1, limit = 20) {
            return API.get(`/pacientes?page=${page}&limit=${limit}`);
        },

        // Buscar paciente por ID
        get: function(id) {
            return API.get(`/pacientes/${id}`);
        },

        // Criar novo paciente
        create: function(data) {
            return API.post('/pacientes/', data);
        },

        // Atualizar paciente
        update: function(id, data) {
            return API.put(`/pacientes/${id}`, data);
        },

        // Deletar paciente
        delete: function(id) {
            return API.delete(`/pacientes/${id}`);
        },

        // Buscar pacientes por nome
        search: function(query) {
            return API.get(`/pacientes/search?q=${encodeURIComponent(query)}`);
        }
    },

    // === AGENDAMENTOS ===
    agendamentos: {
        // Listar agendamentos
        list: function(page = 1, limit = 20, data = null) {
            let url = `/agendamentos?page=${page}&limit=${limit}`;
            if (data) {
                url += `&data=${data}`;
            }
            return API.get(url);
        },

        // Buscar agendamento por ID
        get: function(id) {
            return API.get(`/agendamentos/${id}`);
        },

        // Criar agendamento
        create: function(data) {
            return API.post('/agendamentos/', data);
        },

        // Atualizar agendamento
        update: function(id, data) {
            return API.put(`/agendamentos/${id}`, data);
        },

        // Deletar agendamento
        delete: function(id) {
            return API.delete(`/agendamentos/${id}`);
        },

        // Agendamentos por paciente
        byPaciente: function(pacienteId) {
            return API.get(`/pacientes/${pacienteId}/agendamentos`);
        },

        // Agendamentos do dia
        hoje: function() {
            const hoje = new Date().toISOString().split('T')[0];
            return this.list(1, 100, hoje);
        }
    },

    // === PRONTUÁRIOS ===
    prontuarios: {
        // Listar prontuários
        list: function(page = 1, limit = 20) {
            return API.get(`/prontuarios?page=${page}&limit=${limit}`);
        },

        // Buscar prontuário por ID
        get: function(id) {
            return API.get(`/prontuarios/${id}`);
        },

        // Criar prontuário
        create: function(data) {
            return API.post('/prontuarios/', data);
        },

        // Atualizar prontuário
        update: function(id, data) {
            return API.put(`/prontuarios/${id}`, data);
        },

        // Prontuários por paciente
        byPaciente: function(pacienteId) {
            return API.get(`/pacientes/${pacienteId}/prontuarios`);
        }
    },

    // === RELATÓRIOS ===
    relatorios: {
        // Relatório de agendamentos
        agendamentos: function(dataInicio, dataFim) {
            return API.get(`/relatorios/agendamentos?inicio=${dataInicio}&fim=${dataFim}`);
        },

        // Relatório financeiro
        financeiro: function(mes, ano) {
            return API.get(`/relatorios/financeiro?mes=${mes}&ano=${ano}`);
        },

        // Relatório de pacientes
        pacientes: function() {
            return API.get('/relatorios/pacientes');
        }
    },

    // Utilitários para desenvolvimento
    dev: {
        // Testar conexão
        ping: async function() {
            try {
                const result = await API.health();
                Utils.notify.success('Conexão com API estabelecida!');
                return result;
            } catch (error) {
                Utils.notify.error('Falha na conexão com API');
                return null;
            }
        },

        // Obter informações da API
        info: async function() {
            try {
                const result = await API.info();
                console.table(result);
                return result;
            } catch (error) {
                console.error('Erro ao obter informações da API:', error);
                return null;
            }
        }
    }
};

// Auto-teste da API em desenvolvimento
if (window.PORTAL_CONFIG?.SYSTEM?.DEBUG) {
    // Testar conexão após 2 segundos
    setTimeout(() => {
        API.dev.ping();
    }, 2000);
}

console.log('🔌 API Client carregado');
