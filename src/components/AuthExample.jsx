// src/components/AuthExample.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useSupabase';

/**
 * Componente de exemplo mostrando como usar o hook useAuth
 */
const AuthExample = () => {
  const {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    sendVerificationCode,
    verifyOtpCode,
    hasRole,
    isAuthenticated
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await signIn(email, password);

      if (result.needsOtp) {
        setShowOtpInput(true);
        setSuccess('Código de verificação enviado para seu email!');
      } else {
        setSuccess('Login realizado com sucesso!');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await signUp(email, password, {
        nome: 'Nome do Usuário',
        tipo_usuario: 'paciente'
      });

      if (result.needsOtp) {
        setShowOtpInput(true);
        setSuccess('Conta criada! Código de verificação enviado para seu email.');
      } else {
        setSuccess('Conta criada com sucesso!');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await verifyOtpCode(email, otpCode);
      setSuccess('Verificação realizada com sucesso!');
      setShowOtpInput(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendVerificationCode = async () => {
    setError('');
    setSuccess('');

    try {
      await sendVerificationCode(email);
      setSuccess('Código de verificação enviado!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setSuccess('Logout realizado com sucesso!');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Exemplo de Autenticação</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: 'green', marginBottom: '10px', padding: '10px', border: '1px solid green', borderRadius: '4px' }}>
          {success}
        </div>
      )}

      {isAuthenticated ? (
        <div>
          <h3>Bem-vindo, {user?.profile?.nome || user?.email}!</h3>
          <p>Email: {user?.email}</p>
          <p>Tipo: {user?.profile?.tipo_usuario}</p>
          <p>ID: {user?.id}</p>

          {hasRole('admin') && (
            <div style={{ backgroundColor: '#e8f5e8', padding: '10px', margin: '10px 0', borderRadius: '4px' }}>
              Você tem permissões de administrador!
            </div>
          )}

          <button
            onClick={handleSignOut}
            style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Sair
          </button>
        </div>
      ) : (
        <div>
          {!showOtpInput ? (
            <form onSubmit={handleSignIn}>
              <div style={{ marginBottom: '15px' }}>
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>Senha:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Entrar
                </button>

                <button
                  type="button"
                  onClick={handleSignUp}
                  style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cadastrar
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: '15px' }}>
                <label>Código de Verificação (OTP):</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  placeholder="Digite o código de 6 dígitos"
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Verificar
                </button>

                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Reenviar Código
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthExample;
