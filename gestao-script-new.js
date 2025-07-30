let dadosOriginais = [];
let dadosFiltrados = [];
let orcamentoAtual = null;

// Verificação de autorização no carregamento
function checkAuth() {
    const userInfo = localStorage.getItem('userInfo');
    
    if (!userInfo) {
        console.log('❌ Nenhuma sessão encontrada - redirecionando para login');
        window.location.href = '/login.html';
        return false;
    }
    
    const user = JSON.parse(userInfo);
    console.log('👤 Usuário logado:', user.nome, '| Tipo:', user.tipo, '| Autorizado:', user.autorizado);
    
    // Verificar se funcionário está autorizado
    if (user.tipo === 'funcionario' && !user.autorizado) {
        console.log('⛔ Funcionário não autorizado - redirecionando para login');
        alert('⚠️ Seu acesso ainda não foi autorizado pelo administrador.\n\nVocê será redirecionado para a tela de login.');
        localStorage.removeItem('userInfo');
        window.location.href = '/login.html';
        return false;
    }
    
    return true;
}

// Função para voltar ao dashboard
function voltarDashboard() {
    const userInfo = localStorage.getItem('userInfo');
    
    if (userInfo) {
        window.location.href = '/dashboard.html';
    } else {
        window.location.href = '/login.html';
    }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    carregarDados();
    configurarEventos();
    carregarPacientes();
    definirDataPadrao();
});

function configurarEventos() {
    // Form de novo orçamento
    document.getElementById('formNovoOrcamento').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarNovoOrcamento();
    });
    
    // Filtros em tempo real
    document.getElementById('filtroNome').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroId').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroStatus').addEventListener('change', aplicarFiltros);
}

function definirDataPadrao() {
    // Definir data de hoje para consulta
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataConsulta').value = hoje;
    
    // Definir validade para 30 dias
    const validade = new Date();
    validade.setDate(validade.getDate() + 30);
    document.getElementById('validadeOrcamento').value = validade.toISOString().split('T')[0];
}

async function carregarDados() {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    
    try {
        const response = await fetch('/api/orcamentos/dados');
        const dados = await response.json();
        
        dadosOriginais = dados;
        dadosFiltrados = [...dados];
        
        atualizarTabela();
        atualizarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        
        // Dados de demonstração para teste local
        dadosOriginais = [
            {
                id: 'ORC001',
                paciente_nome: 'Maria Silva',
                data_consulta: '2025-07-25',
                data_orcamento: '2025-07-25',
                procedimento_principal: 'Rinoplastia',
                procedimentos_adicionais: 'Septoplastia funcional',
                valor_total: 8500.00,
                valor_anestesia: 800.00,
                valor_hospital: 1200.00,
                valor_material: 500.00,
                status_orcamento: 'Enviado',
                forma_pagamento: '3x',
                validade: '2025-08-25',
                pagamento_status: 'Pendente',
                observacoes: 'Paciente tem interesse em realizar em dezembro'
            },
            {
                id: 'ORC002',
                paciente_nome: 'Ana Costa',
                data_consulta: '2025-07-28',
                data_orcamento: '2025-07-28',
                procedimento_principal: 'Mamoplastia de Aumento',
                procedimentos_adicionais: '',
                valor_total: 12000.00,
                valor_anestesia: 1000.00,
                valor_hospital: 1500.00,
                valor_material: 2000.00,
                status_orcamento: 'Aceito',
                forma_pagamento: '6x',
                validade: '2025-08-28',
                pagamento_status: 'Entrada Paga',
                observacoes: 'Próteses de silicone 350ml cada'
            },
            {
                id: 'ORC003',
                paciente_nome: 'Julia Santos',
                data_consulta: '2025-07-29',
                data_orcamento: '2025-07-29',
                procedimento_principal: 'Lipoaspiração',
                procedimentos_adicionais: 'Abdômen, flancos e costas',
                valor_total: 7500.00,
                valor_anestesia: 700.00,
                valor_hospital: 1000.00,
                valor_material: 300.00,
                status_orcamento: 'Pendente',
                forma_pagamento: 'vista',
                validade: '2025-08-29',
                pagamento_status: 'Pendente',
                observacoes: 'Aguardando confirmação da paciente'
            }
        ];
        dadosFiltrados = [...dadosOriginais];
        
        atualizarTabela();
        atualizarEstatisticas();
        
        alert('Usando dados de demonstração (API indisponível)');
    } finally {
        loading.style.display = 'none';
    }
}

