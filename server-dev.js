#!/usr/bin/env node
/**
 * 🚀 SERVIDOR MODO DESENVOLVIMENTO LOCAL
 * ====================================
 * 
 * Versão do servidor que funciona sem Railway para desenvolvimento local
 * Permite testar o frontend e identificar problemas
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use(express.urlencoded({ extended: true }));

// Logging de requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rotas de páginas
const pages = [
    'cadastro.html',
    'senha.html', 
    'recuperar-senha.html',
    'dashboard.html',
    'gestao.html'
];

pages.forEach(page => {
    app.get(`/${page.replace('.html', '')}`, (req, res) => {
        res.sendFile(path.join(__dirname, page));
    });
});

// Rota de teste de saúde
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        mode: 'DESENVOLVIMENTO',
        timestamp: new Date().toISOString(),
        database: '❌ Não conectado (modo local)',
        frontend: '✅ Funcionando',
        message: 'Servidor em modo desenvolvimento - database offline'
    });
});

// Rota mock para recuperação de senha
app.post('/api/recuperar-senha', (req, res) => {
    const { email } = req.body;
    
    console.log(`📧 Mock: Recuperação de senha solicitada para ${email}`);
    
    res.json({
        sucesso: true,
        message: 'MODO DESENVOLVIMENTO: Email de recuperação seria enviado',
        detalhes: {
            email: email,
            codigo_mock: '123456',
            modo: 'desenvolvimento',
            nota: 'Database offline - usando resposta mock'
        }
    });
});

// Rota mock para verificar código
app.post('/api/verificar-codigo', (req, res) => {
    const { email, codigo } = req.body;
    
    console.log(`🔐 Mock: Verificação de código ${codigo} para ${email}`);
    
    if (codigo === '123456') {
        res.json({
            sucesso: true,
            message: 'Código válido (mock)',
            token: 'mock_token_123'
        });
    } else {
        res.json({
            sucesso: false,
            message: 'Código inválido. Use 123456 para teste.'
        });
    }
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({
        erro: 'Erro interno do servidor',
        modo: 'desenvolvimento',
        detalhes: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        erro: 'Rota não encontrada',
        path: req.path,
        metodo: req.method
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🚀 SERVIDOR DESENVOLVIMENTO LOCAL');
    console.log('==================================');
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📋 Health: http://localhost:${PORT}/health`);
    console.log('');
    console.log('📄 PÁGINAS DISPONÍVEIS:');
    console.log(`   🏠 Home: http://localhost:${PORT}/`);
    console.log(`   📝 Cadastro: http://localhost:${PORT}/cadastro`);
    console.log(`   🔐 Login: http://localhost:${PORT}/senha`);
    console.log(`   🔑 Recuperar: http://localhost:${PORT}/recuperar-senha`);
    console.log('');
    console.log('⚠️  MODO DESENVOLVIMENTO:');
    console.log('   - Database offline (usando mocks)');
    console.log('   - Use código 123456 para testes');
    console.log('   - Pressione Ctrl+C para parar');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Parando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Servidor finalizado');
    process.exit(0);
});
