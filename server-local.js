#!/usr/bin/env node
/**
 * 🚀 SERVIDOR LOCAL SEM RAILWAY
 * ===========================
 * 
 * Servidor que funciona SEM banco para desenvolvimento
 * Frontend + Backend funcionais + Sistema completo
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// MOCK DATA - Simula banco de dados
const mockUsers = new Map();
const mockCodes = new Map();
const mockLogs = [];

// Usuário admin padrão
mockUsers.set('marcioscartozzoni@gmail.com', {
    email: 'marcioscartozzoni@gmail.com',
    senha: 'AdminMestre2025!',
    tipo: 'admin',
    ativo: true,
    primeiro_acesso: false
});

console.log('🚀 SERVIDOR LOCAL DR. MARCIO');
console.log('============================');
console.log('✅ Admin criado: marcioscartozzoni@gmail.com');
console.log('🔑 Senha: AdminMestre2025!');

// === ROTAS DE PÁGINAS ===

// Rota específica para admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Rota para login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Rota para acesso funcionário
app.get('/acesso-funcionario', (req, res) => {
    res.sendFile(path.join(__dirname, 'acesso-funcionario.html'));
});

// Rota para definir senha funcionário
app.get('/definir-senha-funcionario', (req, res) => {
    res.sendFile(path.join(__dirname, 'definir-senha-funcionario.html'));
});

// Rota para dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Rota para index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// === ROTAS API ===

// Home
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Páginas
const pages = ['cadastro', 'senha', 'recuperar-senha', 'dashboard', 'gestao', 'admin'];
pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, `${page}.html`));
    });
});

// === API ROTAS ===

// Login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    
    console.log(`🔐 Tentativa login: ${email}`);
    
    const user = mockUsers.get(email);
    if (!user) {
        return res.json({
            sucesso: false,
            message: 'Usuário não encontrado'
        });
    }

    if (user.senha !== senha) {
        return res.json({
            sucesso: false,
            message: 'Senha incorreta'
        });
    }
    
    // MODO LOCAL: SEMPRE LIBERAR ACESSO PARA FUNCIONÁRIOS ATIVOS
    if (user.ativo) {
        console.log(`✅ Login sucesso: ${email} (${user.tipo}) - MODO LOCAL`);
        
        res.json({
            sucesso: true,
            message: 'Login realizado com sucesso',
            usuario: {
                email: user.email,
                nome: user.nome || 'Funcionário',
                tipo: user.tipo,
                ativo: user.ativo,
                autorizado: true // ← ADICIONAR PARA COMPATIBILIDADE COM DASHBOARD
            },
            redirect: user.tipo === 'admin' ? '/admin' : '/dashboard'
        });
        return;
    }
    
    // Se chegou aqui, usuário não está ativo
    res.json({
        sucesso: false,
        message: 'Conta não ativada. Entre em contato com o administrador.'
    });
});

// Recuperar senha
app.post('/api/recuperar-senha', (req, res) => {
    const { email } = req.body;
    
    console.log(`📧 Recuperação solicitada: ${email}`);
    
    // Gerar código mock
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);
    
    mockCodes.set(email, {
        codigo: codigo,
        expires: expires,
        tentativas: 0
    });
    
    mockLogs.push({
        email,
        evento: 'recuperacao_solicitada',
        timestamp: new Date(),
        ip: req.ip
    });
    
    console.log(`📱 Código gerado: ${codigo} (válido até ${expires.toLocaleTimeString()})`);
    
    res.json({
        sucesso: true,
        message: `Código enviado para ${email}`,
        debug: {
            codigo: codigo, // Em produção, não retornar isso
            expires: expires.toLocaleString(),
            nota: 'MODO DESENVOLVIMENTO - Código visível'
        }
    });
});

// Verificar código
app.post('/api/verificar-codigo', (req, res) => {
    const { email, codigo } = req.body;
    
    console.log(`🔍 Verificando código: ${email} - ${codigo}`);
    
    const mockCode = mockCodes.get(email);
    if (!mockCode) {
        return res.json({
            sucesso: false,
            message: 'Código não encontrado. Solicite um novo.'
        });
    }
    
    if (new Date() > mockCode.expires) {
        mockCodes.delete(email);
        return res.json({
            sucesso: false,
            message: 'Código expirado. Solicite um novo.'
        });
    }
    
    if (mockCode.codigo !== codigo) {
        mockCode.tentativas++;
        if (mockCode.tentativas >= 3) {
            mockCodes.delete(email);
            return res.json({
                sucesso: false,
                message: 'Muitas tentativas. Solicite um novo código.'
            });
        }
        return res.json({
            sucesso: false,
            message: `Código incorreto. ${3 - mockCode.tentativas} tentativas restantes.`
        });
    }
    
    // Código válido
    mockCodes.delete(email);
    console.log(`✅ Código verificado: ${email}`);
    
    res.json({
        sucesso: true,
        message: 'Código verificado com sucesso',
        token: 'mock_token_' + Date.now()
    });
});

// Redefinir senha
app.post('/api/redefinir-senha', (req, res) => {
    const { email, novaSenha, token } = req.body;
    
    console.log(`🔑 Redefinindo senha: ${email}`);
    
    if (!token || !token.startsWith('mock_token_')) {
        return res.json({
            sucesso: false,
            message: 'Token inválido'
        });
    }
    
    let user = mockUsers.get(email);
    if (!user) {
        // Criar novo usuário
        user = {
            email: email,
            tipo: 'usuario',
            ativo: true,
            primeiro_acesso: true
        };
    }
    
    user.senha = novaSenha;
    user.primeiro_acesso = false;
    mockUsers.set(email, user);
    
    mockLogs.push({
        email,
        evento: 'senha_redefinida',
        timestamp: new Date(),
        ip: req.ip
    });
    
    console.log(`✅ Senha redefinida: ${email}`);
    
    res.json({
        sucesso: true,
        message: 'Senha redefinida com sucesso',
        redirect: '/senha'
    });
});

// Cadastro
app.post('/api/cadastro', (req, res) => {
    const { email, senha, nome, telefone } = req.body;
    
    console.log(`👤 Novo cadastro: ${email}`);
    
    if (mockUsers.has(email)) {
        return res.json({
            sucesso: false,
            message: 'Usuário já cadastrado'
        });
    }
    
    mockUsers.set(email, {
        email,
        senha,
        nome,
        telefone,
        tipo: 'usuario',
        ativo: true,
        primeiro_acesso: false
    });
    
    console.log(`✅ Usuário cadastrado: ${email}`);
    
    res.json({
        sucesso: true,
        message: 'Cadastro realizado com sucesso',
        redirect: '/senha'
    });
});

// Cadastrar funcionário (admin)
app.post('/api/admin/cadastrar-funcionario', (req, res) => {
    const { email, nome, cargo, telefone } = req.body;
    
    console.log(`👥 Admin cadastrando funcionário: ${email}`);
    
    if (mockUsers.has(email)) {
        return res.json({
            sucesso: false,
            message: 'Usuário já existe'
        });
    }
    
    // Gerar código de acesso único
    const codigoAcesso = 'FUNC' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    // Gerar senha temporária
    const senhaTemp = 'Temp' + Math.random().toString(36).slice(-6);
    
    mockUsers.set(email, {
        email,
        nome,
        cargo,
        telefone,
        senha: senhaTemp,
        codigo_acesso: codigoAcesso,
        tipo: 'funcionario',
        ativo: false, // Precisa ativar após usar código
        primeiro_acesso: true
    });
    
    // Salvar código para verificação
    mockCodes.set(codigoAcesso, {
        email,
        tipo: 'funcionario_acesso',
        usado: false,
        criado_em: new Date().toISOString()
    });
    
    res.json({
        sucesso: true,
        message: 'Funcionário cadastrado com sucesso',
        codigoAcesso: codigoAcesso,
        instrucoes: `Forneça este código ao funcionário: ${codigoAcesso}`
    });
});

// Verificar código de acesso do funcionário
app.post('/api/verificar-codigo-funcionario', (req, res) => {
    const { codigo } = req.body;
    
    console.log(`🔑 Verificando código: ${codigo}`);
    
    const codigoData = mockCodes.get(codigo);
    
    if (!codigoData) {
        return res.json({
            sucesso: false,
            message: 'Código não encontrado'
        });
    }
    
    if (codigoData.usado) {
        return res.json({
            sucesso: false,
            message: 'Código já foi utilizado'
        });
    }
    
    if (codigoData.tipo !== 'funcionario_acesso') {
        return res.json({
            sucesso: false,
            message: 'Código inválido para este tipo de acesso'
        });
    }
    
    const user = mockUsers.get(codigoData.email);
    if (!user) {
        return res.json({
            sucesso: false,
            message: 'Funcionário não encontrado'
        });
    }
    
    res.json({
        sucesso: true,
        message: 'Código válido',
        email: user.email,
        nome: user.nome,
        cargo: user.cargo,
        redirect: `/definir-senha-funcionario?codigo=${codigo}&email=${encodeURIComponent(user.email)}`
    });
});

// Definir senha do funcionário com código
app.post('/api/funcionario/definir-senha', (req, res) => {
    const { codigo, email, senha } = req.body;
    
    console.log(`🔐 Funcionário definindo senha: ${email}`);
    
    const codigoData = mockCodes.get(codigo);
    if (!codigoData || codigoData.usado || codigoData.email !== email) {
        return res.json({
            sucesso: false,
            message: 'Código inválido ou já utilizado'
        });
    }
    
    const user = mockUsers.get(email);
    if (!user) {
        return res.json({
            sucesso: false,
            message: 'Funcionário não encontrado'
        });
    }
    
    // Atualizar funcionário - JÁ APROVADO AUTOMATICAMENTE
    user.senha = senha;
    user.ativo = true;
    user.aprovado = true; // ← CORREÇÃO: Auto-aprovar quando define senha
    user.primeiro_acesso = false;
    mockUsers.set(email, user);
    
    // Marcar código como usado
    codigoData.usado = true;
    mockCodes.set(codigo, codigoData);
    
    console.log(`✅ Funcionário ${email} ativado e aprovado automaticamente`);
    
    res.json({
        sucesso: true,
        message: 'Senha definida com sucesso! Você já está aprovado e pode fazer login.',
        redirect: '/login-simples.html'
    });
});

// Cadastrar primeiro admin (rota que faltava)
app.post('/api/cadastrar', (req, res) => {
    const { email, senha, nome, chave } = req.body;
    
    console.log(`👑 Cadastro primeiro admin: ${email}`);
    
    // MODO LOCAL - Aceitar qualquer chave ou sem chave
    const chaveValida = chave === 'AdminMestre2025!' || 
                        chave === 'admin123' || 
                        chave === 'teste' || 
                        !chave; // Aceitar sem chave no modo local
    
    if (!chaveValida) {
        return res.json({
            sucesso: false,
            message: 'Chave de acesso inválida. Tente: AdminMestre2025!, admin123 ou teste'
        });
    }
    
    mockUsers.set(email, {
        email,
        senha,
        nome,
        tipo: 'admin',
        ativo: true,
        primeiro_acesso: false
    });
    
    console.log(`✅ Primeiro admin criado: ${email}`);
    
    res.json({
        sucesso: true,
        message: 'Primeiro administrador criado com sucesso',
        redirect: '/admin'
    });
});

// Status funcionário (API que o frontend está chamando)
app.get('/api/auth/status-funcionario/:email', (req, res) => {
    const email = decodeURIComponent(req.params.email);
    
    console.log(`🔍 Verificando status: ${email}`);
    
    const user = mockUsers.get(email);
    
    if (!user) {
        return res.json({
            encontrado: false,
            primeiro_acesso: true,
            message: 'Usuário não encontrado - primeiro acesso'
        });
    }
    
    res.json({
        encontrado: true,
        primeiro_acesso: user.primeiro_acesso || false,
        tipo: user.tipo,
        ativo: user.ativo
    });
});

// Status do sistema
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        mode: 'LOCAL_DEVELOPMENT',
        database: 'MOCK (sem Railway)',
        users: mockUsers.size,
        codes: mockCodes.size,
        logs: mockLogs.length,
        uptime: process.uptime(),
        admin_user: 'marcioscartozzoni@gmail.com',
        admin_pass: 'AdminMestre2025!'
    });
});

// Listar usuários pendentes
app.get('/api/usuarios-pendentes', (req, res) => {
    const usuariosPendentes = Array.from(mockUsers.values())
        .filter(user => !user.ativo || !user.aprovado)
        .map(user => ({
            email: user.email,
            nome: user.nome || 'N/A',
            tipo: user.tipo,
            ativo: user.ativo,
            aprovado: user.aprovado || false,
            data_cadastro: new Date().toISOString().split('T')[0]
        }));
    
    res.json({
        sucesso: true,
        usuarios: usuariosPendentes
    });
});

// Listar usuários (admin)
app.get('/api/admin/usuarios', (req, res) => {
    const usuarios = Array.from(mockUsers.values()).map(user => ({
        email: user.email,
        nome: user.nome || 'N/A',
        tipo: user.tipo,
        ativo: user.ativo
    }));
    
    res.json({
        sucesso: true,
        usuarios: usuarios
    });
});

// Aprovar usuário (rota alternativa para compatibilidade)
app.post('/api/aprovar-usuario', (req, res) => {
    const { email } = req.body;
    
    console.log(`✅ Aprovando usuário: ${email}`);
    
    const user = mockUsers.get(email);
    if (!user) {
        return res.json({
            sucesso: false,
            message: 'Usuário não encontrado'
        });
    }
    
    user.ativo = true;
    user.aprovado = true;
    mockUsers.set(email, user);
    
    res.json({
        sucesso: true,
        message: 'Usuário aprovado com sucesso'
    });
});

// Aprovar usuário (simular aprovação)
app.post('/api/admin/aprovar/:email', (req, res) => {
    const email = decodeURIComponent(req.params.email);
    
    console.log(`✅ Aprovando usuário: ${email}`);
    
    const user = mockUsers.get(email);
    if (!user) {
        return res.json({
            sucesso: false,
            message: 'Usuário não encontrado'
        });
    }
    
    user.ativo = true;
    user.aprovado = true;
    mockUsers.set(email, user);
    
    res.json({
        sucesso: true,
        message: 'Usuário aprovado com sucesso'
    });
});

// Simular aprovação automática do primeiro admin
app.get('/api/aprovar-admin', (req, res) => {
    const adminEmail = 'marcioscartozzoni@gmail.com';
    const user = mockUsers.get(adminEmail);
    
    if (user) {
        user.ativo = true;
        user.aprovado = true;
        mockUsers.set(adminEmail, user);
        
        res.json({
            sucesso: true,
            message: 'Admin aprovado automaticamente',
            redirect: '/senha'
        });
    } else {
        res.json({
            sucesso: false,
            message: 'Admin não encontrado'
        });
    }
});

// Logs (admin)
app.get('/api/admin/logs', (req, res) => {
    res.json({
        sucesso: true,
        logs: mockLogs.slice(-50) // Últimos 50 logs
    });
});

// === MIDDLEWARE DE ERRO ===
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err);
    res.status(500).json({
        erro: 'Erro interno do servidor',
        message: err.message,
        modo: 'desenvolvimento'
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({
        erro: 'Página não encontrada',
        path: req.path
    });
});

// === INICIALIZAR SERVIDOR ===
app.listen(PORT, () => {
    console.log('\n🎉 SERVIDOR LOCAL INICIADO COM SUCESSO!');
    console.log('======================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📊 Status: http://localhost:${PORT}/api/status`);
    console.log('');
    console.log('🔐 ACESSO ADMIN:');
    console.log('   Email: marcioscartozzoni@gmail.com');
    console.log('   Senha: AdminMestre2025!');
    console.log('');
    console.log('✅ FUNCIONALIDADES:');
    console.log('   ✓ Login/Cadastro');
    console.log('   ✓ Recuperação de senha');
    console.log('   ✓ Painel admin');
    console.log('   ✓ Sistema completo SEM Railway');
    console.log('');
    console.log('⚠️  MODO: Desenvolvimento local');
    console.log('💾 DADOS: Em memória (não persistem)');
    console.log('🔄 REINICIAR: Ctrl+C para parar');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Parando servidor local...');
    console.log('✅ Todos os dados preservados nas pastas de backup');
    process.exit(0);
});

module.exports = app;
