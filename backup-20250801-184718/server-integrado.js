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
    console.log('Listando pacientes...');
    res.json({
        success: true,
        data: pacientes,
        count: pacientes.length
    });
});

app.post('/api/pacientes', (req, res) => {
    console.log('Cadastrando novo paciente...');
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

app.get('/api/agendamentos', (req, res) => {
    console.log('Listando agendamentos...');
    res.json({
        success: true,
        data: agendamentos,
        count: agendamentos.length
    });
});

app.post('/api/agendamentos', (req, res) => {
    console.log('Criando novo agendamento...');
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
    console.log('Listando fichas de atendimento...');
    res.json({
        success: true,
        data: fichas,
        count: fichas.length
    });
});

app.post('/api/fichas', (req, res) => {
    console.log('Criando nova ficha de atendimento...');
    
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

// === 4. ORCAMENTOS ===
app.get('/api/orcamentos', (req, res) => {
    console.log('Listando orcamentos...');
    res.json({
        success: true,
        data: orcamentos,
        count: orcamentos.length
    });
});

app.post('/api/orcamentos', (req, res) => {
    console.log('Criando novo orcamento...');
    
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
        message: 'Orcamento criado com sucesso',
        data: novoOrcamento
    });
});

// === 5. RECEITAS (PRONTUARIO) ===
app.get('/api/receitas', (req, res) => {
    console.log('Listando receitas...');
    res.json({
        success: true,
        data: receitas,
        count: receitas.length
    });
});

app.post('/api/receitas', (req, res) => {
    console.log('Criando nova receita...');
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

// === 6. EXAMES (PRONTUARIO) ===
app.get('/api/exames', (req, res) => {
    console.log('Listando exames...');
    res.json({
        success: true,
        data: exames,
        count: exames.length
    });
});

app.post('/api/exames', (req, res) => {
    console.log('Criando nova solicitacao de exame...');
    const novoExame = {
        id: exames.length + 1,
        ...req.body,
        created_at: new Date().toISOString()
    };
    
    exames.push(novoExame);
    
    res.status(201).json({
        success: true,
        message: 'Solicitacao de exame criada com sucesso',
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
        fluxo: 'Cadastro -> Agendamento -> Ficha -> Orcamento -> Prontuario',
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
    console.error('Erro no servidor:', error);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message 
    });
});

// ==========================================
// SISTEMA DE AUTENTICACAO (SIMULADO)
// ==========================================

// Dados simulados de funcionários e códigos de verificação
let funcionarios = [
    {
        email: 'admin@drmarcio.com',
        nome: 'Admin Sistema',
        status: 'ativo',
        tipo: 'admin',
        cargo: 'Administrador',
        codigo_verificacao: '',
        senha_hash: '$2b$10$hashadmin',
        created_at: new Date().toISOString()
    }
];

let codigosVerificacao = new Map();

// Função para gerar código de verificação
function gerarCodigoVerificacao() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Função para simular envio de email
function simularEnvioEmail(email, codigo) {
    console.log(`[EMAIL] Codigo ${codigo} enviado para ${email}`);
    return true;
}

// Rotas de autenticação
app.post('/api/auth/cadastrar-funcionario', (req, res) => {
    try {
        const { email, nome, cargo } = req.body;
        
        if (!email || !nome) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Email e nome são obrigatórios' 
            });
        }
        
        // Verificar se funcionário já existe
        const funcionarioExistente = funcionarios.find(f => f.email === email);
        if (funcionarioExistente) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Funcionário já cadastrado com este email' 
            });
        }
        
        // Gerar código de verificação
        const codigo = gerarCodigoVerificacao();
        const expiracao = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
        
        // Armazenar código temporariamente
        codigosVerificacao.set(email, {
            codigo: codigo,
            expiracao: expiracao,
            tentativas: 0
        });
        
        // Criar funcionário pendente
        const novoFuncionario = {
            email: email,
            nome: nome,
            status: 'aguardando_verificacao',
            tipo: 'funcionario',
            cargo: cargo || 'Funcionário',
            codigo_verificacao: codigo,
            senha_hash: '',
            created_at: new Date().toISOString()
        };
        
        funcionarios.push(novoFuncionario);
        
        // Simular envio de email
        simularEnvioEmail(email, codigo);
        
        res.json({ 
            sucesso: true,
            message: 'Funcionário cadastrado! Código de verificação enviado por email.',
            redirectUrl: `verificar-email.html?email=${encodeURIComponent(email)}`
        });
        
    } catch (error) {
        console.error('Erro ao cadastrar funcionário:', error);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor'
        });
    }
});

