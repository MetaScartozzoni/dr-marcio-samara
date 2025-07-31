// ========== SISTEMA DE GESTÃO - VERSÃO MELHORADA ==========

let dadosOriginais = [];
let dadosFiltrados = [];
let orcamentoAtual = null;

// ========== SISTEMA DE NOTIFICAÇÕES ==========
class NotificationManager {
    static show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Adicionar ao container de notificações
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Auto remover após duração especificada
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }
    
    static getIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// ========== SISTEMA DE VALIDAÇÃO ==========
class FormValidator {
    static validateRequired(value, fieldName) {
        if (!value || value.trim() === '') {
            throw new Error(`${fieldName} é obrigatório`);
        }
        return true;
    }
    
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Email inválido');
        }
        return true;
    }
    
    static validateDate(date, fieldName) {
        if (!date) {
            throw new Error(`${fieldName} é obrigatório`);
        }
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            throw new Error(`${fieldName} inválida`);
        }
        return true;
    }
    
    static validateNumber(value, fieldName, min = null, max = null) {
        const num = parseFloat(value);
        if (isNaN(num)) {
            throw new Error(`${fieldName} deve ser um número válido`);
        }
        if (min !== null && num < min) {
            throw new Error(`${fieldName} deve ser maior que ${min}`);
        }
        if (max !== null && num > max) {
            throw new Error(`${fieldName} deve ser menor que ${max}`);
        }
        return true;
    }
    
    static validatePhone(phone) {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        if (!phoneRegex.test(phone)) {
            throw new Error('Telefone deve estar no formato (XX) XXXXX-XXXX');
        }
        return true;
    }
    
    static validateOrcamento(dados) {
        this.validateRequired(dados.paciente_id, 'Paciente');
        this.validateRequired(dados.procedimento_principal, 'Procedimento Principal');
        this.validateDate(dados.data_consulta, 'Data da Consulta');
        this.validateDate(dados.validade, 'Validade do Orçamento');
        this.validateNumber(dados.valor_total, 'Valor Total', 0);
        this.validateRequired(dados.forma_pagamento, 'Forma de Pagamento');
        return true;
    }
}

// ========== GERENCIADOR DE API ==========
class ApiManager {
    static getBaseUrl() {
        return CONFIG?.API_BASE_URL || (window.location.hostname === 'localhost' 
            ? 'http://localhost:3001'
            : 'https://portal-dr-marcio-production.up.railway.app');
    }
    
    static async request(url, options = {}) {
        try {
            const fullUrl = url.startsWith('http') ? url : `${this.getBaseUrl()}${url}`;
            console.log('🌐 API Request:', fullUrl);
            
            const response = await fetch(fullUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            NotificationManager.show(`Erro na comunicação: ${error.message}`, 'error');
            throw error;
        }
    }
    
    static async get(url) {
        return this.request(url, { method: 'GET' });
    }
    
    static async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    static async put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    static async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
}

// ========== UTILITÁRIOS ==========
class Utils {
    static formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
    
    static formatDate(date, options = {}) {
        if (!date) return '';
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            ...options
        }).format(new Date(date));
    }
    
    static formatDateTime(date) {
        if (!date) return '';
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
    
    static generateId(prefix = 'ID') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    static sanitizeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    static showLoading(element, show = true) {
        if (show) {
            element.classList.add('loading');
            element.disabled = true;
        } else {
            element.classList.remove('loading');
            element.disabled = false;
        }
    }
}

// ========== SISTEMA DE AUTENTICAÇÃO MELHORADO ==========
class AuthManager {
    static checkAuth() {
        const userInfo = localStorage.getItem('userInfo');
        
        if (!userInfo) {
            console.log('❌ Nenhuma sessão encontrada - redirecionando para login');
            this.redirectToLogin();
            return false;
        }
        
        try {
            const user = JSON.parse(userInfo);
            console.log('👤 Usuário logado:', user.nome, '| Tipo:', user.tipo, '| Autorizado:', user.autorizado);
            
            // Verificar se funcionário está autorizado
            if (user.tipo === 'funcionario' && !user.autorizado) {
                console.log('⛔ Funcionário não autorizado - redirecionando para login');
                NotificationManager.show('Seu acesso ainda não foi autorizado pelo administrador.', 'warning');
                setTimeout(() => {
                    this.logout();
                }, 2000);
                return false;
            }
            
            return user;
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            this.logout();
            return false;
        }
    }
    
    static logout() {
        localStorage.removeItem('userInfo');
        this.redirectToLogin();
    }
    
    static redirectToLogin() {
        window.location.href = '/login.html';
    }
    
    static redirectToDashboard() {
        const userInfo = localStorage.getItem('userInfo');
        
        if (userInfo) {
            const user = JSON.parse(userInfo);
            window.location.href = '/dashboard.html';
        } else {
            this.redirectToLogin();
        }
    }
}

