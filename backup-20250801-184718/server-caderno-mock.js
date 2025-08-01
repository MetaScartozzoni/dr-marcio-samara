const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware básico
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Log de requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Dados mock para desenvolvimento
let receitasData = [
    {
        id: 1,
        paciente_id: "1",
        paciente_nome: "João Silva",
        medico_nome: "Dr. Marcio Scartozzoni",
        medico_crm: "12345",
        data_emissao: "2025-08-01",
        medicamentos: "Paracetamol 500mg - Tomar 1 comprimido a cada 8 horas por 5 dias",
        observacoes: "Prescrição para dor de cabeça. Retornar se sintomas persistirem.",
        via_paciente: true,
        created_at: new Date().toISOString()
    }
];

let examesData = [
    {
        id: 1,
        paciente_id: "1",
        paciente_nome: "Maria Santos",
        medico_nome: "Dr. Marcio Scartozzoni",
        medico_crm: "12345",
        data_solicitacao: "2025-08-01",
        tipo_exame: "Laboratorial",
        exames_solicitados: "Hemograma completo, Glicemia de jejum, Colesterol total e frações",
        justificativa_clinica: "Investigação de quadro de fadiga e controle metabólico",
        cid_10: "R53 - Mal estar e fadiga",
        created_at: new Date().toISOString()
    }
];

let fichasData = [
    {
        id: 1,
        paciente_id: "1",
        paciente_nome: "Ana Costa",
        data_atendimento: "2025-08-01",
        queixa_principal: "Dor de cabeça há 3 dias",
        historia_doenca: "Paciente relata cefaleia frontal, de intensidade moderada, sem fatores desencadeantes identificados",
        exame_fisico: "Paciente consciente, orientada, sinais vitais estáveis. PA: 120/80 mmHg",
        hipotese_diagnostica: "Cefaleia tensional",
        conduta: "Prescrição de analgésico e orientações gerais",
        created_at: new Date().toISOString()
    }
];

// === ROTAS PARA RECEITAS ===
app.get('/api/receitas', (req, res) => {
    console.log('📋 Listando receitas...');
    res.json({
        success: true,
        data: receitasData,
        count: receitasData.length
    });
});

app.post('/api/receitas', (req, res) => {
    console.log('💊 Criando nova receita...');
    const novaReceita = {
        id: receitasData.length + 1,
        ...req.body,
        created_at: new Date().toISOString()
    };
    
    receitasData.push(novaReceita);
    
    res.status(201).json({
        success: true,
        message: 'Receita criada com sucesso',
        data: novaReceita
    });
});

app.get('/api/receitas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const receita = receitasData.find(r => r.id === id);
    
    if (!receita) {
        return res.status(404).json({
            success: false,
            message: 'Receita não encontrada'
        });
    }
    
    res.json({
        success: true,
        data: receita
    });
});

// === ROTAS PARA EXAMES ===
app.get('/api/exames', (req, res) => {
    console.log('🔬 Listando exames...');
    res.json({
        success: true,
        data: examesData,
        count: examesData.length
    });
});

app.post('/api/exames', (req, res) => {
    console.log('🔬 Criando nova solicitação de exame...');
    const novoExame = {
        id: examesData.length + 1,
        ...req.body,
        created_at: new Date().toISOString()
    };
    
    examesData.push(novoExame);
    
    res.status(201).json({
        success: true,
        message: 'Solicitação de exame criada com sucesso',
        data: novoExame
    });
});

app.get('/api/exames/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const exame = examesData.find(e => e.id === id);
    
    if (!exame) {
        return res.status(404).json({
            success: false,
            message: 'Exame não encontrado'
        });
    }
    
    res.json({
        success: true,
        data: exame
    });
});

// === ROTAS PARA FICHAS ===
app.get('/api/fichas', (req, res) => {
    console.log('📝 Listando fichas...');
    res.json({
        success: true,
        data: fichasData,
        count: fichasData.length
    });
});

app.post('/api/fichas', (req, res) => {
    console.log('📝 Criando nova ficha...');
    const novaFicha = {
        id: fichasData.length + 1,
        ...req.body,
        created_at: new Date().toISOString()
    };
    
    fichasData.push(novaFicha);
    
    res.status(201).json({
        success: true,
        message: 'Ficha criada com sucesso',
        data: novaFicha
    });
});

app.get('/api/fichas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const ficha = fichasData.find(f => f.id === id);
    
    if (!ficha) {
        return res.status(404).json({
            success: false,
            message: 'Ficha não encontrada'
        });
    }
    
    res.json({
        success: true,
        data: ficha
    });
});

// === ROTA DE STATUS ===
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: 'API do Caderno Digital funcionando!',
        timestamp: new Date().toISOString(),
        mode: 'Desenvolvimento com dados mock',
        endpoints: {
            receitas: `/api/receitas (${receitasData.length} registros)`,
            exames: `/api/exames (${examesData.length} registros)`,
            fichas: `/api/fichas (${fichasData.length} registros)`
        }
    });
});

// === SERVIR CADERNO DIGITAL ===
app.get('/caderno-digital', (req, res) => {
    res.sendFile(path.join(__dirname, 'caderno-digital.html'));
});

app.get('/', (req, res) => {
    res.redirect('/caderno-digital');
});

// Middleware de erro
app.use((error, req, res, next) => {
    console.error('❌ Erro no servidor:', error);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message 
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('\n🚀 ==========================================');
    console.log(`🏥 CADERNO DIGITAL - Dr. Marcio Scartozzoni`);
    console.log('🚀 ==========================================');
    console.log(`📍 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}/caderno-digital`);
    console.log(`📊 Status: http://localhost:${PORT}/api/status`);
    console.log(`💊 Receitas: ${receitasData.length} registros`);
    console.log(`🔬 Exames: ${examesData.length} registros`);
    console.log(`📝 Fichas: ${fichasData.length} registros`);
    console.log('==========================================\n');
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promessa rejeitada:', reason);
});
