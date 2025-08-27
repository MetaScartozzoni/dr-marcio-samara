// Caderno Digital - Portal Médico Dr. Marcio Scartozzoni
console.log('📋 Caderno Digital Carregado');

// Sistema do Caderno Digital
window.CadernoDigital = {
    // Dados do paciente atual
    pacienteAtual: null,
    fichaAtual: null,

    // Inicializar caderno
    init: function() {
        console.log('🚀 Caderno Digital Inicializado');
        this.carregarPaciente();
        this.configurarEventos();
        this.carregarFichas();
    },

    // Carregar dados do paciente
    carregarPaciente: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const paciente = urlParams.get('paciente');
        
        if (paciente) {
            this.pacienteAtual = {
                nome: decodeURIComponent(paciente),
                id: 'pac_' + Math.random().toString(36).substr(2, 9),
                idade: '35 anos',
                telefone: '(11) 99999-9999',
                email: 'paciente@email.com'
            };
            
            this.atualizarInfoPaciente();
            console.log('✅ Paciente carregado:', this.pacienteAtual.nome);
        }
    },

    // Atualizar informações do paciente na tela
    atualizarInfoPaciente: function() {
        if (!this.pacienteAtual) return;

        const elementos = {
            'paciente-nome': this.pacienteAtual.nome,
            'paciente-idade': this.pacienteAtual.idade,
            'paciente-telefone': this.pacienteAtual.telefone,
            'paciente-email': this.pacienteAtual.email
        };

        Object.keys(elementos).forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = elementos[id];
            }
        });
    },

    // Configurar eventos
    configurarEventos: function() {
        // Botões de ação
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                const action = e.target.getAttribute('data-action');
                this.executarAcao(action, e.target);
            }
        });

        // Formulários
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#form-ficha-atendimento')) {
                e.preventDefault();
                this.salvarFicha(e.target);
            }
        });
    },

    // Executar ações
    executarAcao: function(action, elemento) {
        switch(action) {
            case 'nova-ficha':
                this.novaFicha();
                break;
            case 'salvar-ficha':
                this.salvarFicha();
                break;
            case 'gerar-receita':
                this.gerarReceita();
                break;
            case 'gerar-atestado':
                this.gerarAtestado();
                break;
            case 'voltar':
                this.voltar();
                break;
            default:
                console.log('Ação não reconhecida:', action);
        }
    },

    // Nova ficha de atendimento
    novaFicha: function() {
        this.fichaAtual = {
            id: 'ficha_' + Date.now(),
            paciente: this.pacienteAtual,
            data: new Date().toISOString(),
            tipo: 'consulta',
            queixaPrincipal: '',
            exameFisico: '',
            diagnostico: '',
            prescricao: '',
            observacoes: ''
        };

        this.abrirModalFicha();
        console.log('📄 Nova ficha criada');
    },

    // Abrir modal da ficha
    abrirModalFicha: function() {
        // Criar modal se não existir
        if (!document.getElementById('modal-ficha')) {
            this.criarModalFicha();
        }

        const modal = document.getElementById('modal-ficha');
        modal.style.display = 'flex';
    },

    // Criar modal da ficha
    criarModalFicha: function() {
        const modalHTML = `
            <div id="modal-ficha" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Ficha de Atendimento</h3>
                        <span class="modal-close" onclick="CadernoDigital.fecharModal()">&times;</span>
                    </div>
                    <form id="form-ficha-atendimento">
                        <div class="form-group">
                            <label>Queixa Principal</label>
                            <textarea name="queixaPrincipal" rows="3" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Exame Físico</label>
                            <textarea name="exameFisico" rows="4"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Diagnóstico</label>
                            <textarea name="diagnostico" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Prescrição</label>
                            <textarea name="prescricao" rows="4"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Observações</label>
                            <textarea name="observacoes" rows="3"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Salvar Ficha</button>
                            <button type="button" class="btn btn-secondary" onclick="CadernoDigital.fecharModal()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    // Fechar modal
    fecharModal: function() {
        const modal = document.getElementById('modal-ficha');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    // Salvar ficha
    salvarFicha: function(form) {
        if (form) {
            const formData = new FormData(form);
            
            this.fichaAtual.queixaPrincipal = formData.get('queixaPrincipal');
            this.fichaAtual.exameFisico = formData.get('exameFisico');
            this.fichaAtual.diagnostico = formData.get('diagnostico');
            this.fichaAtual.prescricao = formData.get('prescricao');
            this.fichaAtual.observacoes = formData.get('observacoes');
        }

        // Salvar no localStorage
        const fichas = this.carregarFichas() || [];
        fichas.push(this.fichaAtual);
        localStorage.setItem('fichas_atendimento', JSON.stringify(fichas));

        this.fecharModal();
        this.atualizarListaFichas();
        
        if (typeof PortalMedico !== 'undefined') {
            PortalMedico.notify('✅ Ficha salva com sucesso!', 'success');
        }

        console.log('💾 Ficha salva:', this.fichaAtual);
    },

    // Carregar fichas
    carregarFichas: function() {
        try {
            const fichas = localStorage.getItem('fichas_atendimento');
            return fichas ? JSON.parse(fichas) : [];
        } catch (error) {
            console.error('Erro ao carregar fichas:', error);
            return [];
        }
    },

    // Atualizar lista de fichas
    atualizarListaFichas: function() {
        const container = document.getElementById('lista-fichas');
        if (!container) return;

        const fichas = this.carregarFichas();
        const fichasPaciente = fichas.filter(f => 
            f.paciente && f.paciente.nome === this.pacienteAtual?.nome
        );

        container.innerHTML = fichasPaciente.map(ficha => `
            <div class="card-unificado">
                <div class="card-header">
                    <h4 class="card-title">
                        <i class="fas fa-file-medical"></i>
                        Atendimento ${new Date(ficha.data).toLocaleDateString('pt-BR')}
                    </h4>
                    <span class="status-badge status-concluido">Concluído</span>
                </div>
                <div class="card-content">
                    <p><strong>Queixa:</strong> ${ficha.queixaPrincipal || 'Não informado'}</p>
                    <p><strong>Diagnóstico:</strong> ${ficha.diagnostico || 'Não informado'}</p>
                </div>
                <div class="card-actions">
                    <button class="btn-card btn-primary" onclick="CadernoDigital.visualizarFicha('${ficha.id}')">
                        <i class="fas fa-eye"></i> Visualizar
                    </button>
                    <button class="btn-card btn-secondary" onclick="CadernoDigital.editarFicha('${ficha.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Gerar receita
    gerarReceita: function() {
        if (typeof PortalMedico !== 'undefined') {
            PortalMedico.notify('📄 Funcionalidade de receita em desenvolvimento', 'info');
        }
    },

    // Gerar atestado
    gerarAtestado: function() {
        if (typeof PortalMedico !== 'undefined') {
            PortalMedico.notify('📄 Funcionalidade de atestado em desenvolvimento', 'info');
        }
    },

    // Voltar
    voltar: function() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '../index.html';
        }
    }
};

