// src/components/dashboard/AgendamentoRapido.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { format, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import agendamentoService from '../../services/agendamento.service';
import { useNavigate } from 'react-router-dom';

const AgendamentoRapido = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [proximosAgendamentos, setProximosAgendamentos] = useState([]);
  const [novoAgendamento, setNovoAgendamento] = useState({
    paciente_nome: '',
    paciente_telefone: '',
    paciente_email: '',
    data_agendamento: new Date(),
    hora_agendamento: '',
    observacoes: '',
    origem: 'dashboard'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      
      // Carregar agendamentos de hoje
      const hoje = await agendamentoService.obterAgendamentosHoje();
      setAgendamentosHoje(hoje.agendamentos || []);
      
      // Carregar próximos agendamentos
      const proximos = await agendamentoService.obterProximosAgendamentos(3);
      setProximosAgendamentos(proximos.agendamentos || []);
      
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setError('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNovoAgendamento(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validações básicas
      if (!novoAgendamento.paciente_nome.trim()) {
        setError('Nome do paciente é obrigatório');
        return;
      }
      
      if (!novoAgendamento.paciente_telefone.trim()) {
        setError('Telefone é obrigatório');
        return;
      }
      
      if (!novoAgendamento.hora_agendamento) {
        setError('Horário é obrigatório');
        return;
      }

      // Criar agendamento
      const agendamentoData = {
        ...novoAgendamento,
        data_agendamento: format(novoAgendamento.data_agendamento, 'yyyy-MM-dd'),
        status: 'agendado'
      };

      await agendamentoService.criarAgendamento(agendamentoData);
      
      setSuccess('Agendamento criado com sucesso!');
      setOpen(false);
      
      // Reset form
      setNovoAgendamento({
        paciente_nome: '',
        paciente_telefone: '',
        paciente_email: '',
        data_agendamento: new Date(),
        hora_agendamento: '',
        observacoes: '',
        origem: 'dashboard'
      });
      
      // Recarregar agendamentos
      carregarAgendamentos();
      
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      setError('Erro ao criar agendamento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'agendado': 'primary',
      'confirmado': 'success',
      'em_andamento': 'warning',
      'realizado': 'success',
      'cancelado': 'error',
      'falta': 'error'
    };
    return statusColors[status] || 'default';
  };

  const horariosDisponiveis = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  return (
    <Box>
      {/* Card de Agendamentos Rápido */}
      <Card sx={{ mb: 3, position: 'relative' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Agendamentos
            </Typography>
            <Box>
              <Button
                size="small"
                onClick={() => navigate('/agendamentos')}
                sx={{ mr: 1 }}
              >
                Ver Calendário
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setOpen(true)}
              >
                Novo
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box>
              {/* Agendamentos de Hoje */}
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Hoje ({agendamentosHoje.length})
              </Typography>
              
              {agendamentosHoje.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Nenhum agendamento para hoje
                </Typography>
              ) : (
                <List dense sx={{ mb: 2 }}>
                  {agendamentosHoje.slice(0, 3).map((agendamento) => (
                    <ListItem key={agendamento.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar size="small">
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={agendamento.paciente_nome}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimeIcon sx={{ fontSize: 14 }} />
                            {agendamento.hora_agendamento}
                            <Chip 
                              label={agendamento.status} 
                              size="small" 
                              color={getStatusColor(agendamento.status)}
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Próximos Agendamentos */}
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Próximos ({proximosAgendamentos.length})
              </Typography>
              
              {proximosAgendamentos.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhum agendamento próximo
                </Typography>
              ) : (
                <List dense>
                  {proximosAgendamentos.slice(0, 2).map((agendamento) => (
                    <ListItem key={agendamento.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar size="small">
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={agendamento.paciente_nome}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon sx={{ fontSize: 14 }} />
                            {format(new Date(agendamento.data_agendamento), 'dd/MM', { locale: ptBR })}
                            <TimeIcon sx={{ fontSize: 14 }} />
                            {agendamento.hora_agendamento}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* FAB para novo agendamento */}
      <Tooltip title="Novo Agendamento">
        <Fab
          color="primary"
          size="medium"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
          onClick={() => setOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Dialog para Novo Agendamento */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Novo Agendamento Rápido
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Paciente"
                value={novoAgendamento.paciente_nome}
                onChange={(e) => handleInputChange('paciente_nome', e.target.value)}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.disabled' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={novoAgendamento.paciente_telefone}
                onChange={(e) => handleInputChange('paciente_telefone', e.target.value)}
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.disabled' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email (opcional)"
                type="email"
                value={novoAgendamento.paciente_email}
                onChange={(e) => handleInputChange('paciente_email', e.target.value)}
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.disabled' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Data"
                value={novoAgendamento.data_agendamento}
                onChange={(date) => handleInputChange('data_agendamento', date)}
                minDate={new Date()}
                maxDate={addDays(new Date(), 60)}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Horário"
                value={novoAgendamento.hora_agendamento}
                onChange={(e) => handleInputChange('hora_agendamento', e.target.value)}
              >
                {horariosDisponiveis.map((horario) => (
                  <MenuItem key={horario} value={horario}>
                    {horario}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Observações (opcional)"
                value={novoAgendamento.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <ScheduleIcon />}
          >
            {loading ? 'Agendando...' : 'Agendar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de Sucesso */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default AgendamentoRapido;
