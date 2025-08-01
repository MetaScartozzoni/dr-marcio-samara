const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware básico
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'],
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

// ==========================================
// DADOS MOCK INTEGRADOS
// ==========================================

let pacientes = [
    {
        id: 1,
        nome: "João Silva",
        cpf: "123.456.789-00",
        telefone: "(11) 99999-9999",
        email: "joao.silva@email.com",
        data_nascimento: "1985-05-15",
        endereco: "Rua das Flores, 123 - São Paulo/SP",
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        nome: "Maria Santos",
        cpf: "987.654.321-00",
        telefone: "(11) 88888-8888",
        email: "maria.santos@email.com",
        data_nascimento: "1990-03-20",
        endereco: "Av. Paulista, 456 - São Paulo/SP",
        created_at: new Date().toISOString()
    }
];

let agendamentos = [
    {
        id: 1,
        paciente_id: 1,
        paciente_nome: "João Silva",
        data_agendamento: "2025-08-05T10:00:00.000Z",
        tipo_consulta: "Consulta Inicial",
        status: "agendado",
        observacoes: "Primeira consulta - Avaliação para rinoplastia",
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        paciente_id: 2,
        paciente_nome: "Maria Santos",
        data_agendamento: "2025-08-06T14:00:00.000Z",
        tipo_consulta: "Retorno",
        status: "confirmado",
        observacoes: "Retorno pós-operatório",
        created_at: new Date().toISOString()
    }
];

let fichas = [
    {
        id: 1,
        paciente_id: 1,
        agendamento_id: 1,
        paciente_nome: "João Silva",
        data_atendimento: "2025-08-01",
        queixa_principal: "Desejo de correção estética do nariz",
        historia_doenca: "Paciente relata insatisfação com formato do nariz desde adolescência",
        exame_fisico: "Paciente em bom estado geral. Nariz com giba dorsal discreta",
        peso: "75",
        altura: "1.75",
        pressao_arterial: "120/80",
        hipotese_diagnostica: "Candidato à rinoplastia estética",
        conduta: "Solicitação de exames pré-operatórios e elaboração de orçamento",
        procedimento_indicado: "Rinoplastia estética",
        created_at: new Date().toISOString()
    }
];

let orcamentos = [
    {
        id: 1,
        paciente_id: 1,
        ficha_id: 1,
        agendamento_id: 1,
        numero_orcamento: "ORC-2025-001",
        procedimento: "Rinoplastia Estética",
        descricao_detalhada: "Correção de giba dorsal e refinamento da ponta nasal",
        valor_procedimento: 15000.00,
        valor_anestesia: 2000.00,
        valor_hospital: 3000.00,
        valor_total: 20000.00,
        forma_pagamento: "À vista com 10% desconto ou parcelado em até 12x",
        validade: "2025-09-01",
        status: "pendente",
        observacoes: "Inclui consultas pós-operatórias por 1 ano",
        created_at: new Date().toISOString()
    }
];

let receitas = [
    {
        id: 1,
        paciente_id: 1,
        ficha_id: 1,
        medico_nome: "Dr. Marcio Scartozzoni",
        medico_crm: "12345",
        data_emissao: "2025-08-01",
        medicamentos: "Nimesulida 100mg - 1 cp 12/12h por 3 dias\nDexametasona 4mg - 1 cp ao dia por 3 dias",
        observacoes: "Medicação pré-operatória conforme protocolo",
        created_at: new Date().toISOString()
    }
];

let exames = [
    {
        id: 1,
        paciente_id: 1,
        ficha_id: 1,
        medico_nome: "Dr. Marcio Scartozzoni",
        medico_crm: "12345",
        data_solicitacao: "2025-08-01",
        tipo_exame: "Pré-operatório",
        exames_solicitados: "Hemograma completo, Coagulograma, Glicemia, Ureia, Creatinina, ECG, RX Tórax",
        justificativa_clinica: "Avaliação pré-operatória para cirurgia plástica eletiva",
        cid_10: "Z01.8 - Outros exames especiais especificados",
        created_at: new Date().toISOString()
    }
];

// ==========================================
// ROTAS INTEGRADAS - FLUXO COMPLETO
// ==========================================

// === 1. CADASTRO DE PACIENTES ===
app.get('/api/pacientes', (req, res) => {
    console.log('👥 Listando pacientes...');
    res.json({
        success: true,
        data: pacientes,
        count: pacientes.length
    });
});

