// src/services/otpService.js
import { supabase } from './supabase';

/**
 * Serviço para gerenciar códigos OTP usando Edge Functions
 */
export class OTPService {
  /**
   * Solicitar código OTP via Edge Function
   */
  static async solicitarCodigo(email, tipo = 'login', criarUsuario = true) {
    try {
      const edgeFunctionUrl = `${supabase.supabaseUrl}/functions/v1/gerar-codigo-otp`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          tipo,
          criarUsuario
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar código');
      }

      return data;
    } catch (error) {
      console.error('Erro ao solicitar código OTP:', error);
      throw error;
    }
  }

  /**
   * Verificar código OTP via Edge Function
   */
  static async verificarCodigo(email, codigo, tipo = 'login') {
    try {
      const edgeFunctionUrl = `${supabase.supabaseUrl}/functions/v1/verificar-codigo-otp`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          codigo,
          tipo
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar código');
      }

      return data;
    } catch (error) {
      console.error('Erro ao verificar código OTP:', error);
      throw error;
    }
  }

  /**
   * Solicitar código usando API padrão do Supabase (fallback)
   */
  static async solicitarCodigoPadrao(email, tipo = 'login') {
    try {
      let result;

      switch (tipo) {
        case 'login':
          result = await supabase.auth.signInWithOtp({
            email: email.toLowerCase().trim(),
            options: {
              shouldCreateUser: true,
            }
          });
          break;

        case 'recuperacao':
          result = await supabase.auth.resetPasswordForEmail(
            email.toLowerCase().trim(),
            {
              redirectTo: `${window.location.origin}/reset-password`,
            }
          );
          break;

        case 'confirmacao':
          result = await supabase.auth.resend({
            type: 'signup',
            email: email.toLowerCase().trim(),
          });
          break;

        default:
          throw new Error('Tipo de código inválido');
      }

      if (result.error) {
        throw result.error;
      }

      return {
        success: true,
        message: `Código enviado para ${email}`,
        email,
        tipo,
        data: result.data
      };
    } catch (error) {
      console.error('Erro na API padrão:', error);
      throw error;
    }
  }

  /**
   * Verificar código usando API padrão do Supabase (fallback)
   */
  static async verificarCodigoPadrao(email, codigo, tipo = 'login') {
    try {
      let verificationType = 'email';

      switch (tipo) {
        case 'login':
          verificationType = 'email';
          break;
        case 'recuperacao':
          verificationType = 'recovery';
          break;
        case 'confirmacao':
          verificationType = 'email';
          break;
        default:
          verificationType = 'email';
          break;
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: codigo,
        type: verificationType
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Código verificado com sucesso',
        session: data.session,
        user: data.user
      };
    } catch (error) {
      console.error('Erro na verificação padrão:', error);
      throw error;
    }
  }

  /**
   * Método híbrido - tenta Edge Function primeiro, depois fallback
   */
  static async solicitarCodigoHibrido(email, tipo = 'login', criarUsuario = true) {
    try {
      // Tentar Edge Function primeiro
      return await this.solicitarCodigo(email, tipo, criarUsuario);
    } catch (error) {
      console.warn('Edge Function falhou, tentando API padrão:', error.message);
      // Fallback para API padrão
      return await this.solicitarCodigoPadrao(email, tipo);
    }
  }

  /**
   * Método híbrido para verificação
   */
  static async verificarCodigoHibrido(email, codigo, tipo = 'login') {
    try {
      // Tentar Edge Function primeiro
      return await this.verificarCodigo(email, codigo, tipo);
    } catch (error) {
      console.warn('Edge Function falhou, tentando API padrão:', error.message);
      // Fallback para API padrão
      return await this.verificarCodigoPadrao(email, codigo, tipo);
    }
  }
}

export default OTPService;
