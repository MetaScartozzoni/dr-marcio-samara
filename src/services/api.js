// src/services/api.js
import axios from 'axios';

// Configuração base da API
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://awesome-aurora-465200-q9.uc.r.appspot.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      // Acesso negado
      console.error('Acesso negado:', error.response.data);
    }
    
    if (error.response?.status >= 500) {
      // Erro do servidor
      console.error('Erro do servidor:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Métodos específicos para agendamentos
export const agendamentoAPI = {
  // Buscar todos os agendamentos
  buscarTodos: (filtros = {}) => {
    const params = new URLSearchParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) params.append(key, filtros[key]);
    });
    return api.get(`/agendamentos?${params.toString()}`);
  },

  // Buscar agendamento por ID
  buscarPorId: (id) => api.get(`/agendamentos/${id}`),

  // Criar novo agendamento
  criar: (dados) => api.post('/agendamentos', dados),

  // Atualizar agendamento
  atualizar: (id, dados) => api.put(`/agendamentos/${id}`, dados),

  // Cancelar agendamento
  cancelar: (id, motivo) => api.delete(`/agendamentos/${id}`, { data: { motivo } }),

  // Reagendar consulta
  reagendar: (id, nova_data_hora, motivo) => 
    api.patch(`/agendamentos/${id}/reagendar`, { nova_data_hora, motivo }),

  // Confirmar agendamento
  confirmar: (id) => api.patch(`/agendamentos/${id}/confirmar`),

  // Iniciar consulta
  iniciar: (id) => api.patch(`/agendamentos/${id}/iniciar`),

  // Finalizar consulta
  finalizar: (id, dados) => api.patch(`/agendamentos/${id}/finalizar`, dados),

  // Buscar disponibilidade
  disponibilidade: (data_inicio, data_fim) => 
    api.get('/agendamentos/disponibilidade', { params: { data_inicio, data_fim } }),

  // Buscar estatísticas
  estatisticas: (periodo = '30') => 
    api.get('/agendamentos/estatisticas', { params: { periodo } }),

  // Buscar histórico do paciente
  historicoPaciente: (paciente_id) => 
    api.get(`/agendamentos/paciente/${paciente_id}`),

  // Agenda do dia
  agendaDia: (data) => 
    api.get('/agendamentos/agenda-dia', { params: { data } }),

  // Notificar paciente
  notificar: (id, tipo) => 
    api.post(`/agendamentos/${id}/notificar`, { tipo }),
};

// Métodos específicos para usuários/pacientes
export const usuarioAPI = {
  // Buscar todos os usuários
  buscarTodos: (filtros = {}) => {
    const params = new URLSearchParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) params.append(key, filtros[key]);
    });
    return api.get(`/usuarios?${params.toString()}`);
  },

  // Buscar usuário por ID
  buscarPorId: (id) => api.get(`/usuarios/${id}`),

  // Criar usuário
  criar: (dados) => api.post('/usuarios', dados),

  // Atualizar usuário
  atualizar: (id, dados) => api.put(`/usuarios/${id}`, dados),

  // Buscar pacientes
  buscarPacientes: () => api.get('/usuarios?role=patient'),

  // Buscar perfil atual
  perfil: () => api.get('/usuarios/perfil'),
};

// Métodos específicos para serviços
export const servicoAPI = {
  // Buscar todos os serviços
  buscarTodos: () => api.get('/servicos'),

  // Buscar serviço por ID
  buscarPorId: (id) => api.get(`/servicos/${id}`),

  // Criar serviço
  criar: (dados) => api.post('/servicos', dados),

  // Atualizar serviço
  atualizar: (id, dados) => api.put(`/servicos/${id}`, dados),

  // Remover serviço
  remover: (id) => api.delete(`/servicos/${id}`),
};

// Métodos específicos para orçamentos
export const orcamentoAPI = {
  // Buscar todos os orçamentos
  buscarTodos: (filtros = {}) => {
    const params = new URLSearchParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) params.append(key, filtros[key]);
    });
    return api.get(`/orcamentos?${params.toString()}`);
  },

  // Buscar orçamento por ID
  buscarPorId: (id) => api.get(`/orcamentos/${id}`),

  // Criar orçamento
  criar: (dados) => api.post('/orcamentos', dados),

  // Aceitar orçamento
  aceitar: (id, token) => api.put(`/orcamentos/aceitar/${id}?token=${token}`),

  // Rejeitar orçamento
  rejeitar: (id, motivo) => api.put(`/orcamentos/${id}/rejeitar`, { motivo }),

  // Download PDF
  downloadPDF: (id) => api.get(`/orcamentos/${id}/pdf`),

  // Duplicar orçamento
  duplicar: (id) => api.post(`/orcamentos/${id}/duplicar`),

  // Reenviar orçamento
  reenviar: (id, via) => api.post(`/orcamentos/${id}/reenviar`, { via }),

  // Estatísticas
  estatisticas: (periodo = '30') => 
    api.get('/orcamentos/estatisticas/dashboard', { params: { periodo } }),

  // Relatório
  relatorio: (data_inicio, data_fim) => 
    api.get('/orcamentos/relatorios/geral', { params: { data_inicio, data_fim } }),
};

