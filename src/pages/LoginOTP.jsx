// src/pages/LoginOTP.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OTPFlow_Edge from '../components/OTPFlow_Edge';
import { useAuth } from '../hooks/useSupabase';

/**
 * Página completa de login usando OTP com Edge Functions
 */
function LoginOTP() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showOTP, setShowOTP] = useState(false);

  // Se já estiver autenticado, redirecionar
  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleSuccess = (result) => {
    console.log('Login realizado com sucesso!', result);

    // Aqui você pode:
    // 1. Salvar dados do usuário no contexto
    // 2. Redirecionar para a página apropriada
    // 3. Executar ações pós-login

    if (result.user) {
      // Redirecionar baseado no tipo de usuário
      const userType = result.user.user_metadata?.tipo_usuario;
      switch (userType) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'funcionario':
          navigate('/funcionario/dashboard');
          break;
        default:
          navigate('/paciente/dashboard');
          break;
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleCancel = () => {
    console.log('Login cancelado');
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {!showOTP ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h1 style={{
              color: '#333',
              marginBottom: '20px',
              fontSize: '28px',
              fontWeight: '700'
            }}>
              Portal Dr. Márcio
            </h1>
            <p style={{
              color: '#666',
              marginBottom: '30px',
              fontSize: '16px'
            }}>
              Entre com seu email para receber um código de verificação
            </p>

            <button
              onClick={() => setShowOTP(true)}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              🚀 Entrar com Código OTP
            </button>

            <div style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #e0e0e0'
            }}>
              <p style={{
                color: '#888',
                fontSize: '12px',
                margin: '0'
              }}>
                Sistema seguro • Supabase Edge Functions
              </p>
            </div>
          </div>
        </div>
      ) : (
        <OTPFlow_Edge
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

export default LoginOTP;