// Carregar lista de pacientes para o select
async function carregarPacientes() {
    const select = document.getElementById('pacienteOrcamento');
    
    // Pacientes de exemplo
    const pacientes = [
        { id: 'PAC001', nome: 'Maria Silva' },
        { id: 'PAC002', nome: 'Ana Costa' },
        { id: 'PAC003', nome: 'Julia Santos' },
        { id: 'PAC004', nome: 'Fernanda Lima' },
        { id: 'PAC005', nome: 'Carla Mendes' }
    ];
    
    select.innerHTML = '<option value="">Selecione o paciente</option>';
    pacientes.forEach(paciente => {
        select.innerHTML += '<option value="' + paciente.id + '">' + paciente.nome + '</option>';
    });
}

// Calcular valor total do orçamento
function calcularValorTotal() {
    const procedimento = parseFloat(document.getElementById('valorProcedimento').value) || 0;
    const anestesia = parseFloat(document.getElementById('valorAnestesia').value) || 0;
    const hospital = parseFloat(document.getElementById('valorHospital').value) || 0;
    const material = parseFloat(document.getElementById('valorMaterial').value) || 0;
    
    const total = procedimento + anestesia + hospital + material;
    document.getElementById('valorTotal').value = total.toFixed(2);
    
    // Auto-preencher valor do procedimento baseado na seleção
    const selectProcedimento = document.getElementById('procedimentoPrincipal');
    if (selectProcedimento.value) {
        const valorBase = selectProcedimento.selectedOptions[0].getAttribute('data-valor');
        if (valorBase && !document.getElementById('valorProcedimento').value) {
            document.getElementById('valorProcedimento').value = valorBase;
            calcularValorTotal();
        }
    }
}

function atualizarTabela() {
    const tbody = document.getElementById('corpoTabela');
    tbody.innerHTML = '';
    
    dadosFiltrados.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = 
            '<td>' + item.id + '</td>' +
            '<td>' + item.paciente_nome + '</td>' +
            '<td>' + formatarData(item.data_consulta) + '</td>' +
            '<td>' + formatarData(item.data_orcamento) + '</td>' +
            '<td>' + item.procedimento_principal + '</td>' +
            '<td>R$ ' + item.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '</td>' +
            '<td><span class="status-badge status-' + item.status_orcamento.toLowerCase().replace(' ', '-') + '">' + item.status_orcamento + '</span></td>' +
            '<td><span class="status-badge status-' + item.pagamento_status.toLowerCase().replace(' ', '-') + '">' + item.pagamento_status + '</span></td>' +
            '<td>' + formatarData(item.validade) + '</td>' +
            '<td>' +
                '<button onclick="abrirAcoesOrcamento(\'' + item.id + '\')" class="btn-actions" title="Ações">' +
                    '<i class="fas fa-cog"></i>' +
                '</button>' +
                '<button onclick="visualizarOrcamento(\'' + item.id + '\')" class="btn-view" title="Visualizar">' +
                    '<i class="fas fa-eye"></i>' +
                '</button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function atualizarEstatisticas() {
    // Total de orçamentos
    document.getElementById('totalOrcamentos').textContent = dadosOriginais.length;
    
    // Orçamentos pendentes
    const pendentes = dadosOriginais.filter(item => item.status_orcamento === 'Pendente').length;
    document.getElementById('orcamentosPendentes').textContent = pendentes;
    
    // Orçamentos aceitos
    const aceitos = dadosOriginais.filter(item => item.status_orcamento === 'Aceito').length;
    document.getElementById('orcamentosAceitos').textContent = aceitos;
    
    // Valor total pendente
    const valorPendente = dadosOriginais
        .filter(item => item.status_orcamento === 'Pendente' || item.status_orcamento === 'Enviado')
        .reduce((total, item) => total + item.valor_total, 0);
    document.getElementById('valorTotalPendente').textContent = 
        'R$ ' + valorPendente.toLocaleString('pt-BR', {minimumFractionDigits: 2});
}

// Funções de modais
function adicionarOrcamento() {
    document.getElementById('modalNovoOrcamento').style.display = 'flex';
}