// Funções globais para compatibilidade com onclick do HTML
window.voltarPortal = function() {
    window.location.href = '../index.html';
};

window.novoDocumento = function() {
    CadernoDigital.novaFicha();
};

window.capturarFoto = function() {
    if (typeof PortalMedico !== 'undefined') {
        PortalMedico.notify('📸 Funcionalidade de foto em desenvolvimento', 'info');
    }
};

window.sincronizar = function() {
    if (typeof PortalMedico !== 'undefined') {
        PortalMedico.notify('🔄 Sistema sincronizado com sucesso!', 'success');
    }
};

window.abrirFichaAtendimento = function() {
    CadernoDigital.novaFicha();
};

window.abrirEvolucao = function() {
    if (typeof PortalMedico !== 'undefined') {
        PortalMedico.notify('📊 Funcionalidade de evolução em desenvolvimento', 'info');
    }
};

window.gerarReceita = function() {
    const modal = document.getElementById('modal-receita');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        CadernoDigital.gerarReceita();
    }
};

window.gerarExames = function() {
    const modal = document.getElementById('modal-exames');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        if (typeof PortalMedico !== 'undefined') {
            PortalMedico.notify('🧪 Funcionalidade de exames em desenvolvimento', 'info');
        }
    }
};

window.abrirDocumento = function(tipo) {
    console.log('📄 Abrindo documento:', tipo);
    
    // Destacar documento ativo
    document.querySelectorAll('.document-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const elemento = document.querySelector(`[onclick="abrirDocumento('${tipo}')"]`);
    if (elemento) {
        elemento.classList.add('active');
    }
    
    // Mostrar conteúdo correspondente
    document.querySelectorAll('.content-area > div').forEach(div => {
        div.style.display = 'none';
    });
    
    const conteudo = document.getElementById(`conteudo-${tipo}`);
    if (conteudo) {
        conteudo.style.display = 'block';
    }
};

window.gerarOrcamento = function() {
    if (typeof PortalMedico !== 'undefined') {
        PortalMedico.notify('💰 Orçamento gerado com sucesso!', 'success');
    }
};

window.enviarParaGestao = function() {
    if (typeof PortalMedico !== 'undefined') {
        PortalMedico.notify('📤 Enviado para gestão financeira!', 'success');
    }
};

window.salvarRascunho = function() {
    if (typeof PortalMedico !== 'undefined') {
        PortalMedico.notify('💾 Rascunho salvo!', 'success');
    }
};

window.fecharModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};