// ========== GERENCIADOR DE ORÇAMENTOS MELHORADO ==========
class OrcamentoManager {
    static async salvarNovoOrcamento(dadosFormulario) {
        try {
            // Validar dados
            FormValidator.validateOrcamento(dadosFormulario);
            
            const novoOrcamento = {
                id: Utils.generateId('ORC'),
                ...dadosFormulario,
                data_orcamento: new Date().toISOString().split('T')[0],
                status_orcamento: 'Pendente',
                pagamento_status: 'Pendente',
                data_criacao: new Date().toISOString()
            };
            
            // Tentar salvar via API
            try {
                // Primeira tentativa: nova API de pacientes
                const resultado = await ApiManager.post('/api/pacientes/orcamento', novoOrcamento);
                if (resultado.success) {
                    dadosOriginais.push(resultado.orcamento);
                    NotificationManager.show('Orçamento criado com sucesso!', 'success');
                } else {
                    throw new Error('Nova API não retornou sucesso');
                }
            } catch (apiError) {
                console.warn('Nova API falhou, tentando API antiga:', apiError);
                try {
                    // Fallback: API antiga
                    const resultado = await ApiManager.post('/api/orcamentos', novoOrcamento);
                    dadosOriginais.push(resultado);
                    NotificationManager.show('Orçamento criado com sucesso!', 'success');
                } catch (fallbackError) {
                    // Fallback final: dados locais
                    dadosOriginais.push(novoOrcamento);
                    NotificationManager.show('Orçamento criado localmente (API indisponível)', 'warning');
                }
            }
            
            dadosFiltrados = [...dadosOriginais];
            atualizarTabela();
            atualizarEstatisticas();
            fecharModalOrcamento();
            
        } catch (error) {
            NotificationManager.show(`Erro ao criar orçamento: ${error.message}`, 'error');
        }
    }
    
    static async atualizarStatus(id, novoStatus, statusPagamento = null) {
        try {
            const orcamento = dadosOriginais.find(item => item.id === id);
            if (!orcamento) {
                throw new Error('Orçamento não encontrado');
            }
            
            orcamento.status_orcamento = novoStatus;
            if (statusPagamento) {
                orcamento.pagamento_status = statusPagamento;
            }
            orcamento.data_ultima_update = new Date().toISOString();
            
            // Tentar atualizar via API
            try {
                await ApiManager.put(`/api/orcamentos/${id}`, orcamento);
            } catch (apiError) {
                console.warn('Atualização via API falhou, dados salvos localmente');
            }
            
            atualizarTabela();
            atualizarEstatisticas();
            NotificationManager.show('Status atualizado com sucesso!', 'success');
            
        } catch (error) {
            NotificationManager.show(`Erro ao atualizar status: ${error.message}`, 'error');
        }
    }
    
    static gerarPDF(orcamento) {
        try {
            if (typeof window.jspdf === 'undefined') {
                throw new Error('Biblioteca jsPDF não encontrada');
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Cabeçalho
            doc.setFontSize(20);
            doc.text('ORÇAMENTO - DR. MARCIO SCARTOZZONI', 20, 30);
            doc.setFontSize(12);
            doc.text('Cirurgia Plástica', 20, 40);
            
            // Dados do orçamento
            doc.setFontSize(14);
            doc.text(`Orçamento: ${orcamento.id}`, 20, 60);
            doc.text(`Paciente: ${orcamento.paciente_nome}`, 20, 70);
            doc.text(`Data: ${Utils.formatDate(orcamento.data_orcamento)}`, 20, 80);
            
            // Procedimentos
            doc.text('PROCEDIMENTOS:', 20, 100);
            doc.setFontSize(12);
            doc.text(`• ${orcamento.procedimento_principal}`, 25, 110);
            if (orcamento.procedimentos_adicionais) {
                doc.text(`• ${orcamento.procedimentos_adicionais}`, 25, 120);
            }
            
            // Valores
            doc.setFontSize(14);
            doc.text('VALORES:', 20, 140);
            doc.setFontSize(12);
            doc.text(`Procedimento: ${Utils.formatCurrency(orcamento.valor_total)}`, 25, 150);
            doc.text(`Anestesia: ${Utils.formatCurrency(orcamento.valor_anestesia || 0)}`, 25, 160);
            doc.text(`Hospital: ${Utils.formatCurrency(orcamento.valor_hospital || 0)}`, 25, 170);
            doc.text(`Material: ${Utils.formatCurrency(orcamento.valor_material || 0)}`, 25, 180);
            
            doc.setFontSize(16);
            doc.text(`TOTAL: ${Utils.formatCurrency(orcamento.valor_total)}`, 25, 200);
            
            // Forma de pagamento
            doc.setFontSize(12);
            doc.text(`Forma de Pagamento: ${orcamento.forma_pagamento}`, 20, 220);
            doc.text(`Validade: ${Utils.formatDate(orcamento.validade)}`, 20, 230);
            
            if (orcamento.observacoes) {
                doc.text('Observações:', 20, 250);
                doc.text(orcamento.observacoes, 20, 260);
            }
            
            doc.save(`Orcamento_${orcamento.id}_${orcamento.paciente_nome}.pdf`);
            NotificationManager.show('PDF gerado com sucesso!', 'success');
            
        } catch (error) {
            NotificationManager.show(`Erro ao gerar PDF: ${error.message}`, 'error');
        }
    }
}

// ========== FUNÇÕES PRINCIPAIS ==========

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação primeiro
    if (!AuthManager.checkAuth()) {
        return;
    }
    
