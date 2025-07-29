   let dadosOriginais = [];
let dadosFiltrados = [];

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    carregarDados();
    configurarEventos();
});

function configurarEventos() {
    // Form de edição
    document.getElementById('formEdicao').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarEdicao();
    });
    
    // Filtros em tempo real
    document.getElementById('filtroNome').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroId').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroStatus').addEventListener('change', aplicarFiltros);
}

async function carregarDados() {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    
    try {
        const response = await fetch('/api/gestao/dados');
        const dados = await response.json();
        
        dadosOriginais = dados;
        dadosFiltrados = [...dados];
        
        atualizarTabela();
        atualizarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados');
    } finally {
        loading.style.display = 'none';
    }
}

function atualizarTabela() {
    const tbody = document.getElementById('corpoTabela');
    tbody.innerHTML = '';
    
    dadosFiltrados.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id_paciente}</td>
            <td>${item.nome_paciente}</td>
            <td>${formatarData(item.data_criacao)}</td>
            <td>${formatarData(item.data_ultima_update)}</td>
            <td>${formatarDataHora(item.agendamento_data, item.agendamento_hora)}</td>
            <td><span class="status-badge status-${item.agendamento_status.toLowerCase().replace(' ', '-')}">${item.agendamento_status}</span></td>
            <td><span class="status-badge status-${item.consulta_status.toLowerCase().replace(' ', '-')}">${item.consulta_status}</span></td>
            <td><span class="status-badge status-${item.orcamento_status.toLowerCase().replace(' ', '-')}">${item.orcamento_status}</span></td>
            <td><span class="status-badge status-${item.orcamento_status_aceite.toLowerCase().replace(' ', '-')}">${item.orcamento_status_aceite}</span></td>
            <td>R\$ ${item.pagamento_valor_entrada || '0,00'}</td>
            <td><span class="status-badge status-${item.status_geral.toLowerCase().replace(' ', '-')}">${item.status_geral}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editarPaciente('${item.id_paciente}')">Editar</button>
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
    carregarFiltrosSalvos();
    
    // Salvar filtros quando mudarem
    ['filtroId', 'filtroNome', 'filtroStatus', 'filtroDataInicio', 'filtroDataFim'].forEach(id => {
        document.getElementById(id).addEventListener('change', salvarFiltros);
    });
});