app.post('/api/pacientes', (req, res) => {
    console.log('👤 Cadastrando novo paciente...');
    const novoPaciente = {
        id: pacientes.length + 1,
        ...req.body,
        created_at: new Date().toISOString()
    };
    
    pacientes.push(novoPaciente);
    
    res.status(201).json({
        success: true,
        message: 'Paciente cadastrado com sucesso',
        data: novoPaciente
    });
});

app.get('/api/pacientes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const paciente = pacientes.find(p => p.id === id);
    
    if (!paciente) {
        return res.status(404).json({
            success: false,
            message: 'Paciente não encontrado'
        });
    }
    
    // Buscar dados relacionados
    const agendamentosPaciente = agendamentos.filter(a => a.paciente_id === id);
    const fichasPaciente = fichas.filter(f => f.paciente_id === id);
    const orcamentosPaciente = orcamentos.filter(o => o.paciente_id === id);
    
    res.json({
        success: true,
        data: {
            ...paciente,
            agendamentos: agendamentosPaciente,
            fichas: fichasPaciente,
            orcamentos: orcamentosPaciente
        }
    });
});

// === 2. AGENDAMENTOS ===
app.get('/api/agendamentos', (req, res) => {
    console.log('📅 Listando agendamentos...');
    res.json({
        success: true,
        data: agendamentos,
        count: agendamentos.length
    });
});

app.post('/api/agendamentos', (req, res) => {
    console.log('📅 Criando novo agendamento...');
    const novoAgendamento = {
        id: agendamentos.length + 1,
        ...req.body,
        status: 'agendado',
        created_at: new Date().toISOString()
    };
    
    agendamentos.push(novoAgendamento);
    
    res.status(201).json({
        success: true,
        message: 'Agendamento criado com sucesso',
        data: novoAgendamento
    });
});

// === 3. FICHAS DE ATENDIMENTO ===
app.get('/api/fichas', (req, res) => {
    console.log('📝 Listando fichas de atendimento...');
    res.json({
        success: true,
        data: fichas,
        count: fichas.length
    });
});

app.post('/api/fichas', (req, res) => {
    console.log('📝 Criando nova ficha de atendimento...');
    
    // Vincular com agendamento se fornecido
    let agendamento_relacionado = null;
    if (req.body.agendamento_id) {
        const agendamento = agendamentos.find(a => a.id === parseInt(req.body.agendamento_id));
        if (agendamento) {
            agendamento.status = 'atendido';
            agendamento_relacionado = agendamento;
        }
    }
    
    const novaFicha = {
        id: fichas.length + 1,
        ...req.body,
        created_at: new Date().toISOString()
    };
    
    fichas.push(novaFicha);
    
    res.status(201).json({
        success: true,
        message: 'Ficha de atendimento criada com sucesso',
        data: novaFicha,
        agendamento_atualizado: agendamento_relacionado
    });
});

// === 4. ORÇAMENTOS ===
app.get('/api/orcamentos', (req, res) => {
    console.log('💰 Listando orçamentos...');
    res.json({
        success: true,
        data: orcamentos,
        count: orcamentos.length
    });
});

app.post('/api/orcamentos', (req, res) => {
    console.log('💰 Criando novo orçamento...');
    
    const proximoNumero = `ORC-2025-${String(orcamentos.length + 1).padStart(3, '0')}`;
    
    const novoOrcamento = {
        id: orcamentos.length + 1,
        numero_orcamento: proximoNumero,
        ...req.body,
        status: 'pendente',
        created_at: new Date().toISOString()
    };
    
    orcamentos.push(novoOrcamento);
    
    res.status(201).json({
        success: true,
        message: 'Orçamento criado com sucesso',
        data: novoOrcamento
    });
});

// === 5. RECEITAS (PRONTUÁRIO) ===
app.get('/api/receitas', (req, res) => {
    console.log('💊 Listando receitas...');
    res.json({
        success: true,
        data: receitas,
        count: receitas.length
    });
});

app.post('/api/receitas', (req, res) => {
    console.log('💊 Criando nova receita...');
    const novaReceita = {
        id: receitas.length + 1,
        ...req.body,
        created_at: new Date().toISOString()
    };
    
    receitas.push(novaReceita);
    
    res.status(201).json({
        success: true,
        message: 'Receita criada com sucesso',
        data: novaReceita
    });
});

// === 6. EXAMES (PRONTUÁRIO) ===
app.get('/api/exames', (req, res) => {
    console.log('🔬 Listando exames...');
    res.json({
        success: true,
        data: exames,
        count: exames.length
    });
});

