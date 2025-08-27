// src/components/OTPLoginWithTokenExchange.js
import React, { useState } from 'react';
import { useTokenExchange } from '../hooks/useTokenExchange';

/**
 * Componente de login OTP integrado com troca de código por token
 * Demonstra como usar o sistema completo de autenticação
 */
const OTPLoginWithTokenExchange = ({ onLoginSuccess, onLoginError }) => {
  const {
    loading,
    error,
    success,
    session,
    trocarCodigoPorToken,
    trocarCodigoPorTokenHibrido,
    renovarToken,
    logout,
    temSessaoAtiva,
    tokenExpirado,
  } = useTokenExchange();

  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'logged-in'
  const [usarEdgeFunction, setUsarEdgeFunction] = useState(true);

  // Simulação de envio de código OTP
  const enviarCodigoOTP = async () => {
    if (!email) {
      alert('Por favor, insira seu email');
      return;
    }

    try {
      // Aqui você implementaria o envio do código OTP
      // Por exemplo, usando Supabase Auth
      console.log('Enviando código OTP para:', email);

      // Simulação de envio bem-sucedido
      setTimeout(() => {
        setStep('code');
      }, 1000);

    } catch (err) {
      console.error('Erro ao enviar código:', err);
      onLoginError && onLoginError(err);
    }
  };

  // Verificar código e trocar por token
  const verificarECriarSessao = async () => {
    if (!codigo) {
      alert('Por favor, insira o código');
      return;
    }

    try {
      let result;

      if (usarEdgeFunction) {
        result = await trocarCodigoPorToken(email, codigo, 'login', true);
      } else {
        result = await trocarCodigoPorTokenHibrido(email, codigo, 'login');
      }

      console.log('Login bem-sucedido:', result);
      setStep('logged-in');

      onLoginSuccess && onLoginSuccess(result);

    } catch (err) {
      console.error('Erro na verificação:', err);
      onLoginError && onLoginError(err);
    }
  };

  // Verificar e renovar token se necessário
  const verificarSessao = React.useCallback(async () => {
    if (tokenExpirado()) {
      try {
        await renovarToken(session.refresh_token);
      } catch (err) {
        console.error('Erro ao renovar token:', err);
        setStep('email');
      }
    }
  }, [tokenExpirado, renovarToken, session.refresh_token]);

  // Logout
  const handleLogout = async () => {
    try {
      await logout();
      setStep('email');
      setEmail('');
      setCodigo('');
    } catch (err) {
      console.error('Erro no logout:', err);
    }
  };

  // Verificar sessão ao montar componente
  React.useEffect(() => {
    if (temSessaoAtiva()) {
      setStep('logged-in');
      verificarSessao();
    }
  }, [temSessaoAtiva, verificarSessao]); // Adicionadas todas as dependências

  // Renderizar formulário de email
  if (step === 'email') {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <h2>Login com OTP</h2>

        <div style={{ marginBottom: '20px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '5px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
        </div>

        <button
          onClick={enviarCodigoOTP}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Enviando...' : 'Enviar Código OTP'}
        </button>

        <div style={{ marginTop: '15px' }}>
          <label>
            <input
              type="checkbox"
              checked={usarEdgeFunction}
              onChange={(e) => setUsarEdgeFunction(e.target.checked)}
            />
            Usar Edge Function (mais seguro)
          </label>
        </div>
      </div>
    );
  }

  // Renderizar formulário de código
  if (step === 'code') {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <h2>Verificar Código</h2>

        <div style={{ marginBottom: '10px', color: '#666' }}>
          Código enviado para: <strong>{email}</strong>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Código de 6 dígitos:</label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            maxLength="6"
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '5px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px',
              textAlign: 'center',
              letterSpacing: '2px'
            }}
          />
        </div>

        {error && (
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button
            onClick={verificarECriarSessao}
            disabled={loading || codigo.length !== 6}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: loading || codigo.length !== 6 ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Verificando...' : 'Verificar e Entrar'}
          </button>

          <button
            onClick={() => setStep('email')}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              color: '#1976d2',
              border: '1px solid #1976d2',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Renderizar área logada
  if (step === 'logged-in') {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <h2>Bem-vindo!</h2>

        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#e8f5e8',
          borderRadius: '5px',
          border: '1px solid #4caf50'
        }}>
          <h3>✅ Login realizado com sucesso!</h3>
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Token válido até:</strong> {
            session?.expires_at
              ? new Date(session.expires_at * 1000).toLocaleString()
              : 'N/A'
          }</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button
            onClick={verificarSessao}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Verificando...' : 'Verificar Sessão'}
          </button>

          <button
            onClick={handleLogout}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saindo...' : 'Logout'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OTPLoginWithTokenExchange;
