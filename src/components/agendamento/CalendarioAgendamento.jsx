// src/components/agendamento/CalendarioAgendamento.jsx
import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Event as EventIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAgendamentos, 
  criarAgendamento, 
  fetchDisponibilidade,
  atualizarAgendamento,
  cancelarAgendamento,
  fetchPacientes,
  fetchServicos,
  selectAgendamentos,
  selectDisponibilidade,
  selectPacientes,
  selectServicos,
  selectLoading,
  selectError
} from '../../store/agendamentoSlice';
import { format, parseISO, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CalendarioAgendamento = () => {
  const dispatch = useDispatch();
  
  // Seletores Redux
  const agendamentos = useSelector(selectAgendamentos);
  const disponibilidade = useSelector(selectDisponibilidade);
  const pacientes = useSelector(selectPacientes);
  const servicos = useSelector(selectServicos);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  // Estados locais
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: '',
    servico_id: '',
    data_agendamento: '',
    observacoes: '',
    tipo_consulta: 'primeira_consulta'
  });
  const [filtros, setFiltros] = useState({
    status: 'todos',
    paciente: '',
    servico: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    const hoje = new Date();
    const emUmMes = new Date();
    emUmMes.setMonth(emUmMes.getMonth() + 1);

    dispatch(fetchAgendamentos());
    dispatch(fetchPacientes());
    dispatch(fetchServicos());
    dispatch(fetchDisponibilidade({
      data_inicio: hoje.toISOString().split('T')[0],
      data_fim: emUmMes.toISOString().split('T')[0]
    }));
  }, [dispatch]);

  // Handler para seleção de data/horário
  const handleDateSelect = useCallback((selectInfo) => {
    const agora = new Date();
    const dataSelecionada = new Date(selectInfo.start);
    
    if (dataSelecionada < agora) {
      alert('Não é possível agendar para datas passadas');
      selectInfo.view.calendar.unselect();
      return;
    }

    // Verificar se é horário comercial
    const hora = dataSelecionada.getHours();
    const diaSemana = dataSelecionada.getDay();
    
    if (diaSemana === 0 || diaSemana === 6) {
      alert('Agendamentos apenas de segunda a sexta-feira');
      selectInfo.view.calendar.unselect();
      return;
    }

    if (hora < 8 || hora >= 18) {
      alert('Agendamentos apenas entre 8h e 18h');
      selectInfo.view.calendar.unselect();
      return;
    }

    setFormData({
      ...formData,
      data_agendamento: format(dataSelecionada, "yyyy-MM-dd'T'HH:mm"),
    });
    setModoEdicao(false);
    setModalAberto(true);
  }, [formData]);

  // Handler para clique em evento
  const handleEventClick = useCallback((clickInfo) => {
    const evento = clickInfo.event;
    const agendamento = agendamentos.find(ag => ag.id === evento.id);
    
    if (agendamento) {
      setAgendamentoSelecionado(agendamento);
      setModalDetalhes(true);
    }
  }, [agendamentos]);

  // Submit do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modoEdicao && agendamentoSelecionado) {
        await dispatch(atualizarAgendamento({
          id: agendamentoSelecionado.id,
          ...formData
        })).unwrap();
      } else {
        await dispatch(criarAgendamento(formData)).unwrap();
      }
      
      setModalAberto(false);
      resetForm();
      
      // Recarregar agendamentos
      dispatch(fetchAgendamentos());
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    }
  };

  // Cancelar agendamento
  const handleCancelar = async (agendamentoId, motivo = '') => {
    try {
      await dispatch(cancelarAgendamento({
        id: agendamentoId,
        motivo
      })).unwrap();
      
      setModalDetalhes(false);
      dispatch(fetchAgendamentos());
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    }
  };

  // Editar agendamento
  const handleEditar = (agendamento) => {
    setFormData({
      paciente_id: agendamento.paciente_id,
      servico_id: agendamento.servico_id,
      data_agendamento: format(parseISO(agendamento.data_agendamento), "yyyy-MM-dd'T'HH:mm"),
      observacoes: agendamento.observacoes || '',
      tipo_consulta: agendamento.tipo_consulta || 'primeira_consulta'
    });
    setAgendamentoSelecionado(agendamento);
    setModoEdicao(true);
    setModalDetalhes(false);
    setModalAberto(true);
  };

  // Reset do formulário
  const resetForm = () => {
    setFormData({
      paciente_id: '',
      servico_id: '',
      data_agendamento: '',
      observacoes: '',
      tipo_consulta: 'primeira_consulta'
    });
    setAgendamentoSelecionado(null);
    setModoEdicao(false);
  };

  // Filtrar agendamentos
  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    if (filtros.status !== 'todos' && agendamento.status !== filtros.status) {
      return false;
    }
    if (filtros.paciente && !agendamento.paciente_nome.toLowerCase().includes(filtros.paciente.toLowerCase())) {
      return false;
    }
    if (filtros.servico && agendamento.servico_id !== filtros.servico) {
      return false;
    }
    return true;
  });

  // Eventos para o calendário
  const eventosCalendario = agendamentosFiltrados.map(agendamento => {
    const inicio = parseISO(agendamento.data_agendamento);
    const servico = servicos.find(s => s.id === agendamento.servico_id);
    const duracao = servico ? servico.duracao_minutos : 60;
    const fim = addMinutes(inicio, duracao);

    return {
      id: agendamento.id,
      title: `${agendamento.paciente_nome}`,
      start: agendamento.data_agendamento,
      end: fim.toISOString(),
      backgroundColor: getCorPorStatus(agendamento.status),
      borderColor: getCorPorStatus(agendamento.status),
      textColor: '#ffffff',
      extendedProps: {
        paciente: agendamento.paciente_nome,
        servico: servico?.nome || 'Serviço não encontrado',
        status: agendamento.status,
        observacoes: agendamento.observacoes,
        tipo_consulta: agendamento.tipo_consulta
      }
    };
  });

  // Slots disponíveis
  const slotsDisponiveis = disponibilidade.map(slot => ({
    start: slot.inicio,
    end: slot.fim,
    display: 'background',
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50'
  }));

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch({ type: 'agendamento/clearError' })}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filtros.status}
                  label="Status"
                  onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="agendado">Agendado</MenuItem>
                  <MenuItem value="confirmado">Confirmado</MenuItem>
                  <MenuItem value="em_andamento">Em Andamento</MenuItem>
                  <MenuItem value="concluido">Concluído</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar Paciente"
                value={filtros.paciente}
                onChange={(e) => setFiltros({ ...filtros, paciente: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Serviço</InputLabel>
                <Select
                  value={filtros.servico}
                  label="Serviço"
                  onChange={(e) => setFiltros({ ...filtros, servico: e.target.value })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {servicos.map(servico => (
                    <MenuItem key={servico.id} value={servico.id}>
                      {servico.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                fullWidth
                sx={{ height: '56px' }}
                onClick={() => {
                  setFiltros({ status: 'todos', paciente: '', servico: '' });
                }}
              >
                Limpar Filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Calendário */}
      <Card>
        <CardContent>
          <Box sx={{ height: 600 }}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              initialView="timeGridWeek"
              locale={ptBrLocale}
              slotMinTime="08:00:00"
              slotMaxTime="18:00:00"
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '08:00',
                endTime: '18:00'
              }}
              events={[...eventosCalendario, ...slotsDisponiveis]}
              selectable={true}
              selectMirror={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              height="100%"
              nowIndicator={true}
              eventDisplay="block"
              dayMaxEvents={true}
              slotDuration="00:30:00"
              snapDuration="00:15:00"
              allDaySlot={false}
              weekends={false}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Modal de Novo/Editar Agendamento */}
      <Dialog 
        open={modalAberto} 
        onClose={() => {
          setModalAberto(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {modoEdicao ? 'Editar Agendamento' : 'Novo Agendamento'}
            <IconButton onClick={() => {
              setModalAberto(false);
              resetForm();
            }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Paciente</InputLabel>
                  <Select
                    value={formData.paciente_id}
                    label="Paciente"
                    onChange={(e) => setFormData({
                      ...formData,
                      paciente_id: e.target.value
                    })}
                  >
                    {pacientes.map(paciente => (
                      <MenuItem key={paciente.id} value={paciente.id}>
                        <Box display="flex" alignItems="center">
                          <PersonIcon sx={{ mr: 1 }} />
                          {paciente.full_name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Serviço</InputLabel>
                  <Select
                    value={formData.servico_id}
                    label="Serviço"
                    onChange={(e) => setFormData({
                      ...formData,
                      servico_id: e.target.value
                    })}
                  >
                    {servicos.map(servico => (
                      <MenuItem key={servico.id} value={servico.id}>
                        <Box>
                          <Typography variant="body1">{servico.nome}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {servico.duracao_minutos}min - R$ {servico.preco?.toFixed(2)}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data e Hora"
                  type="datetime-local"
                  value={formData.data_agendamento}
                  onChange={(e) => setFormData({
                    ...formData,
                    data_agendamento: e.target.value
                  })}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Consulta</InputLabel>
                  <Select
                    value={formData.tipo_consulta}
                    label="Tipo de Consulta"
                    onChange={(e) => setFormData({
                      ...formData,
                      tipo_consulta: e.target.value
                    })}
                  >
                    <MenuItem value="primeira_consulta">Primeira Consulta</MenuItem>
                    <MenuItem value="retorno">Retorno</MenuItem>
                    <MenuItem value="procedimento">Procedimento</MenuItem>
                    <MenuItem value="emergencia">Emergência</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  multiline
                  rows={3}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({
                    ...formData,
                    observacoes: e.target.value
                  })}
                  placeholder="Informações adicionais sobre o agendamento..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => {
                setModalAberto(false);
                resetForm();
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
            >
              {loading ? 'Salvando...' : (modoEdicao ? 'Atualizar' : 'Agendar')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal de Detalhes do Agendamento */}
      <Dialog
        open={modalDetalhes}
        onClose={() => setModalDetalhes(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Detalhes do Agendamento
            <IconButton onClick={() => setModalDetalhes(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {agendamentoSelecionado && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {agendamentoSelecionado.paciente_nome}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Chip 
                    label={getStatusLabel(agendamentoSelecionado.status)}
                    color={getStatusColor(agendamentoSelecionado.status)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Data e Hora</Typography>
                  <Typography variant="body1">
                    {format(parseISO(agendamentoSelecionado.data_agendamento), 'PPPp', { locale: ptBR })}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Serviço</Typography>
                  <Typography variant="body1">
                    {servicos.find(s => s.id === agendamentoSelecionado.servico_id)?.nome || 'Serviço não encontrado'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Tipo de Consulta</Typography>
                  <Typography variant="body1">
                    {getTipoConsultaLabel(agendamentoSelecionado.tipo_consulta)}
                  </Typography>
                </Grid>
                
                {agendamentoSelecionado.observacoes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Observações</Typography>
                    <Typography variant="body1">
                      {agendamentoSelecionado.observacoes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setModalDetalhes(false)}
          >
            Fechar
          </Button>
          {agendamentoSelecionado?.status === 'agendado' && (
            <>
              <Button 
                startIcon={<EditIcon />}
                onClick={() => handleEditar(agendamentoSelecionado)}
              >
                Editar
              </Button>
              <Button 
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleCancelar(agendamentoSelecionado.id, 'Cancelado pelo usuário')}
              >
                Cancelar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Funções auxiliares
const getCorPorStatus = (status) => {
  const cores = {
    agendado: '#2196f3',
    confirmado: '#4caf50',
    em_andamento: '#ff9800',
    concluido: '#8bc34a',
    cancelado: '#f44336',
    reagendado: '#9c27b0'
  };
  return cores[status] || '#757575';
};

const getStatusColor = (status) => {
  const cores = {
    agendado: 'primary',
    confirmado: 'success',
    em_andamento: 'warning',
    concluido: 'success',
    cancelado: 'error',
    reagendado: 'secondary'
  };
  return cores[status] || 'default';
};

const getStatusLabel = (status) => {
  const labels = {
    agendado: 'Agendado',
    confirmado: 'Confirmado',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    reagendado: 'Reagendado'
  };
  return labels[status] || status;
};

const getTipoConsultaLabel = (tipo) => {
  const labels = {
    primeira_consulta: 'Primeira Consulta',
    retorno: 'Retorno',
    procedimento: 'Procedimento',
    emergencia: 'Emergência'
  };
  return labels[tipo] || tipo;
};

export default CalendarioAgendamento;
