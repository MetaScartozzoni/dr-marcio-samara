// src/pages/auth/EmailConfirmation.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  CircularProgress,
  Paper,
  Grid,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import { supabase } from '../../services/supabase';

const EmailConfirmation = () => {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, resendConfirmationEmail, sendVerificationCode } = useAuth();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Verificar se há parâmetros de erro na URL
        const error = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          console.error('Erro na confirmação:', error, errorCode, errorDescription);
          setStatus('error');
          setMessage(`Erro na confirmação: ${errorDescription || error}`);
          return;
        }

        // Verificar se há um token de confirmação
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (token && type === 'signup') {
          // Se temos um token, tentar confirmar o email
          const { error: confirmError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });

          if (confirmError) {
            console.error('Erro ao confirmar email:', confirmError);
            setStatus('error');
            setMessage('Erro ao confirmar email. O link pode ter expirado.');
          } else {
            setStatus('success');
            setMessage('Email confirmado com sucesso! Você será redirecionado em alguns segundos...');
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        } else if (user) {
          // Se o usuário já está logado, redirecionar para o dashboard
          setStatus('success');
          setMessage('Email já confirmado! Redirecionando...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // Caso não haja token ou usuário, mostrar mensagem genérica
          setStatus('info');
          setMessage('Verifique seu email e clique no link de confirmação enviado.');
        }
      } catch (error) {
        console.error('Erro inesperado:', error);
        setStatus('error');
        setMessage('Erro inesperado. Tente novamente mais tarde.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate, user]);

  const handleResendConfirmation = async () => {
    try {
      setStatus('loading');
      const email = localStorage.getItem('pendingConfirmationEmail');

      if (!email) {
        setStatus('error');
        setMessage('Email não encontrado. Faça o registro novamente.');
        return;
      }

      await resendConfirmationEmail(email);
      setStatus('success');
      setMessage('Email de confirmação reenviado! Verifique sua caixa de entrada.');
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      setStatus('error');
      setMessage('Erro ao reenviar email. Tente novamente.');
    }
  };

  const handleSendVerificationCode = async () => {
    try {
      setStatus('loading');
      const email = localStorage.getItem('pendingConfirmationEmail');

      if (!email) {
        setStatus('error');
        setMessage('Email não encontrado. Faça o registro novamente.');
        return;
      }

      await sendVerificationCode(email);
      setStatus('success');
      setMessage('Código de verificação enviado! Você será redirecionado em alguns segundos...');

      setTimeout(() => {
        navigate('/verify-code', {
          state: { email: email }
        });
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      setStatus('error');
      setMessage('Erro ao enviar código. Tente novamente.');
    }
  };

  return (
    <AuthLayout title="Confirmação de Email">
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {status === 'loading' && (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Processando confirmação...
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
                {message}
              </Alert>
              <Typography variant="body1">
                Você será redirecionado automaticamente.
              </Typography>
            </>
          )}

          {status === 'error' && (
            <>
              <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                {message}
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    onClick={handleSendVerificationCode}
                    sx={{ width: '100%' }}
                  >
                    Enviar Código de Verificação
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    onClick={handleResendConfirmation}
                    sx={{ width: '100%' }}
                  >
                    Reenviar Email
                  </Button>
                </Grid>
              </Grid>
            </>
          )}

          {status === 'info' && (
            <>
              <Alert severity="info" sx={{ mb: 2, width: '100%' }}>
                {message}
              </Alert>
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{ mt: 2 }}
              >
                Voltar ao Login
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </AuthLayout>
  );
};

export default EmailConfirmation;
