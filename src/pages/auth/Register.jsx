// src/pages/auth/Register.jsx
import React, { useState } from 'react';
import {
  Button,
  TextField,
  Link,
  Grid,
  Alert,
  Box,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nomeCompleto: '',
    telefone: '',
    acceptTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'acceptTerms' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Você deve aceitar os termos de uso.');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        nome_completo: formData.nomeCompleto,
        telefone: formData.telefone,
        tipo_usuario: 'paciente', // Default role
      };

      await signUp(formData.email, formData.password, userData);

      // Redirecionar para página de verificação de código
      navigate(`/verify-code?email=${encodeURIComponent(formData.email)}`, {
        state: {
          message: 'Conta criada! Digite o código de verificação enviado para seu email.'
        }
      });
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Criar Conta">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          id="nomeCompleto"
          label="Nome Completo"
          name="nomeCompleto"
          autoComplete="name"
          autoFocus
          value={formData.nomeCompleto}
          onChange={handleChange}
          disabled={loading}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          id="telefone"
          label="Telefone"
          name="telefone"
          autoComplete="tel"
          value={formData.telefone}
          onChange={handleChange}
          disabled={loading}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email"
          name="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Senha"
          type="password"
          id="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Confirmar Senha"
          type="password"
          id="confirmPassword"
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={loading}
        />

        <FormControlLabel
          control={
            <Checkbox
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              color="primary"
              disabled={loading}
            />
          }
          label="Aceito os termos de uso e política de privacidade"
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </Button>

        <Grid container justifyContent="center">
          <Grid item>
            <Link href="/login" variant="body2">
              Já tem uma conta? Faça login
            </Link>
          </Grid>
        </Grid>
      </Box>
    </AuthLayout>
  );
};

export default Register;
