// src/components/SolicitarCodigoOTP.jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useSupabase';

/**
 * Componente para solicitar código OTP de 6 caracteres
 */
function SolicitarCodigoOTP({ onCodeSent, onSwitchToVerify }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { sendVerificationCode } = useAuth();

  const handleSolicitarCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Usar o método do SupabaseApiService através do hook
      await sendVerificationCode(email);

      setMessage('✅ Código de 6 dígitos enviado com sucesso! Verifique seu email.');

      // Callback para informar que o código foi enviado
      if (onCodeSent) {
        onCodeSent(email);
      }

      // Se houver callback para mudar para tela de verificação
      if (onSwitchToVerify) {
        setTimeout(() => {
          onSwitchToVerify(email);
        }, 2000);
      }

    } catch (err) {
      console.error('Erro ao solicitar código:', err);
      setError(`❌ Erro ao enviar código: ${err.message}`);
    } finally {
      setLoading(false);
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
          Entrar com Código de Verificação
        </h2>
        <p style={{
          color: '#666',
          margin: '0',
          fontSize: '14px'
        }}>
          Digite seu email para receber um código de 6 dígitos
        </p>
      </div>

      <form onSubmit={handleSolicitarCodigo}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#333',
            fontWeight: '500',
            fontSize: '14px'
          }}>
            Email:
          </label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '16px',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s ease',
            marginBottom: '20px'
          }}
          onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#0056b3')}
          onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#007bff')}
        >
          {loading ? (
            <span>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>⟳</span>
              Enviando código...
            </span>
          ) : (
            '📧 Enviar Código de 6 Dígitos'
          )}
        </button>

        {message && (
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
            {message}
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
          margin: '0'
        }}>
          Não recebeu o código?
          <button
            onClick={() => setMessage('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '13px',
              marginLeft: '5px'
            }}
          >
            Tentar novamente
          </button>
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SolicitarCodigoOTP;