function fecharModalOrcamento() {
    document.getElementById('modalNovoOrcamento').style.display = 'none';
    document.getElementById('formNovoOrcamento').reset();
    definirDataPadrao();
}

function salvarNovoOrcamento() {
    const novoOrcamento = {
        id: 'ORC' + String(dadosOriginais.length + 1).padStart(3, '0'),
        paciente_nome: document.getElementById('pacienteOrcamento').selectedOptions[0].text,
        data_consulta: document.getElementById('dataConsulta').value,
        data_orcamento: new Date().toISOString().split('T')[0],
        procedimento_principal: document.getElementById('procedimentoPrincipal').selectedOptions[0].text,
        procedimentos_adicionais: document.getElementById('procedimentosAdicionais').value,
        valor_total: parseFloat(document.getElementById('valorTotal').value),
        valor_anestesia: parseFloat(document.getElementById('valorAnestesia').value) || 0,
        valor_hospital: parseFloat(document.getElementById('valorHospital').value) || 0,
        valor_material: parseFloat(document.getElementById('valorMaterial').value) || 0,
        status_orcamento: 'Pendente',
        forma_pagamento: document.getElementById('formaPagamento').value,
        validade: document.getElementById('validadeOrcamento').value,
        pagamento_status: 'Pendente',
        observacoes: document.getElementById('observacoesOrcamento').value
    };
    
    dadosOriginais.push(novoOrcamento);
    dadosFiltrados = [...dadosOriginais];
    
    atualizarTabela();
    atualizarEstatisticas();
    fecharModalOrcamento();
    
    alert('✅ Orçamento criado com sucesso!');
}

function abrirAcoesOrcamento(id) {
    orcamentoAtual = dadosOriginais.find(item => item.id === id);
    if (!orcamentoAtual) return;
    
    // Preencher informações do modal
    document.getElementById('infoOrcamento').textContent = orcamentoAtual.id + ' - ' + orcamentoAtual.paciente_nome;
    document.getElementById('infoProcedimento').textContent = orcamentoAtual.procedimento_principal;
    document.getElementById('infoValor').textContent = 'R$ ' + orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    document.getElementById('infoStatus').textContent = orcamentoAtual.status_orcamento;
    document.getElementById('infoValidade').textContent = formatarData(orcamentoAtual.validade);
    
    document.getElementById('modalAcoesOrcamento').style.display = 'flex';
}

function fecharModalAcoes() {
    document.getElementById('modalAcoesOrcamento').style.display = 'none';
    orcamentoAtual = null;
}

// Funcionalidades de ações do orçamento
function gerarPDFOrcamento() {
    if (!orcamentoAtual) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.text('ORÇAMENTO - DR. MARCIO SCARTOZZONI', 20, 30);
    doc.setFontSize(12);
    doc.text('Cirurgia Plástica', 20, 40);
    
    // Dados do orçamento
    doc.setFontSize(14);
    doc.text('Orçamento: ' + orcamentoAtual.id, 20, 60);
    doc.text('Paciente: ' + orcamentoAtual.paciente_nome, 20, 70);
    doc.text('Data: ' + formatarData(orcamentoAtual.data_orcamento), 20, 80);
    
    // Procedimentos
    doc.text('PROCEDIMENTOS:', 20, 100);
    doc.setFontSize(12);
    doc.text('• ' + orcamentoAtual.procedimento_principal, 25, 110);
    if (orcamentoAtual.procedimentos_adicionais) {
        doc.text('• ' + orcamentoAtual.procedimentos_adicionais, 25, 120);
    }
    
    // Valores
    doc.setFontSize(14);
    doc.text('VALORES:', 20, 140);
    doc.setFontSize(12);
    doc.text('Procedimento: R$ ' + orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2}), 25, 150);
    doc.text('Anestesia: R$ ' + orcamentoAtual.valor_anestesia.toLocaleString('pt-BR', {minimumFractionDigits: 2}), 25, 160);
    doc.text('Hospital: R$ ' + orcamentoAtual.valor_hospital.toLocaleString('pt-BR', {minimumFractionDigits: 2}), 25, 170);
    doc.text('Material: R$ ' + orcamentoAtual.valor_material.toLocaleString('pt-BR', {minimumFractionDigits: 2}), 25, 180);
    
    doc.setFontSize(16);
    doc.text('TOTAL: R$ ' + orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2}), 25, 200);
    
    // Forma de pagamento
    doc.setFontSize(12);
    doc.text('Forma de Pagamento: ' + orcamentoAtual.forma_pagamento, 20, 220);
    doc.text('Validade: ' + formatarData(orcamentoAtual.validade), 20, 230);
    
    if (orcamentoAtual.observacoes) {
        doc.text('Observações:', 20, 250);
        doc.text(orcamentoAtual.observacoes, 20, 260);
    }
    
    doc.save('Orcamento_' + orcamentoAtual.id + '_' + orcamentoAtual.paciente_nome + '.pdf');
    alert('✅ PDF gerado com sucesso!');
}

