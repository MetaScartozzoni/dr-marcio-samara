// src/components/VerificarCodigoOTP.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useSupabase';

/**
 * Componente para verificar código OTP de 6 caracteres
 */
function VerificarCodigoOTP({ email, onSuccess, onBack, onResendCode }) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  const { verifyOtpCode, sendVerificationCode } = useAuth();

  // Countdown para reenvio de código
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerificarCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Usar o método do SupabaseApiService através do hook
      const result = await verifyOtpCode(email, codigo);

      setSuccess('✅ Código verificado com sucesso! Redirecionando...');

      // Callback de sucesso
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(result);
        }, 1500);
      }

    } catch (err) {
      console.error('Erro ao verificar código:', err);
      setError(`❌ Código inválido ou expirado: ${err.message}`);

      // Limpar o campo de código em caso de erro
      setCodigo('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await sendVerificationCode(email);
      setSuccess('✅ Novo código enviado! Verifique seu email.');
      setCountdown(60); // 60 segundos de countdown

      if (onResendCode) {
        onResendCode(email);
      }
    } catch (err) {
      setError(`❌ Erro ao reenviar código: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Apenas números
    if (value.length <= 6) {
      setCodigo(value);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '30px',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      backgroundColor: '#fff',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{
          color: '#333',
          marginBottom: '10px',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          Verificar Código
        </h2>
        <p style={{
          color: '#666',
          margin: '0',
          fontSize: '14px'
        }}>
          Digite o código de 6 dígitos enviado para:
        </p>
        <p style={{
          color: '#007bff',
          margin: '5px 0 0 0',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {email}
        </p>
      </div>

      <form onSubmit={handleVerificarCodigo}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#333',
            fontWeight: '500',
            fontSize: '14px'
          }}>
            Código de 6 dígitos:
          </label>
          <input
            type="text"
            placeholder="000000"
            value={codigo}
            onChange={handleInputChange}
            required
            maxLength="6"
            style={{
              width: '100%',
              padding: '16px',
              border: `2px solid ${error ? '#dc3545' : '#e0e0e0'}`,
              borderRadius: '8px',
              fontSize: '20px',
              fontWeight: '600',
              textAlign: 'center',
              letterSpacing: '8px',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box',
              fontFamily: 'monospace'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = error ? '#dc3545' : '#e0e0e0'}
            autoComplete="one-time-code"
          />
          <p style={{
            color: '#666',
            fontSize: '12px',
            margin: '5px 0 0 0',
            textAlign: 'center'
          }}>
            Digite apenas os números do código
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || codigo.length !== 6}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: (loading || codigo.length !== 6) ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: (loading || codigo.length !== 6) ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s ease',
            marginBottom: '15px'
          }}
          onMouseOver={(e) => !(loading || codigo.length !== 6) && (e.target.style.backgroundColor = '#218838')}
          onMouseOut={(e) => !(loading || codigo.length !== 6) && (e.target.style.backgroundColor = '#28a745')}
        >
          {loading ? (
            <span>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>⟳</span>
              Verificando...
            </span>
          ) : (
            '✅ Verificar Código'
          )}
        </button>

        {success && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
      </form>

      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #e0e0e0'
      }}>
        <p style={{
          color: '#666',
          fontSize: '13px',
          margin: '0 0 10px 0'
        }}>
          Não recebeu o código?
        </p>

        <button
          onClick={handleResendCode}
          disabled={loading || countdown > 0}
          style={{
            background: 'none',
            border: '2px solid #007bff',
            color: (loading || countdown > 0) ? '#ccc' : '#007bff',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: (loading || countdown > 0) ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => !(loading || countdown > 0) && (
            e.target.style.backgroundColor = '#007bff',
            e.target.style.color = 'white'
          )}
          onMouseOut={(e) => !(loading || countdown > 0) && (
            e.target.style.backgroundColor = 'transparent',
            e.target.style.color = '#007bff'
          )}
        >
          {countdown > 0 ? `Reenviar em ${countdown}s` : '📧 Reenviar Código'}
        </button>
      </div>

      {onBack && (
        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '13px'
            }}
          >
            ← Voltar para solicitar código
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default VerificarCodigoOTP;
