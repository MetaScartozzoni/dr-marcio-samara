// 📅 Exemplos de uso das Edge Functions para o sistema de agendamento

// Exemplo 1: Buscar horários disponíveis
async function buscarHorariosDisponiveis(data, professional, duration) {
    try {
        // Validar parâmetros
        if (!data || !professional) {
            throw new Error('Data e profissional são obrigatórios');
        }
        
        // Preparar dados para a requisição
        const requestData = {
            date: data,              // Formato YYYY-MM-DD
            professional_id: professional,
            duration: duration || 30  // Duração em minutos (padrão: 30min)
        };
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.findAvailableSlots(requestData);
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao buscar horários');
        }
        
        // Retornar os horários disponíveis
        return result.slots || [];
    } catch (error) {
        console.error('Erro ao buscar horários disponíveis:', error);
        throw error;
    }
}

// Exemplo 2: Reservar um horário
async function reservarHorario(data, horario, professionalId, patientId) {
    try {
        // Validar parâmetros
        if (!data || !horario || !professionalId || !patientId) {
            throw new Error('Todos os parâmetros são obrigatórios');
        }
        
        // Preparar dados para a requisição
        const requestData = {
            date: data,              // Formato YYYY-MM-DD
            time: horario,           // Formato HH:MM
            professional_id: professionalId,
            patient_id: patientId
        };
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.bookSlot(requestData);
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao reservar horário');
        }
        
        return {
            success: true,
            appointmentId: result.appointment_id,
            message: 'Horário reservado com sucesso'
        };
    } catch (error) {
        console.error('Erro ao reservar horário:', error);
        throw error;
    }
}

// Exemplo 3: Criar consulta completa
async function criarConsulta(appointmentData) {
    try {
        // Validar dados mínimos
        if (!appointmentData.patient_id || !appointmentData.professional_id || 
            !appointmentData.date || !appointmentData.time) {
            throw new Error('Dados incompletos para criar consulta');
        }
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.createAppointment(appointmentData);
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao criar consulta');
        }
        
        return {
            success: true,
            appointment: result.appointment,
            message: 'Consulta criada com sucesso'
        };
    } catch (error) {
        console.error('Erro ao criar consulta:', error);
        throw error;
    }
}

// Exemplo 4: Buscar consultas de um mês
async function buscarConsultasMes(ano, mes, professionalId = null) {
    try {
        // Preparar dados para a requisição
        const requestData = {
            year: ano,
            month: mes
        };
        
        // Adicionar ID do profissional se fornecido
        if (professionalId) {
            requestData.professional_id = professionalId;
        }
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.getMonthlyAppointments(requestData);
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao buscar consultas');
        }
        
        return result.appointments || [];
    } catch (error) {
        console.error(`Erro ao buscar consultas para ${mes}/${ano}:`, error);
        throw error;
    }
}

// Exemplo 5: Criar reunião no Whereby
async function criarReuniaoPorVideo(appointmentId) {
    try {
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.createWherebyMeeting({
            appointment_id: appointmentId
        });
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao criar reunião por vídeo');
        }
        
        return {
            success: true,
            meetingUrl: result.meeting_url,
            hostRoomUrl: result.host_room_url,
            message: 'Sala de vídeo criada com sucesso'
        };
    } catch (error) {
        console.error('Erro ao criar reunião por vídeo:', error);
        throw error;
    }
}

// Exemplo 6: Reenviar e-mail de confirmação
async function reenviarEmailConfirmacao(appointmentId, emailType = 'confirmation') {
    try {
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.resendEmail({
            appointment_id: appointmentId,
            email_type: emailType // 'confirmation', 'reminder', 'cancellation'
        });
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Erro ao reenviar e-mail');
        }
        
        return {
            success: true,
            message: 'E-mail reenviado com sucesso'
        };
    } catch (error) {
        console.error('Erro ao reenviar e-mail:', error);
        throw error;
    }
}

// Exportar funções para uso global
window.PortalAgendamento = {
    buscarHorariosDisponiveis,
    reservarHorario,
    criarConsulta,
    buscarConsultasMes,
    criarReuniaoPorVideo,
    reenviarEmailConfirmacao
};
