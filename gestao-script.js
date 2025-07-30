let dadosOriginais = [];
let dadosFiltrados = [];

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
        
        // Dados de demonstração para teste local
        dadosOriginais = [
            {
                id_paciente: 'PAC001',
                nome_paciente: 'João Silva',
                data_criacao: '2025-01-15',
                data_ultima_update: '2025-07-29',
                agendamento_data: '2025-08-05',
                agendamento_hora: '14:00',
                agendamento_status: 'Confirmado',
                consulta_status: 'Não Realizada',
                orcamento_status: 'Enviado',
                orcamento_status_aceite: 'Pendente',
                pagamento_valor_entrada: '1500.00',
                status_geral: 'Em Atendimento',
                orcamento_pdf_link: '',
                orcamento_link_aceite: ''
            },
            {
                id_paciente: 'PAC002', 
                nome_paciente: 'Maria Santos',
                data_criacao: '2025-01-20',
                data_ultima_update: '2025-07-28',
                agendamento_data: '2025-08-10',
                agendamento_hora: '10:30',
                agendamento_status: 'Pendente',
                consulta_status: 'Não Realizada',
                orcamento_status: 'Em Elaboração',
                orcamento_status_aceite: 'Pendente',
                pagamento_valor_entrada: '0.00',
                status_geral: 'Novo',
                orcamento_pdf_link: '',
                orcamento_link_aceite: ''
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