    initializeApp();
});

async function initializeApp() {
    try {
        await carregarDados();
        configurarEventos();
        await carregarPacientes();
        definirDataPadrao();
        carregarFiltrosSalvos();
        
        NotificationManager.show('Sistema carregado com sucesso!', 'success');
    } catch (error) {
        NotificationManager.show(`Erro ao inicializar sistema: ${error.message}`, 'error');
    }
}

function configurarEventos() {
    // Form de novo orçamento com validação melhorada
    const formOrcamento = document.getElementById('formNovoOrcamento');
    if (formOrcamento) {
        formOrcamento.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            Utils.showLoading(submitBtn, true);
            
            try {
                const dadosFormulario = new FormData(e.target);
                const dados = Object.fromEntries(dadosFormulario);
                await OrcamentoManager.salvarNovoOrcamento(dados);
            } catch (error) {
                NotificationManager.show(`Erro ao salvar: ${error.message}`, 'error');
            } finally {
                Utils.showLoading(submitBtn, false);
            }
        });
    }
    
    // Filtros com debounce para melhor performance
    const filtroNome = document.getElementById('filtroNome');
    const filtroId = document.getElementById('filtroId');
    
    if (filtroNome) {
        filtroNome.addEventListener('input', Utils.debounce(aplicarFiltros, 300));
    }
    if (filtroId) {
        filtroId.addEventListener('input', Utils.debounce(aplicarFiltros, 300));
    }
    
    const filtroStatus = document.getElementById('filtroStatus');
    if (filtroStatus) {
        filtroStatus.addEventListener('change', aplicarFiltros);
    }
    
    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
        // ESC para fechar modais
        if (e.key === 'Escape') {
            fecharTodosModais();
        }
        
        // Ctrl+F para focar no filtro de nome
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const filtroNome = document.getElementById('filtroNome');
            if (filtroNome) {
                filtroNome.focus();
            }
        }
        
        // Ctrl+N para novo orçamento
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            adicionarOrcamento();
        }
    });
}

function definirDataPadrao() {
    const hoje = new Date().toISOString().split('T')[0];
    const dataConsulta = document.getElementById('dataConsulta');
    if (dataConsulta) {
        dataConsulta.value = hoje;
    }
    
    // Definir validade para 30 dias
    const validade = new Date();
    validade.setDate(validade.getDate() + 30);
    const validadeOrcamento = document.getElementById('validadeOrcamento');
    if (validadeOrcamento) {
        validadeOrcamento.value = validade.toISOString().split('T')[0];
    }
}

async function carregarDados() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'block';
    }
    
    try {
        // Tentar carregar dados da API
        const dados = await ApiManager.get('/api/orcamentos/dados');
        dadosOriginais = dados;
        dadosFiltrados = [...dados];
        
    } catch (error) {
        console.warn('Erro ao carregar dados da API, usando dados de demonstração:', error);
        
        // Dados de demonstração aprimorados
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
                observacoes: 'Paciente tem interesse em realizar em dezembro',
                data_criacao: '2025-07-25T10:00:00Z'
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
                observacoes: 'Próteses de silicone 350ml cada',
                data_criacao: '2025-07-28T14:30:00Z'
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
                observacoes: 'Aguardando confirmação da paciente',
                data_criacao: '2025-07-29T09:15:00Z'
            }
        ];
        dadosFiltrados = [...dadosOriginais];
        
        NotificationManager.show('Usando dados de demonstração (API indisponível)', 'warning');
    } finally {
        if (loading) {
            loading.style.display = 'none';
        }
        
        atualizarTabela();
        atualizarEstatisticas();
    }
}

async function carregarPacientes() {
    const select = document.getElementById('pacienteOrcamento');
    if (!select) return;
    
    try {
        // Tentar carregar da nova API de pacientes
        console.log('🔍 Carregando pacientes da API...');
        const response = await ApiManager.get('/api/pacientes/lista');
        
        if (response.success && response.pacientes) {
            select.innerHTML = '<option value="">Selecione o paciente</option>';
            response.pacientes.forEach(paciente => {
                select.innerHTML += `<option value="${paciente.id}">${paciente.nome} - ${paciente.cpf}</option>`;
            });
            console.log('✅ Pacientes carregados:', response.pacientes.length);
        } else {
            throw new Error('Resposta inválida da API');
        }
        
    } catch (error) {
        console.warn('⚠️ API de pacientes indisponível, usando dados de exemplo:', error);
        // Pacientes de exemplo
        const pacientes = [
            { id: 'PAC001', nome: 'Maria Silva', cpf: '111.111.111-11' },
            { id: 'PAC002', nome: 'Ana Costa', cpf: '222.222.222-22' },
            { id: 'PAC003', nome: 'Julia Santos', cpf: '333.333.333-33' },
            { id: 'PAC004', nome: 'Fernanda Lima', cpf: '444.444.444-44' },
            { id: 'PAC005', nome: 'Carla Mendes', cpf: '555.555.555-55' }
        ];
        
        select.innerHTML = '<option value="">Selecione o paciente</option>';
        pacientes.forEach(paciente => {
            select.innerHTML += `<option value="${paciente.id}">${paciente.nome} - ${paciente.cpf}</option>`;
        });
    }
}

