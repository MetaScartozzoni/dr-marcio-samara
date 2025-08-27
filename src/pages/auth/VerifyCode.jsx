// src/pages/auth/VerifyCode.jsx
import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  Paper,
  Grid,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';

const VerifyCode = () => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sendVerificationCode, verifyOtpCode } = useAuth();

  useEffect(() => {
    // Obter email dos parâmetros da URL ou localStorage
    const emailFromParams = searchParams.get('email');
    const emailFromStorage = localStorage.getItem('pendingConfirmationEmail');

    if (emailFromParams) {
      setEmail(emailFromParams);
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    } else {
      // Se não houver email, redirecionar para registro
      navigate('/register');
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    // Countdown para reenvio de código
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!code.trim()) {
      setError('Digite o código de verificação');
      setLoading(false);
      return;
    }

    if (code.length !== 6) {
      setError('O código deve ter 6 dígitos');
      setLoading(false);
      return;
    }

    try {
      await verifyOtpCode(email, code);
      setSuccess('Email verificado com sucesso! Você será redirecionado em alguns segundos...');

      // Limpar localStorage
      localStorage.removeItem('pendingConfirmationEmail');

      // Redirecionar após sucesso
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Erro ao verificar código:', error);

      if (error.message.includes('invalid')) {
        setError('Código inválido. Verifique e tente novamente.');
      } else if (error.message.includes('expired')) {
        setError('Código expirado. Solicite um novo código.');
      } else if (error.message.includes('too_many')) {
        setError('Muitas tentativas. Aguarde alguns minutos.');
      } else {
        setError('Erro ao verificar código. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    setError('');
    setSuccess('');

    try {
      await sendVerificationCode(email);
      setSuccess('Novo código enviado! Verifique seu email.');
      setCountdown(60); // 60 segundos de countdown
    } catch (error) {
      console.error('Erro ao reenviar código:', error);
      setError('Erro ao reenviar código. Tente novamente.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AuthLayout title="Verificar Código">
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            Digite o código de 6 dígitos enviado para:
            <br />
            <strong>{email}</strong>
          </Typography>

          <TextField
            margin="normal"
            required
            fullWidth
            name="code"
            label="Código de Verificação"
            type="text"
            id="code"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => {
              // Permitir apenas números e limitar a 6 dígitos
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(value);
            }}
            disabled={loading}
            inputProps={{
              maxLength: 6,
              style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
            }}
            helperText="Digite os 6 dígitos do código"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Verificando...' : 'Verificar Código'}
          </Button>

          <Grid container>
            <Grid item xs>
              <Button
                variant="text"
                onClick={handleResendCode}
                disabled={resendLoading || countdown > 0}
                sx={{ textTransform: 'none' }}
              >
                {resendLoading ? 'Enviando...' :
                 countdown > 0 ? `Aguarde ${formatCountdown(countdown)}` :
                 'Reenviar Código'}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="text"
                onClick={() => navigate('/register')}
                sx={{ textTransform: 'none' }}
              >
                Email errado? Registrar novamente
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </AuthLayout>
  );
};

export default VerifyCode;
