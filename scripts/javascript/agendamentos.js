// Agendamentos - Portal Médico Dr. Marcio Scartozzoni
console.log('📅 Sistema de Agendamentos Carregado');

// Sistema de Agendamentos
window.SistemaAgendamentos = {
    agendamentos: [],
    agendamentoAtual: null,

    // Inicializar sistema
    init: function() {
        console.log('🚀 Sistema de Agendamentos Inicializado');
        this.carregarDados();
        this.configurarEventos();
        this.renderizarCalendario();
    },

    // Carregar dados salvos
    carregarDados: function() {
        try {
            const dados = localStorage.getItem('agendamentos_portal');
            if (dados) {
                this.agendamentos = JSON.parse(dados);
            } else {
                // Dados de exemplo
                this.agendamentos = [
                    {
                        id: 'ag1',
                        paciente: 'Maria Silva',
                        telefone: '(11) 99999-9999',
                        data: '2025-08-07',
                        hora: '09:00',
                        tipo: 'primeira-consulta',
                        status: 'confirmado',
                        procedimento: 'Consulta Inicial'
                    },
                    {
                        id: 'ag2',
                        paciente: 'João Santos',
                        telefone: '(11) 88888-8888',
                        data: '2025-08-07',
                        hora: '10:30',
                        tipo: 'retorno',
                        status: 'aguardando',
                        procedimento: 'Pós-operatório'
                    }
                ];
                this.salvarDados();
            }
            console.log('✅ Agendamentos carregados:', this.agendamentos.length);
        } catch (error) {
            console.error('❌ Erro ao carregar agendamentos:', error);
            this.agendamentos = [];
        }
    },

    // Salvar dados
    salvarDados: function() {
        try {
            localStorage.setItem('agendamentos_portal', JSON.stringify(this.agendamentos));
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar agendamentos:', error);
            return false;
        }
    },

    // Configurar eventos
    configurarEventos: function() {
        // Eventos de clique
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                const action = e.target.getAttribute('data-action');
                this.executarAcao(action, e.target);
            }
        });

        // Formulários
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#form-novo-agendamento')) {
                e.preventDefault();
                this.salvarAgendamento(e.target);
            }
        });
    },

    // Executar ações
    executarAcao: function(action, elemento) {
        switch(action) {
            case 'novo-agendamento':
                this.novoAgendamento();
                break;
            case 'confirmar-agendamento':
                const id = elemento.getAttribute('data-id');
                this.confirmarAgendamento(id);
                break;
            case 'cancelar-agendamento':
                const idCancel = elemento.getAttribute('data-id');
                this.cancelarAgendamento(idCancel);
                break;
            case 'atender-paciente':
                const idAtender = elemento.getAttribute('data-id');
                this.atenderPaciente(idAtender);
                break;
            default:
                console.log('Ação não reconhecida:', action);
        }
    },

    // Novo agendamento
    novoAgendamento: function() {
        this.agendamentoAtual = {
            id: 'ag_' + Date.now(),
            data: new Date().toISOString().split('T')[0],
            hora: '09:00',
            status: 'agendado'
        };

        this.abrirModalAgendamento();
    },

    // Abrir modal de agendamento
    abrirModalAgendamento: function() {
        const modal = document.getElementById('modal-agendamento');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            console.log('Modal de agendamento não encontrado');
        }
    },

    // Salvar agendamento
    salvarAgendamento: function(form) {
        const formData = new FormData(form);
        
        this.agendamentoAtual.paciente = formData.get('paciente');
        this.agendamentoAtual.telefone = formData.get('telefone');
        this.agendamentoAtual.data = formData.get('data');
        this.agendamentoAtual.hora = formData.get('hora');
        this.agendamentoAtual.tipo = formData.get('tipo');
        this.agendamentoAtual.procedimento = formData.get('procedimento');

        this.agendamentos.push(this.agendamentoAtual);
        this.salvarDados();
        this.renderizarCalendario();
        this.fecharModal();

        if (typeof PortalMedico !== 'undefined') {
            PortalMedico.notify('✅ Agendamento criado com sucesso!', 'success');
        }

        console.log('📅 Agendamento salvo:', this.agendamentoAtual);
    },

    // Confirmar agendamento
    confirmarAgendamento: function(id) {
        const agendamento = this.agendamentos.find(a => a.id === id);
        if (agendamento) {
            agendamento.status = 'confirmado';
            this.salvarDados();
            this.renderizarCalendario();
            
            if (typeof PortalMedico !== 'undefined') {
                PortalMedico.notify(`✅ Agendamento de ${agendamento.paciente} confirmado!`, 'success');
            }
        }
    },

    // Cancelar agendamento
    cancelarAgendamento: function(id) {
        const agendamento = this.agendamentos.find(a => a.id === id);
        if (agendamento) {
            if (confirm(`❌ Cancelar agendamento de ${agendamento.paciente}?`)) {
                agendamento.status = 'cancelado';
                this.salvarDados();
                this.renderizarCalendario();
                
                if (typeof PortalMedico !== 'undefined') {
                    PortalMedico.notify('✅ Agendamento cancelado!', 'info');
                }
            }
        }
    },

    // Atender paciente
    atenderPaciente: function(id) {
        const agendamento = this.agendamentos.find(a => a.id === id);
        if (agendamento) {
            agendamento.status = 'em-atendimento';
            this.salvarDados();
            this.renderizarCalendario();
            
            // Abrir caderno digital
            const url = `caderno-digital.html?paciente=${encodeURIComponent(agendamento.paciente)}&origem=consulta`;
            window.open(url, '_blank');
            
            if (typeof PortalMedico !== 'undefined') {
                PortalMedico.notify(`👨‍⚕️ Atendendo ${agendamento.paciente}`, 'info');
            }
        }
    },

    // Renderizar calendário (função básica)
    renderizarCalendario: function() {
        const container = document.getElementById('calendario-agendamentos');
        if (!container) return;

        const hoje = new Date().toISOString().split('T')[0];
        const agendamentosHoje = this.agendamentos.filter(a => a.data === hoje);

        container.innerHTML = agendamentosHoje.map(agendamento => `
            <div class="card-unificado agendamento-card ${agendamento.status}">
                <div class="card-header">
                    <h4 class="card-title">
                        <i class="fas fa-user"></i>
                        ${agendamento.paciente}
                    </h4>
                    <span class="status-badge status-${agendamento.status}">${agendamento.status}</span>
                </div>
                <div class="card-content">
                    <p><strong>Horário:</strong> ${agendamento.hora}</p>
                    <p><strong>Tipo:</strong> ${agendamento.tipo}</p>
                    <p><strong>Telefone:</strong> ${agendamento.telefone}</p>
                </div>
                <div class="card-actions">
                    ${agendamento.status === 'agendado' ? `
                        <button class="btn-card btn-success" data-action="confirmar-agendamento" data-id="${agendamento.id}">
                            <i class="fas fa-check"></i> Confirmar
                        </button>
                    ` : ''}
                    ${agendamento.status === 'confirmado' ? `
                        <button class="btn-card btn-primary" data-action="atender-paciente" data-id="${agendamento.id}">
                            <i class="fas fa-stethoscope"></i> Atender
                        </button>
                    ` : ''}
                    <button class="btn-card btn-danger" data-action="cancelar-agendamento" data-id="${agendamento.id}">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Fechar modal
    fecharModal: function() {
        const modal = document.getElementById('modal-agendamento');
        if (modal) {
            modal.style.display = 'none';
        }
    }
};

// Funções globais para compatibilidade
window.novoAgendamento = function() {
    SistemaAgendamentos.novoAgendamento();
};

window.confirmarAgendamento = function(id) {
    SistemaAgendamentos.confirmarAgendamento(id);
};

window.cancelarAgendamento = function(id) {
    SistemaAgendamentos.cancelarAgendamento(id);
};

window.atenderPaciente = function(id) {
    SistemaAgendamentos.atenderPaciente(id);
};

// Auto-inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    SistemaAgendamentos.init();
});

console.log('✅ Sistema de Agendamentos carregado com sucesso!');
