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
    // Verificar se existe informação do usuário
    const userInfo = localStorage.getItem('userInfo');
    
    if (userInfo) {
        const user = JSON.parse(userInfo);
        
        // Redirecionar baseado no tipo de usuário
        if (user.tipo === 'admin') {
            window.location.href = '/dashboard.html';
        } else {
            window.location.href = '/dashboard.html';
        }
    } else {
        // Se não há info do usuário, voltar para login
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
        select.innerHTML += `<option value="${paciente.id}">${paciente.nome}</option>`;
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
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.paciente_nome}</td>
            <td>${formatarData(item.data_consulta)}</td>
            <td>${formatarData(item.data_orcamento)}</td>
            <td>${item.procedimento_principal}</td>
            <td>R$ ${item.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td><span class="status-badge status-${item.status_orcamento.toLowerCase().replace(' ', '-')}">${item.status_orcamento}</span></td>
            <td><span class="status-badge status-${item.pagamento_status.toLowerCase().replace(' ', '-')}">${item.pagamento_status}</span></td>
            <td>${formatarData(item.validade)}</td>
            <td>
                <button onclick="abrirAcoesOrcamento('${item.id}')" class="btn-actions" title="Ações">
                    <i class="fas fa-cog"></i>
                </button>
                <button onclick="visualizarOrcamento('${item.id}')" class="btn-view" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
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
    const formData = new FormData(document.getElementById('formNovoOrcamento'));
    
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
    document.getElementById('infoOrcamento').textContent = `${orcamentoAtual.id} - ${orcamentoAtual.paciente_nome}`;
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
    doc.text(`Orçamento: ${orcamentoAtual.id}`, 20, 60);
    doc.text(`Paciente: ${orcamentoAtual.paciente_nome}`, 20, 70);
    doc.text(`Data: ${formatarData(orcamentoAtual.data_orcamento)}`, 20, 80);
    
    // Procedimentos
    doc.text('PROCEDIMENTOS:', 20, 100);
    doc.setFontSize(12);
    doc.text(`• ${orcamentoAtual.procedimento_principal}`, 25, 110);
    if (orcamentoAtual.procedimentos_adicionais) {
        doc.text(`• ${orcamentoAtual.procedimentos_adicionais}`, 25, 120);
    }
    
    // Valores
    doc.setFontSize(14);
    doc.text('VALORES:', 20, 140);
    doc.setFontSize(12);
    doc.text(`Procedimento: R$ ${orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 25, 150);
    doc.text(`Anestesia: R$ ${orcamentoAtual.valor_anestesia.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 25, 160);
    doc.text(`Hospital: R$ ${orcamentoAtual.valor_hospital.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 25, 170);
    doc.text(`Material: R$ ${orcamentoAtual.valor_material.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 25, 180);
    
    doc.setFontSize(16);
    doc.text(`TOTAL: R$ ${orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 25, 200);
    
    // Forma de pagamento
    doc.setFontSize(12);
    doc.text(`Forma de Pagamento: ${orcamentoAtual.forma_pagamento}`, 20, 220);
    doc.text(`Validade: ${formatarData(orcamentoAtual.validade)}`, 20, 230);
    
    if (orcamentoAtual.observacoes) {
        doc.text('Observações:', 20, 250);
        doc.text(orcamentoAtual.observacoes, 20, 260);
    }
    
    doc.save(`Orcamento_${orcamentoAtual.id}_${orcamentoAtual.paciente_nome}.pdf`);
    alert('✅ PDF gerado com sucesso!');
}

function imprimirOrcamento() {
    if (!orcamentoAtual) return;
    
    const conteudo = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1>DR. MARCIO SCARTOZZONI</h1>
                <h3>Cirurgia Plástica</h3>
                <hr>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h2>ORÇAMENTO ${orcamentoAtual.id}</h2>
                <p><strong>Paciente:</strong> ${orcamentoAtual.paciente_nome}</p>
                <p><strong>Data:</strong> ${formatarData(orcamentoAtual.data_orcamento)}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>PROCEDIMENTOS:</h3>
                <ul>
                    <li>${orcamentoAtual.procedimento_principal}</li>
                    ${orcamentoAtual.procedimentos_adicionais ? `<li>${orcamentoAtual.procedimentos_adicionais}</li>` : ''}
                </ul>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>VALORES:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 5px; border-bottom: 1px solid #ddd;">Procedimento:</td><td style="padding: 5px; border-bottom: 1px solid #ddd;">R$ ${orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td style="padding: 5px; border-bottom: 1px solid #ddd;">Anestesia:</td><td style="padding: 5px; border-bottom: 1px solid #ddd;">R$ ${orcamentoAtual.valor_anestesia.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td style="padding: 5px; border-bottom: 1px solid #ddd;">Hospital:</td><td style="padding: 5px; border-bottom: 1px solid #ddd;">R$ ${orcamentoAtual.valor_hospital.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td style="padding: 5px; border-bottom: 1px solid #ddd;">Material:</td><td style="padding: 5px; border-bottom: 1px solid #ddd;">R$ ${orcamentoAtual.valor_material.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td></tr>
                    <tr style="font-weight: bold; font-size: 18px;"><td style="padding: 10px;">TOTAL:</td><td style="padding: 10px;">R$ ${orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td></tr>
                </table>
            </div>
            
            <div>
                <p><strong>Forma de Pagamento:</strong> ${orcamentoAtual.forma_pagamento}</p>
                <p><strong>Validade:</strong> ${formatarData(orcamentoAtual.validade)}</p>
                ${orcamentoAtual.observacoes ? `<p><strong>Observações:</strong> ${orcamentoAtual.observacoes}</p>` : ''}
            </div>
        </div>
    `;
    
    const novaJanela = window.open('', '_blank');
    novaJanela.document.write(conteudo);
    novaJanela.document.close();
    novaJanela.print();
}

function copiarOrcamento() {
    if (!orcamentoAtual) return;
    
    const texto = `ORÇAMENTO ${orcamentoAtual.id}
    
Paciente: ${orcamentoAtual.paciente_nome}
Data: ${formatarData(orcamentoAtual.data_orcamento)}

PROCEDIMENTOS:
• ${orcamentoAtual.procedimento_principal}
${orcamentoAtual.procedimentos_adicionais ? `• ${orcamentoAtual.procedimentos_adicionais}` : ''}

VALORES:
Procedimento: R$ ${orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
Anestesia: R$ ${orcamentoAtual.valor_anestesia.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
Hospital: R$ ${orcamentoAtual.valor_hospital.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
Material: R$ ${orcamentoAtual.valor_material.toLocaleString('pt-BR', {minimumFractionDigits: 2})}

TOTAL: R$ ${orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}

Forma de Pagamento: ${orcamentoAtual.forma_pagamento}
Validade: ${formatarData(orcamentoAtual.validade)}

${orcamentoAtual.observacoes ? `Observações: ${orcamentoAtual.observacoes}` : ''}`;
    
    navigator.clipboard.writeText(texto).then(() => {
        alert('✅ Orçamento copiado para a área de transferência!');
    });
}

function enviarPorEmail() {
    if (!orcamentoAtual) return;
    
    const assunto = `Orçamento ${orcamentoAtual.id} - ${orcamentoAtual.paciente_nome}`;
    const corpo = `Prezado(a) ${orcamentoAtual.paciente_nome},

Segue orçamento conforme solicitado:

PROCEDIMENTO: ${orcamentoAtual.procedimento_principal}
${orcamentoAtual.procedimentos_adicionais ? `ADICIONAL: ${orcamentoAtual.procedimentos_adicionais}` : ''}

VALOR TOTAL: R$ ${orcamentoAtual.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
FORMA DE PAGAMENTO: ${orcamentoAtual.forma_pagamento}
VALIDADE: ${formatarData(orcamentoAtual.validade)}

${orcamentoAtual.observacoes ? `OBSERVAÇÕES: ${orcamentoAtual.observacoes}` : ''}

Qualquer dúvida, estamos à disposição.

Atenciosamente,
Dr. Marcio Scartozzoni
Cirurgia Plástica`;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
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
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editarPaciente('${item.id_paciente}')">Editar</button>
                    <button class="btn-caderno" onclick="abrirCaderno('${item.id_paciente}', '${item.nome_paciente}')">
                        <i class="fas fa-book-medical"></i> Caderno
                    </button>
                    ${item.orcamento_pdf_link ? `<a href="${item.orcamento_pdf_link}"  class="btn-view">PDF</a>` : ''}
                    ${item.orcamento_link_aceite ? `<a href="${item.orcamento_link_aceite}"  class="btn-view">Aceite</a>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function atualizarEstatisticas() {
    const total = dadosOriginais.length;
    const hoje = new Date().toISOString().split('T')[0];
    
    const agendamentosHoje = dadosOriginais.filter(item => 
        item.agendamento_data && item.agendamento_data.includes(hoje)
    ).length;
    
    const orcamentosPendentes = dadosOriginais.filter(item => 
        item.orcamento_status === 'Enviado'
    ).length;
    
    const pagamentosPendentes = dadosOriginais.filter(item => 
        item.status_geral === 'Aguardando Pagamento'
    ).length;
    
    document.getElementById('totalPacientes').textContent = total;
    document.getElementById('agendamentosHoje').textContent = agendamentosHoje;
    document.getElementById('orcamentosPendentes').textContent = orcamentosPendentes;
    document.getElementById('pagamentosPendentes').textContent = pagamentosPendentes;
}

function aplicarFiltros() {
    const filtroId = document.getElementById('filtroId').value.toLowerCase();
    const filtroNome = document.getElementById('filtroNome').value.toLowerCase();
    const filtroStatus = document.getElementById('filtroStatus').value;
    const filtroDataInicio = document.getElementById('filtroDataInicio').value;
    const filtroDataFim = document.getElementById('filtroDataFim').value;
    
    dadosFiltrados = dadosOriginais.filter(item => {
        let passa = true;
        
        if (filtroId && !item.id_paciente.toLowerCase().includes(filtroId)) {
            passa = false;
        }
        
        if (filtroNome && !item.nome_paciente.toLowerCase().includes(filtroNome)) {
            passa = false;
        }
        
        if (filtroStatus && item.status_geral !== filtroStatus) {
            passa = false;
        }
        
        if (filtroDataInicio) {
            const dataCriacao = new Date(item.data_criacao);
            const dataInicio = new Date(filtroDataInicio);
            if (dataCriacao < dataInicio) {
                passa = false;
            }
        }
        
        if (filtroDataFim) {
            const dataCriacao = new Date(item.data_criacao);
            const dataFim = new Date(filtroDataFim);
            if (dataCriacao > dataFim) {
                passa = false;
            }
        }
        
        return passa;
    });
    
    atualizarTabela();
}

function limparFiltros() {
    document.getElementById('filtroId').value = '';
    document.getElementById('filtroNome').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';
    
    dadosFiltrados = [...dadosOriginais];
    atualizarTabela();
}

function editarPaciente(idPaciente) {
    const paciente = dadosOriginais.find(p => p.id_paciente === idPaciente);
    if (!paciente) return;
    
    // Preencher formulário
    document.getElementById('editId').value = paciente.id_paciente;
    document.getElementById('editNome').value = paciente.nome_paciente;
    document.getElementById('editAgendamentoData').value = paciente.agendamento_data ? paciente.agendamento_data.split('T')[0] : '';
    document.getElementById('editAgendamentoHora').value = paciente.agendamento_hora || '';
    document.getElementById('editAgendamentoStatus').value = paciente.agendamento_status;
    document.getElementById('editConsultaStatus').value = paciente.consulta_status;
    document.getElementById('editOrcamentoStatus').value = paciente.orcamento_status;
    document.getElementById('editOrcamentoPdf').value = paciente.orcamento_pdf_link || '';
    document.getElementById('editOrcamentoAceite').value = paciente.orcamento_link_aceite || '';
    document.getElementById('editStatusAceite').value = paciente.orcamento_status_aceite;
    document.getElementById('editValorEntrada').value = paciente.pagamento_valor_entrada || '';
    document.getElementById('editComprovante').value = paciente.pagamento_comprovante || '';
    document.getElementById('editStatusGeral').value = paciente.status_geral;
    document.getElementById('editObservacao').value = paciente.pagamento_observacao || '';
    
    // Mostrar modal
    document.getElementById('modalEdicao').style.display = 'flex';
}

function abrirCaderno(idPaciente, nomePaciente) {
    // Armazenar dados do paciente no localStorage para o Caderno Digital
    const dadosPaciente = dadosOriginais.find(p => p.id_paciente === idPaciente);
    
    if (dadosPaciente) {
        const pacienteParaCaderno = {
            id: dadosPaciente.id_paciente,
            nome: dadosPaciente.nome_paciente,
            dataUltimaConsulta: dadosPaciente.agendamento_data,
            statusGeral: dadosPaciente.status_geral,
            observacoes: dadosPaciente.pagamento_observacao || '',
            origem: 'gestao' // Identificar que veio da gestão
        };
        
        localStorage.setItem('pacienteCaderno', JSON.stringify(pacienteParaCaderno));
        
        // Abrir Caderno Digital em nova aba
        window.open('/caderno-digital.html', '_blank');
    } else {
        alert('Erro: Dados do paciente não encontrados');
    }
}

async function salvarEdicao() {
    const dadosEdicao = {
        id_paciente: document.getElementById('editId').value,
        nome_paciente: document.getElementById('editNome').value,
        agendamento_data: document.getElementById('editAgendamentoData').value,
        agendamento_hora: document.getElementById('editAgendamentoHora').value,
        agendamento_status: document.getElementById('editAgendamentoStatus').value,
        consulta_status: document.getElementById('editConsultaStatus').value,
        orcamento_status: document.getElementById('editOrcamentoStatus').value,
        orcamento_pdf_link: document.getElementById('editOrcamentoPdf').value,
        orcamento_link_aceite: document.getElementById('editOrcamentoAceite').value,
        orcamento_status_aceite: document.getElementById('editStatusAceite').value,
        pagamento_valor_entrada: document.getElementById('editValorEntrada').value,
        pagamento_comprovante: document.getElementById('editComprovante').value,
        status_geral: document.getElementById('editStatusGeral').value,
        pagamento_observacao: document.getElementById('editObservacao').value
    };
    
    try {
        const response = await fetch('/api/gestao/atualizar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosEdicao)
        });
        
        const resultado = await response.json();
        
        if (resultado.sucesso) {
            alert('Dados atualizados com sucesso!');
            fecharModal();
            carregarDados();
        } else {
            alert('Erro ao atualizar: ' + resultado.erro);
        }
  
   } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar dados');
    }
}

function fecharModal() {
    document.getElementById('modalEdicao').style.display = 'none';
}

function adicionarPaciente() {
    // Limpar formulário
    document.getElementById('formEdicao').reset();
    document.getElementById('editId').value = 'NOVO_' + Date.now();
    
    // Valores padrão para novo paciente
    document.getElementById('editAgendamentoStatus').value = 'Pendente';
    document.getElementById('editConsultaStatus').value = 'Não Realizada';
    document.getElementById('editOrcamentoStatus').value = 'Não Enviado';
    document.getElementById('editStatusAceite').value = 'Pendente';
    document.getElementById('editStatusGeral').value = 'Novo';
    
    // Mostrar modal
    document.getElementById('modalEdicao').style.display = 'flex';
}

async function atualizarDados() {
    await carregarDados();
    alert('Dados atualizados!');
}

function exportarDados() {
    // Criar CSV
    const headers = [
        'ID Paciente', 'Nome', 'Data Criação', 'Última Update',
        'Agendamento Data', 'Agendamento Hora', 'Status Agendamento',
        'Status Consulta', 'Observação Consulta', 'Status Orçamento',
        'Data Orçamento', 'Link Editar', 'PDF Link', 'Link Aceite',
        'Status Aceite', 'Valor Entrada', 'Comprovante', 'Obs Pagamento',
        'Status Geral', 'Última Ação'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    dadosFiltrados.forEach(item => {
        const row = [
            item.id_paciente,
            `"${item.nome_paciente}"`,
            formatarData(item.data_criacao),
            formatarData(item.data_ultima_update),
            item.agendamento_data || '',
            item.agendamento_hora || '',
            item.agendamento_status,
            item.consulta_status,
            `"${item.consulta_observacao || ''}"`,
            item.orcamento_status,
            item.orcamento_data || '',
            item.orcamento_link_editar || '',
            item.orcamento_pdf_link || '',
            item.orcamento_link_aceite || '',
            item.orcamento_status_aceite,
            item.pagamento_valor_entrada || '',
            item.pagamento_comprovante || '',
            `"${item.pagamento_observacao || ''}"`,
            item.status_geral,
            `"${item.ultima_acao || ''}"`
        ];
        csvContent += row.join(',') + '\n';
    });
    
    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gestao_pacientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Funções utilitárias
function formatarData(data) {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

function formatarDataHora(data, hora) {
    if (!data) return '';
    const dataFormatada = formatarData(data);
    return hora ? `${dataFormatada} ${hora}` : dataFormatada;
}

// Fechar modal clicando fora
window.onclick = function(event) {
    const modal = document.getElementById('modalEdicao');
    if (event.target === modal) {
        fecharModal();
    }
}

// Atalhos de teclado
document.addEventListener('keydown', function(e) {
    // ESC para fechar modal
    if (e.key === 'Escape') {
        fecharModal();
    }
    
    // Ctrl+F para focar no filtro de nome
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('filtroNome').focus();
    }
});

// Auto-save dos filtros no localStorage
function salvarFiltros() {
    const filtros = {
        id: document.getElementById('filtroId').value,
        nome: document.getElementById('filtroNome').value,
        status: document.getElementById('filtroStatus').value,
        dataInicio: document.getElementById('filtroDataInicio').value,
        dataFim: document.getElementById('filtroDataFim').value
    };
    localStorage.setItem('filtrosGestao', JSON.stringify(filtros));
}

function carregarFiltrosSalvos() {
    const filtrosSalvos = localStorage.getItem('filtrosGestao');
    if (filtrosSalvos) {
        const filtros = JSON.parse(filtrosSalvos);
        document.getElementById('filtroId').value = filtros.id || '';
        document.getElementById('filtroNome').value = filtros.nome || '';
        document.getElementById('filtroStatus').value = filtros.status || '';
        document.getElementById('filtroDataInicio').value = filtros.dataInicio || '';
        document.getElementById('filtroDataFim').value = filtros.dataFim || '';
        aplicarFiltros();
    }
}

// Carregar filtros salvos ao inicializar
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autorização primeiro
    if (!checkAuth()) {
        return; // Não continuar carregamento se não autorizado
    }
    
    carregarFiltrosSalvos();
    
    // Salvar filtros quando mudarem
    ['filtroId', 'filtroNome', 'filtroStatus', 'filtroDataInicio', 'filtroDataFim'].forEach(id => {
        document.getElementById(id).addEventListener('change', salvarFiltros);
    });
});

// ====== SISTEMA DE AGENDAMENTO RÁPIDO ======

// Abrir modal de agendamento rápido
function abrirAgendamentoRapido() {
    const modal = document.getElementById('modalAgendamentoRapido');
    modal.style.display = 'block';
    
    // Definir data mínima como hoje
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataAgendamento').min = hoje;
    
    // Carregar lista de pacientes
    carregarPacientesSelect();
    
    // Carregar horários disponíveis para hoje por padrão
    document.getElementById('dataAgendamento').value = hoje;
    carregarHorariosDisponiveis(hoje);
}

// Fechar modal de agendamento
function fecharModalAgendamento() {
    const modal = document.getElementById('modalAgendamentoRapido');
    modal.style.display = 'none';
    document.getElementById('formAgendamentoRapido').reset();
}

// Carregar pacientes no select
async function carregarPacientesSelect() {
    try {
        const select = document.getElementById('pacienteSelect');
        select.innerHTML = '<option value="">Selecione o paciente</option>';
        
        // Se temos dados carregados, usar eles
        if (dadosOriginais.length > 0) {
            dadosOriginais.forEach(paciente => {
                const option = document.createElement('option');
                option.value = paciente.id;
                option.textContent = `${paciente.nome} (ID: ${paciente.id})`;
                select.appendChild(option);
            });
        } else {
            // Carregar dados da API se necessário
            await carregarDados();
            carregarPacientesSelect(); // Recursiva após carregar
        }
    } catch (error) {
        console.error('Erro ao carregar pacientes:', error);
    }
}

// Carregar horários disponíveis
async function carregarHorariosDisponiveis(data) {
    try {
        const select = document.getElementById('horaAgendamento');
        select.innerHTML = '<option value="">Carregando horários...</option>';
        
        // Horários padrão do consultório
        const horariosConsultorio = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
            '16:00', '16:30', '17:00', '17:30'
        ];
        
        // TODO: Integrar com API para verificar horários ocupados
        select.innerHTML = '<option value="">Selecione o horário</option>';
        
        horariosConsultorio.forEach(horario => {
            const option = document.createElement('option');
            option.value = horario;
            option.textContent = horario;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        const select = document.getElementById('horaAgendamento');
        select.innerHTML = '<option value="">Erro ao carregar horários</option>';
    }
}

// Atualizar duração baseada no tipo
function atualizarDuracao() {
    const tipo = document.getElementById('tipoAgendamento').value;
    const duracao = document.getElementById('duracaoAgendamento');
    
    // Duração padrão por tipo
    const duracoesPadrao = {
        'consulta': '60',
        'cirurgia': '180',
        'reuniao': '30',
        'retorno': '30',
        'avaliacao': '90'
    };
    
    if (duracoesPadrao[tipo]) {
        duracao.value = duracoesPadrao[tipo];
    }
}

// Submeter agendamento rápido
document.getElementById('formAgendamentoRapido').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        tipo: document.getElementById('tipoAgendamento').value,
        pacienteId: document.getElementById('pacienteSelect').value,
        data: document.getElementById('dataAgendamento').value,
        hora: document.getElementById('horaAgendamento').value,
        duracao: document.getElementById('duracaoAgendamento').value,
        observacoes: document.getElementById('observacoesAgendamento').value
    };
    
    try {
        // Mostrar loading
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        const originalText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agendando...';
        btnSubmit.disabled = true;
        
        // TODO: Enviar para API de agendamento
        // const response = await fetch('/api/appointments', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // });
        
        // Simulação por enquanto
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        alert(`✅ Agendamento realizado com sucesso!
        
Tipo: ${formData.tipo}
Data: ${new Date(formData.data).toLocaleDateString('pt-BR')}
Horário: ${formData.hora}
Duração: ${formData.duracao} minutos

O paciente receberá confirmação por email.`);
        
        fecharModalAgendamento();
        await carregarDados(); // Recarregar dados
        
    } catch (error) {
        console.error('Erro ao agendar:', error);
        alert('❌ Erro ao realizar agendamento. Tente novamente.');
    } finally {
        // Restaurar botão
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        btnSubmit.innerHTML = '<i class="fas fa-calendar-check"></i> Agendar';
        btnSubmit.disabled = false;
    }
});

// Abrir calendário completo
function abrirCalendarioCompleto() {
    window.open('/agendar.html', '_blank');
}

// Event listener para mudança de data
document.getElementById('dataAgendamento').addEventListener('change', function(e) {
    carregarHorariosDisponiveis(e.target.value);
});