function imprimirOrcamento() {
    if (!orcamentoAtual) return;
    
    const conteudo = 
        '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">' +
            '<div style="text-align: center; margin-bottom: 30px;">' +
                '<h1>DR. MARCIO SCARTOZZONI</h1>' +
                '<h3>Cirurgia Plástica</h3>' +
                '<hr>' +
            '</div>' +
            
            '<div style="margin-bottom: 20px;">' +
                '<h2>ORÇAMENTO ' + orcamentoAtual.id + '</h2>' +
                '<p><strong>Paciente:</strong> ' + orcamentoAtual.paciente_nome + '</p>' +
                '<p><strong>Data:</strong> ' + formatarData(orcamentoAtual.data_orcamento) + '</p>' +
            '</div>' +
            
            '<div style="margin-bottom: 20px;">' +
                '<h3>PROCEDIMENTOS:</h3>' +
                '<ul>' +
                    '<li>' + orcamentoAtual.procedimento_principal + '</li>' +
                    (orcamentoAtual.procedimentos_adicionais ? '<li>' + orcamentoAtual.procedimentos_adicionais + '</li>' : '') +
                '</ul>' +
            '</div>' +
            
            '<div style="margin-bottom: 20px;">' +
                '<h3>VALORES:</h3>' +
                '<table style="width: 100%; border-collapse: collapse;">' +
                    '<tr><td style="padding: 5px; border-bottom: 1px solid #ddd;">Procedimento:</td><td style="padding: 5px; border-bottom: 1px solid #ddd;">R$ ' + orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '</td></tr>' +
                    '<tr><td style="padding: 5px; border-bottom: 1px solid #ddd;">Anestesia:</td><td style="padding: 5px; border-bottom: 1px solid #ddd;">R$ ' + orcamentoAtual.valor_anestesia.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '</td></tr>' +
                    '<tr><td style="padding: 5px; border-bottom: 1px solid #ddd;">Hospital:</td><td style="padding: 5px; border-bottom: 1px solid #ddd;">R$ ' + orcamentoAtual.valor_hospital.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '</td></tr>' +
                    '<tr><td style="padding: 5px; border-bottom: 1px solid #ddd;">Material:</td><td style="padding: 5px; border-bottom: 1px solid #ddd;">R$ ' + orcamentoAtual.valor_material.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '</td></tr>' +
                    '<tr style="font-weight: bold; font-size: 18px;"><td style="padding: 10px;">TOTAL:</td><td style="padding: 10px;">R$ ' + orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '</td></tr>' +
                '</table>' +
            '</div>' +
            
            '<div>' +
                '<p><strong>Forma de Pagamento:</strong> ' + orcamentoAtual.forma_pagamento + '</p>' +
                '<p><strong>Validade:</strong> ' + formatarData(orcamentoAtual.validade) + '</p>' +
                (orcamentoAtual.observacoes ? '<p><strong>Observações:</strong> ' + orcamentoAtual.observacoes + '</p>' : '') +
            '</div>' +
        '</div>';
    
    const novaJanela = window.open('', '_blank');
    novaJanela.document.write(conteudo);
    novaJanela.document.close();
    novaJanela.print();
}

