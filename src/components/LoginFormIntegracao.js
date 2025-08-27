// src/components/LoginFormIntegracao.js
import React, { useState } from 'react';
import { useTokenExchange } from '../hooks/useTokenExchange';

/**
 * Exemplo de como integrar o sistema de troca de código por token
 * com um formulário de login existente
 */
const LoginFormIntegracao = () => {
  const {
    loading,
    error,
    success,
    trocarCodigoPorToken,
    trocarCodigoPorTokenHibrido,
    temSessaoAtiva,
    logout
  } = useTokenExchange();

  const [formData, setFormData] = useState({
    email: '',
    codigo: ''
  });
  const [step, setStep] = useState('email'); // 'email' | 'codigo'
  const [usarEdgeFunction, setUsarEdgeFunction] = useState(true);

  // Atualizar campos do formulário
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Enviar código OTP (simulação - substitua pela sua implementação)
  const enviarCodigoOTP = async () => {
    if (!formData.email) {
      alert('Por favor, insira seu email');
      return;
    }

    try {
      // TODO: Substitua pela sua implementação de envio de OTP
      // Por exemplo:
      // const { error } = await supabase.auth.signInWithOtp({
      //   email: formData.email
      // });

      console.log('Código OTP enviado para:', formData.email);

      // Simulação de sucesso
      setTimeout(() => {
        setStep('codigo');
      }, 1000);

    } catch (err) {
      console.error('Erro ao enviar código:', err);
      alert('Erro ao enviar código. Tente novamente.');
    }
  };

  // Verificar código e fazer login
  const handleLogin = async () => {
    if (!formData.codigo || formData.codigo.length !== 6) {
      alert('Por favor, insira um código válido de 6 dígitos');
      return;
    }

    try {
      let result;

      if (usarEdgeFunction) {
        // Usar Edge Function (recomendado)
        result = await trocarCodigoPorToken(
          formData.email,
          formData.codigo,
          'login',
          true
        );
      } else {
        // Usar método híbrido (fallback)
        result = await trocarCodigoPorTokenHibrido(
          formData.email,
          formData.codigo,
          'login'
        );
      }

      console.log('Login bem-sucedido:', result);

      // Aqui você pode redirecionar ou atualizar o estado da aplicação
      // Por exemplo:
      // navigate('/dashboard');
      // ou
      // window.location.href = '/dashboard';

    } catch (err) {
      console.error('Erro no login:', err);
      // O erro já é tratado pelo hook e exibido na interface
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await logout();
      setFormData({ email: '', codigo: '' });
      setStep('email');
    } catch (err) {
      console.error('Erro no logout:', err);
    }
  };

  // Se já está logado, mostrar dashboard simples
  if (temSessaoAtiva()) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>✅ Você está logado!</h2>
        <p><strong>Email:</strong> {formData.email}</p>
        <button
          onClick={handleLogout}
          disabled={loading}
          style={{
            padding: '10px 20px',
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
    );
  }

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        {step === 'email' ? 'Login com OTP' : 'Verificar Código'}
      </h2>

      {/* Campo de Email */}
      {step === 'email' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email:
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="seu@email.com"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {/* Campo de Código */}
      {step === 'codigo' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Código de 6 dígitos:
          </label>
          <input
            type="text"
            value={formData.codigo}
            onChange={(e) => handleInputChange('codigo', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            maxLength="6"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px',
              textAlign: 'center',
              letterSpacing: '2px',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            Código enviado para: <strong>{formData.email}</strong>
          </small>
        </div>
      )}

      {/* Mensagens de erro e sucesso */}
      {error && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '5px',
          border: '1px solid #ffcdd2'
        }}>
          <strong>Erro:</strong> {error}
        </div>
      )}

      {success && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#e8f5e8',
          color: '#2e7d32',
          borderRadius: '5px',
          border: '1px solid #c8e6c9'
        }}>
          <strong>Sucesso:</strong> {success}
        </div>
      )}

      {/* Botões */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {step === 'email' ? (
          <button
            onClick={enviarCodigoOTP}
            disabled={loading || !formData.email}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: loading || !formData.email ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Enviando...' : 'Enviar Código OTP'}
          </button>
        ) : (
          <>
            <button
              onClick={handleLogin}
              disabled={loading || formData.codigo.length !== 6}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: loading || formData.codigo.length !== 6 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
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
          </>
        )}
      </div>

      {/* Opções avançadas */}
      {step === 'email' && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '5px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Opções Avançadas:</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={usarEdgeFunction}
              onChange={(e) => setUsarEdgeFunction(e.target.checked)}
            />
            Usar Edge Function (mais seguro)
          </label>
        </div>
      )}

      {/* Informações técnicas */}
      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#e3f2fd',
        borderRadius: '5px',
        fontSize: '12px',
        color: '#1976d2'
      }}>
        <strong>💡 Integração:</strong> Este componente demonstra como integrar
        o sistema de troca de código por token com um formulário existente.
        Substitua a função <code>enviarCodigoOTP</code> pela sua implementação atual.
      </div>
    </div>
  );
};

export default LoginFormIntegracao;