app.post('/api/auth/verificar-codigo', (req, res) => {
    try {
        const { email, codigo } = req.body;
        
        if (!email || !codigo) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Email e código são obrigatórios' 
            });
        }
        
        // Verificar se existe código para este email
        const dadosCodigo = codigosVerificacao.get(email);
        if (!dadosCodigo) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Código não encontrado. Solicite um novo código.' 
            });
        }
        
        // Verificar se código expirou
        if (new Date() > dadosCodigo.expiracao) {
            codigosVerificacao.delete(email);
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Código expirado. Solicite um novo código.' 
            });
        }
        
        // Verificar tentativas
        if (dadosCodigo.tentativas >= 3) {
            codigosVerificacao.delete(email);
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Muitas tentativas. Solicite um novo código.' 
            });
        }
        
        // Verificar código
        if (dadosCodigo.codigo !== codigo) {
            dadosCodigo.tentativas++;
            return res.status(400).json({ 
                sucesso: false,
                erro: `Código incorreto. Tentativas restantes: ${3 - dadosCodigo.tentativas}` 
            });
        }
        
        // Código correto - atualizar status do funcionário
        const funcionario = funcionarios.find(f => f.email === email);
        if (funcionario) {
            funcionario.status = 'verificado';
            funcionario.codigo_verificacao = '';
        }
        
        // Remover código usado
        codigosVerificacao.delete(email);
        
        res.json({ 
            sucesso: true,
            message: 'Email verificado com sucesso! Agora crie sua senha.'
        });
        
    } catch (error) {
        console.error('Erro ao verificar código:', error);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor'
        });
    }
});

app.post('/api/auth/reenviar-codigo', (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Email é obrigatório' 
            });
        }
        
        // Verificar se funcionário existe
        const funcionario = funcionarios.find(f => f.email === email);
        if (!funcionario) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Funcionário não encontrado' 
            });
        }
        
        // Gerar novo código
        const codigo = gerarCodigoVerificacao();
        const expiracao = new Date(Date.now() + 5 * 60 * 1000);
        
        // Atualizar código
        codigosVerificacao.set(email, {
            codigo: codigo,
            expiracao: expiracao,
            tentativas: 0
        });
        
        funcionario.codigo_verificacao = codigo;
        
        // Simular envio de email
        simularEnvioEmail(email, codigo);
        
        res.json({ 
            sucesso: true,
            message: 'Novo código enviado para seu email!'
        });
        
    } catch (error) {
        console.error('Erro ao reenviar código:', error);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor'
        });
    }
});

app.post('/api/auth/criar-senha', (req, res) => {
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Email e senha são obrigatórios' 
            });
        }
        
        if (senha.length < 6) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Senha deve ter pelo menos 6 caracteres' 
            });
        }
        
        // Verificar se funcionário existe e está verificado
        const funcionario = funcionarios.find(f => f.email === email);
        if (!funcionario) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Funcionário não encontrado' 
            });
        }
        
        if (funcionario.status !== 'verificado') {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Email ainda não foi verificado' 
            });
        }
        
        // Simular hash da senha (em produção usar bcrypt)
        funcionario.senha_hash = `$2b$10$hash_${senha}`;
        funcionario.status = 'aguardando_autorizacao';
        
        res.json({ 
            sucesso: true,
            message: 'Senha criada com sucesso! Aguarde aprovação do administrador.',
            redirectUrl: 'aguardando-autorizacao.html'
        });
        
    } catch (error) {
        console.error('Erro ao criar senha:', error);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor'
        });
    }
});

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Email e senha são obrigatórios' 
            });
        }
        
        // Verificar funcionário
        const funcionario = funcionarios.find(f => f.email === email);
        if (!funcionario) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Email ou senha incorretos' 
            });
        }
        
        // Verificar status
        if (funcionario.status !== 'ativo') {
            let mensagem = 'Conta não ativa';
            if (funcionario.status === 'aguardando_verificacao') {
                mensagem = 'Email ainda não foi verificado';
            } else if (funcionario.status === 'aguardando_autorizacao') {
                mensagem = 'Conta aguardando aprovação do administrador';
            }
            return res.status(400).json({ 
                sucesso: false,
                erro: mensagem 
            });
        }
        
        // Simular verificação de senha
        const senhaCorreta = funcionario.senha_hash.includes(senha) || 
                            (email === 'admin@drmarcio.com' && senha === 'admin123');
        
        if (!senhaCorreta) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Email ou senha incorretos' 
            });
        }
        
        // Login bem-sucedido
        res.json({ 
            sucesso: true,
            message: 'Login realizado com sucesso!',
            usuario: {
                email: funcionario.email,
                nome: funcionario.nome,
                tipo: funcionario.tipo,
                cargo: funcionario.cargo
            },
            redirectUrl: funcionario.tipo === 'admin' ? 'admin.html' : 'dashboard-funcionario.html'
        });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor'
        });
    }
});

