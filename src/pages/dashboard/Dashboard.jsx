// src/pages/dashboard/Dashboard.jsx
import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  MedicalServices as MedicalIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';

const Dashboard = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Agendar Consulta',
      description: 'Marque uma nova consulta',
      icon: <CalendarIcon fontSize="large" />,
      path: '/agendar',
      color: 'primary',
    },
    {
      title: 'Meus Prontuários',
      description: 'Visualize seus registros médicos',
      icon: <MedicalIcon fontSize="large" />,
      path: '/prontuarios',
      color: 'secondary',
    },
    {
      title: 'Resultados',
      description: 'Veja seus exames e resultados',
      icon: <AssessmentIcon fontSize="large" />,
      path: '/resultados',
      color: 'success',
    },
    {
      title: 'Configurações',
      description: 'Gerencie sua conta',
      icon: <SettingsIcon fontSize="large" />,
      path: '/configuracoes',
      color: 'info',
    },
  ];

  return (
    <Layout>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          Bem-vindo ao Portal Dr. Márcio
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
                onClick={() => navigate(action.path)}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box
                    sx={{
                      color: `${action.color}.main`,
                      mb: 2,
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Próximas Consultas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Nenhuma consulta agendada.
              </Typography>
              <Button
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate('/agendar')}
              >
                Agendar Consulta
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Últimas Notícias
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mantenha-se informado sobre novidades e atualizações.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default Dashboard;