function copiarOrcamento() {
    if (!orcamentoAtual) return;
    
    const texto = 'ORÇAMENTO ' + orcamentoAtual.id + '\n\n' +
        'Paciente: ' + orcamentoAtual.paciente_nome + '\n' +
        'Data: ' + formatarData(orcamentoAtual.data_orcamento) + '\n\n' +
        'PROCEDIMENTOS:\n' +
        '• ' + orcamentoAtual.procedimento_principal + '\n' +
        (orcamentoAtual.procedimentos_adicionais ? '• ' + orcamentoAtual.procedimentos_adicionais + '\n' : '') + '\n' +
        'VALORES:\n' +
        'Procedimento: R$ ' + orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '\n' +
        'Anestesia: R$ ' + orcamentoAtual.valor_anestesia.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '\n' +
        'Hospital: R$ ' + orcamentoAtual.valor_hospital.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '\n' +
        'Material: R$ ' + orcamentoAtual.valor_material.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '\n\n' +
        'TOTAL: R$ ' + orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '\n\n' +
        'Forma de Pagamento: ' + orcamentoAtual.forma_pagamento + '\n' +
        'Validade: ' + formatarData(orcamentoAtual.validade) + '\n\n' +
        (orcamentoAtual.observacoes ? 'Observações: ' + orcamentoAtual.observacoes : '');
    
    navigator.clipboard.writeText(texto).then(() => {
        alert('✅ Orçamento copiado para a área de transferência!');
    });
}

function enviarPorEmail() {
    if (!orcamentoAtual) return;
    
    const assunto = 'Orçamento ' + orcamentoAtual.id + ' - ' + orcamentoAtual.paciente_nome;
    const corpo = 'Prezado(a) ' + orcamentoAtual.paciente_nome + ',\n\n' +
        'Segue orçamento conforme solicitado:\n\n' +
        'PROCEDIMENTO: ' + orcamentoAtual.procedimento_principal + '\n' +
        (orcamentoAtual.procedimentos_adicionais ? 'ADICIONAL: ' + orcamentoAtual.procedimentos_adicionais + '\n' : '') + '\n' +
        'VALOR TOTAL: R$ ' + orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '\n' +
        'FORMA DE PAGAMENTO: ' + orcamentoAtual.forma_pagamento + '\n' +
        'VALIDADE: ' + formatarData(orcamentoAtual.validade) + '\n\n' +
        (orcamentoAtual.observacoes ? 'OBSERVAÇÕES: ' + orcamentoAtual.observacoes + '\n\n' : '') +
        'Qualquer dúvida, estamos à disposição.\n\n' +
        'Atenciosamente,\n' +
        'Dr. Marcio Scartozzoni\n' +
        'Cirurgia Plástica';
    
    const mailtoLink = 'mailto:?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo);
    window.open(mailtoLink);
}

function marcarComoAceito() {
    if (!orcamentoAtual) return;
    
    if (confirm('Marcar orçamento como aceito?')) {
        orcamentoAtual.status_orcamento = 'Aceito';
        orcamentoAtual.pagamento_status = 'Aguardando Entrada';
        
        atualizarTabela();
        atualizarEstatisticas();
        fecharModalAcoes();
        
        alert('✅ Orçamento marcado como aceito!');
    }
}

function editarOrcamento() {
    alert('🚧 Funcionalidade de edição em desenvolvimento');
}

function exportarOrcamentos() {
    alert('🚧 Funcionalidade de exportação em desenvolvimento');
}

function visualizarOrcamento(id) {
    abrirAcoesOrcamento(id);
}

// Funções auxiliares
function formatarData(data) {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
}

function aplicarFiltros() {
    const filtroId = document.getElementById('filtroId').value.toLowerCase();
    const filtroNome = document.getElementById('filtroNome').value.toLowerCase();
    const filtroStatus = document.getElementById('filtroStatus').value;
    
    dadosFiltrados = dadosOriginais.filter(item => {
        const matchId = !filtroId || item.id.toLowerCase().includes(filtroId);
        const matchNome = !filtroNome || item.paciente_nome.toLowerCase().includes(filtroNome);
        const matchStatus = !filtroStatus || item.status_orcamento === filtroStatus;
        
        return matchId && matchNome && matchStatus;
    });
    
    atualizarTabela();
}

function limparFiltros() {
    document.getElementById('filtroId').value = '';
    document.getElementById('filtroNome').value = '';
    document.getElementById('filtroStatus').value = '';
    
    dadosFiltrados = [...dadosOriginais];
    atualizarTabela();
}

function atualizarDados() {
    carregarDados();
}

function abrirAgendamentoRapido() {
    alert('🚧 Modal de agendamento rápido em desenvolvimento');
}
