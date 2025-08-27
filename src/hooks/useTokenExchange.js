// src/hooks/useTokenExchange.js
import { useState, useCallback } from 'react';
import TokenExchangeService from '../services/tokenExchangeService';

/**
 * Hook personalizado para troca de código OTP por token de autenticação
 */
export const useTokenExchange = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [session, setSession] = useState(null);

  /**
   * Trocar código por token usando Edge Function
   */
  const trocarCodigoPorToken = useCallback(async (
    email,
    codigo,
    tipo = 'login',
    usarEdgeFunction = true
  ) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;

      if (usarEdgeFunction) {
        // Usar Edge Function
        result = await TokenExchangeService.trocarCodigoPorToken(email, codigo, tipo);
      } else {
        // Usar método direto
        result = await TokenExchangeService.trocarCodigoPorTokenDireto(email, codigo, tipo);
      }

      setSuccess(result.message || 'Código verificado com sucesso! Token gerado.');
      setSession(result.session);

      return result;
    } catch (err) {
      console.error('Erro na troca de código por token:', err);
      setError(err.message || 'Erro na troca de código por token');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Método híbrido - tenta Edge Function primeiro, depois fallback
   */
  const trocarCodigoPorTokenHibrido = useCallback(async (
    email,
    codigo,
    tipo = 'login'
  ) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await TokenExchangeService.trocarCodigoPorTokenHibrido(email, codigo, tipo);
      setSuccess(result.message || 'Código verificado com sucesso! Token gerado.');
      setSession(result.session);
      return result;
    } catch (err) {
      console.error('Erro na troca híbrida:', err);
      setError(err.message || 'Erro na troca de código por token');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Estabelecer sessão com token
   */
  const estabelecerSessao = useCallback(async (sessionData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await TokenExchangeService.estabelecerSessaoComToken(sessionData);
      setSuccess('Sessão estabelecida com sucesso!');
      setSession(sessionData);
      return result;
    } catch (err) {
      console.error('Erro ao estabelecer sessão:', err);
      setError(err.message || 'Erro ao estabelecer sessão');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verificar validade do token
   */
  const verificarToken = useCallback(async (token) => {
    try {
      const result = await TokenExchangeService.verificarToken(token);
      return result;
    } catch (err) {
      console.error('Erro ao verificar token:', err);
      return { valido: false, error: err.message };
    }
  }, []);

  /**
   * Renovar token
   */
  const renovarToken = useCallback(async (refreshToken) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await TokenExchangeService.renovarToken(refreshToken);
      setSuccess('Token renovado com sucesso!');
      setSession(result.session);
      return result;
    } catch (err) {
      console.error('Erro ao renovar token:', err);
      setError(err.message || 'Erro ao renovar token');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await TokenExchangeService.logout();
      setSuccess('Logout realizado com sucesso!');
      setSession(null);
      return { success: true };
    } catch (err) {
      console.error('Erro no logout:', err);
      setError(err.message || 'Erro no logout');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpar mensagens
   */
  const limparMensagens = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  /**
   * Verificar se há sessão ativa
   */
  const temSessaoAtiva = useCallback(() => {
    return session && session.access_token;
  }, [session]);

  /**
   * Obter token de acesso atual
   */
  const getAccessToken = useCallback(() => {
    return session?.access_token;
  }, [session]);

  /**
   * Obter refresh token atual
   */
  const getRefreshToken = useCallback(() => {
    return session?.refresh_token;
  }, [session]);

  /**
   * Verificar se token está expirado
   */
  const tokenExpirado = useCallback(() => {
    if (!session?.expires_at) return true;

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;

    return now >= expiresAt;
  }, [session]);

  return {
    // Estados
    loading,
    error,
    success,
    session,

    // Ações principais
    trocarCodigoPorToken,
    trocarCodigoPorTokenHibrido,
    estabelecerSessao,

    // Utilitários
    verificarToken,
    renovarToken,
    logout,
    limparMensagens,

    // Getters
    temSessaoAtiva,
    getAccessToken,
    getRefreshToken,
    tokenExpirado,
  };
};

export default useTokenExchange;
