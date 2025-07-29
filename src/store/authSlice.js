// src/store/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../services/api';

// Thunks assíncronos
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, refreshToken, user } = response.data;
      
      // Salvar tokens no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      return { token, refreshToken, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao fazer login');
    }
  }
);

export const registro = createAsyncThunk(
  'auth/registro',
  async (dadosUsuario, { rejectWithValue }) => {
    try {
      const response = await authAPI.registro(dadosUsuario);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao fazer registro');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return {};
    } catch (error) {
      // Mesmo com erro, remover tokens localmente
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return {};
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }
      
      const response = await authAPI.refresh(refreshToken);
      const { token: newToken, refreshToken: newRefreshToken } = response.data;
      
      localStorage.setItem('token', newToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return rejectWithValue('Sessão expirada');
    }
  }
);

export const verificarEmail = createAsyncThunk(
  'auth/verificarEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authAPI.verificarEmail(token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao verificar email');
    }
  }
);

export const alterarSenha = createAsyncThunk(
  'auth/alterarSenha',
  async ({ senha_atual, nova_senha }, { rejectWithValue }) => {
    try {
      const response = await authAPI.alterarSenha(senha_atual, nova_senha);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao alterar senha');
    }
  }
);

export const solicitarResetSenha = createAsyncThunk(
  'auth/solicitarResetSenha',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authAPI.solicitarResetSenha(email);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.erro || 'Erro ao solicitar reset de senha');
    }
  }
);

// Estado inicial
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
  emailVerificado: false,
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    setEmailVerificado: (state, action) => {
      state.emailVerificado = action.payload;
      if (state.user) {
        state.user.emailVerificado = action.payload;
      }
    },
    resetAuth: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.emailVerificado = action.payload.user.emailVerificado;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Registro
      .addCase(registro.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registro.fulfilled, (state) => {
        state.loading = false;
        // Após registro, usuário precisa verificar email
      })
      .addCase(registro.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.emailVerificado = false;
        state.loading = false;
        state.error = null;
      })

      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
        }
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.emailVerificado = false;
      })

      // Verificar Email
      .addCase(verificarEmail.fulfilled, (state) => {
        state.emailVerificado = true;
        if (state.user) {
          state.user.emailVerificado = true;
        }
      })
      .addCase(verificarEmail.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Alterar Senha
      .addCase(alterarSenha.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(alterarSenha.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(alterarSenha.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Solicitar Reset Senha
      .addCase(solicitarResetSenha.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(solicitarResetSenha.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(solicitarResetSenha.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Actions
export const { clearError, updateUser, setEmailVerificado, resetAuth } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectEmailVerificado = (state) => state.auth.emailVerificado;
export const selectUserRole = (state) => state.auth.user?.role;

export default authSlice.reducer;
