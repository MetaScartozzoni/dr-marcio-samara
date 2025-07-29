// src/store/orcamentoSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orcamentoAPI } from '../services/api';

// Thunks assíncronos
export const fetchOrcamentos = createAsyncThunk(
  'orcamento/fetchOrcamentos',
  async ({ page = 1, limit = 10, filtros = {} }, { rejectWithValue }) => {
    try {
      const response = await orcamentoAPI.listar({
        page,
        limit,
        ...filtros
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao buscar orçamentos');
    }
  }
);

export const fetchOrcamentoById = createAsyncThunk(
  'orcamento/fetchOrcamentoById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orcamentoAPI.buscarPorId(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao buscar orçamento');
    }
  }
);

export const criarOrcamento = createAsyncThunk(
  'orcamento/criarOrcamento',
  async (dadosOrcamento, { rejectWithValue }) => {
    try {
      const response = await orcamentoAPI.criar(dadosOrcamento);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao criar orçamento');
    }
  }
);

export const atualizarOrcamento = createAsyncThunk(
  'orcamento/atualizarOrcamento',
  async ({ id, dados }, { rejectWithValue }) => {
    try {
      const response = await orcamentoAPI.atualizar(id, dados);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao atualizar orçamento');
    }
  }
);

export const deletarOrcamento = createAsyncThunk(
  'orcamento/deletarOrcamento',
  async (id, { rejectWithValue }) => {
    try {
      await orcamentoAPI.deletar(id);
      return { id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao deletar orçamento');
    }
  }
);

export const gerarPdfOrcamento = createAsyncThunk(
  'orcamento/gerarPdfOrcamento',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orcamentoAPI.gerarPdf(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao gerar PDF');
    }
  }
);

export const enviarOrcamento = createAsyncThunk(
  'orcamento/enviarOrcamento',
  async ({ id, email, metodo }, { rejectWithValue }) => {
    try {
      const response = await orcamentoAPI.enviar(id, { email, metodo });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao enviar orçamento');
    }
  }
);

export const aprovarOrcamento = createAsyncThunk(
  'orcamento/aprovarOrcamento',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orcamentoAPI.aprovar(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao aprovar orçamento');
    }
  }
);

export const rejeitarOrcamento = createAsyncThunk(
  'orcamento/rejeitarOrcamento',
  async ({ id, motivo }, { rejectWithValue }) => {
    try {
      const response = await orcamentoAPI.rejeitar(id, { motivo });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao rejeitar orçamento');
    }
  }
);

export const fetchEstatisticas = createAsyncThunk(
  'orcamento/fetchEstatisticas',
  async (periodo, { rejectWithValue }) => {
    try {
      const response = await orcamentoAPI.estatisticas(periodo);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao buscar estatísticas');
    }
  }
);

// Estado inicial
const initialState = {
  orcamentos: [],
  orcamentoAtual: null,
  estatisticas: null,
  loading: false,
  error: null,
  paginacao: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  },
  filtros: {
    status: '',
    dataInicio: null,
    dataFim: null,
    cliente: '',
    valor_min: '',
    valor_max: ''
  }
};

