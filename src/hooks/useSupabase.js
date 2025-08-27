// src/hooks/useSupabase.js
import { useState, useEffect, useCallback } from 'react';
import SupabaseApiService from '../services/supabaseApi';

/**
 * Hook personalizado para autenticação com Supabase
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  const checkUser = useCallback(async () => {
    try {
      const currentUser = await SupabaseApiService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verificar sessão atual ao montar
    checkUser();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = SupabaseApiService.supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user?.id) {
          // Buscar perfil do usuário
          const profile = await SupabaseApiService.getUserProfile(session.user.id);
          if (profile) {
            setUser({ ...session.user, profile });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkUser]);

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const result = await SupabaseApiService.signIn(email, password);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email, password, userData) => {
    setLoading(true);
    try {
      const result = await SupabaseApiService.signUp(email, password, userData);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await SupabaseApiService.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendVerificationCode = useCallback(async (email) => {
    return await SupabaseApiService.sendVerificationCode(email);
  }, []);

  const verifyOtpCode = useCallback(async (email, code) => {
    setLoading(true);
    try {
      const result = await SupabaseApiService.verifyOtpCode(email, code);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    return await SupabaseApiService.resetPassword(email);
  }, []);

  const updatePassword = useCallback(async (password) => {
    return await SupabaseApiService.updatePassword(password);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    const updatedProfile = await SupabaseApiService.updateUserProfile(user.id, updates);
    setUser({ ...user, profile: updatedProfile });
    return updatedProfile;
  }, [user]);

  const hasRole = useCallback((role) => {
    return user?.profile?.tipo_usuario === role;
  }, [user]);

  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.profile?.tipo_usuario);
  }, [user]);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    sendVerificationCode,
    verifyOtpCode,
    resetPassword,
    updatePassword,
    updateProfile,
    hasRole,
    hasAnyRole,
    checkUser,
    isAuthenticated: !!user,
  };
};

/**
 * Hook para gerenciar usuários (apenas admins)
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await SupabaseApiService.getAllUsers(filters);
      setUsers(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserStatus = useCallback(async (userId, status) => {
    try {
      const updatedUser = await SupabaseApiService.updateUserStatus(userId, status);
      setUsers(prev => prev.map(user =>
        user.id === userId ? updatedUser : user
      ));
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUserStatus,
  };
};

/**
 * Hook para gerenciar consultas
 */
export const useConsultas = () => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConsultas = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await SupabaseApiService.getConsultas(filters);
      setConsultas(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createConsulta = useCallback(async (consultaData) => {
    try {
      const newConsulta = await SupabaseApiService.createConsulta(consultaData);
      setConsultas(prev => [newConsulta, ...prev]);
      return newConsulta;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateConsulta = useCallback(async (consultaId, updates) => {
    try {
      const updatedConsulta = await SupabaseApiService.updateConsulta(consultaId, updates);
      setConsultas(prev => prev.map(consulta =>
        consulta.id === consultaId ? updatedConsulta : consulta
      ));
      return updatedConsulta;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteConsulta = useCallback(async (consultaId) => {
    try {
      await SupabaseApiService.deleteConsulta(consultaId);
      setConsultas(prev => prev.filter(consulta => consulta.id !== consultaId));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    consultas,
    loading,
    error,
    fetchConsultas,
    createConsulta,
    updateConsulta,
    deleteConsulta,
  };
};

/**
 * Hook para operações gerais com loading e error states
 */
export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (operation) => {
    setLoading(true);
    setError(null);
    try {
      const result = await operation();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    execute,
  };
};

const SupabaseHooks = {
  useAuth,
  useUsers,
  useConsultas,
  useAsyncOperation,
};

export default SupabaseHooks;
