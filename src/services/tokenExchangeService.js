// src/services/tokenExchangeService.js
import { supabase } from './supabase';

/**
 * Serviço para troca de código OTP por token de autenticação
 */
export class TokenExchangeService {
  /**
   * Trocar código OTP por token usando Edge Function
   */
  static async trocarCodigoPorToken(email, codigo, tipo = 'login') {
    try {
      const edgeFunctionUrl = `${supabase.supabaseUrl}/functions/v1/troca-codigo-token`;

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
        throw new Error(data.error || 'Erro na troca de código por token');
      }

      return data;
    } catch (error) {
      console.error('Erro na troca de código por token:', error);
      throw error;
    }
  }

  /**
   * Método híbrido - tenta Edge Function primeiro, depois fallback
   */
  static async trocarCodigoPorTokenHibrido(email, codigo, tipo = 'login') {
    try {
      // Tentar Edge Function primeiro
      return await this.trocarCodigoPorToken(email, codigo, tipo);
    } catch (error) {
      console.warn('Edge Function falhou, tentando método direto:', error.message);
      // Fallback para método direto
      return await this.trocarCodigoPorTokenDireto(email, codigo, tipo);
    }
  }

  /**
   * Método direto usando Supabase Auth (fallback)
   */
  static async trocarCodigoPorTokenDireto(email, codigo, tipo = 'login') {
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
        message: 'Código verificado com sucesso! Token gerado.',
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at,
          expires_in: data.session?.expires_in,
          token_type: data.session?.token_type
        },
        user: {
          id: data.user?.id,
          email: data.user?.email,
          email_confirmed_at: data.user?.email_confirmed_at,
          created_at: data.user?.created_at,
          updated_at: data.user?.updated_at,
          user_metadata: data.user?.user_metadata,
          app_metadata: data.user?.app_metadata
        }
      };
    } catch (error) {
      console.error('Erro no método direto:', error);
      throw error;
    }
  }

  /**
   * Estabelecer sessão com token
   */
  static async estabelecerSessaoComToken(sessionData) {
    try {
      if (!sessionData.access_token || !sessionData.refresh_token) {
        throw new Error('Tokens de acesso e refresh são obrigatórios');
      }

      // Criar sessão manualmente
      const { data, error } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token
      });

      if (error) {
        throw error;
      }

      console.log('✅ Sessão estabelecida com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao estabelecer sessão:', error);
      throw error;
    }
  }

  /**
   * Verificar validade do token
   */
  static async verificarToken(token) {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabase.supabaseKey,
        },
      });

      if (!response.ok) {
        return { valido: false, error: 'Token inválido ou expirado' };
      }

      const userData = await response.json();
      return { valido: true, user: userData };
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return { valido: false, error: error.message };
    }
  }

  /**
   * Renovar token usando refresh token
   */
  static async renovarToken(refreshToken) {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at,
          expires_in: data.session?.expires_in,
          token_type: data.session?.token_type
        }
      };
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      throw error;
    }
  }

  /**
   * Logout - revogar tokens
   */
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

      console.log('✅ Logout realizado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }
}

export default TokenExchangeService;
