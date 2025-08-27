// src/components/SolicitarCodigoOTP_Edge.jsx
import { useState } from 'react';
import { useOTP } from '../hooks/useOTP';

/**
 * Componente para solicitar código OTP usando Edge Functions
 */
function SolicitarCodigoOTP_Edge({ onCodeSent, onSwitchToVerify }) {
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('login');
  const [usarEdgeFunction, setUsarEdgeFunction] = useState(true);

  const {
    loading,
    error,
    success,
    countdown,
    solicitarCodigo,
    solicitarCodigoHibrido,
    podeReenviar
  } = useOTP();

  const handleSolicitarCodigo = async (e) => {
    e.preventDefault();

    try {
      if (usarEdgeFunction) {
        // Usar Edge Function diretamente
        await solicitarCodigo(email, tipo, true, true);
      } else {
        // Usar método híbrido (Edge Function + fallback)
        await solicitarCodigoHibrido(email, tipo, true);
      }

      // Callback para informar que o código foi enviado
      if (onCodeSent) {
        onCodeSent(email, tipo);
      }

      // Se houver callback para mudar para tela de verificação
      if (onSwitchToVerify) {
        setTimeout(() => {
          onSwitchToVerify(email, tipo);
        }, 2000);
      }

    } catch (err) {
      // Erro já tratado pelo hook
      console.error('Erro ao solicitar código:', err);
    }
  };

  const handleReenviar = async () => {
    if (!podeReenviar) return;

    try {
      await solicitarCodigoHibrido(email, tipo, true);
    } catch (err) {
      console.error('Erro ao reenviar código:', err);
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
          Solicitar Código OTP
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

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#333',
            fontWeight: '500',
            fontSize: '14px'
          }}>
            Tipo de Código:
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="login">Login / Acesso</option>
            <option value="recuperacao">Recuperação de Senha</option>
            <option value="confirmacao">Confirmação de Email</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#666'
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
            Usar Edge Function (recomendado)
          </label>
          <p style={{
            fontSize: '12px',
            color: '#888',
            margin: '5px 0 0 25px'
          }}>
            {usarEdgeFunction
              ? 'Usará Edge Function com validações avançadas'
              : 'Usará método híbrido com fallback automático'
            }
          </p>
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
            marginBottom: '15px'
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
            `📧 Enviar Código (${tipo})`
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

      {email && podeReenviar && (
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
            onClick={handleReenviar}
            style={{
              background: 'none',
              border: '2px solid #28a745',
              color: '#28a745',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => (
              e.target.style.backgroundColor = '#28a745',
              e.target.style.color = 'white'
            )}
            onMouseOut={(e) => (
              e.target.style.backgroundColor = 'transparent',
              e.target.style.color = '#28a745'
            )}
          >
            📧 Reenviar Código
          </button>
        </div>
      )}

      {email && !podeReenviar && countdown > 0 && (
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
            Aguarde {countdown} segundos para reenviar
          </p>
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

export default SolicitarCodigoOTP_Edge;