// Métodos de autenticação
export const authAPI = {
  // Login
  login: (email, password) => 
    api.post('/auth/login', { email, password }),

  // Registro
  registro: (dados) => 
    api.post('/auth/registro', dados),

  // Refresh token
  refresh: (refreshToken) => 
    api.post('/auth/refresh', { refreshToken }),

  // Logout
  logout: () => api.post('/auth/logout'),

  // Verificar email
  verificarEmail: (token) => 
    api.post('/auth/verificar-email', { token }),

  // Solicitar reset de senha
  solicitarResetSenha: (email) => 
    api.post('/auth/reset-senha', { email }),

  // Confirmar reset de senha
  confirmarResetSenha: (token, nova_senha) => 
    api.post('/auth/confirmar-reset', { token, nova_senha }),

  // Alterar senha
  alterarSenha: (senha_atual, nova_senha) => 
    api.post('/auth/alterar-senha', { senha_atual, nova_senha }),
};

// Métodos para upload de arquivos
export const uploadAPI = {
  // Upload de arquivo
  upload: (arquivo, tipo = 'documento') => {
    const formData = new FormData();
    formData.append('file', arquivo);
    formData.append('tipo', tipo);
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload de múltiplos arquivos
  uploadMultiplos: (arquivos, tipo = 'documento') => {
    const formData = new FormData();
    arquivos.forEach((arquivo, index) => {
      formData.append(`files[${index}]`, arquivo);
    });
    formData.append('tipo', tipo);
    
    return api.post('/upload/multiplos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Remover arquivo
  remover: (id) => api.delete(`/upload/${id}`),
};

// Utilitários
export const utils = {
  // Verificar saúde da API
  health: () => api.get('/health'),

  // Buscar configurações
  configuracoes: () => api.get('/configuracoes'),

  // Testar notificações
  testarNotificacao: (tipo, destinatario) => 
    api.post('/notificacoes/teste', { tipo, destinatario }),
};

// API de Pacientes
export const pacienteAPI = {
  listar: (params) => api.get('/pacientes', { params }),
  buscarPorId: (id) => api.get(`/pacientes/${id}`),
  buscarPorCpf: (cpf) => api.get(`/pacientes/cpf/${cpf}`),
  criar: (paciente) => api.post('/pacientes', paciente),
  atualizar: (id, paciente) => api.put(`/pacientes/${id}`, paciente),
  deletar: (id) => api.delete(`/pacientes/${id}`),
  ativar: (id) => api.patch(`/pacientes/${id}/ativar`),
  desativar: (id) => api.patch(`/pacientes/${id}/desativar`),
  historico: (id) => api.get(`/pacientes/${id}/historico`),
  atualizarFicha: (id, ficha) => api.put(`/pacientes/${id}/ficha`, ficha),
  uploadDocumento: (id, formData) => 
    api.post(`/pacientes/${id}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  downloadDocumento: (id, documentoId) => 
    api.get(`/pacientes/${id}/documentos/${documentoId}`, { responseType: 'blob' }),
};

// API de Dashboard/Estatísticas
export const dashboardAPI = {
  estatisticas: () => api.get('/dashboard/estatisticas'),
  agendamentosHoje: () => api.get('/dashboard/agendamentos-hoje'),
  faturamento: (periodo) => api.get('/dashboard/faturamento', { params: { periodo } }),
  pacientesRecentes: () => api.get('/dashboard/pacientes-recentes'),
  orcamentosPendentes: () => api.get('/dashboard/orcamentos-pendentes'),
  alertas: () => api.get('/dashboard/alertas'),
};

// API de Notificações
export const notificacaoAPI = {
  listar: () => api.get('/notificacoes'),
  marcarComoLida: (id) => api.patch(`/notificacoes/${id}/lida`),
  marcarTodasComoLidas: () => api.patch('/notificacoes/marcar-todas-lidas'),
  deletar: (id) => api.delete(`/notificacoes/${id}`),
  configuracoes: () => api.get('/notificacoes/configuracoes'),
  atualizarConfiguracoes: (config) => api.put('/notificacoes/configuracoes', config),
};

export default api;
