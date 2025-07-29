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
