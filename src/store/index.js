// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import agendamentoReducer from './agendamentoSlice';
import authReducer from './authSlice';
import orcamentoReducer from './orcamentoSlice';
import pacienteReducer from './pacienteSlice';

export const store = configureStore({
  reducer: {
    agendamento: agendamentoReducer,
    auth: authReducer,
    orcamento: orcamentoReducer,
    paciente: pacienteReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['auth.token', 'auth.refreshToken'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Para uso com TypeScript, descomente as linhas abaixo:
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

// Selectors para acesso rápido aos estados principais
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default store;