// Slice
const orcamentoSlice = createSlice({
  name: 'orcamento',
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
    clearOrcamentoAtual: (state) => {
      state.orcamentoAtual = null;
    },
    updateOrcamentoStatus: (state, action) => {
      const { id, status } = action.payload;
      const orcamento = state.orcamentos.find(o => o.id === id);
      if (orcamento) {
        orcamento.status = status;
      }
      if (state.orcamentoAtual && state.orcamentoAtual.id === id) {
        state.orcamentoAtual.status = status;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orçamentos
      .addCase(fetchOrcamentos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrcamentos.fulfilled, (state, action) => {
        state.loading = false;
        state.orcamentos = action.payload.orcamentos;
        state.paginacao = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalItems: action.payload.totalItems,
          itemsPerPage: action.payload.itemsPerPage
        };
      })
      .addCase(fetchOrcamentos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Orçamento por ID
      .addCase(fetchOrcamentoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrcamentoById.fulfilled, (state, action) => {
        state.loading = false;
        state.orcamentoAtual = action.payload;
      })
      .addCase(fetchOrcamentoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Criar Orçamento
      .addCase(criarOrcamento.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(criarOrcamento.fulfilled, (state, action) => {
        state.loading = false;
        state.orcamentos.unshift(action.payload);
        state.orcamentoAtual = action.payload;
      })
      .addCase(criarOrcamento.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Atualizar Orçamento
      .addCase(atualizarOrcamento.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(atualizarOrcamento.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orcamentos.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.orcamentos[index] = action.payload;
        }
        if (state.orcamentoAtual && state.orcamentoAtual.id === action.payload.id) {
          state.orcamentoAtual = action.payload;
        }
      })
      .addCase(atualizarOrcamento.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Deletar Orçamento
      .addCase(deletarOrcamento.fulfilled, (state, action) => {
        state.orcamentos = state.orcamentos.filter(o => o.id !== action.payload.id);
        if (state.orcamentoAtual && state.orcamentoAtual.id === action.payload.id) {
          state.orcamentoAtual = null;
        }
      })
      .addCase(deletarOrcamento.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Gerar PDF
      .addCase(gerarPdfOrcamento.pending, (state) => {
        state.loading = true;
      })
      .addCase(gerarPdfOrcamento.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(gerarPdfOrcamento.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Enviar Orçamento
      .addCase(enviarOrcamento.fulfilled, (state, action) => {
        // Atualizar status se necessário
        const orcamento = state.orcamentos.find(o => o.id === action.meta.arg.id);
        if (orcamento) {
          orcamento.dataEnvio = new Date().toISOString();
        }
      })

      // Aprovar Orçamento
      .addCase(aprovarOrcamento.fulfilled, (state, action) => {
        const index = state.orcamentos.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.orcamentos[index] = action.payload;
        }
        if (state.orcamentoAtual && state.orcamentoAtual.id === action.payload.id) {
          state.orcamentoAtual = action.payload;
        }
      })

      // Rejeitar Orçamento
      .addCase(rejeitarOrcamento.fulfilled, (state, action) => {
        const index = state.orcamentos.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.orcamentos[index] = action.payload;
        }
        if (state.orcamentoAtual && state.orcamentoAtual.id === action.payload.id) {
          state.orcamentoAtual = action.payload;
        }
      })

      // Estatísticas
      .addCase(fetchEstatisticas.fulfilled, (state, action) => {
        state.estatisticas = action.payload;
      });
  }
});

// Actions
export const { 
  clearError, 
  setFiltros, 
  clearFiltros, 
  setPaginacao, 
  clearOrcamentoAtual,
  updateOrcamentoStatus 
} = orcamentoSlice.actions;

// Selectors
export const selectOrcamentos = (state) => state.orcamento.orcamentos;
export const selectOrcamentoAtual = (state) => state.orcamento.orcamentoAtual;
export const selectOrcamentoLoading = (state) => state.orcamento.loading;
export const selectOrcamentoError = (state) => state.orcamento.error;
export const selectPaginacao = (state) => state.orcamento.paginacao;
export const selectFiltros = (state) => state.orcamento.filtros;
export const selectEstatisticas = (state) => state.orcamento.estatisticas;

// Seletores computados
export const selectOrcamentosPorStatus = (state) => {
  const orcamentos = selectOrcamentos(state);
  return {
    pendentes: orcamentos.filter(o => o.status === 'pendente'),
    aprovados: orcamentos.filter(o => o.status === 'aprovado'),
    rejeitados: orcamentos.filter(o => o.status === 'rejeitado'),
    enviados: orcamentos.filter(o => o.status === 'enviado')
  };
};

export const selectTotalOrcamentos = (state) => selectOrcamentos(state).length;

export default orcamentoSlice.reducer;