function atualizarTabela() {
    const tbody = document.getElementById('corpoTabela');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    dadosFiltrados.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.paciente_nome}</td>
            <td>${Utils.formatDate(item.data_consulta)}</td>
            <td>${Utils.formatDate(item.data_orcamento)}</td>
            <td>${item.procedimento_principal}</td>
            <td>${Utils.formatCurrency(item.valor_total)}</td>
            <td><span class="status-badge status-${item.status_orcamento.toLowerCase().replace(' ', '-')}">${item.status_orcamento}</span></td>
            <td><span class="status-badge status-${item.pagamento_status.toLowerCase().replace(' ', '-')}">${item.pagamento_status}</span></td>
            <td>${Utils.formatDate(item.validade)}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="abrirAcoesOrcamento('${item.id}')" class="btn-actions" title="Ações">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button onclick="visualizarOrcamento('${item.id}')" class="btn-view" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function atualizarEstatisticas() {
    const totalElement = document.getElementById('totalOrcamentos');
    const pendentesElement = document.getElementById('orcamentosPendentes');
    const aceitosElement = document.getElementById('orcamentosAceitos');
    const valorPendenteElement = document.getElementById('valorTotalPendente');
    
    if (totalElement) {
        totalElement.textContent = dadosOriginais.length;
    }
    
    const pendentes = dadosOriginais.filter(item => item.status_orcamento === 'Pendente').length;
    if (pendentesElement) {
        pendentesElement.textContent = pendentes;
    }
    
    const aceitos = dadosOriginais.filter(item => item.status_orcamento === 'Aceito').length;
    if (aceitosElement) {
        aceitosElement.textContent = aceitos;
    }
    
    const valorPendente = dadosOriginais
        .filter(item => item.status_orcamento === 'Pendente' || item.status_orcamento === 'Enviado')
        .reduce((total, item) => total + item.valor_total, 0);
    
    if (valorPendenteElement) {
        valorPendenteElement.textContent = Utils.formatCurrency(valorPendente);
    }
}

// ========== FUNÇÕES DE MODAL ==========

function adicionarOrcamento() {
    const modal = document.getElementById('modalNovoOrcamento');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharModalOrcamento() {
    const modal = document.getElementById('modalNovoOrcamento');
    if (modal) {
        modal.style.display = 'none';
    }
    
    const form = document.getElementById('formNovoOrcamento');
    if (form) {
        form.reset();
    }
    
    definirDataPadrao();
}

function fecharTodosModais() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

function abrirAcoesOrcamento(id) {
    orcamentoAtual = dadosOriginais.find(item => item.id === id);
    if (!orcamentoAtual) return;
    
    // Preencher informações do modal
    const infoElements = {
        'infoOrcamento': `${orcamentoAtual.id} - ${orcamentoAtual.paciente_nome}`,
        'infoProcedimento': orcamentoAtual.procedimento_principal,
        'infoValor': Utils.formatCurrency(orcamentoAtual.valor_total),
        'infoStatus': orcamentoAtual.status_orcamento,
        'infoValidade': Utils.formatDate(orcamentoAtual.validade)
    };
    
    Object.entries(infoElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    const modal = document.getElementById('modalAcoesOrcamento');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharModalAcoes() {
    const modal = document.getElementById('modalAcoesOrcamento');
    if (modal) {
        modal.style.display = 'none';
    }
    orcamentoAtual = null;
}

// ========== AÇÕES DO ORÇAMENTO ==========

function gerarPDFOrcamento() {
    if (!orcamentoAtual) return;
    OrcamentoManager.gerarPDF(orcamentoAtual);
}

function marcarComoAceito() {
    if (!orcamentoAtual) return;
    
    if (confirm('Marcar orçamento como aceito?')) {
        OrcamentoManager.atualizarStatus(orcamentoAtual.id, 'Aceito', 'Aguardando Entrada');
        fecharModalAcoes();
    }
}

// ========== SISTEMA DE FILTROS ==========

function aplicarFiltros() {
    const filtroId = document.getElementById('filtroId')?.value.toLowerCase() || '';
    const filtroNome = document.getElementById('filtroNome')?.value.toLowerCase() || '';
    const filtroStatus = document.getElementById('filtroStatus')?.value || '';
    const filtroDataInicio = document.getElementById('filtroDataInicio')?.value || '';
    const filtroDataFim = document.getElementById('filtroDataFim')?.value || '';
    
    dadosFiltrados = dadosOriginais.filter(item => {
        let passa = true;
        
        if (filtroId && !item.id.toLowerCase().includes(filtroId)) {
            passa = false;
        }
        
        if (filtroNome && !item.paciente_nome.toLowerCase().includes(filtroNome)) {
            passa = false;
        }
        
        if (filtroStatus && item.status_orcamento !== filtroStatus) {
            passa = false;
        }
        
        if (filtroDataInicio) {
            const dataOrcamento = new Date(item.data_orcamento);
            const dataInicio = new Date(filtroDataInicio);
            if (dataOrcamento < dataInicio) {
                passa = false;
            }
        }
        
        if (filtroDataFim) {
            const dataOrcamento = new Date(item.data_orcamento);
            const dataFim = new Date(filtroDataFim);
            if (dataOrcamento > dataFim) {
                passa = false;
            }
        }
        
        return passa;
    });
    
    atualizarTabela();
    salvarFiltros();
}

function limparFiltros() {
    const filtros = ['filtroId', 'filtroNome', 'filtroStatus', 'filtroDataInicio', 'filtroDataFim'];
    filtros.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.value = '';
        }
    });
    
    dadosFiltrados = [...dadosOriginais];
    atualizarTabela();
    localStorage.removeItem('filtrosOrcamento');
}

