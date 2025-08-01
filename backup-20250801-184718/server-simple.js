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
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ydKZVqeDdnQVSPOsAkcKJhoTHLsOEqxu@maglev.proxy.rlwy.net:39156/railway',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Teste de conexão
pool.on('connect', () => {
    console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Erro no PostgreSQL:', err);
});

// Função para inicializar o banco de dados
async function initializeDatabase() {
    try {
        console.log('🔄 Inicializando banco de dados...');
        console.log('🔗 URL de conexão:', process.env.DATABASE_URL ? 'Configurada' : 'Usando fallback');
        
        // Testar conexão
        await pool.query('SELECT NOW()');
        console.log('✅ Conexão com banco estabelecida');
        
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
                autorizado BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Adicionar coluna autorizado se não existir (para bancos existentes)
        try {
            await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS autorizado BOOLEAN DEFAULT true`);
        } catch (error) {
            // Coluna já existe, ignorar erro
        }

        // Criar tabela de consultas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS consultas (
                id SERIAL PRIMARY KEY,
                paciente_id INTEGER REFERENCES usuarios(id),
                data_consulta TIMESTAMP NOT NULL,
                tipo_consulta VARCHAR(100),
                observacoes TEXT,
                status VARCHAR(50) DEFAULT 'agendada',
                convenio VARCHAR(100),
                telefone_contato VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Adicionar novas colunas se não existirem (para bancos existentes)
        try {
            await pool.query(`ALTER TABLE consultas ADD COLUMN IF NOT EXISTS convenio VARCHAR(100)`);
            await pool.query(`ALTER TABLE consultas ADD COLUMN IF NOT EXISTS telefone_contato VARCHAR(20)`);
            await pool.query(`ALTER TABLE consultas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        } catch (error) {
            // Colunas já existem, ignorar erro
        }

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
app.get('/api/health', async (req, res) => {
    let dbStatus = 'unknown';
    let dbError = null;
    
    try {
        await pool.query('SELECT 1');
        dbStatus = 'connected';
    } catch (error) {
        dbStatus = 'disconnected';
        dbError = error.message;
    }
    
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        database: {
            status: dbStatus,
            url_configured: !!process.env.DATABASE_URL,
            error: dbError
        },
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
        
        // Verificar se usuário está autorizado
        if (!user.autorizado) {
            return res.json({
                success: false,
                message: 'Usuário não autorizado. Entre em contato com o administrador.'
            });
        }
        
        const senhaValida = await bcrypt.compare(senha, user.senha);
        
        if (senhaValida) {
            // Gerar token simples
            const tokenData = `${user.email}:${Date.now()}`;
            const token = Buffer.from(tokenData).toString('base64');
            
            // Definir redirecionamento baseado no tipo de usuário
            let redirectUrl = '/dashboard.html'; // Dashboard universal que detecta o tipo
            
            // Admin vai direto para dashboard, outros vão para pending
            if (user.tipo !== 'admin') {
                redirectUrl = '/pending.html';
            }
            
            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                token: token,
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    tipo: user.tipo || 'paciente',
                    status: user.tipo === 'admin' ? 'ativo' : (user.status || 'pending'),
                    autorizado: user.autorizado
                },
                redirect: redirectUrl
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

// Endpoint para inicializar/atualizar estrutura do banco
app.post('/api/init-db', async (req, res) => {
    try {
        console.log('🔧 Iniciando atualização do banco...');
        
        // Adicionar coluna status se não existir
        await pool.query(`
            ALTER TABLE usuarios 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo'
        `);
        
        // Definir admin padrão como ativo
        await pool.query(`
            UPDATE usuarios 
            SET status = 'ativo', tipo = 'admin', autorizado = true
            WHERE email = 'admin@clinica.com'
        `);
        
        // Definir outros usuários como pending se não tiverem status
        await pool.query(`
            UPDATE usuarios 
            SET status = 'pending'
            WHERE status IS NULL AND email != 'admin@clinica.com'
        `);
        
        console.log('✅ Estrutura do banco atualizada');
        res.json({
            success: true,
            message: 'Banco de dados atualizado com sucesso!'
        });
    } catch (error) {
        console.error('❌ Erro ao atualizar banco:', error);
        res.json({
            success: false,
            message: 'Erro ao atualizar banco: ' + error.message
        });
    }
});

// Cadastro de paciente
app.post('/api/cadastro', async (req, res) => {
    try {
        console.log('📝 Dados recebidos:', req.body);
        
        const { nome, email, telefone, cpf, senha } = req.body;
        
        // Validações básicas
        if (!nome || !email || !senha) {
            return res.json({
                success: false,
                message: 'Nome, email e senha são obrigatórios'
            });
        }
        
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
        
        // Definir tipo e status baseado no email
        const isAdmin = email === 'admin@clinica.com';
        const tipo = isAdmin ? 'admin' : 'paciente';
        const status = isAdmin ? 'ativo' : 'pending';
        
        // Inserir usuário com status
        const result = await pool.query(
            'INSERT INTO usuarios (nome, email, telefone, cpf, senha, tipo, status, autorizado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [nome, email, telefone || null, cpf || null, hashedPassword, tipo, status, isAdmin]
        );
        
        const user = result.rows[0];
        console.log('✅ Usuário criado:', user.id, 'Status:', status);
        
        // Definir redirecionamento baseado no status
        let redirectUrl = isAdmin ? '/dashboard.html' : '/pending.html';
        let message = isAdmin ? 
            'Cadastro realizado! Bem-vindo, administrador!' : 
            'Cadastro realizado! Aguarde aprovação do administrador.';
        
        res.json({
            success: true,
            message: message,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                telefone: user.telefone,
                cpf: user.cpf,
                tipo: tipo,
                status: status
            },
            redirect: redirectUrl
        });
    } catch (error) {
        console.error('❌ Erro no cadastro:', error);
        res.json({
            success: false,
            message: 'Erro ao cadastrar usuário: ' + error.message,
            error: error.message
        });
    }
});

// Recuperar senha
app.post('/api/recuperar-senha', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('🔄 Solicitação de recuperação para:', email);
        
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.json({
                success: false,
                message: 'Email não encontrado em nossa base de dados'
            });
        }
        
        const user = result.rows[0];
        
        // Gerar código de 6 dígitos
        const codigoRecuperacao = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        
        // Salvar código no banco (em uma tabela real, você criaria uma tabela específica)
        // Por simplicidade, vamos usar um campo temporário ou localStorage no frontend
        
        // Enviar email via SendGrid
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const emailContent = {
            to: email,
            from: process.env.EMAIL_FROM,
            subject: 'Código de Recuperação - Portal Dr. Marcio',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #2c3e50;">🔐 Código de Recuperação</h2>
                    </div>
                    
                    <p>Olá <strong>${user.nome}</strong>,</p>
                    <p>Você solicitou a redefinição de sua senha no Portal Dr. Marcio.</p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <div style="background: #f8f9fa; border: 2px dashed #007bff; padding: 30px; border-radius: 10px;">
                            <p style="margin: 0; color: #666; font-size: 14px;">Seu código de verificação é:</p>
                            <h1 style="font-size: 36px; color: #007bff; margin: 10px 0; letter-spacing: 8px; font-weight: bold;">
                                ${codigoRecuperacao}
                            </h1>
                            <p style="margin: 0; color: #666; font-size: 12px;">
                                Este código expira em <strong>15 minutos</strong>
                            </p>
                        </div>
                    </div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #856404; font-size: 14px;">
                            <strong>⚠️ Importante:</strong> Não compartilhe este código com ninguém. 
                            Nossa equipe nunca solicitará este código por telefone ou email.
                        </p>
                    </div>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        <strong>Portal Dr. Marcio</strong><br>
                        ${process.env.ENDERECO_CLINICA || 'Rua Dr. Marcio, 123'}<br>
                        ${process.env.TELEFONE_CLINICA || '(11) 99999-9999'}
                    </p>
                </div>
            `
        };
        
        await sgMail.send(emailContent);
        console.log('✅ Código de recuperação enviado para:', email);
        
        res.json({
            success: true,
            message: 'Código de verificação enviado para seu email!',
            codigo: codigoRecuperacao, // Em produção, NUNCA retorne o código na resposta
            expires: expiresAt.toISOString()
        });
    } catch (error) {
        console.error('❌ Erro ao recuperar senha:', error);
        res.json({
            success: false,
            message: 'Erro ao enviar código de recuperação. Tente novamente.',
            error: error.message
        });
    }
});

// Rota para redefinir senha com código
app.post('/api/redefinir-senha', async (req, res) => {
    try {
        const { email, codigo, novaSenha } = req.body;
        console.log('🔄 Redefinição de senha para:', email, 'Código:', codigo);
        
        if (!email || !codigo || !novaSenha) {
            return res.json({
                success: false,
                message: 'Email, código e nova senha são obrigatórios'
            });
        }
        
        if (novaSenha.length < 6) {
            return res.json({
                success: false,
                message: 'A senha deve ter pelo menos 6 caracteres'
            });
        }
        
        // Verificar se usuário existe
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.json({
                success: false,
                message: 'Email não encontrado'
            });
        }
        
        // Em um sistema real, você verificaria o código contra uma tabela de códigos temporários
        // Por simplicidade, vamos aceitar qualquer código de 6 dígitos
        if (!/^\d{6}$/.test(codigo)) {
            return res.json({
                success: false,
                message: 'Código inválido'
            });
        }
        
        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(novaSenha, 10);
        
        // Atualizar senha no banco
        await pool.query(
            'UPDATE usuarios SET senha = $1 WHERE email = $2',
            [hashedPassword, email]
        );
        
        console.log('✅ Senha atualizada com sucesso para:', email);
        
        res.json({
            success: true,
            message: 'Senha redefinida com sucesso! Você pode fazer login agora.'
        });
        
    } catch (error) {
        console.error('❌ Erro ao redefinir senha:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor',
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

// Endpoint para atualizar role do usuário
app.post('/api/atualizar-role', async (req, res) => {
    try {
        const { email, novoRole } = req.body;
        console.log('🔄 Atualizando role:', email, '->', novoRole);
        
        // Verificar se usuário existe
        const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.json({
                sucesso: false,
                erro: 'Usuário não encontrado'
            });
        }
        
        const user = userResult.rows[0];
        const roleAnterior = user.tipo;
        
        // Atualizar role
        await pool.query(
            'UPDATE usuarios SET tipo = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
            [novoRole, email]
        );
        
        console.log('✅ Role atualizado:', email, roleAnterior, '->', novoRole);
        
        res.json({
            sucesso: true,
            email: email,
            roleAnterior: roleAnterior,
            novoRole: novoRole,
            message: 'Role atualizado com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao atualizar role:', error);
        res.json({
            sucesso: false,
            erro: 'Erro ao atualizar role: ' + error.message
        });
    }
});

// Endpoint para atualizar autorização do usuário
app.post('/api/atualizar-autorizacao', async (req, res) => {
    try {
        const { email, autorizado } = req.body;
        const autorizadoBool = autorizado === 'sim';
        
        console.log('🔄 Atualizando autorização:', email, '->', autorizadoBool);
        
        // Verificar se usuário existe
        const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.json({
                sucesso: false,
                erro: 'Usuário não encontrado'
            });
        }
        
        const user = userResult.rows[0];
        const autorizacaoAnterior = user.autorizado ? 'Autorizado' : 'Não Autorizado';
        
        // Atualizar autorização
        await pool.query(
            'UPDATE usuarios SET autorizado = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
            [autorizadoBool, email]
        );
        
        console.log('✅ Autorização atualizada:', email, user.autorizado, '->', autorizadoBool);
        
        res.json({
            sucesso: true,
            email: email,
            autorizacaoAnterior: autorizacaoAnterior,
            novaAutorizacao: autorizadoBool ? 'Autorizado' : 'Não Autorizado',
            message: 'Autorização atualizada com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao atualizar autorização:', error);
        res.json({
            sucesso: false,
            erro: 'Erro ao atualizar autorização: ' + error.message
        });
    }
});

// Endpoint para listar usuários (para administradores)
app.get('/api/listar-usuarios', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, nome, email, tipo, autorizado, created_at 
            FROM usuarios 
            ORDER BY created_at DESC
        `);
        
        res.json({
            sucesso: true,
            usuarios: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('❌ Erro ao listar usuários:', error);
        res.json({
            sucesso: false,
            erro: 'Erro ao listar usuários: ' + error.message
        });
    }
});

// API para usuários pendentes - busca usuarios não autorizados ou com status pending/bloqueado
app.get('/api/usuarios-pendentes', async (req, res) => {
    try {
        // Buscar usuários que precisam de aprovação
        const result = await pool.query(`
            SELECT id, nome, email, telefone, cpf, tipo, status, autorizado, created_at 
            FROM usuarios 
            WHERE (autorizado = false OR autorizado IS NULL OR status = 'pending' OR status = 'bloqueado')
            AND email != 'admin@clinica.com'
            ORDER BY created_at DESC
        `);
        
        res.json({
            success: true,
            usuarios: result.rows
        });
    } catch (error) {
        console.error('❌ Erro ao buscar usuários pendentes:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// API simples para aprovar usuário (simulação)
app.post('/api/aprovar-usuario', async (req, res) => {
    try {
        const { userId, tipo } = req.body;
        
        res.json({
            success: true,
            message: 'Funcionalidade em desenvolvimento'
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// API para aprovação avançada de usuários
app.post('/api/aprovar-usuario-avancado', async (req, res) => {
    try {
        const { userId, tipo, perfil, permissoes, observacoes, autorizado } = req.body;
        
        console.log('📋 Aprovação avançada recebida:', {
            userId,
            tipo,
            perfil,
            permissoes: permissoes?.length || 0,
            autorizado
        });
        
        // Verificar se existe tabela de perfis/permissões, se não criar
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES usuarios(id),
                tipo VARCHAR(50) NOT NULL,
                perfil VARCHAR(50),
                permissoes TEXT[],
                observacoes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Simular aprovação (em produção seria salvo no banco)
        console.log(`✅ Usuário ${userId} aprovado como ${tipo}${perfil ? ` (${perfil})` : ''}`);
        console.log(`🔐 Permissões configuradas: ${permissoes?.join(', ') || 'nenhuma'}`);
        
        if (observacoes) {
            console.log(`📝 Observações: ${observacoes}`);
        }
        
        // TODO: Implementar salvamento real no banco
        // await pool.query('UPDATE usuarios SET tipo = $1, autorizado = $2 WHERE id = $3', [tipo, autorizado, userId]);
        // await pool.query('INSERT INTO user_profiles (user_id, tipo, perfil, permissoes, observacoes) VALUES ($1, $2, $3, $4, $5)', 
        //                  [userId, tipo, perfil, permissoes, observacoes]);
        
        res.json({
            success: true,
            message: `Usuário aprovado como ${tipo}${perfil ? ` - ${perfil}` : ''} com ${permissoes?.length || 0} permissões`,
            data: {
                userId,
                tipo,
                perfil,
                permissoes,
                autorizado: true
            }
        });
        
    } catch (error) {
        console.error('❌ Erro na aprovação avançada:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor: ' + error.message
        });
    }
});

// API para verificar status
app.post('/api/check-status', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Admin sempre ativo, outros pending
        const status = email === 'admin@clinica.com' ? 'ativo' : 'pending';
        
        res.json({
            success: true,
            status: status
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ====================================
// SISTEMA DE CALENDÁRIO E AGENDAMENTO
// ====================================

// Middleware para verificar autenticação
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token de acesso requerido' });
    }

    try {
        // Simulação simples de autenticação
        // Em produção, use JWT ou sessões adequadas
        
        // Por enquanto, vamos usar o email no "token" para simplicidade
        // Format: "email:timestamp"
        const [email, timestamp] = Buffer.from(token, 'base64').toString().split(':');
        
        if (!email || !timestamp) {
            throw new Error('Token inválido');
        }

        // Verificar se o token não expirou (24 horas)
        const tokenTime = parseInt(timestamp);
        const now = Date.now();
        if (now - tokenTime > 24 * 60 * 60 * 1000) {
            throw new Error('Token expirado');
        }

        // Buscar usuário pelo email
        pool.query('SELECT id, email, nome, tipo FROM usuarios WHERE email = $1', [email])
            .then(result => {
                if (result.rows.length === 0) {
                    return res.status(404).json({ message: 'Usuário não encontrado' });
                }
                
                req.user = result.rows[0];
                req.userId = result.rows[0].id;
                next();
            })
            .catch(error => {
                console.error('Erro na autenticação:', error);
                return res.status(500).json({ message: 'Erro interno' });
            });

    } catch (error) {
        return res.status(403).json({ message: 'Token inválido' });
    }
}

// Obter informações do usuário logado
app.get('/api/user-info', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nome, email, telefone FROM usuarios WHERE id = $1',
            [req.userId]
        );

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Obter horários disponíveis para uma data
app.get('/api/available-slots', authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Data é obrigatória' });
        }

        // Verificar se é dia útil (segunda a sexta)
        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay();
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return res.json([]); // Sem horários nos fins de semana
        }

        // Horários padrão do consultório
        const standardSlots = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
            '16:00', '16:30', '17:00', '17:30'
        ];

        // Buscar agendamentos existentes para a data
        const existingAppointments = await pool.query(
            'SELECT EXTRACT(HOUR FROM data_consulta) as hour, EXTRACT(MINUTE FROM data_consulta) as minute FROM consultas WHERE DATE(data_consulta) = $1',
            [date]
        );

        const bookedTimes = existingAppointments.rows.map(row => {
            const hour = String(row.hour).padStart(2, '0');
            const minute = String(row.minute).padStart(2, '0');
            return `${hour}:${minute}`;
        });

        // Criar lista de horários com disponibilidade
        const slots = standardSlots.map(time => ({
            time: time,
            available: !bookedTimes.includes(time)
        }));

        res.json(slots);
    } catch (error) {
        console.error('Erro ao buscar horários:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Listar agendamentos do mês
app.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ message: 'Ano e mês são obrigatórios' });
        }

        const result = await pool.query(`
            SELECT c.*, u.nome as paciente_nome 
            FROM consultas c
            JOIN usuarios u ON c.paciente_id = u.id
            WHERE EXTRACT(YEAR FROM c.data_consulta) = $1 
            AND EXTRACT(MONTH FROM c.data_consulta) = $2
            ORDER BY c.data_consulta ASC
        `, [year, month]);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Criar novo agendamento
app.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const {
            data_consulta,
            tipo_consulta,
            convenio,
            observacoes,
            telefone_contato
        } = req.body;

        // Validações básicas
        if (!data_consulta || !tipo_consulta) {
            return res.status(400).json({ 
                message: 'Data e tipo de consulta são obrigatórios' 
            });
        }

        // Verificar se o horário ainda está disponível
        const existingAppointment = await pool.query(
            'SELECT id FROM consultas WHERE data_consulta = $1',
            [data_consulta]
        );

        if (existingAppointment.rows.length > 0) {
            return res.status(409).json({ 
                message: 'Este horário já foi agendado por outro paciente' 
            });
        }

        // Criar o agendamento
        const result = await pool.query(`
            INSERT INTO consultas (
                paciente_id, 
                data_consulta, 
                tipo_consulta, 
                observacoes, 
                convenio,
                telefone_contato,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'agendada')
            RETURNING *
        `, [req.userId, data_consulta, tipo_consulta, observacoes, convenio, telefone_contato]);

        const appointment = result.rows[0];

        // Buscar dados do paciente para notificação
        const userResult = await pool.query(
            'SELECT nome, email FROM usuarios WHERE id = $1',
            [req.userId]
        );
        const user = userResult.rows[0];

        // Enviar email de confirmação
        try {
            const emailService = require('./email-enhanced.service.js');
            await emailService.enviarConfirmacaoAgendamento(
                user.email,
                user.nome,
                {
                    data: new Date(data_consulta).toLocaleDateString('pt-BR'),
                    horario: new Date(data_consulta).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }),
                    tipo: tipo_consulta,
                    convenio: convenio || 'Particular'
                }
            );
        } catch (emailError) {
            console.error('Erro ao enviar email de confirmação:', emailError);
            // Não falhar o agendamento por erro de email
        }

        res.status(201).json({
            success: true,
            message: 'Consulta agendada com sucesso',
            appointment: appointment
        });

    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Cancelar agendamento
app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se o agendamento pertence ao usuário ou se é admin
        const result = await pool.query(
            'SELECT * FROM consultas WHERE id = $1 AND (paciente_id = $2 OR $2 IN (SELECT id FROM usuarios WHERE tipo = \'admin\'))',
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                message: 'Agendamento não encontrado ou sem permissão' 
            });
        }

        // Atualizar status para cancelado
        await pool.query(
            'UPDATE consultas SET status = \'cancelada\' WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Agendamento cancelado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Listar agendamentos do usuário
app.get('/api/my-appointments', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM consultas 
            WHERE paciente_id = $1 
            AND status != 'cancelada'
            ORDER BY data_consulta ASC
        `, [req.userId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar agendamentos do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Atualizar agendamento (admin)
app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, observacoes } = req.body;

        // Verificar se é admin
        const adminCheck = await pool.query(
            'SELECT tipo FROM usuarios WHERE id = $1',
            [req.userId]
        );

        if (adminCheck.rows.length === 0 || adminCheck.rows[0].tipo !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        await pool.query(
            'UPDATE consultas SET status = $1, observacoes = $2 WHERE id = $3',
            [status, observacoes, id]
        );

        res.json({
            success: true,
            message: 'Agendamento atualizado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Portal Dr. Marcio rodando na porta ${PORT}`);
    console.log(`📧 SendGrid: ${process.env.SENDGRID_API_KEY ? 'OK' : 'FALTANDO'}`);
    console.log(`📱 Twilio: ${process.env.TWILIO_ACCOUNT_SID ? 'OK' : 'FALTANDO'}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});
