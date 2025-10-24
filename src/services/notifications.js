// src/services/notifications.js
const nodemailer = require('nodemailer');

/**
 * Notification service supporting multiple providers:
 * - SendGrid for email
 * - Twilio for SMS
 * - Hostinger SMTP for email
 */
class NotificationService {
  constructor() {
    this.sendGridEnabled = !!process.env.SENDGRID_API_KEY;
    this.twilioEnabled = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    this.smtpEnabled = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  /**
   * Send email using configured provider
   */
  async sendEmail({ to, subject, text, html, attachments = [] }) {
    if (!to || !subject) {
      throw new Error('Email recipient and subject are required');
    }

    // Try SendGrid first if configured
    if (this.sendGridEnabled) {
      return await this._sendViaSendGrid({ to, subject, text, html, attachments });
    }

    // Fallback to SMTP if configured
    if (this.smtpEnabled) {
      return await this._sendViaSMTP({ to, subject, text, html, attachments });
    }

    throw new Error('No email provider configured. Set SENDGRID_API_KEY or SMTP credentials.');
  }

  /**
   * Send SMS using Twilio
   */
  async sendSms({ to, body }) {
    if (!this.twilioEnabled) {
      throw new Error('Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM');
    }

    if (!to || !body) {
      throw new Error('SMS recipient and body are required');
    }

    try {
      // Lazy load twilio to avoid errors if not installed
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const message = await client.messages.create({
        body,
        from: process.env.TWILIO_FROM,
        to
      });

      return {
        success: true,
        provider: 'twilio',
        messageId: message.sid,
        to
      };
    } catch (error) {
      console.error('Error sending SMS via Twilio:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send email via SendGrid
   */
  async _sendViaSendGrid({ to, subject, text, html, attachments }) {
    try {
      // Lazy load @sendgrid/mail to avoid errors if not installed
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@example.com',
        subject,
        text: text || '',
        html: html || text || ''
      };

      if (attachments && attachments.length > 0) {
        msg.attachments = attachments.map(att => ({
          content: att.content,
          filename: att.filename,
          type: att.type || 'application/pdf',
          disposition: 'attachment'
        }));
      }

      await sgMail.send(msg);

      return {
        success: true,
        provider: 'sendgrid',
        to
      };
    } catch (error) {
      console.error('Error sending email via SendGrid:', error);
      throw new Error(`Failed to send email via SendGrid: ${error.message}`);
    }
  }

  /**
   * Send email via SMTP (Hostinger or other)
   */
  async _sendViaSMTP({ to, subject, text, html, attachments }) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text: text || '',
        html: html || text || ''
      };

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map(att => ({
          content: att.content,
          filename: att.filename,
          contentType: att.type || 'application/pdf'
        }));
      }

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        provider: 'smtp',
        messageId: info.messageId,
        to
      };
    } catch (error) {
      console.error('Error sending email via SMTP:', error);
      throw new Error(`Failed to send email via SMTP: ${error.message}`);
    }
  }

  /**
   * Get status of configured providers
   */
  getProviderStatus() {
    return {
      email: {
        sendgrid: this.sendGridEnabled,
        smtp: this.smtpEnabled
      },
      sms: {
        twilio: this.twilioEnabled
      }
    };
  }
}

module.exports = new NotificationService();
