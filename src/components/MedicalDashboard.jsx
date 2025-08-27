// src/components/MedicalDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useConsultas, useUsers, useAsyncOperation } from '../hooks/useSupabase';

/**
 * Dashboard médico completo mostrando integração de múltiplos hooks
 */
const MedicalDashboard = () => {
  const {
    user,
    loading: authLoading,
    signOut,
    hasRole,
    isAuthenticated
  } = useAuth();

  const {
    consultas,
    loading: consultasLoading,
    fetchConsultas,
    updateConsulta
  } = useConsultas();

  const {
    users,
    loading: usersLoading,
    fetchUsers
  } = useUsers();

  const { loading: asyncLoading, execute } = useAsyncOperation();

  const [activeTab, setActiveTab] = useState('consultas');
  const [stats, setStats] = useState({
    totalConsultas: 0,
    consultasHoje: 0,
    pacientesAtivos: 0,
    receitaMensal: 0
  });

  const calculateStats = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0];

    const consultasHoje = consultas.filter(c =>
      c.data_consulta.startsWith(hoje)
    ).length;

    const pacientesUnicos = new Set(
      consultas.map(c => c.paciente_email)
    ).size;

    setStats({
      totalConsultas: consultas.length,
      consultasHoje,
      pacientesAtivos: pacientesUnicos,
      receitaMensal: consultas.length * 150 // Exemplo: R$ 150 por consulta
    });
  }, [consultas]);

  const loadDashboardData = useCallback(async () => {
    await execute(async () => {
      // Carregar dados baseado no tipo de usuário
      if (hasRole('admin') || hasRole('funcionario')) {
        await Promise.all([
          fetchConsultas(),
          fetchUsers()
        ]);
      } else {
        await fetchConsultas({ paciente_email: user.email });
      }

      // Calcular estatísticas
      calculateStats();
    });
  }, [user, hasRole, fetchConsultas, fetchUsers, execute, calculateStats]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData]);

  const handleStatusChange = async (consultaId, newStatus) => {
    try {
      await updateConsulta(consultaId, { status: newStatus });
      await loadDashboardData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'agendada': return '#007bff';
      case 'confirmada': return '#28a745';
      case 'cancelada': return '#dc3545';
      case 'realizada': return '#6c757d';
      default: return '#6c757d';
    }
  };

  if (authLoading || asyncLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Carregando dashboard...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Faça login para acessar o dashboard</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #dee2e6',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>
            Portal Médico Dr. Márcio
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            {getGreeting()}, {user?.profile?.nome || user?.email}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{
            padding: '5px 10px',
            backgroundColor: '#e9ecef',
            borderRadius: '15px',
            fontSize: '12px',
            color: '#495057'
          }}>
            {user?.profile?.tipo_usuario}
          </span>
          <button
            onClick={signOut}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sair
          </button>
        </div>
      </header>

      <div style={{ padding: '30px' }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
              {stats.totalConsultas}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>Total de Consultas</p>
          </div>

          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
              {stats.consultasHoje}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>Consultas Hoje</p>
          </div>

          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>
              {stats.pacientesAtivos}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>Pacientes Ativos</p>
          </div>

          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>
              R$ {stats.receitaMensal.toLocaleString()}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>Receita Estimada</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #dee2e6' }}>
            <button
              onClick={() => setActiveTab('consultas')}
              style={{
                padding: '10px 20px',
                border: 'none',
                backgroundColor: activeTab === 'consultas' ? '#007bff' : 'transparent',
                color: activeTab === 'consultas' ? 'white' : '#666',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer'
              }}
            >
              Consultas
            </button>

            {(hasRole('admin') || hasRole('funcionario')) && (
              <button
                onClick={() => setActiveTab('pacientes')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: activeTab === 'pacientes' ? '#007bff' : 'transparent',
                  color: activeTab === 'pacientes' ? 'white' : '#666',
                  borderRadius: '4px 4px 0 0',
                  cursor: 'pointer'
                }}
              >
                Pacientes ({users.length})
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {activeTab === 'consultas' && (
            <div>
              <h3>Consultas Recentes</h3>
              {consultasLoading ? (
                <div>Carregando consultas...</div>
              ) : consultas.length > 0 ? (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {consultas.slice(0, 10).map((consulta) => (
                    <div key={consulta.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '15px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0' }}>
                          {consulta.paciente_nome}
                        </h4>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                          {new Date(consulta.data_consulta).toLocaleDateString('pt-BR')} às {consulta.horario}
                        </p>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                          {consulta.tipo_consulta}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '5px 10px',
                          backgroundColor: getStatusColor(consulta.status),
                          color: 'white',
                          borderRadius: '15px',
                          fontSize: '12px'
                        }}>
                          {consulta.status}
                        </span>

                        {(hasRole('admin') || hasRole('funcionario')) && (
                          <select
                            value={consulta.status}
                            onChange={(e) => handleStatusChange(consulta.id, e.target.value)}
                            style={{
                              padding: '5px 10px',
                              border: '1px solid #ccc',
                              borderRadius: '4px'
                            }}
                          >
                            <option value="agendada">Agendada</option>
                            <option value="confirmada">Confirmada</option>
                            <option value="cancelada">Cancelada</option>
                            <option value="realizada">Realizada</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Nenhuma consulta encontrada.</p>
              )}
            </div>
          )}

          {activeTab === 'pacientes' && (hasRole('admin') || hasRole('funcionario')) && (
            <div>
              <h3>Gerenciamento de Pacientes</h3>
              {usersLoading ? (
                <div>Carregando pacientes...</div>
              ) : users.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Nome</th>
                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Email</th>
                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Tipo</th>
                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                            {user.profile?.nome || 'N/A'}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                            {user.email}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                            {user.profile?.tipo_usuario || 'N/A'}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                            <span style={{
                              padding: '3px 8px',
                              backgroundColor: user.profile?.status === 'ativo' ? '#28a745' : '#dc3545',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}>
                              {user.profile?.status || 'inativo'}
                            </span>
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Nenhum paciente encontrado.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalDashboard;
