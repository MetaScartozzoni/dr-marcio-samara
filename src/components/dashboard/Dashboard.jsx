// src/components/dashboard/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Paper,
  LinearProgress,
  Fab,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  CalendarToday,
  People,
  AttachMoney,
  TrendingUp,
  Add,
  Notifications,
  Schedule,
  Person,
  Assignment,
  Today,
  EventAvailable,
  Cancel,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { format, startOfDay, endOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchAgendamentos } from '../../store/agendamentoSlice';
import { fetchPacientes } from '../../store/pacienteSlice';
import { fetchOrcamentos, fetchEstatisticas } from '../../store/orcamentoSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const { user } = useSelector((state) => state.auth);
  const { agendamentos } = useSelector((state) => state.agendamento);
  const { pacientes } = useSelector((state) => state.paciente);
  const { orcamentos, estatisticas } = useSelector((state) => state.orcamento);

  const [hoje] = useState(new Date());

  useEffect(() => {
    // Carregar dados do dashboard
    const dataInicio = format(startOfDay(hoje), 'yyyy-MM-dd');
    const dataFim = format(endOfDay(addDays(hoje, 7)), 'yyyy-MM-dd');
    
    dispatch(fetchAgendamentos({ 
      filtros: { data_inicio: dataInicio, data_fim: dataFim },
      limit: 10 
    }));
    dispatch(fetchPacientes({ limit: 5 }));
    dispatch(fetchOrcamentos({ limit: 5 }));
    dispatch(fetchEstatisticas('30'));
  }, [dispatch, hoje]);

  // Filtrar agendamentos de hoje
  const agendamentosHoje = agendamentos.filter(agendamento => {
    const dataAgendamento = new Date(agendamento.data_hora);
    return format(dataAgendamento, 'yyyy-MM-dd') === format(hoje, 'yyyy-MM-dd');
  });

  // Filtrar próximos agendamentos
  const proximosAgendamentos = agendamentos.filter(agendamento => {
    const dataAgendamento = new Date(agendamento.data_hora);
    return dataAgendamento > hoje;
  }).slice(0, 5);

  // Estatísticas rápidas
  const stats = [
    {
      title: 'Agendamentos Hoje',
      value: agendamentosHoje.length,
      icon: <Today />,
      color: theme.palette.primary.main,
      trend: '+5%'
    },
    {
      title: 'Total de Pacientes',
      value: pacientes.length,
      icon: <People />,
      color: theme.palette.success.main,
      trend: '+12%'
    },
    {
      title: 'Orçamentos Pendentes',
      value: orcamentos.filter(o => o.status === 'pendente').length,
      icon: <Assignment />,
      color: theme.palette.warning.main,
      trend: '-3%'
    },
    {
      title: 'Faturamento Mensal',
      value: `R$ ${estatisticas?.faturamento_mensal?.toLocaleString() || '0'}`,
      icon: <AttachMoney />,
      color: theme.palette.info.main,
      trend: '+18%'
    }
  ];

  const getStatusChip = (status) => {
    const statusConfig = {
      'agendado': { color: 'primary', icon: <EventAvailable /> },
      'confirmado': { color: 'success', icon: <CheckCircle /> },
      'cancelado': { color: 'error', icon: <Cancel /> },
      'em_andamento': { color: 'warning', icon: <Schedule /> },
      'finalizado': { color: 'success', icon: <CheckCircle /> }
    };

    const config = statusConfig[status] || { color: 'default', icon: null };
    
    return (
      <Chip
        label={status.replace('_', ' ').toUpperCase()}
        color={config.color}
        size="small"
        icon={config.icon}
        variant="outlined"
      />
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bem-vindo de volta, {user?.nome}! Aqui está o resumo de hoje.
        </Typography>
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)} 0%, ${alpha(stat.color, 0.2)} 100%)`,
                border: `1px solid ${alpha(stat.color, 0.2)}`,
                height: '100%'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp 
                        sx={{ 
                          fontSize: 16, 
                          color: stat.trend.startsWith('+') ? 'success.main' : 'error.main',
                          mr: 0.5 
                        }} 
                      />
                      <Typography 
                        variant="caption" 
                        color={stat.trend.startsWith('+') ? 'success.main' : 'error.main'}
                      >
                        {stat.trend} este mês
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar
                    sx={{
                      backgroundColor: stat.color,
                      width: 56,
                      height: 56
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Conteúdo Principal */}
      <Grid container spacing={3}>
        {/* Agendamentos de Hoje */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Agendamentos de Hoje
                </Typography>
                <Button
                  startIcon={<Add />}
                  variant="outlined"
                  size="small"
                  href="/agendamentos/novo"
                >
                  Novo Agendamento
                </Button>
              </Box>

              {agendamentosHoje.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    Nenhum agendamento para hoje
                  </Typography>
                </Box>
              ) : (
                <List>
                  {agendamentosHoje.map((agendamento, index) => (
                    <ListItem key={agendamento.id} divider={index < agendamentosHoje.length - 1}>
                      <ListItemAvatar>
                        <Avatar>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={agendamento.paciente_nome}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(agendamento.data_hora), 'HH:mm', { locale: ptBR })} - {agendamento.servico_nome}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {getStatusChip(agendamento.status)}
                            </Box>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" color="primary">
                          <Schedule />
                        </IconButton>
                        <IconButton size="small" color="success">
                          <CheckCircle />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Próximos Agendamentos */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Próximos Agendamentos
              </Typography>
              
              {proximosAgendamentos.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  Nenhum agendamento próximo
                </Typography>
              ) : (
                <List dense>
                  {proximosAgendamentos.map((agendamento) => (
                    <ListItem key={agendamento.id} sx={{ px: 0 }}>
                      <ListItemText
                        primary={agendamento.paciente_nome}
                        secondary={format(new Date(agendamento.data_hora), 'dd/MM - HH:mm', { locale: ptBR })}
                      />
                      {getStatusChip(agendamento.status)}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Pacientes Recentes */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Pacientes Recentes
              </Typography>
              
              <List dense>
                {pacientes.slice(0, 5).map((paciente) => (
                  <ListItem key={paciente.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <Person fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={paciente.nome}
                      secondary={paciente.telefone}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Alertas/Notificações */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Notifications sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Alertas
                </Typography>
              </Box>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ backgroundColor: 'warning.main', width: 32, height: 32 }}>
                      <Warning fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Consultas não confirmadas"
                    secondary="5 consultas aguardando confirmação"
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ backgroundColor: 'info.main', width: 32, height: 32 }}>
                      <Assignment fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Orçamentos pendentes"
                    secondary="3 orçamentos aguardando resposta"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Botão de Ação Flutuante */}
      <Tooltip title="Novo Agendamento">
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
          }}
          href="/agendamentos/novo"
        >
          <Add />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default Dashboard;
