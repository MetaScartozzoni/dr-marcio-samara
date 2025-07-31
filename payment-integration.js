// Sistema de integração entre gestão local e pagamentos online
// Adequação backend-frontend completa

class PaymentIntegration {
    constructor() {
        this.baseUrl = window.location.origin;
        this.apiUrl = `${this.baseUrl}/api/payments`;
        
        // Configuração de status mapeados
        this.statusMapping = {
            'pendente': 'Pendente',
            'aceito': 'Aceito',
            'aprovado': 'Pago',
            'pago': 'Pago',
            'falhou': 'Falha Pagamento',
            'cancelado': 'Cancelado'
        };
    }

    // Gerar link de pagamento online para orçamento existente
    async gerarLinkPagamento(orcamentoId, metodoPagamento = 'stripe') {
        try {
            const response = await fetch(`${this.apiUrl}/payment-link/${orcamentoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ metodoPagamento })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.sucesso && data.checkout_url) {
                return {
                    sucesso: true,
                    url: data.checkout_url,
                    metodoPagamento: metodoPagamento
                };
            } else {
                throw new Error(data.erro || 'Erro ao gerar link de pagamento');
            }
        } catch (error) {
            console.error('Erro ao gerar link de pagamento:', error);
            throw error;
        }
    }

    // Verificar status de pagamento online
    async verificarStatusPagamento(orcamentoId) {
        try {
            const response = await fetch(`${this.apiUrl}/status/${orcamentoId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return { sucesso: false, erro: 'Pagamento não encontrado' };
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.sucesso && data.pagamento) {
                return {
                    sucesso: true,
                    status: data.pagamento.status,
                    statusFormatado: this.statusMapping[data.pagamento.status] || data.pagamento.status,
                    valor: data.pagamento.valor,
                    dataPagamento: data.pagamento.data_pagamento,
                    metodoPagamento: data.pagamento.tipo_pagamento
                };
            } else {
                throw new Error(data.erro || 'Erro ao verificar status');
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            return { sucesso: false, erro: error.message };
        }
    }

    // Sincronizar orçamento local com sistema de pagamentos
    async sincronizarOrcamento(orcamentoLocal) {
        try {
            // Primeiro, verificar se já existe um pagamento para este orçamento
            const statusResult = await this.verificarStatusPagamento(orcamentoLocal.id);
            
            if (statusResult.sucesso) {
                // Atualizar status local se pagamento foi aprovado
                if (statusResult.status === 'aprovado' || statusResult.status === 'pago') {
                    await OrcamentoManager.atualizarStatus(
                        orcamentoLocal.id, 
                        'aceito', 
                        'Pago'
                    );
                    
                    NotificationManager.show(
                        `Pagamento confirmado para orçamento ${orcamentoLocal.numero_orcamento}!`, 
                        'success'
                    );
                    
                    return { sincronizado: true, statusAtualizado: 'Pago' };
                }
            }
            
            return { sincronizado: false, motivo: 'Nenhuma atualização necessária' };
        } catch (error) {
            console.error('Erro na sincronização:', error);
            return { sincronizado: false, erro: error.message };
        }
    }

    // Adicionar botões de pagamento à interface existente
    adicionarBotoesPagamento(orcamento, containerElement) {
        if (!orcamento || !containerElement) return;

        // Verificar se orçamento está em status adequado para pagamento
        const statusPagamentoValido = ['Pendente', 'Aceito'].includes(orcamento.status);
        
        if (!statusPagamentoValido) return;

        const paymentButtonsHtml = `
            <div class="payment-actions" style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #495057;">💳 Pagamento Online</h4>
                <div class="payment-buttons">
                    <button onclick="paymentIntegration.iniciarPagamento('${orcamento.id}', 'stripe')" 
                            class="btn btn-primary" style="margin-right: 10px;">
                        <i class="fas fa-credit-card"></i> Cartão (Stripe)
                    </button>
                    <button onclick="paymentIntegration.iniciarPagamento('${orcamento.id}', 'pagseguro')" 
                            class="btn btn-secondary">
                        <i class="fas fa-university"></i> PagSeguro
                    </button>
                </div>
                <small style="color: #6c757d; display: block; margin-top: 8px;">
                    Links de pagamento serão gerados automaticamente
                </small>
            </div>
        `;

        containerElement.insertAdjacentHTML('beforeend', paymentButtonsHtml);
    }

    // Iniciar processo de pagamento
    async iniciarPagamento(orcamentoId, metodoPagamento) {
        try {
            NotificationManager.show('Gerando link de pagamento...', 'info');

            const resultado = await this.gerarLinkPagamento(orcamentoId, metodoPagamento);
            
            if (resultado.sucesso) {
                // Mostrar modal com opções
                this.mostrarModalPagamento(resultado.url, metodoPagamento);
            } else {
                throw new Error('Falha ao gerar link de pagamento');
            }
        } catch (error) {
            NotificationManager.show(
                `Erro ao iniciar pagamento: ${error.message}`, 
                'error'
            );
        }
    }

    // Modal para exibir link de pagamento
    mostrarModalPagamento(url, metodoPagamento) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>💳 Link de Pagamento Gerado</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <p><strong>Método:</strong> ${metodoPagamento === 'stripe' ? 'Stripe (Cartão)' : 'PagSeguro'}</p>
                    <p>Link de pagamento gerado com sucesso!</p>
                    <div class="payment-link-actions" style="margin: 20px 0;">
                        <a href="${url}" target="_blank" class="btn btn-primary" style="margin-right: 10px;">
                            <i class="fas fa-external-link-alt"></i> Abrir Pagamento
                        </a>
                        <button onclick="navigator.clipboard.writeText('${url}').then(() => 
                            NotificationManager.show('Link copiado!', 'success'))" 
                            class="btn btn-secondary">
                            <i class="fas fa-copy"></i> Copiar Link
                        </button>
                    </div>
                    <small style="color: #6c757d;">
                        O link será aberto em nova aba. O status será atualizado automaticamente após o pagamento.
                    </small>
                </div>
                <div class="modal-footer">
                    <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-default">
                        Fechar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Auto fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Sincronização automática periódica
    iniciarSincronizacaoAutomatica(intervaloMinutos = 5) {
        setInterval(async () => {
            if (dadosOriginais && dadosOriginais.length > 0) {
                for (const orcamento of dadosOriginais) {
                    if (['Pendente', 'Aceito'].includes(orcamento.status)) {
                        await this.sincronizarOrcamento(orcamento);
                    }
                }
            }
        }, intervaloMinutos * 60 * 1000);
    }
}

// Instância global para usar em toda a aplicação
const paymentIntegration = new PaymentIntegration();

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Sistema de integração de pagamentos inicializado');
    
