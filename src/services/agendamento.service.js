// src/services/agendamento.service.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class AgendamentoService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar respostas e renovar token
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const { token } = response.data;
              localStorage.setItem('token', token);

              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh token is invalid, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Listar agendamentos com filtros
  async listarAgendamentos(filtros = {}) {
    const params = new URLSearchParams();
    
    // Adicionar filtros como parâmetros de query
    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
        params.append(key, filtros[key]);
      }
    });

    return this.api.get(`/agendamentos?${params.toString()}`);
  }

  // Buscar agendamento por ID
  async buscarAgendamentoPorId(id) {
    return this.api.get(`/agendamentos/${id}`);
  }

  // Criar novo agendamento
  async criarAgendamento(dados) {
    return this.api.post('/agendamentos', dados);
  }

  // Atualizar agendamento
  async atualizarAgendamento(id, dados) {
    return this.api.put(`/agendamentos/${id}`, dados);
  }

  // Cancelar agendamento
  async cancelarAgendamento(id, motivo) {
    return this.api.delete(`/agendamentos/${id}`, { data: { motivo } });
  }

  // Reagendar consulta
  async reagendarAgendamento(id, nova_data_hora, motivo) {
    return this.api.patch(`/agendamentos/${id}/reagendar`, { nova_data_hora, motivo });
  }

  // Confirmar agendamento
  async confirmarAgendamento(id) {
    return this.api.patch(`/agendamentos/${id}/confirmar`);
  }

  // Iniciar consulta
  async iniciarConsulta(id) {
    return this.api.patch(`/agendamentos/${id}/iniciar`);
  }

  // Finalizar consulta
  async finalizarConsulta(id, dados) {
    return this.api.patch(`/agendamentos/${id}/finalizar`, dados);
  }

  // Buscar disponibilidade de horários
  async obterDisponibilidade(data_inicio, data_fim) {
    return this.api.get('/agendamentos/disponibilidade', { 
      params: { data_inicio, data_fim } 
    });
  }

  // Buscar estatísticas de agendamentos
  async obterEstatisticas(periodo = '30') {
    return this.api.get('/agendamentos/estatisticas', { 
      params: { periodo } 
    });
  }

  // Buscar histórico do paciente
  async obterHistoricoPaciente(paciente_id) {
    return this.api.get(`/agendamentos/paciente/${paciente_id}`);
  }

  // Buscar agendamentos por período
  async buscarPorPeriodo(data_inicio, data_fim, filtros = {}) {
    const params = {
      data_inicio,
      data_fim,
      ...filtros
    };

    return this.api.get('/agendamentos/periodo', { params });
  }

  // Buscar próximos agendamentos
  async proximosAgendamentos(limite = 5) {
    return this.api.get('/agendamentos/proximos', { 
      params: { limite } 
    });
  }

  // Buscar agendamentos de hoje
  async agendamentosHoje() {
    return this.api.get('/agendamentos/hoje');
  }

  // Verificar conflitos de horário
  async verificarConflitos(data_hora, duracao, paciente_id, agendamento_id = null) {
    return this.api.post('/agendamentos/verificar-conflitos', {
      data_hora,
      duracao,
      paciente_id,
      agendamento_id
    });
  }

  // Buscar horários disponíveis para um dia específico
  async horariosDisponiveis(data, profissional_id = null) {
    const params = { data };
    if (profissional_id) {
      params.profissional_id = profissional_id;
    }

    return this.api.get('/agendamentos/horarios-disponiveis', { params });
  }

  // Atualizar status do agendamento
  async atualizarStatus(id, status, observacoes = null) {
    return this.api.patch(`/agendamentos/${id}/status`, { 
      status, 
      observacoes 
    });
  }

  // Enviar lembrete por email/SMS
  async enviarLembrete(id, tipo = 'email') {
    return this.api.post(`/agendamentos/${id}/lembrete`, { tipo });
  }

  // Buscar agendamentos pendentes de confirmação
  async agendamentosPendentes() {
    return this.api.get('/agendamentos/pendentes');
  }

  // Relatório de agendamentos
  async relatorioAgendamentos(filtros = {}) {
    return this.api.get('/agendamentos/relatorio', { 
      params: filtros,
      responseType: 'blob' // Para download de PDF/Excel
    });
  }
}

// Criar instância única do serviço
const agendamentoService = new AgendamentoService();

export default agendamentoService;