app.post('/api/exames', (req, res) => {
    console.log('🔬 Criando nova solicitação de exame...');
    const novoExame = {
        id: exames.length + 1,
        ...req.body,
        created_at: new Date().toISOString()
    };
    
    exames.push(novoExame);
    
    res.status(201).json({
        success: true,
        message: 'Solicitação de exame criada com sucesso',
        data: novoExame
    });
});

// ==========================================
// ROTAS DE INTEGRAÇÃO E FLUXO
// ==========================================

// Fluxo completo por paciente
app.get('/api/fluxo/:paciente_id', (req, res) => {
    const paciente_id = parseInt(req.params.paciente_id);
    
    const paciente = pacientes.find(p => p.id === paciente_id);
    if (!paciente) {
        return res.status(404).json({
            success: false,
            message: 'Paciente não encontrado'
        });
    }
    
    const fluxoCompleto = {
        paciente: paciente,
        agendamentos: agendamentos.filter(a => a.paciente_id === paciente_id),
        fichas: fichas.filter(f => f.paciente_id === paciente_id),
        orcamentos: orcamentos.filter(o => o.paciente_id === paciente_id),
        receitas: receitas.filter(r => r.paciente_id === paciente_id),
        exames: exames.filter(e => e.paciente_id === paciente_id)
    };
    
    res.json({
        success: true,
        data: fluxoCompleto
    });
});

// Dashboard com estatísticas
app.get('/api/dashboard', (req, res) => {
    const stats = {
        pacientes: {
            total: pacientes.length,
            novos_mes: pacientes.filter(p => 
                new Date(p.created_at).getMonth() === new Date().getMonth()
            ).length
        },
        agendamentos: {
            total: agendamentos.length,
            pendentes: agendamentos.filter(a => a.status === 'agendado').length,
            hoje: agendamentos.filter(a => 
                new Date(a.data_agendamento).toDateString() === new Date().toDateString()
            ).length
        },
        atendimentos: {
            total: fichas.length,
            mes_atual: fichas.filter(f => 
                new Date(f.created_at).getMonth() === new Date().getMonth()
            ).length
        },
        orcamentos: {
            total: orcamentos.length,
            pendentes: orcamentos.filter(o => o.status === 'pendente').length,
            valor_total_pendente: orcamentos
                .filter(o => o.status === 'pendente')
                .reduce((sum, o) => sum + o.valor_total, 0)
        }
    };
    
    res.json({
        success: true,
        data: stats
    });
});

// Status da API
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: 'Sistema Integrado Dr. Marcio Scartozzoni',
        timestamp: new Date().toISOString(),
        mode: 'Desenvolvimento com dados mock integrados',
        fluxo: 'Cadastro → Agendamento → Ficha → Orçamento → Prontuário',
        estatisticas: {
            pacientes: pacientes.length,
            agendamentos: agendamentos.length,
            fichas: fichas.length,
            orcamentos: orcamentos.length,
            receitas: receitas.length,
            exames: exames.length
        }
    });
});

// Servir páginas
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/caderno-digital', (req, res) => {
    res.sendFile(path.join(__dirname, 'caderno-digital.html'));
});

app.get('/', (req, res) => {
    res.json({
        message: 'Sistema Integrado Dr. Marcio Scartozzoni',
        endpoints: {
            dashboard: '/dashboard',
            caderno: '/caderno-digital',
            api_status: '/api/status',
            api_dashboard: '/api/dashboard'
        }
    });
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
    console.log(`🏥 SISTEMA INTEGRADO - Dr. Marcio Scartozzoni`);
    console.log('🚀 ==========================================');
    console.log(`📍 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`📝 Caderno: http://localhost:${PORT}/caderno-digital`);
    console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
    console.log('\n📋 FLUXO INTEGRADO:');
    console.log('1️⃣  Cadastro de Pacientes');
    console.log('2️⃣  Agendamento de Consultas');
    console.log('3️⃣  Ficha de Atendimento');
    console.log('4️⃣  Geração de Orçamento');
    console.log('5️⃣  Prontuário (Receitas/Exames)');
    console.log('\n📈 DADOS ATUAIS:');
    console.log(`👥 Pacientes: ${pacientes.length}`);
    console.log(`📅 Agendamentos: ${agendamentos.length}`);
    console.log(`📝 Fichas: ${fichas.length}`);
    console.log(`💰 Orçamentos: ${orcamentos.length}`);
    console.log(`💊 Receitas: ${receitas.length}`);
    console.log(`🔬 Exames: ${exames.length}`);
    console.log('==========================================\n');
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promessa rejeitada:', reason);
});
