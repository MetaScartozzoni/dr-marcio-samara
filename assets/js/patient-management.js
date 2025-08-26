// 👥 Exemplos de uso das Edge Functions para gerenciamento de pacientes

// Exemplo 1: Buscar pacientes
async function buscarPacientes(searchParams = {}) {
    try {
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.PATIENT_SEARCH, 
            searchParams
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao buscar pacientes');
        }
        
        return {
            success: true,
            patients: result.patients || [],
            total: result.total || 0
        };
    } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
        return {
            success: false,
            error: error.message,
            patients: []
        };
    }
}

// Exemplo 2: Detalhes do paciente
async function obterDetalhesPaciente(patientId) {
    try {
        if (!patientId) {
            throw new Error('ID do paciente é obrigatório');
        }
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.PATIENT_DETAILS, 
            { patient_id: patientId }
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao obter detalhes do paciente');
        }
        
        return {
            success: true,
            patient: result.patient
        };
    } catch (error) {
        console.error(`Erro ao obter detalhes do paciente ${patientId}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Exemplo 3: Salvar dados do paciente
async function salvarDadosPaciente(patientData) {
    try {
        // Validar dados mínimos
        if (!patientData.nome || !patientData.email) {
            throw new Error('Nome e email são obrigatórios');
        }
        
        // Determinar se é criação ou atualização
        const action = patientData.id ? 'update' : 'create';
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.PATIENT_SAVE, 
            {
                action,
                patient: patientData
            }
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || `Erro ao ${action === 'create' ? 'criar' : 'atualizar'} paciente`);
        }
        
        return {
            success: true,
            patient: result.patient,
            message: `Paciente ${action === 'create' ? 'criado' : 'atualizado'} com sucesso`
        };
    } catch (error) {
        console.error('Erro ao salvar dados do paciente:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Exemplo 4: Obter histórico do paciente
async function obterHistoricoPaciente(patientId, options = {}) {
    try {
        if (!patientId) {
            throw new Error('ID do paciente é obrigatório');
        }
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.PATIENT_HISTORY, 
            { 
                patient_id: patientId,
                limit: options.limit || 10,
                offset: options.offset || 0,
                include_appointments: options.includeAppointments !== false,
                include_payments: options.includePayments !== false,
                include_treatments: options.includeTreatments !== false
            }
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao obter histórico do paciente');
        }
        
        return {
            success: true,
            history: result.history || {}
        };
    } catch (error) {
        console.error(`Erro ao obter histórico do paciente ${patientId}:`, error);
        return {
            success: false,
            error: error.message,
            history: {}
        };
    }
}

// Exportar funções para uso global
window.PortalPacientes = {
    buscarPacientes,
    obterDetalhesPaciente,
    salvarDadosPaciente,
    obterHistoricoPaciente
};

console.log('🚀 Portal Pacientes inicializado');