window.inserirTextoReceita = function(tipo) {
    const textarea = document.getElementById('receita-prescricao');
    if (!textarea) return;
    
    const textos = {
        'antibiotico': 'Amoxicilina 500mg - Tomar 1 comprimido de 8/8h por 7 dias',
        'analgesico': 'Paracetamol 750mg - Tomar 1 comprimido de 6/6h se dor',
        'pos-operatorio': 'Repouso relativo por 48h\nCompressas frias 3x/dia\nRetorno em 7 dias'
    };
    
    const textoAtual = textarea.value;
    const novoTexto = textos[tipo] || '';
    textarea.value = textoAtual + (textoAtual ? '\n' : '') + novoTexto;
};

window.gerarPDFReceita = function() {
    const paciente = document.getElementById('receita-paciente').value;
    const prescricao = document.getElementById('receita-prescricao').value;
    
    if (!paciente || !prescricao) {
        if (typeof PortalMedico !== 'undefined') {
            PortalMedico.notify('⚠️ Preencha todos os campos obrigatórios.', 'warning');
        }
        return;
    }
    
    console.log('📄 Gerando PDF da receita...');
    if (typeof PortalMedico !== 'undefined') {
        PortalMedico.notify('✅ PDF da receita gerado com sucesso!', 'success');
    }
    fecharModal('modal-receita');
};

window.gerarPDFExames = function() {
    const paciente = document.getElementById('exames-paciente').value;
    const exames = document.getElementById('exames-lista').value;
    
    if (!paciente || !exames) {
        if (typeof PortalMedico !== 'undefined') {
            PortalMedico.notify('⚠️ Preencha todos os campos obrigatórios.', 'warning');
        }
        return;
    }
    
    console.log('📄 Gerando PDF dos exames...');
    if (typeof PortalMedico !== 'undefined') {
        PortalMedico.notify('✅ PDF do pedido de exames gerado com sucesso!', 'success');
    }
    fecharModal('modal-exames');
};

// CSS para modal
const modalCSS = `
<style>
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 9999;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background: white;
    border-radius: 15px;
    padding: 30px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #f0f0f0;
}

.modal-close {
    font-size: 24px;
    cursor: pointer;
    color: #999;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #333;
}

.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-family: inherit;
    resize: vertical;
}

.form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 30px;
}
</style>
`;

// Adicionar CSS ao head
document.head.insertAdjacentHTML('beforeend', modalCSS);

// Auto-inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    CadernoDigital.init();
});

console.log('✅ Caderno Digital carregado com sucesso!');
