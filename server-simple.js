const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(__dirname));

// Health check endpoint (OBRIGATÓRIO para Railway)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        services: {
            sendgrid: process.env.SENDGRID_API_KEY ? 'configured' : 'missing',
            twilio: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'missing'
        }
    });
});

// Página inicial - redireciona para login
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Portal Dr. Marcio Scartozzoni</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>🏥 Portal Dr. Marcio Scartozzoni</h1>
                    <p>Sistema de Gestão Médica</p>
                </header>
                
                <div class="status-card">
                    <h2>✅ Sistema Online</h2>
                    <div class="status-grid">
                        <div class="status-item">
                            <span class="icon">🌐</span>
                            <span>Servidor: Ativo</span>
                        </div>
                        <div class="status-item">
                            <span class="icon">📧</span>
                            <span>Email: ${process.env.SENDGRID_API_KEY ? 'Configurado' : 'Pendente'}</span>
                        </div>
                        <div class="status-item">
                            <span class="icon">📱</span>
                            <span>SMS: ${process.env.TWILIO_ACCOUNT_SID ? 'Configurado' : 'Pendente'}</span>
                        </div>
                    </div>
                </div>

                <div class="actions">
                    <a href="/login.html" class="btn btn-primary">🔐 Acessar Sistema</a>
                    <a href="/cadastro.html" class="btn btn-secondary">📝 Novo Cadastro</a>
                </div>

                <div class="info">
                    <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
                    <p><strong>Versão:</strong> 1.0.0</p>
                    <p><strong>Status:</strong> <a href="/api/health">Health Check</a></p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Rota para painel (depois do login)
app.get('/painel', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Painel - Portal Dr. Marcio</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>🏥 Painel Dr. Marcio Scartozzoni</h1>
                    <div class="user-info">
                        <span>Bem-vindo(a)!</span>
                        <a href="/" class="btn btn-sm">Sair</a>
                    </div>
                </header>
                
                <div class="dashboard">
                    <div class="card">
                        <h3>📅 Consultas Hoje</h3>
                        <p class="number">12</p>
                    </div>
                    <div class="card">
                        <h3>👥 Pacientes</h3>
                        <p class="number">248</p>
                    </div>
                    <div class="card">
                        <h3>📧 Emails Enviados</h3>
                        <p class="number">45</p>
                    </div>
                    <div class="card">
                        <h3>💰 Receita Mensal</h3>
                        <p class="number">R$ 15.750</p>
                    </div>
                </div>

                <div class="menu-grid">
                    <a href="/consultas" class="menu-item">
                        <span class="icon">📅</span>
                        <span>Consultas</span>
                    </a>
                    <a href="/pacientes" class="menu-item">
                        <span class="icon">👥</span>
                        <span>Pacientes</span>
                    </a>
                    <a href="/agenda" class="menu-item">
                        <span class="icon">🗓️</span>
                        <span>Agenda</span>
                    </a>
                    <a href="/financeiro" class="menu-item">
                        <span class="icon">💰</span>
                        <span>Financeiro</span>
                    </a>
                    <a href="/relatorios" class="menu-item">
                        <span class="icon">📊</span>
                        <span>Relatórios</span>
                    </a>
                    <a href="/configuracoes" class="menu-item">
                        <span class="icon">⚙️</span>
                        <span>Configurações</span>
                    </a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// === ROTAS PARA REDIRECIONAMENTOS (sem .html) ===

// Redirecionar /senha para /senha.html
app.get('/senha', (req, res) => {
    res.redirect('/senha.html');
});

// Redirecionar /login para /login.html
app.get('/login', (req, res) => {
    res.redirect('/login.html');
});

// Redirecionar /cadastro para /cadastro.html
app.get('/cadastro', (req, res) => {
    res.redirect('/cadastro.html');
});

// Redirecionar /dashboard para /dashboard.html
app.get('/dashboard', (req, res) => {
    res.redirect('/dashboard.html');
});

// Redirecionar /admin para /admin.html
app.get('/admin', (req, res) => {
    res.redirect('/admin.html');
});

// Redirecionar /gestao para /gestao.html
app.get('/gestao', (req, res) => {
    res.redirect('/gestao.html');
});

// Redirecionar /lgpd para /lgpd-compliance.html
app.get('/lgpd', (req, res) => {
    res.redirect('/lgpd-compliance.html');
});

// === ROTAS DE API PARA FUNCIONALIDADES ===

// Verificar se email já existe
app.post('/api/verificar-email', (req, res) => {
    const { email } = req.body;
    
    // Simulação - em produção seria consulta no banco
    const emailsExistentes = [
        'admin@mscartozzoni.com.br',
        'teste@exemplo.com'
    ];
    
    const existe = emailsExistentes.includes(email);
    
    res.json({
        success: true,
        existe: existe,
        message: existe ? 'Email já cadastrado' : 'Email disponível'
    });
});

// Login de usuário
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    
    // Simulação - em produção seria consulta no banco com hash
    if (email === 'admin@mscartozzoni.com.br' && senha === '123456') {
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            user: {
                id: 1,
                nome: 'Dr. Marcio Scartozzoni',
                email: email,
                tipo: 'admin'
            },
            redirect: '/painel'
        });
    } else {
        res.json({
            success: false,
            message: 'Email ou senha incorretos'
        });
    }
});

// Cadastro de paciente
app.post('/api/cadastro', (req, res) => {
    const { nome, email, telefone, cpf, senha } = req.body;
    
    // Simulação de salvamento
    console.log('Novo cadastro:', { nome, email, telefone, cpf });
    
    res.json({
        success: true,
        message: 'Cadastro realizado com sucesso!',
        user: {
            id: Date.now(), // ID temporário
            nome,
            email,
            telefone,
            cpf
        }
    });
});

// Recuperar senha
app.post('/api/recuperar-senha', (req, res) => {
    const { email } = req.body;
    
    res.json({
        success: true,
        message: 'Link de recuperação enviado para seu email'
    });
});

// Enviar email real via SendGrid
app.post('/api/enviar-email', async (req, res) => {
    try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const { to, subject, html } = req.body;
        
        const msg = {
            to: to || process.env.EMAIL_FROM,
            from: process.env.EMAIL_FROM,
            subject: subject || 'Teste do Portal Dr. Marcio',
            html: html || '<h1>Email de teste do Portal Dr. Marcio</h1><p>Sistema funcionando perfeitamente!</p>'
        };
        
        await sgMail.send(msg);
        
        res.json({
            success: true,
            message: 'Email enviado com sucesso!'
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'Erro ao enviar email',
            error: error.message
        });
    }
});

// Teste SendGrid
app.get('/api/email/test', async (req, res) => {
    try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        res.json({
            status: 'SendGrid Ready',
            apiKey: process.env.SENDGRID_API_KEY ? 'Configured' : 'Missing'
        });
    } catch (error) {
        res.json({
            status: 'SendGrid Error',
            error: error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Portal Dr. Marcio rodando na porta ${PORT}`);
    console.log(`📧 SendGrid: ${process.env.SENDGRID_API_KEY ? 'OK' : 'FALTANDO'}`);
    console.log(`📱 Twilio: ${process.env.TWILIO_ACCOUNT_SID ? 'OK' : 'FALTANDO'}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});
