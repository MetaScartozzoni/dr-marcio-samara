// src/hooks/useOTP.js
import { useState, useCallback } from 'react';
import OTPService from '../services/otpService';

/**
 * Hook personalizado para gerenciar códigos OTP
 */
export const useOTP = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  /**
   * Solicitar código OTP
   */
  const solicitarCodigo = useCallback(async (
    email,
    tipo = 'login',
    criarUsuario = true,
    usarEdgeFunction = true
  ) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;

      if (usarEdgeFunction) {
        // Usar Edge Function
        result = await OTPService.solicitarCodigo(email, tipo, criarUsuario);
      } else {
        // Usar API padrão
        result = await OTPService.solicitarCodigoPadrao(email, tipo);
      }

      setSuccess(result.message || 'Código enviado com sucesso!');
      setCountdown(60); // 60 segundos de countdown

      return result;
    } catch (err) {
      console.error('Erro ao solicitar código:', err);
      setError(err.message || 'Erro ao enviar código');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verificar código OTP
   */
  const verificarCodigo = useCallback(async (
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
        result = await OTPService.verificarCodigo(email, codigo, tipo);
      } else {
        // Usar API padrão
        result = await OTPService.verificarCodigoPadrao(email, codigo, tipo);
      }

      setSuccess(result.message || 'Código verificado com sucesso!');

      return result;
    } catch (err) {
      console.error('Erro ao verificar código:', err);
      setError(err.message || 'Código inválido ou expirado');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Método híbrido - tenta Edge Function primeiro, depois fallback
   */
  const solicitarCodigoHibrido = useCallback(async (
    email,
    tipo = 'login',
    criarUsuario = true
  ) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await OTPService.solicitarCodigoHibrido(email, tipo, criarUsuario);
      setSuccess(result.message || 'Código enviado com sucesso!');
      setCountdown(60);
      return result;
    } catch (err) {
      console.error('Erro ao solicitar código (híbrido):', err);
      setError(err.message || 'Erro ao enviar código');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Método híbrido para verificação
   */
  const verificarCodigoHibrido = useCallback(async (
    email,
    codigo,
    tipo = 'login'
  ) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await OTPService.verificarCodigoHibrido(email, codigo, tipo);
      setSuccess(result.message || 'Código verificado com sucesso!');
      return result;
    } catch (err) {
      console.error('Erro ao verificar código (híbrido):', err);
      setError(err.message || 'Código inválido ou expirado');
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
   * Resetar countdown
   */
  const resetCountdown = useCallback(() => {
    setCountdown(0);
  }, []);

  return {
    // Estados
    loading,
    error,
    success,
    countdown,

    // Ações
    solicitarCodigo,
    verificarCodigo,
    solicitarCodigoHibrido,
    verificarCodigoHibrido,
    limparMensagens,
    resetCountdown,

    // Utilitários
    podeReenviar: countdown === 0,
    tempoRestante: countdown,
  };
};

export default useOTP;
