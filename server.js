const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const app = express();

// Importar configuração de banco
const { pool, testConnection, initializeDatabase } = require('./src/config/database');

// Importar sistema LGPD
const lgpdRoutes = require('./src/routes/lgpd.routes');
const LGPDMiddleware = require('./src/middleware/lgpd.middleware');

// Importar sistema de pagamentos
const paymentRoutes = require('./src/routes/payments.routes');

// Importar sistema de autenticação completo
const AuthSystemComplete = require('./auth-system-complete');

// Importar sistema de setup
const setupRoutes = require('./src/routes/setup.routes');
const { checkSystemSetup } = require('./src/middleware/setup.middleware');

// Importar novas rotas do banco de dados
const funcionariosRoutes = require('./src/routes/funcionarios.routes');
const jornadaRoutes = require('./src/routes/jornada.routes');
const systemRoutes = require('./src/routes/system.routes');

// Importar rotas da integração completa
const pacientesRoutes = require('./src/routes/pacientes.routes');
const { router: adminRoutes, initializeRoutes: initializeAdminRoutes } = require('./src/routes/admin.routes');

// Middleware básico
app.use(cors());
app.use(express.json());

// MIDDLEWARE DE SETUP - DEVE VIR ANTES DOS OUTROS
app.use(checkSystemSetup);

// Middleware estático após verificação de setup
app.use(express.static('.'));

// Middleware LGPD
app.use(LGPDMiddleware.privacyHeaders());
app.use(LGPDMiddleware.cookieConsent());
app.use(LGPDMiddleware.logAccess());
app.use(LGPDMiddleware.detectUnauthorizedAccess());
app.use(LGPDMiddleware.rateLimitByUser());

// Configuração da planilha
const SHEET_ID = '1KSZcXweNg7csm-Xi0YYg8v-3mHg6cB5xI2NympkTY4k';
let doc;
let authSystem; // Sistema de autenticação

// Inicializar conexão com Google Sheets (DESABILITADO)
async function initSheet() {
    try {
        console.log('⚠️ Google Sheets desabilitado - usando apenas PostgreSQL');
        // Google Sheets desabilitado por configuração
        // Sistema funcionará apenas com PostgreSQL
        return;
        
        /* CÓDIGO ORIGINAL COMENTADO
        const creds = require('./credentials.json');
        
        const serviceAccountAuth = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        console.log('Conectado ao Google Sheets');
        */
        
                // Inicializar sistema de autenticação
        const sendGridService = require('@sendgrid/mail');
        sendGridService.setApiKey(process.env.SENDGRID_API_KEY);
        
        // Configurar Google Sheets service para AuthSystem
        const googleSheetsService = {
            spreadsheets: {
                values: {
                    get: async (params) => {
                        const sheet = doc.sheetsByTitle[params.range.split('!')[0]] || doc.sheetsByIndex[0];
                        const rows = await sheet.getRows();
                        return {
                            data: {
                                values: rows.length > 0 ? [Object.keys(rows[0]._rawData), ...rows.map(row => Object.values(row._rawData))] : []
                            }
                        };
                    },
                    append: async (params) => {
                        const sheetName = params.range.split('!')[0];
                        const sheet = doc.sheetsByTitle[sheetName] || doc.sheetsByIndex[0];
                        await sheet.addRow(params.resource.values[0]);
                        return { success: true };
                    },
                    update: async (params) => {
                        const sheetName = params.range.split('!')[0];
                        const sheet = doc.sheetsByTitle[sheetName] || doc.sheetsByIndex[0];
                        const rows = await sheet.getRows();
                        const rowIndex = parseInt(params.range.match(/(\d+)/)[1]) - 2;
                        if (rows[rowIndex]) {
                            const headers = Object.keys(rows[0]._rawData);
                            headers.forEach((header, index) => {
                                rows[rowIndex][header] = params.resource.values[0][index] || '';
                            });
                            await rows[rowIndex].save();
                        }
                        return { success: true };
                    }
                }
            }
        };
        
        authSystem = new AuthSystemComplete(googleSheetsService, sendGridService);
        console.log('Sistema de autenticação inicializado');
        
    } catch (error) {
        console.error('Erro ao conectar com Google Sheets:', error);
    }
}