function salvarFiltros() {
    const filtros = {
        id: document.getElementById('filtroId')?.value || '',
        nome: document.getElementById('filtroNome')?.value || '',
        status: document.getElementById('filtroStatus')?.value || '',
        dataInicio: document.getElementById('filtroDataInicio')?.value || '',
        dataFim: document.getElementById('filtroDataFim')?.value || ''
    };
    localStorage.setItem('filtrosOrcamento', JSON.stringify(filtros));
}

function carregarFiltrosSalvos() {
    const filtrosSalvos = localStorage.getItem('filtrosOrcamento');
    if (filtrosSalvos) {
        try {
            const filtros = JSON.parse(filtrosSalvos);
            Object.entries(filtros).forEach(([key, value]) => {
                const elemento = document.getElementById(`filtro${key.charAt(0).toUpperCase() + key.slice(1)}`);
                if (elemento && value) {
                    elemento.value = value;
                }
            });
            aplicarFiltros();
        } catch (error) {
            console.warn('Erro ao carregar filtros salvos:', error);
        }
    }
}

// ========== FUNÇÕES UTILITÁRIAS ESPECÍFICAS ==========

function voltarDashboard() {
    AuthManager.redirectToDashboard();
}

function visualizarOrcamento(id) {
    const orcamento = dadosOriginais.find(item => item.id === id);
    if (orcamento) {
        // Implementar visualização detalhada
        NotificationManager.show('Funcionalidade de visualização em desenvolvimento', 'info');
    }
}

function calcularValorTotal() {
    const campos = ['valorProcedimento', 'valorAnestesia', 'valorHospital', 'valorMaterial'];
    let total = 0;
    
    campos.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) {
            total += parseFloat(elemento.value) || 0;
        }
    });
    
    const totalElement = document.getElementById('valorTotal');
    if (totalElement) {
        totalElement.value = total.toFixed(2);
    }
}

// Fechar modal clicando fora
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ========== EXPORTAÇÃO DE DADOS ==========

function exportarDados() {
    try {
        const headers = [
            'ID', 'Paciente', 'Data Consulta', 'Data Orçamento', 'Procedimento',
            'Valor Total', 'Status Orçamento', 'Status Pagamento', 'Validade',
            'Forma Pagamento', 'Observações'
        ];
        
        let csvContent = headers.join(',') + '\n';
        
        dadosFiltrados.forEach(item => {
            const row = [
                item.id,
                `"${item.paciente_nome}"`,
                Utils.formatDate(item.data_consulta),
                Utils.formatDate(item.data_orcamento),
                `"${item.procedimento_principal}"`,
                item.valor_total,
                item.status_orcamento,
                item.pagamento_status,
                Utils.formatDate(item.validade),
                item.forma_pagamento,
                `"${item.observacoes || ''}"`
            ];
            csvContent += row.join(',') + '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `orcamentos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        NotificationManager.show('Dados exportados com sucesso!', 'success');
        
    } catch (error) {
        NotificationManager.show(`Erro ao exportar dados: ${error.message}`, 'error');
    }
}

// Função para abrir agendamento rápido
function abrirAgendamentoRapido() {
    window.open('agendar.html', '_blank');
}

// ========== SISTEMA DE TABS ==========
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPanel = button.getAttribute('aria-controls');
            
            // Remover active de todos
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
            });
            
            // Ativar o selecionado
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
            document.getElementById(targetPanel).classList.add('active');
            
            // Carregar dados do painel ativo
            if (targetPanel === 'panel-pacientes') {
                carregarDadosPacientes();
            } else if (targetPanel === 'panel-logs') {
                carregarDadosLogs();
            }
        });
    });
}

// ========== GESTÃO DE PACIENTES ==========

let dadosPacientes = [];
let dadosPacientesFiltrados = [];

