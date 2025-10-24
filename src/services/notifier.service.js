// src/services/notifier.service.js
// Multi-channel notification service (SendGrid, Twilio, SMTP)
const nodemailer = require('nodemailer');

class NotifierService {
  constructor() {
    this.sendGridAvailable = false;
    this.twilioAvailable = false;
    this.smtpAvailable = false;
    
    this.setupProviders();
  }

  /**
   * Setup notification providers based on environment variables
   */
  setupProviders() {
    // Check SendGrid
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.sendGrid = sgMail;
        this.sendGridAvailable = true;
        console.log('✅ NotifierService: SendGrid configured');
      } catch (error) {
        console.warn('⚠️  NotifierService: SendGrid not available:', error.message);
      }
    }

    // Check Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        this.twilioAvailable = true;
        console.log('✅ NotifierService: Twilio configured');
      } catch (error) {
        console.warn('⚠️  NotifierService: Twilio not available:', error.message);
      }
    }

    // Check SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        this.smtpTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        this.smtpAvailable = true;
        console.log('✅ NotifierService: SMTP configured');
      } catch (error) {
        console.warn('⚠️  NotifierService: SMTP not available:', error.message);
      }
    }

    if (!this.sendGridAvailable && !this.twilioAvailable && !this.smtpAvailable) {
      console.warn('⚠️  NotifierService: No notification providers configured!');
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(to, subject, html, attachments = []) {
    try {
      // Try SendGrid first
      if (this.sendGridAvailable) {
        return await this.sendEmailViaSendGrid(to, subject, html, attachments);
      }

      // Fallback to SMTP
      if (this.smtpAvailable) {
        return await this.sendEmailViaSMTP(to, subject, html, attachments);
      }

      throw new Error('No email provider available');

    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send email via SendGrid
   */
  async sendEmailViaSendGrid(to, subject, html, attachments = []) {
    try {
      const msg = {
        to,
        from: {
          email: process.env.EMAIL_FROM || process.env.SENDGRID_FROM || 'noreply@example.com',
          name: process.env.CLINIC_NAME || 'Dr. Marcio'
        },
        subject,
        html
      };

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        msg.attachments = attachments.map(att => ({
          content: att.content,
          filename: att.filename,
          type: att.type || 'application/pdf',
          disposition: 'attachment'
        }));
      }

      const response = await this.sendGrid.send(msg);
      
      console.log(`✅ Email sent via SendGrid to ${to}`);
      
      return {
        success: true,
        provider: 'sendgrid',
        messageId: response[0].headers['x-message-id']
      };

    } catch (error) {
      console.error('❌ SendGrid error:', error);
      throw error;
    }
  }

  /**
   * Send email via SMTP
   */
  async sendEmailViaSMTP(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@example.com',
        to,
        subject,
        html
      };

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map(att => ({
          content: att.content,
          filename: att.filename,
          contentType: att.type || 'application/pdf'
        }));
      }

      const info = await this.smtpTransporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent via SMTP to ${to}`);
      
      return {
        success: true,
        provider: 'smtp',
        messageId: info.messageId
      };

    } catch (error) {
      console.error('❌ SMTP error:', error);
      throw error;
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendSMS(to, message) {
    try {
      if (!this.twilioAvailable) {
        throw new Error('Twilio not configured');
      }

      const messageOptions = {
        body: message,
        to: this.formatPhone(to)
      };

      // Use Messaging Service ID if available, otherwise use phone number
      if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
        messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
      } else if (process.env.TWILIO_PHONE_NUMBER) {
        messageOptions.from = process.env.TWILIO_PHONE_NUMBER;
      } else {
        throw new Error('Twilio phone number or messaging service not configured');
      }

      const result = await this.twilioClient.messages.create(messageOptions);
      
      console.log(`✅ SMS sent via Twilio to ${to}`);
      
      return {
        success: true,
        provider: 'twilio',
        messageId: result.sid
      };

    } catch (error) {
      console.error('❌ Twilio error:', error);
      throw error;
    }
  }

  /**
   * Send orçamento notification
   */
  async sendOrcamentoNotification(orcamento, paciente, pdfUrl) {
    try {
      const subject = `Orçamento ${orcamento.numero_orcamento} - ${process.env.CLINIC_NAME || 'Dr. Marcio'}`;
      
      const html = this.buildOrcamentoEmailTemplate(orcamento, paciente, pdfUrl);

      // Send email
      if (paciente.email) {
        await this.sendEmail(paciente.email, subject, html);
      }

      // Send SMS if configured and phone available
      if (this.twilioAvailable && paciente.phone) {
        const smsMessage = `Olá ${paciente.full_name || paciente.nome}! Seu orçamento ${orcamento.numero_orcamento} está pronto. Acesse: ${orcamento.link_aceite || pdfUrl}`;
        await this.sendSMS(paciente.phone, smsMessage);
      }

      return {
        success: true,
        emailSent: !!paciente.email,
        smsSent: !!(this.twilioAvailable && paciente.phone)
      };

    } catch (error) {
      console.error('❌ Failed to send orcamento notification:', error);
      throw error;
    }
  }

  /**
   * Build email template for orçamento
   */
  buildOrcamentoEmailTemplate(orcamento, paciente, pdfUrl) {
    const clinicName = process.env.CLINIC_NAME || 'Dr. Marcio';
    const clinicPhone = process.env.CLINIC_PHONE || '(11) 99999-9999';
    const clinicEmail = process.env.CLINIC_EMAIL || 'contato@clinica.com.br';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #0066cc; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${clinicName}</h1>
            <p>Orçamento Médico</p>
          </div>
          
          <div class="content">
            <h2>Olá, ${paciente.full_name || paciente.nome}!</h2>
            
            <p>Seu orçamento está pronto! Confira os detalhes abaixo:</p>
            
            <div class="info-box">
              <strong>Número do Orçamento:</strong> ${orcamento.numero_orcamento}<br>
              <strong>Valor Total:</strong> R$ ${(orcamento.valor_final || 0).toFixed(2).replace('.', ',')}<br>
              <strong>Validade:</strong> ${orcamento.validade ? new Date(orcamento.validade).toLocaleDateString('pt-BR') : '30 dias'}
            </div>
            
            ${pdfUrl ? `
              <p style="text-align: center;">
                <a href="${pdfUrl}" class="button">📄 Visualizar Orçamento</a>
              </p>
            ` : ''}
            
            ${orcamento.link_aceite ? `
              <p style="text-align: center;">
                <a href="${orcamento.link_aceite}" class="button">✅ Aceitar Orçamento</a>
              </p>
            ` : ''}
            
            <p>Se você tiver alguma dúvida ou precisar de esclarecimentos, entre em contato conosco:</p>
            
            <div class="info-box">
              <strong>Telefone:</strong> ${clinicPhone}<br>
              <strong>Email:</strong> ${clinicEmail}
            </div>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>&copy; ${new Date().getFullYear()} ${clinicName}. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Format phone number for Twilio
   */
  formatPhone(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = '55' + cleaned;
    }
    
    // Add + prefix
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Check if any notification provider is available
   */
  isAvailable() {
    return this.sendGridAvailable || this.twilioAvailable || this.smtpAvailable;
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return {
      sendgrid: this.sendGridAvailable,
      twilio: this.twilioAvailable,
      smtp: this.smtpAvailable
    };
  }
}

// Export singleton instance
module.exports = new NotifierService();
