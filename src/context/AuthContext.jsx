// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN' && session?.user?.id) {
        // Fetch user profile from usuarios table
        const { data: profile } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({ ...session.user, profile });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro detalhado do Supabase:', error);

        // Tratar erros específicos
        if (error.message.includes('Hook requires authorization token')) {
          throw new Error('Erro de configuração do servidor. Tente novamente em alguns instantes.');
        }

        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos. Verifique seus dados.');
        }

        if (error.message.includes('Email not confirmed')) {
          throw new Error('Confirme seu email antes de fazer login.');
        }

        if (error.message.includes('Too many requests')) {
          throw new Error('Muitas tentativas de login. Aguarde alguns minutos.');
        }

        // Erro genérico
        throw new Error('Erro no login. Tente novamente.');
      }

      return data;
    } catch (error) {
      // Re-throw com mensagem mais amigável se já foi tratada
      if (error.message.includes('Erro de configuração') ||
          error.message.includes('Email ou senha') ||
          error.message.includes('Confirme seu email') ||
          error.message.includes('Muitas tentativas') ||
          error.message.includes('Erro no login')) {
        throw error;
      }

      // Erro inesperado
      console.error('Erro inesperado no login:', error);
      throw new Error('Erro inesperado. Tente novamente em alguns instantes.');
    }
  };

  const signUp = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        // Removido redirectTo para usar código OTP ao invés de link
      },
    });

    if (error) throw error;

    // Salvar email para possível reenvio de código
    if (data.user && !data.user.email_confirmed_at) {
      localStorage.setItem('pendingConfirmationEmail', email);
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) throw error;
    return data;
  };

  const updatePassword = async (password) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
    return data;
  };

  const resendConfirmationEmail = async (email) => {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${window.location.origin}/email-confirmation`,
      },
    });

    if (error) throw error;
    return data;
  };

  const sendVerificationCode = async (email) => {
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        // Melhor tratamento de rate limiting
        if (error.message.includes('rate limit') || error.message.includes('after')) {
          const waitTime = error.message.match(/after (\d+) seconds?/);
          const seconds = waitTime ? parseInt(waitTime[1]) : 60;

          throw new Error(`Aguarde ${seconds} segundos antes de solicitar um novo código.`);
        }

        // Outros erros específicos
        if (error.message.includes('Invalid email')) {
          throw new Error('Email inválido. Verifique o endereço digitado.');
        }

        if (error.message.includes('not found')) {
          throw new Error('Email não encontrado. Verifique se foi digitado corretamente.');
        }

        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao enviar código de verificação:', error);
      throw error;
    }
  };

  const verifyOtpCode = async (email, code) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'signup',
      });

      if (error) {
        // Tratar erros específicos de verificação
        if (error.message.includes('invalid')) {
          throw new Error('Código inválido. Verifique o código digitado.');
        }

        if (error.message.includes('expired')) {
          throw new Error('Código expirado. Solicite um novo código.');
        }

        if (error.message.includes('rate limit')) {
          throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
        }

        if (error.message.includes('already')) {
          throw new Error('Email já confirmado. Você pode fazer login normalmente.');
        }

        if (error.message.includes('not found')) {
          throw new Error('Usuário não encontrado. Verifique o email digitado.');
        }

        // Erro genérico
        throw new Error('Erro na verificação do código. Tente novamente.');
      }

      return data;
    } catch (error) {
      console.error('Erro na verificação OTP:', error);
      throw error;
    }
  };

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Update local user state
    setUser({ ...user, profile: data });
    return data;
  };

  const hasRole = (role) => {
    return user?.profile?.tipo_usuario === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.profile?.tipo_usuario);
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    resendConfirmationEmail,
    sendVerificationCode,
    verifyOtpCode,
    updateProfile,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