async function carregarDadosPacientes() {
    console.log('🔍 Carregando dados dos pacientes...');
    
    try {
        const response = await ApiManager.get('/api/pacientes/lista');
        
        if (response.success && response.pacientes) {
            dadosPacientes = response.pacientes;
            dadosPacientesFiltrados = [...dadosPacientes];
            console.log('✅ Pacientes carregados:', dadosPacientes.length);
        } else {
            throw new Error('Resposta inválida da API');
        }
        
    } catch (error) {
        console.warn('⚠️ API indisponível, usando dados de exemplo:', error);
        
        // Dados de exemplo
        dadosPacientes = [
            {
                id: 1,
                nome: 'Maria Silva Santos',
                cpf: '111.111.111-11',
                email: 'maria.silva@email.com',
                telefone: '(11) 99999-1111',
                tem_acesso_dashboard: true,
                status: 'ativo',
                data_cadastro: '2025-01-15'
            },
            {
                id: 2,
                nome: 'Ana Costa Lima',
                cpf: '222.222.222-22',
                email: 'ana.costa@email.com',
                telefone: '(11) 99999-2222',
                tem_acesso_dashboard: false,
                status: 'ativo',
                data_cadastro: '2025-02-20'
            },
            {
                id: 3,
                nome: 'Julia Santos Oliveira',
                cpf: '333.333.333-33',
                email: 'julia.santos@email.com',
                telefone: '(11) 99999-3333',
                tem_acesso_dashboard: true,
                status: 'inativo',
                data_cadastro: '2025-03-10'
            }
        ];
        
        dadosPacientesFiltrados = [...dadosPacientes];
        NotificationManager.show('Usando dados de demonstração para pacientes', 'warning');
    }
    
    atualizarTabelaPacientes();
    atualizarEstatisticasPacientes();
}

