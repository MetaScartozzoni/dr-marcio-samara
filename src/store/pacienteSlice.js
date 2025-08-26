// src/store/pacienteSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { pacienteAPI } from '../services/api';

// Thunks assíncronos
export const fetchPacientes = createAsyncThunk(
  'paciente/fetchPacientes',
  async ({ page = 1, limit = 10, search = '' }, { rejectWithValue }) => {
    try {
      const response = await pacienteAPI.listar({ page, limit, search });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao buscar pacientes');
    }
  }
);

export const fetchPacienteById = createAsyncThunk(
  'paciente/fetchPacienteById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await pacienteAPI.buscarPorId(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao buscar paciente');
    }
  }
);

export const criarPaciente = createAsyncThunk(
  'paciente/criarPaciente',
  async (dadosPaciente, { rejectWithValue }) => {
    try {
      const response = await pacienteAPI.criar(dadosPaciente);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao criar paciente');
    }
  }
);

export const atualizarPaciente = createAsyncThunk(
  'paciente/atualizarPaciente',
  async ({ id, dados }, { rejectWithValue }) => {
    try {
      const response = await pacienteAPI.atualizar(id, dados);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao atualizar paciente');
    }
  }
);

export const deletarPaciente = createAsyncThunk(
  'paciente/deletarPaciente',
  async (id, { rejectWithValue }) => {
    try {
      await pacienteAPI.deletar(id);
      return { id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao deletar paciente');
    }
  }
);

export const fetchHistoricoPaciente = createAsyncThunk(
  'paciente/fetchHistoricoPaciente',
  async (id, { rejectWithValue }) => {
    try {
      const response = await pacienteAPI.historico(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao buscar histórico');
    }
  }
);

export const atualizarFichaPaciente = createAsyncThunk(
  'paciente/atualizarFichaPaciente',
  async ({ id, ficha }, { rejectWithValue }) => {
    try {
      const response = await pacienteAPI.atualizarFicha(id, ficha);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao atualizar ficha');
    }
  }
);

export const buscarPacientePorCpf = createAsyncThunk(
  'paciente/buscarPorCpf',
  async (cpf, { rejectWithValue }) => {
    try {
      const response = await pacienteAPI.buscarPorCpf(cpf);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Paciente não encontrado');
    }
  }
);

// Estado inicial
const initialState = {
  pacientes: [],
  pacienteAtual: null,
  historicoPaciente: null,
  loading: false,
  error: null,
  searchLoading: false,
  paginacao: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  },
  filtros: {
    search: '',
    ativo: true
  }
};

// Slice
const pacienteSlice = createSlice({
  name: 'paciente',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFiltros: (state, action) => {
      state.filtros = { ...state.filtros, ...action.payload };
    },
    clearFiltros: (state) => {
      state.filtros = initialState.filtros;
    },
    setPaginacao: (state, action) => {
      state.paginacao = { ...state.paginacao, ...action.payload };
    },
    clearPacienteAtual: (state) => {
      state.pacienteAtual = null;
    },
    clearHistorico: (state) => {
      state.historicoPaciente = null;
    },
    updatePacienteStatus: (state, action) => {
      const { id, ativo } = action.payload;
      const paciente = state.pacientes.find(p => p.id === id);
      if (paciente) {
        paciente.ativo = ativo;
      }
      if (state.pacienteAtual && state.pacienteAtual.id === id) {
        state.pacienteAtual.ativo = ativo;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Pacientes
      .addCase(fetchPacientes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPacientes.fulfilled, (state, action) => {
        state.loading = false;
        state.pacientes = action.payload.pacientes;
        state.paginacao = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalItems: action.payload.totalItems,
          itemsPerPage: action.payload.itemsPerPage
        };
      })
      .addCase(fetchPacientes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Paciente por ID
      .addCase(fetchPacienteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPacienteById.fulfilled, (state, action) => {
        state.loading = false;
        state.pacienteAtual = action.payload;
      })
      .addCase(fetchPacienteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Criar Paciente
      .addCase(criarPaciente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(criarPaciente.fulfilled, (state, action) => {
        state.loading = false;
        state.pacientes.unshift(action.payload);
        state.pacienteAtual = action.payload;
      })
      .addCase(criarPaciente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Atualizar Paciente
      .addCase(atualizarPaciente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(atualizarPaciente.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.pacientes.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.pacientes[index] = action.payload;
        }
        if (state.pacienteAtual && state.pacienteAtual.id === action.payload.id) {
          state.pacienteAtual = action.payload;
        }
      })
      .addCase(atualizarPaciente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Deletar Paciente
      .addCase(deletarPaciente.fulfilled, (state, action) => {
        state.pacientes = state.pacientes.filter(p => p.id !== action.payload.id);
        if (state.pacienteAtual && state.pacienteAtual.id === action.payload.id) {
          state.pacienteAtual = null;
        }
      })
      .addCase(deletarPaciente.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Histórico do Paciente
      .addCase(fetchHistoricoPaciente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHistoricoPaciente.fulfilled, (state, action) => {
        state.loading = false;
        state.historicoPaciente = action.payload;
      })
      .addCase(fetchHistoricoPaciente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Atualizar Ficha
      .addCase(atualizarFichaPaciente.fulfilled, (state, action) => {
        if (state.pacienteAtual && state.pacienteAtual.id === action.payload.id) {
          state.pacienteAtual = action.payload;
        }
        const index = state.pacientes.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.pacientes[index] = action.payload;
        }
      })

      // Buscar por CPF
      .addCase(buscarPacientePorCpf.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(buscarPacientePorCpf.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.pacienteAtual = action.payload;
      })
      .addCase(buscarPacientePorCpf.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      });
  }
});

// Actions
export const { 
  clearError, 
  setFiltros, 
  clearFiltros, 
  setPaginacao, 
  clearPacienteAtual,
  clearHistorico,
  updatePacienteStatus 
} = pacienteSlice.actions;

// Selectors
export const selectPacientes = (state) => state.paciente.pacientes;
export const selectPacienteAtual = (state) => state.paciente.pacienteAtual;
export const selectHistoricoPaciente = (state) => state.paciente.historicoPaciente;
export const selectPacienteLoading = (state) => state.paciente.loading;
export const selectPacienteSearchLoading = (state) => state.paciente.searchLoading;
export const selectPacienteError = (state) => state.paciente.error;
export const selectPacientePaginacao = (state) => state.paciente.paginacao;
export const selectPacienteFiltros = (state) => state.paciente.filtros;

// Seletores computados
export const selectPacientesAtivos = (state) => 
  selectPacientes(state).filter(p => p.ativo);

export const selectTotalPacientes = (state) => selectPacientes(state).length;

export const selectPacientesPorIdade = (state) => {
  const pacientes = selectPacientes(state);
  return {
    criancas: pacientes.filter(p => p.idade < 18),
    adultos: pacientes.filter(p => p.idade >= 18 && p.idade < 60),
    idosos: pacientes.filter(p => p.idade >= 60)
  };
};

export default pacienteSlice.reducer;
