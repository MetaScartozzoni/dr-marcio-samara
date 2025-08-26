// 💰 Exemplos de uso das Edge Functions para gestão financeira

// Exemplo 1: Buscar transações financeiras
async function buscarTransacoes(filters = {}) {
    try {
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.FINANCE_GET_TRANSACTIONS,
            filters
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao buscar transações');
        }
        
        return {
            success: true,
            transactions: result.transactions || [],
            total: result.total || 0,
            summary: result.summary || {}
        };
    } catch (error) {
        console.error('Erro ao buscar transações financeiras:', error);
        return {
            success: false,
            error: error.message,
            transactions: []
        };
    }
}

// Exemplo 2: Criar nova transação
async function criarTransacao(transactionData) {
    try {
        // Validar dados mínimos
        if (!transactionData.amount || !transactionData.type || !transactionData.description) {
            throw new Error('Valor, tipo e descrição são obrigatórios');
        }
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.FINANCE_CREATE_TRANSACTION, 
            { transaction: transactionData }
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao criar transação');
        }
        
        return {
            success: true,
            transaction: result.transaction,
            message: 'Transação criada com sucesso'
        };
    } catch (error) {
        console.error('Erro ao criar transação financeira:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Exemplo 3: Atualizar status de transação
async function atualizarStatusTransacao(transactionId, newStatus, comments = '') {
    try {
        // Validar parâmetros
        if (!transactionId || !newStatus) {
            throw new Error('ID da transação e novo status são obrigatórios');
        }
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.FINANCE_UPDATE_TRANSACTION_STATUS,
            { 
                transaction_id: transactionId,
                status: newStatus,
                comments
            }
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao atualizar status da transação');
        }
        
        return {
            success: true,
            transaction: result.transaction,
            message: 'Status da transação atualizado com sucesso'
        };
    } catch (error) {
        console.error(`Erro ao atualizar status da transação ${transactionId}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Exemplo 4: Gerar relatório financeiro
async function gerarRelatorioFinanceiro(period, filters = {}) {
    try {
        // Validar parâmetros
        if (!period) {
            throw new Error('Período é obrigatório');
        }
        
        // Preparar dados para a requisição
        const requestData = {
            period,
            ...filters
        };
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.FINANCE_GENERATE_REPORT,
            requestData
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao gerar relatório financeiro');
        }
        
        return {
            success: true,
            report: result.report,
            summary: result.summary,
            charts: result.charts
        };
    } catch (error) {
        console.error('Erro ao gerar relatório financeiro:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Exemplo 5: Gerar orçamento para paciente
async function gerarOrcamento(budgetData) {
    try {
        // Validar dados mínimos
        if (!budgetData.patient_id || !budgetData.items || budgetData.items.length === 0) {
            throw new Error('Paciente e itens são obrigatórios');
        }
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.FINANCE_GENERATE_BUDGET,
            { budget: budgetData }
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao gerar orçamento');
        }
        
        return {
            success: true,
            budget: result.budget,
            pdfUrl: result.pdf_url,
            message: 'Orçamento gerado com sucesso'
        };
    } catch (error) {
        console.error('Erro ao gerar orçamento:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Exportar funções para uso global
window.PortalFinanceiro = {
    buscarTransacoes,
    criarTransacao,
    atualizarStatusTransacao,
    gerarRelatorioFinanceiro,
    gerarOrcamento
};

console.log('🚀 Portal Financeiro inicializado');
