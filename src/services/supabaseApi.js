// src/services/supabaseApi.js
import { supabase } from './supabase';

/**
 * Serviço de API específico para operações com Supabase
 * Centraliza todas as operações de banco de dados do Supabase
 */
export class SupabaseApiService {
  // ===============================
  // AUTENTICAÇÃO
  // ===============================

  /**
   * Login de usuário
   */
  static async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        throw this.handleAuthError(error);
      }

      // Buscar perfil do usuário
      if (data.user) {
        const profile = await this.getUserProfile(data.user.id);
        return {
          ...data,
          user: {
            ...data.user,
            profile
          }
        };
      }

      return data;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  /**
   * Cadastro de usuário
   */
  static async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            nome: userData.nome || '',
            tipo_usuario: userData.tipo_usuario || 'paciente',
            ...userData
          }
        },
      });

      if (error) {
        throw this.handleAuthError(error);
      }

      // Salvar email para possível reenvio de código
      if (data.user && !data.user.email_confirmed_at) {
        localStorage.setItem('pendingConfirmationEmail', email);
      }

      return data;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw this.handleAuthError(error);
      }

      // Limpar dados locais
      localStorage.removeItem('pendingConfirmationEmail');
      return true;
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }

  /**
   * Enviar código de verificação
   */
  static async sendVerificationCode(email) {
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase().trim(),
      });

      if (error) {
        throw this.handleAuthError(error);
      }

      return data;
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      throw error;
    }
  }

  /**
   * Verificar código OTP
   */
  static async verifyOtpCode(email, code) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: code,
        type: 'signup',
      });

      if (error) {
        throw this.handleAuthError(error);
      }

      return data;
    } catch (error) {
      console.error('Erro na verificação OTP:', error);
      throw error;
    }
  }

  /**
   * Resetar senha
   */
  static async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      );

      if (error) {
        throw this.handleAuthError(error);
      }

      return data;
    } catch (error) {
      console.error('Erro no reset de senha:', error);
      throw error;
    }
  }

  /**
   * Atualizar senha
   */
  static async updatePassword(password) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw this.handleAuthError(error);
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      throw error;
    }
  }

  // ===============================
  // PERFIS DE USUÁRIO
  // ===============================

  /**
   * Buscar perfil do usuário
   */
  static async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Usuário não encontrado na tabela usuarios
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  static async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Buscar todos os usuários (apenas admins)
   */
  static async getAllUsers(filters = {}) {
    try {
      let query = supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.tipo_usuario) {
        query = query.eq('tipo_usuario', filters.tipo_usuario);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }

  /**
   * Atualizar status do usuário
   */
  static async updateUserStatus(userId, status) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  // ===============================
  // CONSULTAS
  // ===============================

  /**
   * Buscar todas as consultas
   */
  static async getConsultas(filters = {}) {
    try {
      let query = supabase
        .from('consultas')
        .select('*')
        .order('data_consulta', { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.paciente_nome) {
        query = query.ilike('paciente_nome', `%${filters.paciente_nome}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      throw error;
    }
  }

  /**
   * Criar nova consulta
   */
  static async createConsulta(consultaData) {
    try {
      const { data, error } = await supabase
        .from('consultas')
        .insert([consultaData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar consulta:', error);
      throw error;
    }
  }

  /**
   * Atualizar consulta
   */
  static async updateConsulta(consultaId, updates) {
    try {
      const { data, error } = await supabase
        .from('consultas')
        .update(updates)
        .eq('id', consultaId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar consulta:', error);
      throw error;
    }
  }

  /**
   * Deletar consulta
   */
  static async deleteConsulta(consultaId) {
    try {
      const { error } = await supabase
        .from('consultas')
        .delete()
        .eq('id', consultaId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar consulta:', error);
      throw error;
    }
  }

  // ===============================
  // UTILITÁRIOS
  // ===============================

  /**
   * Verificar sessão atual
   */
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      return session;
    } catch (error) {
      console.error('Erro ao buscar sessão:', error);
      return null;
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  static async isAuthenticated() {
    try {
      const session = await this.getCurrentSession();
      return !!session;
    } catch (error) {
      return false;
    }
  }

  /**
   * Buscar usuário atual
   */
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      if (user) {
        const profile = await this.getUserProfile(user.id);
        return {
          ...user,
          profile
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      return null;
    }
  }

  /**
   * Limpar cache local
   */
  static clearCache() {
    localStorage.removeItem('pendingConfirmationEmail');
    // Outros dados locais podem ser limpos aqui
  }

  /**
   * Tratamento de erros de autenticação
   */
  static handleAuthError(error) {
    console.error('Erro de autenticação:', error);

    // Mapeamento de erros comuns
    const errorMap = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'Email not confirmed': 'Confirme seu email antes de fazer login',
      'Too many requests': 'Muitas tentativas. Aguarde alguns minutos',
      'User already registered': 'Este email já está cadastrado',
      'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
      'Unable to validate email address': 'Email inválido',
      'Signup is disabled': 'Cadastro temporariamente desabilitado',
      'Email rate limit exceeded': 'Muitos códigos enviados. Aguarde alguns minutos',
      'Invalid token': 'Código inválido ou expirado',
      'Token has expired': 'Código expirado. Solicite um novo',
    };

    // Procurar mensagem de erro correspondente
    for (const [key, message] of Object.entries(errorMap)) {
      if (error.message.includes(key)) {
        return new Error(message);
      }
    }

    // Verificar rate limiting específico
    if (error.message.includes('rate limit') || error.message.includes('after')) {
      const waitTime = error.message.match(/after (\d+) seconds?/);
      const seconds = waitTime ? parseInt(waitTime[1]) : 60;
      return new Error(`Aguarde ${seconds} segundos antes de tentar novamente`);
    }

    // Erro genérico
    return new Error(error.message || 'Erro na autenticação');
  }
}

export default SupabaseApiService;
