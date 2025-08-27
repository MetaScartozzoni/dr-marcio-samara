// src/components/VerificarCodigoOTP_Edge.jsx
import { useState, useEffect } from 'react';
import { useOTP } from '../hooks/useOTP';

/**
 * Componente para verificar código OTP usando Edge Functions
 */
function VerificarCodigoOTP_Edge({ email, tipo = 'login', onSuccess, onBack, onResendCode }) {
  const [codigo, setCodigo] = useState('');
  const [usarEdgeFunction, setUsarEdgeFunction] = useState(true);

  const {
    loading,
    error,
    success,
    countdown,
    verificarCodigo,
    verificarCodigoHibrido,
    solicitarCodigoHibrido,
    limparMensagens,
    podeReenviar
  } = useOTP();

  // Countdown para reenvio de código
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        // O countdown será gerenciado pelo hook useOTP
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerificarCodigo = async (e) => {
    e.preventDefault();
    limparMensagens();

    try {
      let result;

      if (usarEdgeFunction) {
        // Usar Edge Function diretamente
        result = await verificarCodigo(email, codigo, tipo, true);
      } else {
        // Usar método híbrido (Edge Function + fallback)
        result = await verificarCodigoHibrido(email, codigo, tipo);
      }

      // Callback de sucesso
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(result);
        }, 1500);
      }

    } catch (err) {
      // Erro já tratado pelo hook
      console.error('Erro ao verificar código:', err);
    }
  };

  const handleResendCode = async () => {
    if (!podeReenviar) return;

    limparMensagens();

    try {
      await solicitarCodigoHibrido(email, tipo, true);
      if (onResendCode) {
        onResendCode(email, tipo);
      }
    } catch (err) {
      console.error('Erro ao reenviar código:', err);
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

  const formatTipo = (tipo) => {
    switch (tipo) {
      case 'login': return 'Login';
      case 'recuperacao': return 'Recuperação';
      case 'confirmacao': return 'Confirmação';
      default: return tipo;
    }
  };

  return (
    <div style={{
      maxWidth: '450px',
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
          Verificar Código - {formatTipo(tipo)}
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

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#666',
          justifyContent: 'center'
        }}>
          <input
            type="checkbox"
            checked={usarEdgeFunction}
            onChange={(e) => setUsarEdgeFunction(e.target.checked)}
            style={{
              marginRight: '8px',
              transform: 'scale(1.2)'
            }}
          />
          Usar Edge Function
        </label>
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
          disabled={loading || !podeReenviar}
          style={{
            background: 'none',
            border: `2px solid ${podeReenviar ? '#007bff' : '#ccc'}`,
            color: podeReenviar ? '#007bff' : '#ccc',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: podeReenviar ? 'pointer' : 'not-allowed',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            marginRight: '10px'
          }}
          onMouseOver={(e) => podeReenviar && (
            e.target.style.backgroundColor = '#007bff',
            e.target.style.color = 'white'
          )}
          onMouseOut={(e) => podeReenviar && (
            e.target.style.backgroundColor = 'transparent',
            e.target.style.color = '#007bff'
          )}
        >
          {podeReenviar ? '📧 Reenviar' : `Aguarde ${countdown}s`}
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

export default VerificarCodigoOTP_Edge;
