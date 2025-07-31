// server-auth.js - Servidor simplificado para teste do sistema de autenticação
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Importar apenas o sistema de autenticação
const AuthSystemComplete = require('./auth-system-complete-fixed.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Simulação simplificada do Google Sheets Service
const googleSheetsService = {
  async get() {
    // Simular dados de funcionários
    return [
      ['email', 'nome', 'status', 'tipo', 'cargo', 'codigo_verificacao', 'senha_hash'],
      ['admin@drmarcio.com', 'Admin Sistema', 'ativo', 'admin', 'Administrador', '', '$2b$10$hashadmin'],
      ['funcionario@drmarcio.com', 'Funcionário Teste', 'ativo', 'funcionario', 'Recepcionista', '', '$2b$10$hashfunc']
    ];
  },
  
  async append(values) {
    console.log('Adicionando funcionário:', values);
    return { status: 'success' };
  },
  
  async update(range, values) {
    console.log('Atualizando funcionário:', range, values);
    return { status: 'success' };
  }
};

// Simulação simplificada do SendGrid Service
const sendGridService = {
  async sendEmail(to, subject, html) {
    console.log('Email enviado para:', to);
    console.log('Assunto:', subject);
    console.log('HTML:', html.substring(0, 100) + '...');
    return { status: 'success' };
  }
};

// Inicializar sistema de autenticação
const authSystem = new AuthSystemComplete(googleSheetsService, sendGridService);

// Rotas de autenticação
app.post('/api/auth/cadastrar-funcionario', async (req, res) => {
  try {
    const { email, nome, cargo } = req.body;
    
    if (!email || !nome) {
      return res.status(400).json({ 
        error: 'Email e nome são obrigatórios' 
      });
    }
    
    const result = await authSystem.cadastrarFuncionario(email, nome, cargo);
    res.json(result);
  } catch (error) {
    console.error('Erro ao cadastrar funcionário:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

app.post('/api/auth/verificar-codigo', async (req, res) => {
  try {
    const { email, codigo } = req.body;
    
    if (!email || !codigo) {
      return res.status(400).json({ 
        error: 'Email e código são obrigatórios' 
      });
    }
    
    const result = await authSystem.verificarCodigo(email, codigo);
    res.json(result);
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

app.post('/api/auth/criar-senha', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }
    
    const result = await authSystem.criarSenha(email, senha);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar senha:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }
    
    const result = await authSystem.realizarLogin(email, senha);
    res.json(result);
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

app.get('/api/auth/status-funcionario/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await authSystem.verificarStatusFuncionario(email);
    res.json(result);
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

app.get('/api/auth/funcionarios-pendentes', async (req, res) => {
  try {
    const result = await authSystem.listarFuncionariosPendentes();
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar funcionários pendentes:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

app.post('/api/auth/autorizar-funcionario', async (req, res) => {
  try {
    const { email, aprovado, motivo } = req.body;
    
    if (!email || aprovado === undefined) {
      return res.status(400).json({ 
        error: 'Email e status de aprovação são obrigatórios' 
      });
    }
    
    const result = await authSystem.autorizarFuncionario(email, aprovado, motivo);
    res.json(result);
  } catch (error) {
    console.error('Erro ao autorizar funcionário:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

app.post('/api/auth/reenviar-codigo', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email é obrigatório' 
      });
    }
    
    const result = await authSystem.reenviarCodigoVerificacao(email);
    res.json(result);
  } catch (error) {
    console.error('Erro ao reenviar código:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Rota de teste
app.get('/api/auth/test', (req, res) => {
  res.json({ 
    message: 'Sistema de autenticação funcionando!',
    timestamp: new Date().toISOString() 
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de autenticação rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
  console.log(`🔐 Sistema de autenticação: http://localhost:${PORT}/cadastro.html`);
  console.log(`👥 Admin autorizações: http://localhost:${PORT}/admin-autorizacoes.html`);
});

module.exports = app;
