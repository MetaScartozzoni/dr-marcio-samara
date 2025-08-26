# 🔌 Portal Integrations

Sistema completo de integrações para o Portal Dr. Marcio.

## 🌟 Integrações Disponíveis

### 📱 WhatsApp Integration
- **Função:** Envio automático de mensagens
- **Casos de uso:** 
  - Lembretes de consulta
  - Confirmações de agendamento
  - Notificações importantes

```javascript
// Exemplo de uso
await sendWhatsApp({
    phone: '5511999999999',
    message: 'Sua consulta está confirmada!',
    template: 'appointment_reminder'
});
```

### 📧 Email Integration
- **Função:** Envio de emails profissionais
- **Templates disponíveis:**
  - `appointment_confirmation` - Confirmação de consultas
  - `password_reset` - Reset de senha
  - `welcome` - Boas-vindas

```javascript
// Exemplo de uso
await sendEmail({
    to: 'paciente@email.com',
    subject: 'Consulta Confirmada',
    template: 'appointment_confirmation',
    data: { patientName: 'João Silva', date: '15/12/2024', time: '14:00' }
});
```

### 📅 Google Calendar Integration
- **Função:** Criação automática de eventos
- **Recursos:**
  - Links diretos para Google Calendar
  - Convites automáticos
  - Sincronização de horários

```javascript
// Exemplo de uso
await createCalendarEvent({
    summary: 'Consulta - João Silva',
    description: 'Consulta de rotina',
    startTime: '2024-12-15T14:00:00',
    endTime: '2024-12-15T15:00:00',
    attendees: ['paciente@email.com', 'doutor@email.com']
});
```

### 💰 Payment Integration (Stripe)
- **Função:** Processamento de pagamentos
- **Recursos:**
  - Integração com Stripe
  - Pagamentos seguros
  - Múltiplas moedas

```javascript
// Exemplo de uso
await createPayment({
    amount: 150.00,
    currency: 'BRL',
    description: 'Consulta Dr. Marcio',
    customerEmail: 'paciente@email.com'
});
```

### 📱 SMS Integration
- **Função:** Envio de SMS
- **Casos de uso:**
  - Confirmações rápidas
  - Códigos de verificação
  - Lembretes urgentes

```javascript
// Exemplo de uso
await window.portalIntegrations.execute('sms', 'sendSMS', {
    phone: '5511999999999',
    message: 'Sua consulta é amanhã às 14h',
    template: 'appointment_reminder'
});
```

## 🚀 Como Usar

### 1. Incluir no HTML
```html
<script src="integrations/portal-integrations.js"></script>
```

### 2. Usar as funções globais
```javascript
// WhatsApp
window.sendWhatsApp({ phone: '...', message: '...' });

// Email
window.sendEmail({ to: '...', subject: '...', template: '...', data: {} });

// Calendar
window.createCalendarEvent({ summary: '...', startTime: '...', endTime: '...' });

// Payment
window.createPayment({ amount: 100, description: '...' });
```

## 🔧 Configuração

### Edge Functions Necessárias

1. **Email Service** (`/api/integrations/email`)
```sql
-- Função para envio de emails
CREATE OR REPLACE FUNCTION send_email(
    p_to text,
    p_subject text,
    p_html text,
    p_from text DEFAULT 'noreply@marcioplasticsurgery.com'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Implementação do envio de email
$$;
```

2. **SMS Service** (`/api/integrations/sms`)
```sql
-- Função para envio de SMS
CREATE OR REPLACE FUNCTION send_sms(
    p_phone text,
    p_message text,
    p_template text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Implementação do envio de SMS
$$;
```

3. **Payment Service** (`/api/integrations/payment`)
```sql
-- Função para processamento de pagamentos
CREATE OR REPLACE FUNCTION create_payment(
    p_amount integer,
    p_currency text,
    p_description text,
    p_customer_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Implementação do Stripe
$$;
```

## 📊 Analytics Integration

Todas as integrações são automaticamente rastreadas:

- `whatsapp_message_sent` - Mensagens WhatsApp enviadas
- `email_sent` - Emails enviados
- `calendar_event_created` - Eventos de calendário criados
- `payment_initiated` - Pagamentos iniciados
- `sms_sent` - SMS enviados

## 🔒 Segurança

- Todas as APIs usam autenticação JWT
- Dados sensíveis são criptografados
- Logs de auditoria para todas as integrações
- Rate limiting implementado

## 🎯 Templates de Mensagem

### WhatsApp Appointment Template
```
🏥 *Portal Dr. Marcio*

Olá {patientName}!

📅 Lembrete de Consulta:
• Data: {date}
• Horário: {time}
• Médico: Dr. {doctorName}

Por favor, confirme sua presença.

_Mensagem automática do Portal Médico_
```

### Email Confirmation Template
- Design responsivo
- Cores da identidade visual
- Informações completas da consulta
- Call-to-action para confirmação

## 🚀 Próximos Passos

1. Implementar Edge Functions no Supabase
2. Configurar webhooks para notificações
3. Adicionar integração com Zoom para teleconsultas
4. Implementar chatbot para atendimento automático
5. Integração com sistemas de laboratório
