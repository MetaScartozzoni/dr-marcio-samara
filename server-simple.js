const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Função para inicializar o banco de dados
async function initializeDatabase() {
    try {
        // Criar tabela de usuários
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                senha VARCHAR(255) NOT NULL,
                telefone VARCHAR(20),
                cpf VARCHAR(14),
                tipo VARCHAR(50) DEFAULT 'paciente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Criar tabela de consultas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS consultas (
                id SERIAL PRIMARY KEY,
                paciente_id INTEGER REFERENCES usuarios(id),
                data_consulta TIMESTAMP NOT NULL,
                tipo_consulta VARCHAR(100),
                observacoes TEXT,
                status VARCHAR(50) DEFAULT 'agendada',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Criar usuário admin se não existir
        const adminExists = await pool.query('SELECT * FROM usuarios WHERE email = $1', ['admin@mscartozzoni.com.br']);
        
        if (adminExists.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            await pool.query(
                'INSERT INTO usuarios (nome, email, senha, tipo) VALUES ($1, $2, $3, $4)',
                ['Dr. Marcio Scartozzoni', 'admin@mscartozzoni.com.br', hashedPassword, 'admin']
            );
            console.log('✅ Usuário admin criado');
        }

        console.log('✅ Banco de dados inicializado');
    } catch (error) {
        console.error('❌ Erro ao inicializar banco:', error);
    }
}

// Inicializar banco na inicialização
initializeDatabase();

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
app.post('/api/verificar-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const existe = result.rows.length > 0;
        
        res.json({
            success: true,
            existe: existe,
            message: existe ? 'Email já cadastrado' : 'Email disponível'
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'Erro ao verificar email',
            error: error.message
        });
    }
});

// Login de usuário
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.json({
                success: false,
                message: 'Email não encontrado'
            });
        }
        
        const user = result.rows[0];
        const senhaValida = await bcrypt.compare(senha, user.senha);
        
        if (senhaValida) {
            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    tipo: user.tipo
                },
                redirect: '/painel'
            });
        } else {
            res.json({
                success: false,
                message: 'Senha incorreta'
            });
        }
    } catch (error) {
        res.json({
            success: false,
            message: 'Erro ao fazer login',
            error: error.message
        });
    }
});

// Cadastro de paciente
app.post('/api/cadastro', async (req, res) => {
    try {
        const { nome, email, telefone, cpf, senha } = req.body;
        
        // Verificar se email já existe
        const emailExists = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (emailExists.rows.length > 0) {
            return res.json({
                success: false,
                message: 'Email já cadastrado'
            });
        }
        
        // Hash da senha
        const hashedPassword = await bcrypt.hash(senha, 10);
        
        // Inserir usuário
        const result = await pool.query(
            'INSERT INTO usuarios (nome, email, telefone, cpf, senha, tipo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [nome, email, telefone, cpf, hashedPassword, 'paciente']
        );
        
        const user = result.rows[0];
        
        res.json({
            success: true,
            message: 'Cadastro realizado com sucesso!',
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                telefone: user.telefone,
                cpf: user.cpf
            }
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'Erro ao cadastrar usuário',
            error: error.message
        });
    }
});

// Recuperar senha
app.post('/api/recuperar-senha', async (req, res) => {
    try {
        const { email } = req.body;
        
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.json({
                success: false,
                message: 'Email não encontrado'
            });
        }
        
        // Aqui você enviaria um email real
        res.json({
            success: true,
            message: 'Link de recuperação enviado para seu email'
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'Erro ao recuperar senha',
            error: error.message
        });
    }
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
