// src/components/TokenExchangeDemo.js
import React, { useState } from 'react';
import { useTokenExchange } from '../hooks/useTokenExchange';

/**
 * Componente de demonstração para troca de código OTP por token
 * Este componente mostra como usar o hook useTokenExchange
 */
const TokenExchangeDemo = () => {
  const {
    loading,
    error,
    success,
    session,
    trocarCodigoPorToken,
    trocarCodigoPorTokenHibrido,
    estabelecerSessao, // Disponível para uso futuro
    verificarToken,
    renovarToken,
    logout,
    limparMensagens,
    temSessaoAtiva,
    getAccessToken, // Disponível para uso futuro
    tokenExpirado,
  } = useTokenExchange();

  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState('login');
  const [usarEdgeFunction, setUsarEdgeFunction] = useState(true);
  const [tokenParaVerificar, setTokenParaVerificar] = useState('');

  const handleTrocaCodigo = async () => {
    if (!email || !codigo) {
      alert('Por favor, preencha email e código');
      return;
    }

    try {
      const result = await trocarCodigoPorToken(email, codigo, tipo, usarEdgeFunction);
      console.log('Resultado da troca:', result);
    } catch (err) {
      console.error('Erro na troca:', err);
    }
  };

  const handleTrocaHibrida = async () => {
    if (!email || !codigo) {
      alert('Por favor, preencha email e código');
      return;
    }

    try {
      const result = await trocarCodigoPorTokenHibrido(email, codigo, tipo);
      console.log('Resultado da troca híbrida:', result);
    } catch (err) {
      console.error('Erro na troca híbrida:', err);
    }
  };

  const handleVerificarToken = async () => {
    if (!tokenParaVerificar) {
      alert('Por favor, insira um token para verificar');
      return;
    }

    try {
      const result = await verificarToken(tokenParaVerificar);
      console.log('Resultado da verificação:', result);
      alert(result.valido ? 'Token válido!' : 'Token inválido!');
    } catch (err) {
      console.error('Erro na verificação:', err);
    }
  };

  const handleRenovarToken = async () => {
    if (!session?.refresh_token) {
      alert('Não há refresh token disponível');
      return;
    }

    try {
      const result = await renovarToken(session.refresh_token);
      console.log('Resultado da renovação:', result);
    } catch (err) {
      console.error('Erro na renovação:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Erro no logout:', err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Demonstração - Troca de Código por Token</h2>

      {/* Status da sessão */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Status da Sessão</h3>
        <p><strong>Sessão ativa:</strong> {temSessaoAtiva() ? 'Sim' : 'Não'}</p>
        <p><strong>Token expirado:</strong> {tokenExpirado() ? 'Sim' : 'Não'}</p>
        {session && (
          <details>
            <summary>Detalhes da Sessão</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(session, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Mensagens */}
      {error && (
        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '5px' }}>
          <strong>Erro:</strong> {error}
        </div>
      )}

      {success && (
        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#e8f5e8', color: '#2e7d32', borderRadius: '5px' }}>
          <strong>Sucesso:</strong> {success}
        </div>
      )}

      {/* Formulário de troca de código */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Troca de Código por Token</h3>

        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Código OTP:</label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="123456"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Tipo:</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="login">Login</option>
            <option value="signup">Cadastro</option>
            <option value="recovery">Recuperação</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="checkbox"
              checked={usarEdgeFunction}
              onChange={(e) => setUsarEdgeFunction(e.target.checked)}
            />
            Usar Edge Function
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleTrocaCodigo}
            disabled={loading}
            style={{
              padding: '10px 15px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Processando...' : 'Trocar Código'}
          </button>

          <button
            onClick={handleTrocaHibrida}
            disabled={loading}
            style={{
              padding: '10px 15px',
              backgroundColor: '#388e3c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Processando...' : 'Troca Híbrida'}
          </button>
        </div>
      </div>

      {/* Verificação de token */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Verificar Token</h3>

        <div style={{ marginBottom: '10px' }}>
          <label>Token para verificar:</label>
          <input
            type="text"
            value={tokenParaVerificar}
            onChange={(e) => setTokenParaVerificar(e.target.value)}
            placeholder="Cole o token aqui"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <button
          onClick={handleVerificarToken}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#f57c00',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Verificando...' : 'Verificar Token'}
        </button>
      </div>

      {/* Ações da sessão */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Ações da Sessão</h3>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRenovarToken}
            disabled={loading || !session?.refresh_token}
            style={{
              padding: '10px 15px',
              backgroundColor: '#7b1fa2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading || !session?.refresh_token ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Renovando...' : 'Renovar Token'}
          </button>

          <button
            onClick={handleLogout}
            disabled={loading}
            style={{
              padding: '10px 15px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saindo...' : 'Logout'}
          </button>

          <button
            onClick={limparMensagens}
            style={{
              padding: '10px 15px',
              backgroundColor: '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Limpar Mensagens
          </button>
        </div>
      </div>

      {/* Informações técnicas */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Informações Técnicas</h3>
        <ul>
          <li><strong>Edge Function:</strong> Implementada em <code>supabase/functions/troca-codigo-token/index.ts</code></li>
          <li><strong>Serviço:</strong> Implementado em <code>src/services/tokenExchangeService.js</code></li>
          <li><strong>Hook:</strong> Implementado em <code>src/hooks/useTokenExchange.js</code></li>
          <li><strong>Segurança:</strong> Tokens são trocados server-side via Edge Function</li>
          <li><strong>Fallback:</strong> Método híbrido tenta Edge Function primeiro, depois método direto</li>
        </ul>
      </div>
    </div>
  );
};

export default TokenExchangeDemo;
