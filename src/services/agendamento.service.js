// src/services/agendamento.service.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

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

    // Interceptor para tratar respostas
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado, redirecionar para login
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Criar novo agendamento
  async criarAgendamento(dadosAgendamento) {
    try {
      const response = await this.api.post('/agendamentos', dadosAgendamento);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Listar agendamentos com filtros
  async listarAgendamentos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.origem) params.append('origem', filtros.origem);

      const response = await this.api.get(`/agendamentos?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obter disponibilidade do calendário
  async obterDisponibilidade(dataInicio, dataFim) {
    try {
      const response = await this.api.get('/agendamentos/disponibilidade', {
        params: {
          data_inicio: dataInicio,
          data_fim: dataFim
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Atualizar status do agendamento
  async atualizarStatus(id, status, observacoes = null) {
    try {
      const response = await this.api.patch(`/agendamentos/${id}/status`, {
        status,
        observacoes
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Confirmar agendamento
  async confirmarAgendamento(id) {
    try {
      const response = await this.api.patch(`/agendamentos/${id}/confirmar`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obter agendamentos de hoje
  async obterAgendamentosHoje() {
    try {
      const response = await this.api.get('/agendamentos/hoje');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obter configuração do calendário
  async obterConfiguracaoCalendario() {
    try {
      const response = await this.api.get('/calendario/config');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Atualizar configuração do calendário
  async atualizarConfiguracaoCalendario(configuracao) {
    try {
      const response = await this.api.put('/calendario/config', {
        configuracao
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Buscar agendamento por ID
  async buscarAgendamentoPorId(id) {
    try {
      const response = await this.api.get(`/agendamentos/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Cancelar agendamento
  async cancelarAgendamento(id, motivo) {
    try {
      const response = await this.api.patch(`/agendamentos/${id}/status`, {
        status: 'cancelado',
        observacoes: motivo
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Reagendar consulta
  async reagendarAgendamento(id, novaData, novaHora, motivo) {
    try {
      const response = await this.api.patch(`/agendamentos/${id}`, {
        data_agendamento: novaData,
        hora_agendamento: novaHora,
        status: 'reagendado',
        observacoes: motivo
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Marcar como realizado
  async marcarRealizado(id, observacoes = null) {
    try {
      const response = await this.api.patch(`/agendamentos/${id}/status`, {
        status: 'realizado',
        observacoes
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Marcar falta
  async marcarFalta(id, observacoes = null) {
    try {
      const response = await this.api.patch(`/agendamentos/${id}/status`, {
        status: 'falta',
        observacoes
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Verificar disponibilidade de horário específico
  async verificarDisponibilidade(data, hora) {
    try {
      const response = await this.api.get('/agendamentos/verificar-disponibilidade', {
        params: { data_agendamento: data, hora_agendamento: hora }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obter estatísticas do dashboard
  async obterEstatisticas(periodo = 'mes') {
    try {
      const response = await this.api.get('/agendamentos/estatisticas', {
        params: { periodo }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obter próximos agendamentos
  async obterProximosAgendamentos(limite = 5) {
    try {
      const response = await this.api.get('/agendamentos/proximos', {
        params: { limite }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Buscar conflitos de horário
  async buscarConflitos(data, horaInicio, horaFim) {
    try {
      const response = await this.api.get('/agendamentos/conflitos', {
        params: {
          data,
          hora_inicio: horaInicio,
          hora_fim: horaFim
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obter agendamentos pendentes
  async obterAgendamentosPendentes() {
    try {
      const response = await this.api.get('/agendamentos/pendentes');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obter histórico do paciente
  async obterHistoricoPaciente(pacienteId) {
    try {
      const response = await this.api.get(`/agendamentos/paciente/${pacienteId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Enviar lembrete
  async enviarLembrete(id, tipo = 'email') {
    try {
      const response = await this.api.post(`/agendamentos/${id}/lembrete`, { tipo });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Gerar relatório
  async gerarRelatorio(filtros = {}) {
    try {
      const response = await this.api.get('/agendamentos/relatorio', {
        params: filtros,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Helper para tratamento de erros
  handleError(error) {
    if (error.response) {
      // Erro retornado pelo servidor
      return {
        message: error.response.data.message || 'Erro do servidor',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Erro de rede
      return {
        message: 'Erro de conexão com o servidor',
        status: 0,
        data: null
      };
    } else {
      // Outros erros
      return {
        message: error.message || 'Erro desconhecido',
        status: 0,
        data: null
      };
    }
  }
}

export default new AgendamentoService();
