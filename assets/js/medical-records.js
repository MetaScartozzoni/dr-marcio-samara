// 📋 Exemplos de uso das Edge Functions para gerenciamento de prontuários

// Exemplo 1: Buscar prontuário de um paciente
async function buscarProntuario(patientId) {
    try {
        // Validar parâmetros
        if (!patientId) {
            throw new Error('ID do paciente é obrigatório');
        }
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.MEDICAL_RECORD_GET, 
            { patient_id: patientId }
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao buscar prontuário');
        }
        
        return {
            success: true,
            medicalRecord: result.medical_record || {},
            entries: result.entries || []
        };
    } catch (error) {
        console.error(`Erro ao buscar prontuário do paciente ${patientId}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Exemplo 2: Adicionar entrada em prontuário
async function adicionarEntradaProntuario(patientId, entryData) {
    try {
        // Validar parâmetros
        if (!patientId || !entryData.content) {
            throw new Error('ID do paciente e conteúdo são obrigatórios');
        }
        
        // Preparar dados para a requisição
        const requestData = {
            patient_id: patientId,
            entry: {
                ...entryData,
                created_at: new Date().toISOString()
            }
        };
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.MEDICAL_RECORD_ADD_ENTRY, 
            requestData
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao adicionar entrada no prontuário');
        }
        
        return {
            success: true,
            entry: result.entry,
            message: 'Entrada adicionada com sucesso ao prontuário'
        };
    } catch (error) {
        console.error(`Erro ao adicionar entrada no prontuário do paciente ${patientId}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Exemplo 3: Atualizar informações básicas do prontuário
async function atualizarProntuario(patientId, medicalRecordData) {
    try {
        // Validar parâmetros
        if (!patientId) {
            throw new Error('ID do paciente é obrigatório');
        }
        
        // Preparar dados para a requisição
        const requestData = {
            patient_id: patientId,
            medical_record: medicalRecordData
        };
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.MEDICAL_RECORD_UPDATE, 
            requestData
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao atualizar prontuário');
        }
        
        return {
            success: true,
            medicalRecord: result.medical_record,
            message: 'Prontuário atualizado com sucesso'
        };
    } catch (error) {
        console.error(`Erro ao atualizar prontuário do paciente ${patientId}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Exemplo 4: Gerar PDF do prontuário
async function gerarPDFProntuario(patientId, options = {}) {
    try {
        // Validar parâmetros
        if (!patientId) {
            throw new Error('ID do paciente é obrigatório');
        }
        
        // Preparar dados para a requisição
        const requestData = {
            patient_id: patientId,
            include_history: options.includeHistory !== false,
            include_images: options.includeImages !== false,
            include_treatments: options.includeTreatments !== false,
            template_id: options.templateId || 'default'
        };
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.MEDICAL_RECORD_GENERATE_PDF, 
            requestData
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao gerar PDF do prontuário');
        }
        
        return {
            success: true,
            pdfUrl: result.pdf_url,
            expiresAt: result.expires_at,
            message: 'PDF do prontuário gerado com sucesso'
        };
    } catch (error) {
        console.error(`Erro ao gerar PDF do prontuário do paciente ${patientId}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Exemplo 5: Compartilhar prontuário com outro profissional
async function compartilharProntuario(patientId, recipientEmail, options = {}) {
    try {
        // Validar parâmetros
        if (!patientId || !recipientEmail) {
            throw new Error('ID do paciente e email do destinatário são obrigatórios');
        }
        
        // Preparar dados para a requisição
        const requestData = {
            patient_id: patientId,
            recipient_email: recipientEmail,
            expiration_days: options.expirationDays || 7,
            message: options.message || '',
            sections: options.sections || ['all']
        };
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.call(
            window.PORTAL_CONFIG.EDGE_FUNCTIONS.MEDICAL_RECORD_SHARE, 
            requestData
        );
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao compartilhar prontuário');
        }
        
        return {
            success: true,
            shareId: result.share_id,
            accessLink: result.access_link,
            expiresAt: result.expires_at,
            message: 'Prontuário compartilhado com sucesso'
        };
    } catch (error) {
        console.error(`Erro ao compartilhar prontuário do paciente ${patientId}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Exportar funções para uso global
window.PortalProntuarios = {
    buscarProntuario,
    adicionarEntradaProntuario,
    atualizarProntuario,
    gerarPDFProntuario,
    compartilharProntuario
};

console.log('🚀 Portal Prontuários inicializado');
