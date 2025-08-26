// src/components/paciente/PacienteList.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Fab,
  Tooltip,
  InputAdornment,
  Menu,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  Person,
  Phone,
  Email,
  FilterList,
  Download,
  Upload
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  fetchPacientes,
  deletarPaciente,
  setFiltros,
  clearError
} from '../../store/pacienteSlice';

const PacienteList = () => {
  const dispatch = useDispatch();
  
  const {
    pacientes,
    loading,
    error,
    paginacao,
    filtros
  } = useSelector((state) => state.paciente);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    dispatch(fetchPacientes({
      page: paginacao.currentPage,
      limit: paginacao.itemsPerPage,
      search: filtros.search
    }));
  }, [dispatch, paginacao.currentPage, paginacao.itemsPerPage, filtros.search]);

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      dispatch(setFiltros({ search: value }));
    }, 500);
  };

  const handlePageChange = (event, newPage) => {
    dispatch(fetchPacientes({
      page: newPage + 1,
      limit: paginacao.itemsPerPage,
      search: filtros.search
    }));
  };

  const handleRowsPerPageChange = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    dispatch(fetchPacientes({
      page: 1,
      limit: newLimit,
      search: filtros.search
    }));
  };

  const handleMenuClick = (event, paciente) => {
    setAnchorEl(event.currentTarget);
    setSelectedPaciente(paciente);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPaciente(null);
  };

  const handleViewDetails = () => {
    setDetailsDialogOpen(true);
    handleMenuClose();
  };

  const handleEdit = () => {
    // Navegar para página de edição
    window.location.href = `/pacientes/${selectedPaciente.id}/editar`;
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deletarPaciente(selectedPaciente.id)).unwrap();
      setSnackbar({
        open: true,
        message: 'Paciente excluído com sucesso!',
        severity: 'success'
      });
      setDeleteDialogOpen(false);
      setSelectedPaciente(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error || 'Erro ao excluir paciente',
        severity: 'error'
      });
    }
  };

  const getIdadeDisplay = (dataNascimento) => {
    if (!dataNascimento) return '-';
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    const idade = hoje.getFullYear() - nascimento.getFullYear();
    return `${idade} anos`;
  };

  const getStatusChip = (ativo) => (
    <Chip
      label={ativo ? 'Ativo' : 'Inativo'}
      color={ativo ? 'success' : 'error'}
      size="small"
      variant="outlined"
    />
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Pacientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          href="/pacientes/novo"
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
          }}
        >
          Novo Paciente
        </Button>
      </Box>

      {/* Filtros e Busca */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por nome, CPF, email ou telefone..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  startIcon={<FilterList />}
                  variant="outlined"
                >
                  Filtros
                </Button>
                <Button
                  startIcon={<Download />}
                  variant="outlined"
                >
                  Exportar
                </Button>
                <Button
                  startIcon={<Upload />}
                  variant="outlined"
                >
                  Importar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de Pacientes */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Paciente</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>Idade</TableCell>
                <TableCell>Última Consulta</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : pacientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 4 }}>
                      <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="text.secondary">
                        Nenhum paciente encontrado
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                pacientes.map((paciente) => (
                  <TableRow key={paciente.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {paciente.nome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            CPF: {paciente.cpf || '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {paciente.telefone || '-'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {paciente.email || '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getIdadeDisplay(paciente.data_nascimento)}
                    </TableCell>
                    <TableCell>
                      {paciente.ultima_consulta ? 
                        format(new Date(paciente.ultima_consulta), 'dd/MM/yyyy', { locale: ptBR }) : 
                        'Nunca'
                      }
                    </TableCell>
                    <TableCell>
                      {getStatusChip(paciente.ativo)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, paciente)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginação */}
        <TablePagination
          component="div"
          count={paginacao.totalItems}
          page={paginacao.currentPage - 1}
          onPageChange={handlePageChange}
          rowsPerPage={paginacao.itemsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Itens por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </Card>

      {/* Menu de Ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <Visibility sx={{ mr: 1 }} />
          Ver Detalhes
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o paciente "{selectedPaciente?.nome}"?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Detalhes */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalhes do Paciente</DialogTitle>
        <DialogContent>
          {selectedPaciente && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Nome Completo
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedPaciente.nome}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  CPF
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedPaciente.cpf || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Telefone
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedPaciente.telefone || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedPaciente.email || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Endereço
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedPaciente.endereco || 'Não informado'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Fechar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setDetailsDialogOpen(false);
              handleEdit();
            }}
          >
            Editar
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB */}
      <Tooltip title="Novo Paciente">
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
          }}
          href="/pacientes/novo"
        >
          <Add />
        </Fab>
      </Tooltip>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          onClose={() => dispatch(clearError())}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default PacienteList;
