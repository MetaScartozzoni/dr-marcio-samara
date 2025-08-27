// src/components/ConsultasExample.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useConsultas, useAuth } from '../hooks/useSupabase';

/**
 * Componente de exemplo mostrando como usar o hook useConsultas
 */
const ConsultasExample = () => {
  const { user, hasRole } = useAuth();
  const {
    consultas,
    loading,
    error,
    fetchConsultas,
    createConsulta,
    updateConsulta,
    deleteConsulta
  } = useConsultas();

  const [showForm, setShowForm] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState(null);
  const [formData, setFormData] = useState({
    paciente_nome: '',
    paciente_email: '',
    data_consulta: '',
    horario: '',
    tipo_consulta: 'consulta',
    status: 'agendada',
    observacoes: ''
  });

  const loadConsultas = useCallback(async () => {
    try {
      const filters = {};

      // Se não for admin, mostrar apenas consultas do usuário
      if (!hasRole('admin') && !hasRole('funcionario')) {
        filters.paciente_email = user.email;
      }

      await fetchConsultas(filters);
    } catch (err) {
      console.error('Erro ao carregar consultas:', err);
    }
  }, [user, hasRole, fetchConsultas]);

  useEffect(() => {
    if (user) {
      loadConsultas();
    }
  }, [user, loadConsultas]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const consultaData = {
        ...formData,
        paciente_id: user.id,
        data_consulta: new Date(formData.data_consulta).toISOString(),
      };

      if (editingConsulta) {
        await updateConsulta(editingConsulta.id, consultaData);
      } else {
        await createConsulta(consultaData);
      }

      resetForm();
      await loadConsultas();
    } catch (err) {
      console.error('Erro ao salvar consulta:', err);
    }
  };

  const handleEdit = (consulta) => {
    setEditingConsulta(consulta);
    setFormData({
      paciente_nome: consulta.paciente_nome,
      paciente_email: consulta.paciente_email,
      data_consulta: new Date(consulta.data_consulta).toISOString().split('T')[0],
      horario: consulta.horario,
      tipo_consulta: consulta.tipo_consulta,
      status: consulta.status,
      observacoes: consulta.observacoes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (consultaId) => {
    if (window.confirm('Tem certeza que deseja excluir esta consulta?')) {
      try {
        await deleteConsulta(consultaId);
        await loadConsultas();
      } catch (err) {
        console.error('Erro ao excluir consulta:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      paciente_nome: '',
      paciente_email: '',
      data_consulta: '',
      horario: '',
      tipo_consulta: 'consulta',
      status: 'agendada',
      observacoes: ''
    });
    setEditingConsulta(null);
    setShowForm(false);
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

  if (!user) {
    return <div>Faça login para acessar as consultas.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gerenciamento de Consultas</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {showForm ? 'Cancelar' : 'Nova Consulta'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>{editingConsulta ? 'Editar Consulta' : 'Nova Consulta'}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label>Nome do Paciente:</label>
              <input
                type="text"
                value={formData.paciente_nome}
                onChange={(e) => setFormData({...formData, paciente_nome: e.target.value})}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label>Email do Paciente:</label>
              <input
                type="email"
                value={formData.paciente_email}
                onChange={(e) => setFormData({...formData, paciente_email: e.target.value})}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label>Data da Consulta:</label>
              <input
                type="date"
                value={formData.data_consulta}
                onChange={(e) => setFormData({...formData, data_consulta: e.target.value})}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label>Horário:</label>
              <input
                type="time"
                value={formData.horario}
                onChange={(e) => setFormData({...formData, horario: e.target.value})}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label>Tipo de Consulta:</label>
              <select
                value={formData.tipo_consulta}
                onChange={(e) => setFormData({...formData, tipo_consulta: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="consulta">Consulta</option>
                <option value="retorno">Retorno</option>
                <option value="procedimento">Procedimento</option>
                <option value="cirurgia">Cirurgia</option>
              </select>
            </div>

            <div>
              <label>Status:</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="agendada">Agendada</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada">Cancelada</option>
                <option value="realizada">Realizada</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Observações:</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows="3"
              style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {editingConsulta ? 'Atualizar' : 'Criar'} Consulta
            </button>
            <button
              type="button"
              onClick={resetForm}
              style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <h3>Consultas ({consultas.length})</h3>

      {loading ? (
        <div>Carregando consultas...</div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {consultas.map((consulta) => (
            <div key={consulta.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4>{consulta.paciente_nome}</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      backgroundColor: getStatusColor(consulta.status),
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    {consulta.status}
                  </span>
                  <button
                    onClick={() => handleEdit(consulta)}
                    style={{ padding: '4px 8px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Editar
                  </button>
                  {(hasRole('admin') || hasRole('funcionario')) && (
                    <button
                      onClick={() => handleDelete(consulta.id)}
                      style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '14px', color: '#666' }}>
                <div><strong>Email:</strong> {consulta.paciente_email}</div>
                <div><strong>Data:</strong> {new Date(consulta.data_consulta).toLocaleDateString('pt-BR')}</div>
                <div><strong>Horário:</strong> {consulta.horario}</div>
                <div><strong>Tipo:</strong> {consulta.tipo_consulta}</div>
                <div><strong>Criado em:</strong> {new Date(consulta.created_at).toLocaleDateString('pt-BR')}</div>
              </div>

              {consulta.observacoes && (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <strong>Observações:</strong> {consulta.observacoes}
                </div>
              )}
            </div>
          ))}

          {consultas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Nenhuma consulta encontrada.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsultasExample;
