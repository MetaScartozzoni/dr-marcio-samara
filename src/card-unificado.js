// 🎯 CARD UNIFICADO - JAVASCRIPT PARA TODOS OS SISTEMAS
// Arquivo: card-unificado.js

/* ==============================================
   CLASSE PRINCIPAL - CARD UNIFICADO
   ============================================== */

class CardUnificado {
    constructor() {
        this.sistemaAtual = this.detectarSistema();
        this.pacientes = new Map();
        this.init();
    }

    init() {
        this.carregarCSS();
        this.configurarEventListeners();
    }

    carregarCSS() {
        if (!document.querySelector('link[href*="card-unificado.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/card-unificado.css';
            document.head.appendChild(link);
        }
    }

    detectarSistema() {
        const pathname = window.location.pathname;
        if (pathname.includes('quadro-evolutivo')) return 'evolucao';
        if (pathname.includes('jornada-paciente')) return 'jornada';
        if (pathname.includes('prontuarios')) return 'prontuarios';
        return 'prontuarios'; // default
    }

    configurarEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.marco-item, .marco-item *')) {
                const marcoItem = e.target.closest('.marco-item');
                this.handleMarcoClick(marcoItem);
            }
        });
    }

    /* ==============================================
       CRIAÇÃO DO CARD UNIFICADO
       ============================================== */

    criarCard(paciente) {
        const status = this.determinarStatus(paciente);
        const marcos = this.obterMarcosImportantes(paciente);
        const notificacoes = this.contarNotificacoes(paciente);
        const contexto = this.obterConteudoContexto(paciente);

        return `
            <div class="card-paciente unified" 
                 data-paciente-id="${paciente.id}" 
                 data-sistema="${this.sistemaAtual}"
                 data-status="${status.tipo}">
                
                <div class="card-header">
                    <div class="paciente-info">
                        <h3>👤 ${paciente.nome}</h3>
                        <div class="paciente-meta">
                            <span class="prontuario-id">${paciente.id}</span>
                            <span class="status-badge ${status.tipo}">${status.texto}</span>
                        </div>
                    </div>
                    <div class="notificacao-container">
                        ${notificacoes > 0 ? `<span class="notificacao-badge" data-count="${notificacoes}">${notificacoes}</span>` : ''}
                    </div>
                </div>

                <div class="dados-basicos">
                    <div class="dado-item">
                        <i class="fas fa-phone"></i> ${paciente.telefone || 'Não informado'}
                    </div>
                    <div class="dado-item">
                        <i class="fas fa-envelope"></i> ${paciente.email || 'Não informado'}
                    </div>
                </div>

                <div class="card-context ${this.sistemaAtual}">
                    ${contexto}
                </div>

                <div class="marcos-importantes">
                    ${marcos.map(marco => this.criarMarcoHTML(marco, paciente.id)).join('')}
                </div>

                <div class="card-actions">
                    <div class="actions-primary">
                        <button class="btn-action recado" onclick="cardUnificado.abrirRecado('${paciente.id}')">
                            <i class="fas fa-sticky-note"></i> Recado
                        </button>
                        <button class="btn-action evoluir" onclick="cardUnificado.abrirEvolucao('${paciente.id}')">
                            <i class="fas fa-chart-line"></i> Evoluir
                        </button>
                    </div>
                    
                    <div class="actions-navigation">
                        <button class="btn-nav caderno ${this.sistemaAtual === 'caderno' ? 'active' : ''}" 
                                onclick="cardUnificado.abrirCaderno('${paciente.id}')" 
                                title="Caderno Digital">
                            <i class="fas fa-book-medical"></i>
                        </button>
                        <button class="btn-nav evolucao ${this.sistemaAtual === 'evolucao' ? 'active' : ''}" 
                                onclick="cardUnificado.abrirQuadroEvolucao('${paciente.id}')" 
                                title="Quadro Evolução">
                            <i class="fas fa-chart-bar"></i>
                        </button>
                        <button class="btn-nav jornada ${this.sistemaAtual === 'jornada' ? 'active' : ''}" 
                                onclick="cardUnificado.abrirJornada('${paciente.id}')" 
                                title="Jornada">
                            <i class="fas fa-route"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    criarMarcoHTML(marco, pacienteId) {
        return `
            <div class="marco-item ${marco.status}" 
                 data-tipo="${marco.tipo}"
                 data-paciente-id="${pacienteId}"
                 data-data="${marco.dataCompleta}"
                 title="${marco.titulo}">
                <span class="marco-icon">${marco.icon}</span>
                <span class="marco-data">${marco.data}</span>
            </div>
        `;
    }

    /* ==============================================
       DETERMINAÇÃO DE STATUS POR SISTEMA
       ============================================== */

    determinarStatus(paciente) {
        switch(this.sistemaAtual) {
            case 'evolucao':
                return this.determinarStatusEvolucao(paciente);
            case 'jornada':
                return this.determinarStatusJornada(paciente);
            case 'prontuarios':
                return this.determinarStatusProntuario(paciente);
            default:
                return { tipo: 'pendente', texto: 'Pendente' };
        }
    }

    determinarStatusEvolucao(paciente) {
        if (paciente.status === 'critico') {
            return { tipo: 'critico', texto: 'Crítico' };
        }
        
        if (paciente.ultimaConsulta) {
            const dias = this.calcularDiasDesdeUltimaConsulta(paciente.ultimaConsulta);
            if (dias > 30) return { tipo: 'critico', texto: 'Crítico' };
            if (dias > 15) return { tipo: 'pendente', texto: 'Pendente' };
            if (dias <= 7) return { tipo: 'ontime', texto: 'OnTime' };
        }
        
        if (paciente.status === 'aguardando') return { tipo: 'aguardando', texto: 'Aguardando' };
        if (paciente.status === 'estavel') return { tipo: 'realizado', texto: 'Realizado' };
        
        return { tipo: 'pendente', texto: 'Pendente' };
    }

    determinarStatusJornada(paciente) {
        const agora = new Date();
        
        if (paciente.prazo && new Date(paciente.prazo) < agora) {
            return { tipo: 'critico', texto: 'Crítico' };
        }
        
        if (paciente.prioridade === 'urgente') {
            return { tipo: 'critico', texto: 'Crítico' };
        }
        
        if (paciente.etapaAtual === 'concluido') {
            return { tipo: 'realizado', texto: 'Realizado' };
        }
        
        if (paciente.proximaAcao) {
            if (paciente.prioridade === 'alta') return { tipo: 'pendente', texto: 'Pendente' };
            if (paciente.etapaAtual?.includes('aguardando')) return { tipo: 'aguardando', texto: 'Aguardando' };
            return { tipo: 'ontime', texto: 'OnTime' };
        }
        
        return { tipo: 'pendente', texto: 'Pendente' };
    }

    determinarStatusProntuario(paciente) {
        const camposObrigatorios = ['nome', 'cpf', 'telefone'];
        const camposOpcionais = ['email', 'dataNascimento'];
        
        const faltandoObrigatorio = camposObrigatorios.some(campo => 
            !paciente[campo] || paciente[campo].trim() === ''
        );
        
        if (faltandoObrigatorio) {
            return { tipo: 'critico', texto: 'Crítico' };
        }
        
        const faltandoOpcional = camposOpcionais.some(campo => 
            !paciente[campo] || paciente[campo].trim() === ''
        );
        
        if (faltandoOpcional) {
            return { tipo: 'pendente', texto: 'Pendente' };
        }
        
        return { tipo: 'realizado', texto: 'Realizado' };
    }

    /* ==============================================
       MARCOS IMPORTANTES ("ANIVERSÁRIOS")
       ============================================== */

    obterMarcosImportantes(paciente) {
        const marcos = [];
        const hoje = new Date();
        
        // Primeira Consulta
        if (paciente.primeiraConsulta || paciente.primeira_consulta) {
            const data = paciente.primeiraConsulta || paciente.primeira_consulta;
            marcos.push({
                tipo: 'primeira-consulta',
                icon: '🏥',
                data: this.formatarDataCurta(data),
                dataCompleta: data,
                status: 'primeira-consulta',
                titulo: 'Primeira Consulta'
            });
        }
        
        // Data da Cirurgia
        if (paciente.dataCirurgia || paciente.data_cirurgia) {
            const data = paciente.dataCirurgia || paciente.data_cirurgia;
            marcos.push({
                tipo: 'cirurgia',
                icon: '⚕️',
                data: this.formatarDataCurta(data),
                dataCompleta: data,
                status: 'cirurgia',
                titulo: 'Data da Cirurgia'
            });
        }
        
        // Próximo Retorno
        if (paciente.proximoRetorno || paciente.proximo_retorno) {
            const data = paciente.proximoRetorno || paciente.proximo_retorno;
            const dataRetorno = new Date(data);
            const isHoje = this.isDataHoje(dataRetorno);
            const isUrgente = dataRetorno <= hoje;
            
            marcos.push({
                tipo: 'retorno',
                icon: '🔄',
                data: isHoje ? 'Hoje' : this.formatarDataCurta(data),
                dataCompleta: data,
                status: isUrgente ? 'urgente' : isHoje ? 'hoje' : 'retorno',
                titulo: 'Próximo Retorno'
            });
        }
        
        // Última Consulta
        if (paciente.ultimaConsulta || paciente.ultima_consulta) {
            const data = paciente.ultimaConsulta || paciente.ultima_consulta;
            marcos.push({
                tipo: 'ultima-consulta',
                icon: '📅',
                data: this.formatarDataCurta(data),
                dataCompleta: data,
                status: 'retorno',
                titulo: 'Última Consulta'
            });
        }
        
        return marcos.slice(0, 3); // Máximo 3 marcos
    }

    /* ==============================================
       CONTEÚDO ESPECÍFICO POR SISTEMA
       ============================================== */

    obterConteudoContexto(paciente) {
        switch(this.sistemaAtual) {
            case 'evolucao':
                return this.obterContextoEvolucao(paciente);
            case 'jornada':
                return this.obterContextoJornada(paciente);
            case 'prontuarios':
                return this.obterContextoProntuarios(paciente);
            default:
                return '';
        }
    }

    obterContextoEvolucao(paciente) {
        const ultimaEvolucao = paciente.ultimaEvolucao || 'Nenhuma evolução registrada';
        const statusClass = paciente.status || 'normal';
        
        return `
            <div class="evolucao-info">
                <div class="evolucao-ultima">${ultimaEvolucao}</div>
                <div class="evolucao-status ${statusClass}">
                    ${this.obterTextoStatusEvolucao(paciente.status)}
                </div>
            </div>
        `;
    }

    obterContextoJornada(paciente) {
        const proximaAcao = paciente.proximaAcao || 'Nenhuma ação pendente';
        const prazo = paciente.prazo ? this.calcularTempoRestante(paciente.prazo) : '';
        
        return `
            <div class="jornada-info">
                <div class="proxima-acao">${proximaAcao}</div>
                ${prazo ? `
                    <div class="prazo-info">
                        <i class="fas fa-clock"></i> ${prazo}
                    </div>
                ` : ''}
            </div>
        `;
    }

    obterContextoProntuarios(paciente) {
        const totalConsultas = paciente.totalConsultas || 0;
        const dataCriacao = paciente.dataCriacao || paciente.data_criacao || '';
        
        return `
            <div class="prontuario-stats">
                <span><i class="fas fa-calendar"></i> Criado: ${this.formatarDataCurta(dataCriacao)}</span>
                <span><i class="fas fa-stethoscope"></i> ${totalConsultas} consulta${totalConsultas !== 1 ? 's' : ''}</span>
            </div>
        `;
    }

    /* ==============================================
       FUNÇÕES DE AÇÃO
       ============================================== */

    abrirRecado(pacienteId) {
        const paciente = this.pacientes.get(pacienteId) || { id: pacienteId };
        
        // Criar modal de recado
        const modal = this.criarModalRecado(paciente);
        document.body.appendChild(modal);
        
        // Mostrar modal
        setTimeout(() => modal.classList.add('active'), 100);
    }

    abrirEvolucao(pacienteId) {
        const paciente = this.pacientes.get(pacienteId) || { id: pacienteId };
        
        // Verificar se existe função específica do sistema
        if (typeof window.abrirEvolucao === 'function') {
            window.abrirEvolucao(pacienteId);
            return;
        }
        
        // Criar modal de evolução
        const modal = this.criarModalEvolucao(paciente);
        document.body.appendChild(modal);
        
        // Mostrar modal
        setTimeout(() => modal.classList.add('active'), 100);
    }

    abrirCaderno(pacienteId) {
        // Salvar dados do paciente para o caderno
        const paciente = this.pacientes.get(pacienteId);
        if (paciente) {
            localStorage.setItem('pacienteAtual', JSON.stringify(paciente));
        }
        
        // Abrir caderno digital
        window.open(`/caderno-digital.html?paciente=${pacienteId}`, '_blank');
    }

    abrirQuadroEvolucao(pacienteId) {
        if (this.sistemaAtual === 'evolucao') {
            // Já está no quadro de evolução, destacar card
            this.destacarCard(pacienteId);
            return;
        }
        
        // Abrir quadro de evolução
        window.open(`/quadro-evolutivo.html?paciente=${pacienteId}`, '_blank');
    }

    abrirJornada(pacienteId) {
        if (this.sistemaAtual === 'jornada') {
            // Já está na jornada, destacar card
            this.destacarCard(pacienteId);
            return;
        }
        
        // Abrir jornada do paciente
        window.open(`/jornada-paciente.html?paciente=${pacienteId}`, '_blank');
    }

    handleMarcoClick(marcoItem) {
        const pacienteId = marcoItem.dataset.pacienteId;
        const data = marcoItem.dataset.data;
        const tipo = marcoItem.dataset.tipo;
        
        // Abrir caderno digital na data específica
        if (data) {
            window.open(`/caderno-digital.html?paciente=${pacienteId}&data=${data}`, '_blank');
        }
    }

    /* ==============================================
       MODAIS
       ============================================== */

    criarModalRecado(paciente) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-sticky-note"></i> Recado - ${paciente.nome || paciente.id}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <textarea id="recado-texto" rows="4" 
                              placeholder="Digite seu recado sobre este paciente..."
                              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                </div>
                <div class="modal-footer">
                    <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary">Cancelar</button>
                    <button onclick="cardUnificado.salvarRecado('${paciente.id}')" class="btn btn-primary">Salvar Recado</button>
                </div>
            </div>
        `;
        
        return modal;
    }

    criarModalEvolucao(paciente) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-chart-line"></i> Evolução - ${paciente.nome || paciente.id}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Data da Evolução</label>
                        <input type="date" id="evolucao-data" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Tipo de Evolução</label>
                        <select id="evolucao-tipo">
                            <option value="consulta">Consulta</option>
                            <option value="retorno">Retorno</option>
                            <option value="procedimento">Procedimento</option>
                            <option value="acompanhamento">Acompanhamento</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descrição da Evolução</label>
                        <textarea id="evolucao-texto" rows="4" 
                                  placeholder="Descreva a evolução do paciente..."
                                  style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary">Cancelar</button>
                    <button onclick="cardUnificado.salvarEvolucao('${paciente.id}')" class="btn btn-primary">Salvar Evolução</button>
                </div>
            </div>
        `;
        
        return modal;
    }

    /* ==============================================
       FUNÇÕES AUXILIARES
       ============================================== */

    salvarRecado(pacienteId) {
        const texto = document.getElementById('recado-texto').value;
        if (!texto.trim()) {
            alert('Por favor, digite um recado antes de salvar.');
            return;
        }
        
        // Aqui você salvaria no backend
        console.log('Salvando recado:', { pacienteId, texto });
        
        // Simular salvamento
        alert('Recado salvo com sucesso!');
        document.querySelector('.modal-overlay').remove();
        
        // Atualizar notificações do card
        this.atualizarNotificacoes(pacienteId);
    }

    salvarEvolucao(pacienteId) {
        const data = document.getElementById('evolucao-data').value;
        const tipo = document.getElementById('evolucao-tipo').value;
        const texto = document.getElementById('evolucao-texto').value;
        
        if (!texto.trim()) {
            alert('Por favor, descreva a evolução antes de salvar.');
            return;
        }
        
        // Aqui você salvaria no backend
        console.log('Salvando evolução:', { pacienteId, data, tipo, texto });
        
        // Simular salvamento
        alert('Evolução salva com sucesso!');
        document.querySelector('.modal-overlay').remove();
        
        // Atualizar status do card
        this.atualizarStatusCard(pacienteId);
    }

    contarNotificacoes(paciente) {
        let count = 0;
        
        // Verificar se há recados não lidos
        if (paciente.recadosNaoLidos) count += paciente.recadosNaoLidos;
        
        // Verificar prazos vencidos
        if (paciente.prazo && new Date(paciente.prazo) < new Date()) count++;
        
        // Verificar status crítico
        if (paciente.status === 'critico') count++;
        
        return count;
    }

    calcularDiasDesdeUltimaConsulta(data) {
        const hoje = new Date();
        const ultimaConsulta = new Date(data);
        const diferenca = hoje - ultimaConsulta;
        return Math.floor(diferenca / (1000 * 60 * 60 * 24));
    }

    calcularTempoRestante(prazo) {
        const agora = new Date();
        const dataPrazo = new Date(prazo);
        const diferenca = dataPrazo - agora;
        
        if (diferenca < 0) return 'Vencido';
        
        const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (dias > 0) return `${dias}d ${horas}h`;
        if (horas > 0) return `${horas}h`;
        
        const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutos}m`;
    }

    formatarDataCurta(data) {
        if (!data) return '';
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit' 
        });
    }

    isDataHoje(data) {
        const hoje = new Date();
        const comparar = new Date(data);
        return hoje.toDateString() === comparar.toDateString();
    }

    obterTextoStatusEvolucao(status) {
        const textos = {
            'critico': 'Crítico',
            'acompanhamento': 'Acompanhamento',
            'estavel': 'Estável',
            'aguardando': 'Aguardando'
        };
        return textos[status] || 'Normal';
    }

    destacarCard(pacienteId) {
        // Remover destaque de outros cards
        document.querySelectorAll('.card-paciente.unified.destacado')
            .forEach(card => card.classList.remove('destacado'));
        
        // Destacar card específico
        const card = document.querySelector(`[data-paciente-id="${pacienteId}"]`);
        if (card) {
            card.classList.add('destacado');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    atualizarNotificacoes(pacienteId) {
        const card = document.querySelector(`[data-paciente-id="${pacienteId}"]`);
        if (card) {
            const badge = card.querySelector('.notificacao-badge');
            if (badge) {
                const count = parseInt(badge.textContent) + 1;
                badge.textContent = count;
                badge.setAttribute('data-count', count);
            }
        }
    }

    atualizarStatusCard(pacienteId) {
        const card = document.querySelector(`[data-paciente-id="${pacienteId}"]`);
        if (card) {
            // Atualizar status para "OnTime" após evolução
            card.setAttribute('data-status', 'ontime');
            const statusBadge = card.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.className = 'status-badge ontime';
                statusBadge.textContent = 'OnTime';
            }
        }
    }
}

// Instanciar globalmente
const cardUnificado = new CardUnificado();

// Expor para uso em outros scripts
window.CardUnificado = CardUnificado;
window.cardUnificado = cardUnificado;