// Rota para listar funcionários pendentes (admin)
app.get('/api/auth/funcionarios-pendentes', (req, res) => {
    try {
        const pendentes = funcionarios.filter(f => f.status === 'aguardando_autorizacao');
        res.json({ 
            sucesso: true,
            funcionarios: pendentes 
        });
    } catch (error) {
        console.error('Erro ao listar funcionários pendentes:', error);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor'
        });
    }
});

// Rota para autorizar funcionário (admin)
app.post('/api/auth/autorizar-funcionario', (req, res) => {
    try {
        const { email, aprovado, motivo } = req.body;
        
        const funcionario = funcionarios.find(f => f.email === email);
        if (!funcionario) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Funcionário não encontrado' 
            });
        }
        
        if (aprovado) {
            funcionario.status = 'ativo';
        } else {
            funcionario.status = 'rejeitado';
            funcionario.motivo_rejeicao = motivo;
        }
        
        res.json({ 
            sucesso: true,
            message: aprovado ? 'Funcionário aprovado com sucesso!' : 'Funcionário rejeitado.'
        });
        
    } catch (error) {
        console.error('Erro ao autorizar funcionário:', error);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor'
        });
    }
});

// Rota para verificar status do funcionário
app.get('/api/auth/status-funcionario/:email', (req, res) => {
    try {
        const { email } = req.params;
        
        const funcionario = funcionarios.find(f => f.email === email);
        if (!funcionario) {
            return res.json({ 
                sucesso: false,
                existe: false,
                message: 'Funcionário não encontrado'
            });
        }
        
        res.json({ 
            sucesso: true,
            existe: true,
            funcionario: {
                email: funcionario.email,
                nome: funcionario.nome,
                status: funcionario.status,
                tipo: funcionario.tipo,
                cargo: funcionario.cargo
            },
            aprovado: funcionario.status === 'ativo',
            aguardandoAprovacao: funcionario.status === 'aguardando_autorizacao'
        });
        
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor'
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('SISTEMA INTEGRADO - Dr. Marcio Scartozzoni');
    console.log('========================================');
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`Caderno: http://localhost:${PORT}/caderno-digital`);
    console.log(`API Status: http://localhost:${PORT}/api/status`);
    console.log('\nFLUXO INTEGRADO:');
    console.log('1. Cadastro de Pacientes');
    console.log('2. Agendamento de Consultas');
    console.log('3. Ficha de Atendimento');
    console.log('4. Geracao de Orcamento');
    console.log('5. Prontuario (Receitas/Exames)');
    console.log('\nDADOS ATUAIS:');
    console.log(`Pacientes: ${pacientes.length}`);
    console.log(`Agendamentos: ${agendamentos.length}`);
    console.log(`Fichas: ${fichas.length}`);
    console.log(`Orcamentos: ${orcamentos.length}`);
    console.log(`Receitas: ${receitas.length}`);
    console.log(`Exames: ${exames.length}`);
    console.log('========================================\n');
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
    console.error('Erro nao capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promessa rejeitada:', reason);
});