    // Iniciar sincronização automática a cada 5 minutos
    paymentIntegration.iniciarSincronizacaoAutomatica(5);
});

// Extensão do OrcamentoManager existente para integrar pagamentos
if (typeof OrcamentoManager !== 'undefined') {
    // Salvar referência do método original
    const originalExibirDetalhes = OrcamentoManager.exibirDetalhes;
    
    // Sobrescrever método para adicionar botões de pagamento
    OrcamentoManager.exibirDetalhes = function(orcamento) {
        // Chamar método original
        originalExibirDetalhes.call(this, orcamento);
        
        // Adicionar botões de pagamento
        const detailsContainer = document.querySelector('.orcamento-details');
        if (detailsContainer) {
            paymentIntegration.adicionarBotoesPagamento(orcamento, detailsContainer);
        }
    };
    
    console.log('✅ OrcamentoManager estendido com funcionalidades de pagamento');
}

// CSS adicional para integração
const additionalStyles = `
    .payment-actions {
        border-left: 4px solid #007bff;
    }
    
    .payment-buttons .btn {
        font-size: 14px;
        padding: 8px 16px;
    }
    
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    }
    
    .modal-content {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .payment-link-actions .btn {
        text-decoration: none;
        display: inline-block;
    }
`;

// Adicionar CSS ao head
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
