// 🔌 Integrações - Portal Dr. Marcio
class PortalIntegrations {
    constructor() {
        this.integrations = new Map();
        this.init();
    }

    init() {
        // Registrar integrações disponíveis
        this.registerIntegration('whatsapp', new WhatsAppIntegration());
        this.registerIntegration('google-calendar', new GoogleCalendarIntegration());
        this.registerIntegration('email', new EmailIntegration());
        this.registerIntegration('sms', new SMSIntegration());
        this.registerIntegration('payment', new PaymentIntegration());
    }

    registerIntegration(name, integration) {
        this.integrations.set(name, integration);
    }

    async execute(integrationName, method, params) {
        const integration = this.integrations.get(integrationName);
        if (!integration) {
            throw new Error(`Integração ${integrationName} não encontrada`);
        }
        return await integration[method](params);
    }
}

// 📱 WhatsApp Integration
class WhatsAppIntegration {
    constructor() {
        this.apiUrl = 'https://api.whatsapp.com/send';
    }

    async sendMessage({ phone, message, template = null }) {
        try {
            // Para templates de agendamento
            if (template === 'appointment_reminder') {
                message = this.getAppointmentTemplate(message);
            }

            const url = `${this.apiUrl}?phone=${phone}&text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
            
            // Log da integração
            window.trackEvent('whatsapp_message_sent', { phone, template });
            
            return { success: true, url };
        } catch (error) {
            console.error('WhatsApp Integration Error:', error);
            return { success: false, error: error.message };
        }
    }

    getAppointmentTemplate({ patientName, date, time, doctorName }) {
        return `🏥 *Portal Dr. Marcio*

Olá ${patientName}!

📅 Lembrete de Consulta:
• Data: ${date}
• Horário: ${time}
• Médico: Dr. ${doctorName}

Por favor, confirme sua presença.

_Mensagem automática do Portal Médico_`;
    }
}

// 📧 Email Integration
class EmailIntegration {
    constructor() {
        this.templates = {
            appointment_confirmation: this.getAppointmentConfirmationTemplate,
            password_reset: this.getPasswordResetTemplate,
            welcome: this.getWelcomeTemplate
        };
    }

    async sendEmail({ to, subject, template, data }) {
        try {
            const emailData = {
                to,
                subject,
                html: this.templates[template](data),
                from: 'noreply@marcioplasticsurgery.com'
            };

            // Enviar via Edge Function
            const response = await fetch('/api/integrations/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });

            const result = await response.json();
            
            window.trackEvent('email_sent', { to, template, success: result.success });
            
            return result;
        } catch (error) {
            console.error('Email Integration Error:', error);
            return { success: false, error: error.message };
        }
    }

    getAppointmentConfirmationTemplate({ patientName, date, time, doctorName }) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c5aa0;">Consulta Confirmada</h2>
                <p>Olá <strong>${patientName}</strong>,</p>
                <p>Sua consulta foi confirmada para:</p>
                <ul>
                    <li><strong>Data:</strong> ${date}</li>
                    <li><strong>Horário:</strong> ${time}</li>
                    <li><strong>Médico:</strong> Dr. ${doctorName}</li>
                </ul>
                <p>Atenciosamente,<br>Portal Dr. Marcio</p>
            </div>
        `;
    }
}

// 📅 Google Calendar Integration
class GoogleCalendarIntegration {
    constructor() {
        this.apiUrl = 'https://www.googleapis.com/calendar/v3';
    }

    async createEvent({ summary, description, startTime, endTime, attendees }) {
        try {
            const event = {
                summary,
                description,
                start: { dateTime: startTime },
                end: { dateTime: endTime },
                attendees: attendees.map(email => ({ email }))
            };

            // Criar URL do Google Calendar
            const calendarUrl = this.generateCalendarUrl(event);
            
            window.trackEvent('calendar_event_created', { summary, attendees: attendees.length });
            
            return { success: true, url: calendarUrl };
        } catch (error) {
            console.error('Calendar Integration Error:', error);
            return { success: false, error: error.message };
        }
    }

    generateCalendarUrl({ summary, description, start, end }) {
        const startDate = new Date(start.dateTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const endDate = new Date(end.dateTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(summary)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(description)}`;
    }
}

// 💰 Payment Integration (Stripe)
class PaymentIntegration {
    constructor() {
        this.stripeKey = 'pk_test_...'; // Chave pública do Stripe
    }

    async createPayment({ amount, currency = 'BRL', description, customerEmail }) {
        try {
            const response = await fetch('/api/integrations/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amount * 100, // Stripe usa centavos
                    currency,
                    description,
                    customer_email: customerEmail
                })
            });

            const result = await response.json();
            
            window.trackEvent('payment_initiated', { amount, currency, customerEmail });
            
            return result;
        } catch (error) {
            console.error('Payment Integration Error:', error);
            return { success: false, error: error.message };
        }
    }
}

// 📱 SMS Integration
class SMSIntegration {
    async sendSMS({ phone, message, template = null }) {
        try {
            const response = await fetch('/api/integrations/sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, message, template })
            });

            const result = await response.json();
            
            window.trackEvent('sms_sent', { phone, template, success: result.success });
            
            return result;
        } catch (error) {
            console.error('SMS Integration Error:', error);
            return { success: false, error: error.message };
        }
    }
}

// 🚀 Inicializar Integrações
window.portalIntegrations = new PortalIntegrations();

// 🌟 Métodos globais para uso fácil
window.sendWhatsApp = (params) => window.portalIntegrations.execute('whatsapp', 'sendMessage', params);
window.sendEmail = (params) => window.portalIntegrations.execute('email', 'sendEmail', params);
window.createCalendarEvent = (params) => window.portalIntegrations.execute('google-calendar', 'createEvent', params);
window.createPayment = (params) => window.portalIntegrations.execute('payment', 'createPayment', params);
