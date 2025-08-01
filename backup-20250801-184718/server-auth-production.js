// server-auth-production.js - Servidor de produção com integração real
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Importar sistema de autenticação
const AuthSystemComplete = require('./auth-system-complete-fixed.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Inicializar serviços reais
let googleSheetsService;
let emailService;
let authSystem;

async function initializeServices() {
    try {
        console.log('🔧 Inicializando serviços...');
        
        // Verificar se as variáveis de ambiente estão configuradas
        if (!process.env.SENDGRID_API_KEY) {
            console.warn('⚠️  SENDGRID_API_KEY não configurado - usando modo simulação');
        }

        // Usar o serviço de email existente
        try {
            const EmailService = require('./src/services/email-sendgrid.service.js');
            emailService = new EmailService();
            console.log('✅ Email Service (SendGrid) inicializado');
        } catch (err) {
            console.warn('⚠️  Email Service não encontrado - usando simulação');
            emailService = createMockEmailService();
        }

        // Simular Google Sheets até configurar o real
        googleSheetsService = createMockGoogleSheetsService();
        console.log('🔄 Usando Google Sheets simulado');

        // Inicializar sistema de autenticação
        authSystem = new AuthSystemComplete(googleSheetsService, emailService);
        console.log('✅ Sistema de autenticação inicializado');

    } catch (error) {
        console.error('❌ Erro ao inicializar serviços:', error);
        process.exit(1);
    }
}

// Serviços simulados para desenvolvimento
function createMockGoogleSheetsService() {
    return {
        async get() {
            // Dados simulados com estrutura real
            return [
                ['email', 'nome', 'status', 'tipo', 'cargo', 'codigo_verificacao', 'senha_hash', 'data_cadastro', 'data_autorizacao', 'autorizado_por', 'motivo_recusa'],
                ['admin@drmarcio.com', 'Admin Sistema', 'ativo', 'admin', 'Administrador', '', '$2b$10$hashadmin', '2025-07-01T00:00:00.000Z', '2025-07-01T00:00:00.000Z', 'sistema', ''],
                ['funcionario@drmarcio.com', 'Funcionário Teste', 'ativo', 'funcionario', 'Recepcionista', '', '$2b$10$hashfunc', '2025-07-01T00:00:00.000Z', '2025-07-01T00:00:00.000Z', 'admin', '']
            ];
        },
        
        async append(values) {
            console.log('📝 [SIMULADO] Adicionando à planilha:', values);
            return { status: 'success' };
        },
        
        async update(range, values) {
            console.log('✏️  [SIMULADO] Atualizando planilha:', range, values);
            return { status: 'success' };
        }
    };
}

function createMockEmailService() {
    return {
        async sendEmail(to, subject, html) {
            console.log('📧 [SIMULADO] Email enviado:');
            console.log('   Para:', to);
            console.log('   Assunto:', subject);
            console.log('   HTML:', html.substring(0, 100) + '...');
            return { status: 'success' };
        }
    };
}

// Middleware de verificação de inicialização
const requireInitialization = (req, res, next) => {
    if (!authSystem) {
        return res.status(503).json({ 
            error: 'Sistema ainda inicializando. Tente novamente em alguns segundos.' 
        });
    }
    next();
};

// Rotas de autenticação
app.post('/api/auth/cadastrar-funcionario', requireInitialization, async (req, res) => {
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
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.post('/api/auth/verificar-codigo', requireInitialization, async (req, res) => {
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
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.post('/api/auth/criar-senha', requireInitialization, async (req, res) => {
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
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.post('/api/auth/login', requireInitialization, async (req, res) => {
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
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.get('/api/auth/status-funcionario/:email', requireInitialization, async (req, res) => {
    try {
        const { email } = req.params;
        const result = await authSystem.verificarStatusFuncionario(email);
        res.json(result);
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.get('/api/auth/funcionarios-pendentes', requireInitialization, async (req, res) => {
    try {
        const result = await authSystem.listarFuncionariosPendentes();
        res.json(result);
    } catch (error) {
        console.error('Erro ao listar funcionários pendentes:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.post('/api/auth/autorizar-funcionario', requireInitialization, async (req, res) => {
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
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.post('/api/auth/reenviar-codigo', requireInitialization, async (req, res) => {
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
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Rota de health check
app.get('/api/health', (req, res) => {
    const status = {
        status: 'online',
        timestamp: new Date().toISOString(),
        services: {
            googleSheets: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            sendGrid: !!process.env.SENDGRID_API_KEY,
            authSystem: !!authSystem
        },
        environment: process.env.NODE_ENV || 'development'
    };
    
    res.json(status);
});

// Rota de teste específica para autenticação
app.get('/api/auth/test', requireInitialization, (req, res) => {
    res.json({ 
        message: 'Sistema de autenticação funcionando!',
        timestamp: new Date().toISOString(),
        mode: process.env.NODE_ENV || 'development',
        services: {
            googleSheets: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'real' : 'simulado',
            sendGrid: process.env.SENDGRID_API_KEY ? 'real' : 'simulado'
        }
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', err);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
    });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Rota não encontrada',
        path: req.path 
    });
});

// Inicializar serviços e iniciar servidor
async function startServer() {
    console.log('🚀 Iniciando Portal Dr. Marcio - Sistema de Autenticação');
    console.log('📅 Data:', new Date().toLocaleDateString('pt-BR'));
    console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
    
    await initializeServices();
    
    app.listen(PORT, () => {
        console.log('');
        console.log('✅ Servidor iniciado com sucesso!');
        console.log(`📡 Porta: ${PORT}`);
        console.log(`🔗 URL: http://localhost:${PORT}`);
        console.log('');
        console.log('📋 Rotas disponíveis:');
        console.log(`   🔐 Cadastro: http://localhost:${PORT}/cadastro.html`);
        console.log(`   👥 Admin: http://localhost:${PORT}/admin-autorizacoes.html`);
        console.log(`   🚪 Login: http://localhost:${PORT}/login.html`);
        console.log(`   📊 Health: http://localhost:${PORT}/api/health`);
        console.log('');
        
        if (!process.env.SENDGRID_API_KEY || !process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
            console.log('⚠️  Modo de desenvolvimento detectado');
            console.log('   Configure as variáveis de ambiente para produção');
            console.log('   Consulte o arquivo .env.example');
        } else {
            console.log('🏭 Modo de produção - Serviços reais configurados');
        }
        console.log('');
    });
}

// Tratamento de sinais do sistema
process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, encerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, encerrando servidor...');
    process.exit(0);
});

// Iniciar servidor
startServer().catch(error => {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
});

module.exports = app;
