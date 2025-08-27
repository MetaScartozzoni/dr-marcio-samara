// src/components/OTPFlow_Edge.jsx
import { useState } from 'react';
import SolicitarCodigoOTP_Edge from './SolicitarCodigoOTP_Edge';
import VerificarCodigoOTP_Edge from './VerificarCodigoOTP_Edge';

/**
 * Componente completo que demonstra o fluxo completo de OTP usando Edge Functions
 */
function OTPFlow_Edge({ onSuccess, onCancel }) {
  const [step, setStep] = useState('solicitar'); // 'solicitar' | 'verificar'
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('login');

  const handleCodeSent = (emailEnviado, tipoEnviado) => {
    setEmail(emailEnviado);
    setTipo(tipoEnviado);
    setStep('verificar');
  };

  const handleCodeVerified = (result) => {
    console.log('Código verificado com sucesso:', result);

    if (onSuccess) {
      onSuccess(result);
    }
  };

  const handleBack = () => {
    setStep('solicitar');
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            color: '#333',
            marginBottom: '10px',
            fontSize: '28px',
            fontWeight: '700'
          }}>
            Sistema de Verificação OTP
          </h1>
          <p style={{
            color: '#666',
            margin: '0',
            fontSize: '16px'
          }}>
            Usando Edge Functions do Supabase
          </p>

          {/* Step indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '20px',
            gap: '10px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: step === 'solicitar' ? '#007bff' : '#28a745',
              transition: 'background-color 0.3s ease'
            }} />
            <div style={{
              width: '40px',
              height: '2px',
              backgroundColor: step === 'verificar' ? '#28a745' : '#e0e0e0',
              transition: 'background-color 0.3s ease'
            }} />
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: step === 'verificar' ? '#28a745' : '#e0e0e0',
              transition: 'background-color 0.3s ease'
            }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '10px'
          }}>
            <span style={{
              fontSize: '12px',
              color: step === 'solicitar' ? '#007bff' : '#666',
              fontWeight: step === 'solicitar' ? '600' : '400'
            }}>
              Solicitar Código
            </span>
            <span style={{
              fontSize: '12px',
              color: step === 'verificar' ? '#28a745' : '#666',
              fontWeight: step === 'verificar' ? '600' : '400'
            }}>
              Verificar Código
            </span>
          </div>
        </div>

        {/* Content */}
        {step === 'solicitar' && (
          <div>
            <SolicitarCodigoOTP_Edge
              onCodeSent={handleCodeSent}
              onSwitchToVerify={(email, tipo) => {
                setEmail(email);
                setTipo(tipo);
                setStep('verificar');
              }}
            />

            {onCancel && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={handleCancel}
                  style={{
                    background: 'none',
                    border: '2px solid #dc3545',
                    color: '#dc3545',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => (
                    e.target.style.backgroundColor = '#dc3545',
                    e.target.style.color = 'white'
                  )}
                  onMouseOut={(e) => (
                    e.target.style.backgroundColor = 'transparent',
                    e.target.style.color = '#dc3545'
                  )}
                >
                  ❌ Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'verificar' && (
          <div>
            <VerificarCodigoOTP_Edge
              email={email}
              tipo={tipo}
              onSuccess={handleCodeVerified}
              onBack={handleBack}
              onResendCode={(email, tipo) => {
                console.log('Código reenviado para:', email, tipo);
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #e0e0e0'
        }}>
          <p style={{
            color: '#888',
            fontSize: '12px',
            margin: '0'
          }}>
            Sistema seguro de verificação • Supabase Edge Functions
          </p>
        </div>
      </div>
    </div>
  );
}

export default OTPFlow_Edge;