// Verificar se email existe (PostgreSQL only)
app.post('/api/verificar-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        const query = 'SELECT email, password_hash, role FROM usuarios WHERE email = $1';
        const result = await pool.query(query, [email]);
        
        if (result.rows.length > 0) {
            const usuario = result.rows[0];
            res.json({ 
                existe: true, 
                temSenha: !!usuario.password_hash,
                role: usuario.role 
            });
        } else {
            res.json({ existe: false });
        }
    } catch (error) {
        console.error('Erro ao verificar email:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Cadastrar novo usuário (PostgreSQL only)
app.post('/api/cadastrar', async (req, res) => {
    try {
        const { email, full_name, telefone, role } = req.body;
        
        // Verificar se email já existe
        const checkQuery = 'SELECT email FROM usuarios WHERE email = $1';
        const checkResult = await pool.query(checkQuery, [email]);
        
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        
        // Gerar user_id único
        const user_id = 'USR_' + Date.now();
        
        // Definir role (padrão patient se não especificado)
        const userRole = role || 'patient';
        
        // Inserir novo usuário
        const insertQuery = `
            INSERT INTO usuarios (
                email, full_name, telefone, role, user_id, status, 
                autorizado, last_login, password_hash, data_criacao, observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING user_id
        `;
        
        const values = [
            email, full_name, telefone, userRole, user_id, 'ativo',
            'nao', null, '', new Date().toISOString(), 'Cadastro via webapp'
        ];
        
        const result = await pool.query(insertQuery, values);
        
        res.json({ sucesso: true, message: 'Usuário cadastrado com sucesso', role: userRole });
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Criar senha (PostgreSQL only)
app.post('/api/criar-senha', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        // Verificar se usuário existe
        const checkQuery = 'SELECT user_id FROM usuarios WHERE email = $1';
        const checkResult = await pool.query(checkQuery, [email]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        // Hash da senha
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(senha, saltRounds);
        
        // Atualizar senha no banco
        const updateQuery = 'UPDATE usuarios SET password_hash = $1 WHERE email = $2';
        await pool.query(updateQuery, [password_hash, email]);
        
        res.json({ sucesso: true, message: 'Senha criada com sucesso' });
    } catch (error) {
        console.error('Erro ao criar senha:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Login (PostgreSQL only)
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        console.log('Tentativa de login para:', email); // Debug
        
        // Buscar usuário no PostgreSQL
        const query = 'SELECT email, password_hash, role, full_name FROM usuarios WHERE email = $1';
        const result = await pool.query(query, [email]);
        
        if (result.rows.length === 0) {
            console.log('Usuário não encontrado:', email); // Debug
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        const usuario = result.rows[0];
        console.log('Usuário encontrado:', email, 'Role:', usuario.role); // Debug
        console.log('Tem senha hash?', !!usuario.password_hash); // Debug
        
        if (!usuario.password_hash) {
            console.log('Usuário precisa criar senha'); // Debug
            return res.json({ precisaCriarSenha: true });
        }
        
        // Verificar senha
        console.log('Verificando senha...'); // Debug
        const senhaValida = await bcrypt.compare(senha, usuario.password_hash);
        console.log('Senha válida?', senhaValida); // Debug
        
        if (!senhaValida) {
            console.log('Senha incorreta para:', email); // Debug
            return res.status(401).json({ erro: 'Senha incorreta' });
        }
        
        // Atualizar last_login
        const updateQuery = 'UPDATE usuarios SET last_login = $1 WHERE email = $2';
        await pool.query(updateQuery, [new Date().toISOString(), email]);
        
        console.log('Login bem-sucedido para:', email, 'Role:', usuario.role); // Debug
        
        res.json({ 
            sucesso: true, 
            role: usuario.role,
            full_name: usuario.full_name 
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// API para captura de leads da landing page pública
app.post('/api/capturar-lead', async (req, res) => {
    const { nome, telefone, email, idade, procedimento, observacoes, origem } = req.body;
    
    try {
        // Validação básica
        if (!nome || !telefone || !procedimento) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nome, telefone e procedimento são obrigatórios' 
            });
        }
        
        // Gerar protocolo único
        const protocolo = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        
        // Tentar salvar no PostgreSQL
        const query = `
            INSERT INTO leads (
                protocolo, nome, telefone, email, idade, procedimento, 
                observacoes, origem, status, data_captura, data_criacao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        `;
        
        const values = [
            protocolo,
            nome,
            telefone || null,
            email || null,
            idade || null,
            procedimento,
            observacoes || null,
            origem || 'landing-publica',
            'novo',
            new Date(),
            new Date()
        ];
        
        const result = await pool.query(query, values);
        const leadId = result.rows[0].id;
        
        console.log(`✅ Lead capturado: ${protocolo} - ${nome}`);
        
        res.json({ 
            success: true, 
            message: 'Lead capturado com sucesso',
            protocolo: protocolo,
            lead_id: leadId
        });
        
    } catch (error) {
        console.error('Erro ao capturar lead:', error);
        
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// API para listar leads (admin)
app.get('/api/leads', async (req, res) => {
    try {
        // Tentar buscar no PostgreSQL primeiro
        try {
            const query = `
                SELECT 
                    id, protocolo, nome, telefone, email, idade, procedimento,
                    observacoes, origem, status, data_captura, data_criacao,
                    convertido_em_paciente, paciente_id, data_conversao
                FROM leads 
                ORDER BY data_captura DESC
            `;
            
            const result = await pool.query(query);
            
            res.json({
                success: true,
                leads: result.rows,
                total: result.rows.length,
                source: 'postgresql'
            });
            
        } catch (dbError) {
            console.warn('Falha no PostgreSQL, tentando Google Sheets:', dbError.message);
            
            // Fallback para Google Sheets
            const leadsSheet = doc.sheetsByTitle['Leads'];
            if (!leadsSheet) {
                return res.json({
                    success: true,
                    leads: [],
                    total: 0,
                    source: 'google_sheets'
                });
            }
            
            const rows = await leadsSheet.getRows();
            const leads = rows.map((row, index) => ({
                id: index + 1,
                protocolo: row.get('Protocolo') || '',
                nome: row.get('Nome') || '',
                telefone: row.get('Telefone') || '',
                email: row.get('Email') || '',
                idade: row.get('Idade') || '',
                procedimento: row.get('Procedimento') || '',
                observacoes: row.get('Observações') || '',
                origem: row.get('Origem') || '',
                status: row.get('Status') || 'novo',
                data_captura: row.get('Data Captura') || '',
                data_criacao: row.get('Data Criação') || '',
                convertido_em_paciente: false,
                paciente_id: null,
                data_conversao: null
            }));
            
            res.json({
                success: true,
                leads: leads,
                total: leads.length,
                source: 'google_sheets'
            });
        }
        
    } catch (error) {
        console.error('Erro ao listar leads:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Atualizar role de usuário existente (PostgreSQL only)
app.post('/api/atualizar-role', async (req, res) => {
    try {
        const { email, novoRole } = req.body;
        
        // Validar dados de entrada
        if (!email || !novoRole) {
            return res.status(400).json({ erro: 'Email e novo role são obrigatórios' });
        }
        
        // Validar roles permitidos
        const rolesPermitidos = ['patient', 'staff', 'admin'];
        if (!rolesPermitidos.includes(novoRole)) {
            return res.status(400).json({ erro: 'Role inválido. Use: patient, staff, admin' });
        }
        
        // Buscar usuário
        const checkQuery = 'SELECT role FROM usuarios WHERE email = $1';
        const checkResult = await pool.query(checkQuery, [email]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        const roleAnterior = checkResult.rows[0].role;
        
        // Atualizar role
        const updateQuery = 'UPDATE usuarios SET role = $1 WHERE email = $2';
        await pool.query(updateQuery, [novoRole, email]);
        
        console.log(`Role atualizado para ${email}: ${roleAnterior} -> ${novoRole}`);
        
        res.json({ 
            sucesso: true, 
            message: `Role atualizado de "${roleAnterior}" para "${novoRole}"`,
            email: email,
            roleAnterior: roleAnterior,
            novoRole: novoRole
        });
    } catch (error) {
        console.error('Erro ao atualizar role:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Atualizar autorização de usuário (PostgreSQL only)
app.post('/api/atualizar-autorizacao', async (req, res) => {
    try {
        const { email, autorizado } = req.body;
        
        // Validar dados de entrada
        if (!email || autorizado === undefined) {
            return res.status(400).json({ erro: 'Email e status de autorização são obrigatórios' });
        }
        
        // Validar valores permitidos
        const valoresPermitidos = ['sim', 'nao'];
        if (!valoresPermitidos.includes(autorizado)) {
            return res.status(400).json({ erro: 'Autorização deve ser "sim" ou "nao"' });
        }
        
        // Buscar usuário
        const checkQuery = 'SELECT autorizado FROM usuarios WHERE email = $1';
        const checkResult = await pool.query(checkQuery, [email]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        const autorizacaoAnterior = checkResult.rows[0].autorizado;
        
        // Atualizar autorização
        const updateQuery = 'UPDATE usuarios SET autorizado = $1 WHERE email = $2';
        await pool.query(updateQuery, [autorizado, email]);
        
        console.log(`Autorização atualizada para ${email}: ${autorizacaoAnterior} -> ${autorizado}`);
        
        res.json({ 
            sucesso: true, 
            message: `Autorização atualizada de "${autorizacaoAnterior}" para "${autorizado}"`,
            email: email,
            autorizacaoAnterior: autorizacaoAnterior,
            novaAutorizacao: autorizado
        });
    } catch (error) {
        console.error('Erro ao atualizar autorização:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ROTAS DESABILITADAS - Google Sheets não disponível em produção
/*
// Aprovar usuário pendente - DESABILITADO (Google Sheets)
app.post('/api/aprovar-usuario', async (req, res) => {
    res.status(503).json({ 
        success: false, 
        message: 'Serviço temporariamente indisponível - migração para PostgreSQL em andamento' 
    });
});

// Listar usuários pendentes - DESABILITADO (Google Sheets)
app.get('/api/usuarios-pendentes', async (req, res) => {
    res.json({
        success: true,
        usuarios: [],
        message: 'Migração para PostgreSQL - funcionalidade em desenvolvimento'
    });
});

// Listar usuários cadastrados - DESABILITADO (Google Sheets)  
app.get('/api/listar-usuarios', async (req, res) => {
    res.json({
        sucesso: true,
        total: 0,
        usuarios: [],
        message: 'Migração para PostgreSQL - funcionalidade em desenvolvimento'
    });
});
*/

// Servir páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, 'cadastro.html'));
});

app.get('/senha', (req, res) => {
    res.sendFile(path.join(__dirname, 'senha.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ROTAS DE GESTÃO DESABILITADAS - Google Sheets não disponível
/*
// Obter todos os dados da gestão - DESABILITADO
app.get('/api/gestao/dados', async (req, res) => {
    res.status(503).json({ 
        erro: 'Serviço temporariamente indisponível - migração para PostgreSQL em andamento' 
    });
});

// Atualizar dados da gestão - DESABILITADO  
app.post('/api/gestao/atualizar', async (req, res) => {
    res.status(503).json({ 
        erro: 'Serviço temporariamente indisponível - migração para PostgreSQL em andamento' 
    });
});

// Sincronizar dados - DESABILITADO
app.post('/api/gestao/sincronizar', async (req, res) => {
    res.status(503).json({ 
        erro: 'Serviço temporariamente indisponível - migração para PostgreSQL em andamento' 
    });
});

// Obter estatísticas do dashboard - DESABILITADO
app.get('/api/gestao/estatisticas', async (req, res) => {
    res.status(503).json({ 
        erro: 'Serviço temporariamente indisponível - migração para PostgreSQL em andamento' 
    });
});
*/

// Servir página de gestão
app.get('/gestao', (req, res) => {
    res.sendFile(path.join(__dirname, 'gestao.html'));
});

// Rotas de Setup (DEVE VIR PRIMEIRO)
app.use('/setup', setupRoutes);
app.use('/api/setup', setupRoutes);

// Rotas LGPD
app.use('/api/lgpd', lgpdRoutes);

// Rotas de Pagamentos
app.use('/api/payments', paymentRoutes);

// Novas rotas do banco de dados
app.use('/api/funcionarios', funcionariosRoutes);
app.use('/api/jornada', jornadaRoutes);
app.use('/api/system', systemRoutes);

// Rotas da integração completa de pacientes
app.use('/api/pacientes', pacientesRoutes);

// Rotas administrativas para logs
initializeAdminRoutes(pool);
app.use('/api/admin', adminRoutes);

// ENDPOINTS ANTIGOS (Google Sheets) - Manter durante migração
const configRoutes = require('./src/routes/config.routes');
app.use('/api/config', configRoutes);

// ROTAS DE AUTENTICAÇÃO DESABILITADAS - Google Sheets não disponível
/*
// Rotas duplicadas removidas - dependiam do Google Sheets
// As funcionalidades foram migradas para PostgreSQL nas rotas do sistema principal
*/

// Health Check para Railway
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            server: '✅ Online',
            sendgrid: process.env.SENDGRID_API_KEY ? '✅ Configurado' : '❌ Não configurado',
            twilio: process.env.TWILIO_ACCOUNT_SID ? '✅ Configurado' : '❌ Não configurado',
            database: process.env.DATABASE_URL ? '✅ Conectado' : '❌ Não conectado'
        },
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Endpoint de teste de email
app.get('/api/email/test', async (req, res) => {
    try {
        const EmailService = require('./src/services/email-sendgrid.service');
        const emailService = new EmailService();
        
        const testEmail = req.query.email || 'test@example.com';
        
        const resultado = await emailService.enviarEmail(
            testEmail,
            'Teste Railway - Portal Dr. Marcio',
            '<h1>🚀 Sistema Online!</h1><p>O Portal Dr. Marcio está funcionando perfeitamente no Railway!</p>'
        );
        
        res.json({
            success: resultado.sucesso,
            message: resultado.sucesso ? 'Email enviado com sucesso!' : 'Erro ao enviar email',
            details: resultado
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro no serviço de email',
            error: error.message
        });
    }
});

// Endpoint de teste de email via POST
app.post('/api/enviar-email', async (req, res) => {
    try {
        const { to, subject, html } = req.body;
        
        if (!to || !subject || !html) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios: to, subject, html'
            });
        }
        
        const EmailService = require('./src/services/email-sendgrid.service');
        const emailService = new EmailService();
        
        const resultado = await emailService.enviarEmail(to, subject, html);
        
        res.json({
            success: resultado.sucesso,
            message: resultado.sucesso ? 'Email enviado com sucesso!' : 'Erro ao enviar email',
            details: resultado
        });
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        res.status(500).json({
            success: false,
            message: 'Erro no serviço de email',
            error: error.message
        });
    }
});

// Endpoint de teste de SMS via POST
app.post('/api/enviar-sms', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios: to, message'
            });
        }
        
        // Verificar se o Twilio está configurado
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
            return res.status(400).json({
                success: false,
                message: 'Serviço SMS não configurado. Faltam variáveis do Twilio.',
                details: {
                    account_sid: process.env.TWILIO_ACCOUNT_SID ? 'Configurado' : 'Não configurado',
                    auth_token: process.env.TWILIO_AUTH_TOKEN ? 'Configurado' : 'Não configurado',
                    phone_number: process.env.TWILIO_PHONE_NUMBER ? 'Configurado' : 'Não configurado'
                }
            });
        }
        
        // Importar Twilio dinamicamente
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const resultado = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
        
        res.json({
            success: true,
            message: 'SMS enviado com sucesso!',
            details: {
                sid: resultado.sid,
                status: resultado.status,
                to: to
            }
        });
        
    } catch (error) {
        console.error('Erro ao enviar SMS:', error);
        res.status(500).json({
            success: false,
            message: 'Erro no serviço de SMS',
            error: error.message
        });
    }
});

// Endpoint para informações de configuração (sem expor dados sensíveis)
app.get('/api/config-info', (req, res) => {
    try {
        const configInfo = {
            email: {
                status: process.env.SENDGRID_API_KEY ? 'configured' : 'missing',
                variables: [
                    { name: 'SENDGRID_API_KEY', configured: !!process.env.SENDGRID_API_KEY },
                    { name: 'FROM_EMAIL', configured: !!process.env.FROM_EMAIL }
                ],
                service: 'SendGrid',
                docs: 'https://sendgrid.com/docs/api-reference/'
            },
            sms: {
                status: (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) ? 'configured' : 'missing',
                variables: [
                    { name: 'TWILIO_ACCOUNT_SID', configured: !!process.env.TWILIO_ACCOUNT_SID },
                    { name: 'TWILIO_AUTH_TOKEN', configured: !!process.env.TWILIO_AUTH_TOKEN },
                    { name: 'TWILIO_PHONE_NUMBER', configured: !!process.env.TWILIO_PHONE_NUMBER }
                ],
                service: 'Twilio',
                docs: 'https://www.twilio.com/docs/usage/api'
            },
            payments: {
                status: 'not-configured',
                variables: [
                    { name: 'STRIPE_SECRET_KEY', configured: !!process.env.STRIPE_SECRET_KEY },
                    { name: 'STRIPE_PUBLISHABLE_KEY', configured: !!process.env.STRIPE_PUBLISHABLE_KEY }
                ],
                service: 'Stripe',
                docs: 'https://stripe.com/docs/api'
            },
            whatsapp: {
                status: 'not-configured',
                variables: [
                    { name: 'WHATSAPP_TOKEN', configured: !!process.env.WHATSAPP_TOKEN },
                    { name: 'WHATSAPP_PHONE_ID', configured: !!process.env.WHATSAPP_PHONE_ID }
                ],
                service: 'WhatsApp Business API',
                docs: 'https://developers.facebook.com/docs/whatsapp'
            }
        };
        
        res.json({
            success: true,
            config: configInfo,
            railway_url: 'https://railway.app/project/portal-dr-marcio/variables'
        });
    } catch (error) {
        console.error('Erro ao buscar informações de configuração:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar configurações'
        });
    }
});

// SISTEMA DE AUTENTICAÇÃO LIMPO - PostgreSQL Only
// Todas as rotas de autenticação foram migradas para PostgreSQL
// Removidas dependências do Google Sheets para produção

// Iniciar servidor
const PORT = process.env.PORT || 3000;

// Função de inicialização assíncrona
async function startServer() {
    try {
        console.log('🚀 Inicializando servidor...');
        
        // 1. Testar conexão com banco
        const dbConnected = await testConnection();
        if (!dbConnected) {
            throw new Error('Falha na conexão com banco de dados');
        }
        
        // 2. Inicializar estrutura do banco
        await initializeDatabase();
        
        // 3. Google Sheets desabilitado - usando apenas PostgreSQL
        // await initSheet(); // Comentado - não necessário
        
        // 4. Iniciar servidor
        app.listen(PORT, () => {
            console.log(`✅ Servidor rodando na porta ${PORT}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`🗄️ Banco de dados: PostgreSQL Conectado`);
            console.log(`📊 Google Sheets: Desabilitado (usando PostgreSQL)`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}

// Iniciar aplicação
startServer();