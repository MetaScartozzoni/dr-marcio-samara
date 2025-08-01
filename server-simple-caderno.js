const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware básico
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Middleware de desenvolvimento - simular dados se não houver banco
const mockData = (req, res, next) => {
    req.isDevelopment = !process.env.DATABASE_URL;
    next();
};

app.use(mockData);

// Log de requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Importar apenas as rotas do caderno digital
try {
    const receitasRoutes = require('./src/routes/receitas.routes');
    const examesRoutes = require('./src/routes/exames.routes');
    const fichasRoutes = require('./src/routes/fichas.routes');

    // Registrar rotas
    app.use('/api/receitas', receitasRoutes);
    app.use('/api/exames', examesRoutes);
    app.use('/api/fichas', fichasRoutes);

    console.log('✅ Rotas do caderno digital carregadas com sucesso');
} catch (error) {
    console.error('❌ Erro ao carregar rotas:', error.message);
}

// Rotas mock para desenvolvimento
app.get('/api/receitas/mock', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                paciente_nome: "João Silva",
                medico_nome: "Dr. Marcio Scartozzoni",
                data_emissao: "2025-08-01",
                medicamentos: "Paracetamol 500mg - Tomar 1 comprimido a cada 8 horas",
                observacoes: "Receita de exemplo"
            }
        ]
    });
});

app.get('/api/exames/mock', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                paciente_nome: "Maria Santos",
                medico_nome: "Dr. Marcio Scartozzoni",
                data_solicitacao: "2025-08-01",
                tipo_exame: "Laboratorial",
                exames_solicitados: "Hemograma completo, Glicemia de jejum"
            }
        ]
    });
});

app.get('/api/fichas/mock', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                paciente_nome: "Ana Costa",
                data_atendimento: "2025-08-01",
                queixa_principal: "Dor de cabeça",
                historia_doenca: "Paciente relata dor de cabeça há 3 dias",
                exame_fisico: "Paciente consciente e orientada"
            }
        ]
    });
});

// Rota de teste
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Servidor do caderno digital funcionando!',
        timestamp: new Date().toISOString(),
        database: process.env.DATABASE_URL ? 'Conectado' : 'Mock/Desenvolvimento'
    });
});

// Rota para servir o caderno digital
app.get('/caderno-digital', (req, res) => {
    res.sendFile(path.join(__dirname, 'caderno-digital.html'));
});

// Middleware de erro
app.use((error, req, res, next) => {
    console.error('Erro no servidor:', error);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message 
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor do caderno digital rodando na porta ${PORT}`);
    console.log(`📝 Acesse: http://localhost:${PORT}/caderno-digital`);
    console.log(`🔗 API Test: http://localhost:${PORT}/api/test`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promessa rejeitada:', reason);
});