function atualizarTabelaPacientes() {
    const tbody = document.getElementById('corpoTabelaPacientes');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    dadosPacientesFiltrados.forEach(paciente => {
        const statusClass = `status-${paciente.status}`;
        const acessoClass = paciente.tem_acesso_dashboard ? 'com-acesso' : 'sem-acesso';
        const acessoTexto = paciente.tem_acesso_dashboard ? 'Sim' : 'Não';
        const acessoIcon = paciente.tem_acesso_dashboard ? 'fas fa-check' : 'fas fa-times';
        
        tbody.innerHTML += `
            <tr>
                <td>${paciente.id}</td>
                <td>${paciente.nome}</td>
                <td>${paciente.cpf}</td>
                <td>${paciente.email}</td>
                <td>${paciente.telefone}</td>
                <td>
                    <span class="acesso-dashboard ${acessoClass}">
                        <i class="${acessoIcon}"></i>
                        ${acessoTexto}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${paciente.status}
                    </span>
                </td>
                <td>
                    <button onclick="abrirModalAcoesPaciente(${paciente.id})" class="btn btn-sm btn-primary">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function atualizarEstatisticasPacientes() {
    const total = dadosPacientes.length;
    const ativos = dadosPacientes.filter(p => p.status === 'ativo').length;
    const novosEsteMes = dadosPacientes.filter(p => {
        const cadastro = new Date(p.data_cadastro);
        const agora = new Date();
        return cadastro.getMonth() === agora.getMonth() && cadastro.getFullYear() === agora.getFullYear();
    }).length;
    
    document.getElementById('totalPacientes').textContent = total;
    document.getElementById('pacientesAtivos').textContent = ativos;
    document.getElementById('pacientesNovos').textContent = novosEsteMes;
    document.getElementById('consultasAgendadas').textContent = '5'; // Mock data
}

function filtrarPacientes() {
    const filtroNome = document.getElementById('filtroNomePaciente').value.toLowerCase();
    const filtroCpf = document.getElementById('filtroCpfPaciente').value;
    const filtroStatus = document.getElementById('filtroStatusPaciente').value;
    const filtroAcesso = document.getElementById('filtroAcessoDashboard').value;
    
    dadosPacientesFiltrados = dadosPacientes.filter(paciente => {
        const matchNome = !filtroNome || paciente.nome.toLowerCase().includes(filtroNome);
        const matchCpf = !filtroCpf || paciente.cpf.includes(filtroCpf);
        const matchStatus = !filtroStatus || paciente.status === filtroStatus;
        const matchAcesso = !filtroAcesso || paciente.tem_acesso_dashboard.toString() === filtroAcesso;
        
        return matchNome && matchCpf && matchStatus && matchAcesso;
    });
    
    atualizarTabelaPacientes();
    NotificationManager.show(`${dadosPacientesFiltrados.length} paciente(s) encontrado(s)`, 'info');
}

function limparFiltrosPacientes() {
    document.getElementById('filtroNomePaciente').value = '';
    document.getElementById('filtroCpfPaciente').value = '';
    document.getElementById('filtroStatusPaciente').value = '';
    document.getElementById('filtroAcessoDashboard').value = '';
    
    dadosPacientesFiltrados = [...dadosPacientes];
    atualizarTabelaPacientes();
}

// Modal de ações do paciente
let pacienteSelecionado = null;

function abrirModalAcoesPaciente(pacienteId) {
    pacienteSelecionado = dadosPacientes.find(p => p.id === pacienteId);
    if (!pacienteSelecionado) return;
    
    document.getElementById('nomePacienteSelecionado').textContent = pacienteSelecionado.nome;
    document.getElementById('detalhesPacienteSelecionado').textContent = 
        `CPF: ${pacienteSelecionado.cpf} | Email: ${pacienteSelecionado.email}`;
    
    document.getElementById('modalAcoesPaciente').style.display = 'flex';
}

function fecharModalAcoesPaciente() {
    document.getElementById('modalAcoesPaciente').style.display = 'none';
    pacienteSelecionado = null;
}

function editarPaciente() {
    NotificationManager.show('Funcionalidade de edição em desenvolvimento', 'info');
    fecharModalAcoesPaciente();
}

function verHistoricoPaciente() {
    if (pacienteSelecionado) {
        NotificationManager.show(`Carregando histórico de ${pacienteSelecionado.nome}...`, 'info');
        // Implementar busca por histórico via API
    }
    fecharModalAcoesPaciente();
}

        function gerenciarAcesso() {
            if (pacienteSelecionado) {
                const novoAcesso = !pacienteSelecionado.tem_acesso_dashboard;
                const acao = novoAcesso ? 'conceder' : 'revogar';
                
                if (confirm(`Deseja ${acao} acesso ao dashboard para ${pacienteSelecionado.nome}?`)) {
                    // Atualizar via API
                    atualizarAcessoPaciente(pacienteSelecionado.id, novoAcesso);
                }
            }
            fecharModalAcoesPaciente();
        }
        
        async function atualizarAcessoPaciente(pacienteId, novoAcesso) {
            try {
                const response = await ApiManager.put(`/api/pacientes/${pacienteId}/acesso`, {
                    tem_acesso_dashboard: novoAcesso
                });
                
                if (response.success) {
                    // Atualizar dados locais
                    const paciente = dadosPacientes.find(p => p.id === pacienteId);
                    if (paciente) {
                        paciente.tem_acesso_dashboard = novoAcesso;
                        atualizarTabelaPacientes();
                    }
                    
                    NotificationManager.show(`Acesso ${novoAcesso ? 'concedido' : 'revogado'} com sucesso!`, 'success');
                    
                    // Log da ação no frontend
                    console.log(`📝 ADMIN ACTION: Acesso ${novoAcesso ? 'concedido' : 'revogado'} para paciente ID ${pacienteId}`);
                } else {
                    NotificationManager.show('Erro ao atualizar acesso', 'error');
                }
                
            } catch (error) {
                console.error('Erro ao atualizar acesso:', error);
                NotificationManager.show('Erro de comunicação com o servidor', 'error');
            }
        }function agendarConsulta() {
    if (pacienteSelecionado) {
        NotificationManager.show('Redirecionando para agendamento...', 'info');
        // Redirecionar para sistema de agendamento
    }
    fecharModalAcoesPaciente();
}

        function adicionarPaciente() {
            NotificationManager.show('Funcionalidade de cadastro em desenvolvimento', 'info');
        }

        // ========== GESTÃO DE LOGS ADMINISTRATIVOS ==========

        let dadosLogs = [];
        let autoRefreshLogs = false;
        let intervalRefreshLogs = null;

        async function carregarDadosLogs() {
            console.log('🔍 Carregando logs administrativos...');
            
            try {
                const response = await ApiManager.get('/api/admin/logs/recente?horas=24');
                
                if (response.success && response.data) {
                    dadosLogs = response.data.logs || [];
                    console.log('✅ Logs carregados:', dadosLogs.length);
                    
                    // Carregar estatísticas
                    const statsResponse = await ApiManager.get('/api/admin/logs/estatisticas');
                    if (statsResponse.success) {
                        atualizarEstatisticasLogs(statsResponse.data);
                    }
                } else {
                    throw new Error('Resposta inválida da API');
                }
                
            } catch (error) {
                console.warn('⚠️ API de logs indisponível, usando dados de exemplo:', error);
                
                // Dados de exemplo
                dadosLogs = [
                    {
                        id: 1,
                        tipo: 'PACIENTE',
                        descricao: 'Paciente Maria Silva cadastrado com sucesso',
                        nome_usuario: 'Dr. Marcio',
                        data_evento: new Date().toISOString(),
                        detalhes: { ip: '192.168.1.1', tem_acesso_dashboard: true }
                    },
                    {
                        id: 2,
                        tipo: 'ORCAMENTO',
                        descricao: 'Orçamento ORC202507001 criado - Valor: R$ 2500.00',
                        nome_usuario: 'Dr. Marcio',
                        data_evento: new Date(Date.now() - 3600000).toISOString(),
                        detalhes: { valor_total: 2500, numero_orcamento: 'ORC202507001' }
                    },
                    {
                        id: 3,
                        tipo: 'ACESSO',
                        descricao: 'Acesso ao dashboard concedido para Ana Costa',
                        nome_usuario: 'Dr. Marcio',
                        data_evento: new Date(Date.now() - 7200000).toISOString(),
                        detalhes: { acao_acesso: 'concedido', ip: '192.168.1.2' }
                    }
                ];
                
                NotificationManager.show('Usando dados de demonstração para logs', 'warning');
            }
            
            atualizarTabelaLogs();
        }

        function atualizarTabelaLogs() {
            const tbody = document.getElementById('corpoTabelaLogs');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            dadosLogs.forEach(log => {
                const data = new Date(log.data_evento);
                const dataFormatada = data.toLocaleString('pt-BR');
                
                const tipoClass = `log-tipo-${log.tipo.toLowerCase()}`;
                
                let detalhesText = '';
                if (log.detalhes && typeof log.detalhes === 'object') {
                    detalhesText = Object.keys(log.detalhes)
                        .map(key => `${key}: ${log.detalhes[key]}`)
                        .join(', ');
                }
                
                tbody.innerHTML += `
                    <tr>
                        <td>${dataFormatada}</td>
                        <td>
                            <span class="tipo-badge ${tipoClass}">
                                ${log.tipo}
                            </span>
                        </td>
                        <td>${log.descricao}</td>
                        <td>${log.nome_usuario || 'Sistema'}</td>
                        <td>
                            <small class="detalhes-log" title="${detalhesText}">
                                ${detalhesText.length > 50 ? detalhesText.substring(0, 50) + '...' : detalhesText}
                            </small>
                        </td>
                    </tr>
                `;
            });
        }

        function atualizarEstatisticasLogs(estatisticas) {
            if (estatisticas.geral) {
                document.getElementById('totalLogs').textContent = estatisticas.geral.total_logs || 0;
                document.getElementById('logs24h').textContent = estatisticas.geral.atividade_24h || 0;
                document.getElementById('usuariosAtivos').textContent = estatisticas.geral.usuarios_ativos || 0;
                
                const atividadeMedia = estatisticas.geral.atividade_24h 
                    ? Math.round(estatisticas.geral.atividade_24h / 24) 
                    : 0;
                document.getElementById('atividadeMedia').textContent = atividadeMedia;
            }
        }

        async function filtrarLogs() {
            const filtros = {
                tipo: document.getElementById('filtroTipoLog').value,
                data_inicio: document.getElementById('filtroDataInicioLog').value,
                data_fim: document.getElementById('filtroDataFimLog').value,
                limit: document.getElementById('filtroLimiteLogs').value
            };
            
            try {
                let url = '/api/admin/logs?';
                Object.keys(filtros).forEach(key => {
                    if (filtros[key]) {
                        url += `${key}=${encodeURIComponent(filtros[key])}&`;
                    }
                });
                
                const response = await ApiManager.get(url);
                
                if (response.success) {
                    dadosLogs = response.data.logs || [];
                    atualizarTabelaLogs();
                    NotificationManager.show(`${dadosLogs.length} log(s) encontrado(s)`, 'info');
                }
                
            } catch (error) {
                console.error('Erro ao filtrar logs:', error);
                NotificationManager.show('Erro ao filtrar logs', 'error');
            }
        }

        function limparFiltrosLogs() {
            document.getElementById('filtroTipoLog').value = '';
            document.getElementById('filtroDataInicioLog').value = '';
            document.getElementById('filtroDataFimLog').value = '';
            document.getElementById('filtroLimiteLogs').value = '100';
            
            carregarDadosLogs();
        }

        function atualizarLogsAutomatico() {
            const btn = document.getElementById('btnAutoRefresh');
            
            if (autoRefreshLogs) {
                // Parar auto-refresh
                autoRefreshLogs = false;
                clearInterval(intervalRefreshLogs);
                btn.innerHTML = '<i class="fas fa-sync"></i> Auto-Atualizar';
                btn.classList.remove('btn-warning');
                btn.classList.add('btn-success');
                NotificationManager.show('Auto-atualização desativada', 'info');
            } else {
                // Iniciar auto-refresh
                autoRefreshLogs = true;
                intervalRefreshLogs = setInterval(carregarDadosLogs, 30000); // A cada 30 segundos
                btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Ativo';
                btn.classList.remove('btn-success');
                btn.classList.add('btn-warning');
                NotificationManager.show('Auto-atualização ativada (30s)', 'success');
            }
        }

        function exportarLogs() {
            try {
                const csvContent = [
                    'Data/Hora,Tipo,Descrição,Usuário,Detalhes',
                    ...dadosLogs.map(log => {
                        const data = new Date(log.data_evento).toLocaleString('pt-BR');
                        const detalhes = log.detalhes ? JSON.stringify(log.detalhes).replace(/"/g, '""') : '';
                        return `"${data}","${log.tipo}","${log.descricao}","${log.nome_usuario || 'Sistema'}","${detalhes}"`;
                    })
                ].join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `logs_sistema_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                NotificationManager.show('Logs exportados com sucesso!', 'success');
                
            } catch (error) {
                NotificationManager.show(`Erro ao exportar logs: ${error.message}`, 'error');
            }
        }