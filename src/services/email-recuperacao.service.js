// =====================================================
// SERVIÇO DE EMAIL PARA RECUPERAÇÃO DE SENHA
// Portal Dr. Marcio - Sistema Médico Integrado
// Data: 01/08/2025
// =====================================================

const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailRecuperacaoService {
    constructor() {
        // Configurar SendGrid (Produção)
        if (process.env.SENDGRID_API_KEY) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            this.providerPrimario = 'sendgrid';
            console.log('📧 Email configurado: SendGrid (Produção)');
        } else {
            this.providerPrimario = 'smtp';
            console.log('📧 Email configurado: SMTP/Nodemailer (Desenvolvimento)');
        }

        // Configurar SMTP como fallback
        this.transporterSMTP = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true' || false,
            auth: {
                user: process.env.SMTP_USER || 'apikey',
                pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY
            }
        });

        // Configurações da clínica
        this.emailFrom = process.env.EMAIL_FROM || 'clinica@mscartozzoni.com.br';
        this.emailFromName = process.env.EMAIL_FROM_NAME || 'Portal Dr. Marcio';
        this.clinicaNome = process.env.CLINICA_NOME || 'Dr. Marcio Scartozzoni';
        this.clinicaTelefone = process.env.TELEFONE_CLINICA || '(11) 99999-9999';
        this.clinicaEndereco = process.env.ENDERECO_CLINICA || 'Consultório Médico';
        this.adminEmail = process.env.ADMIN_EMAIL || 'clinica@mscartozzoni.com.br';
    }

    /**
     * Enviar código de recuperação por email
     */
    async enviarCodigoRecuperacao(email, codigo, nomeUsuario = null) {
        try {
            console.log(`📧 Enviando código de recuperação para: ${email}`);

            const assunto = `🔑 Código de Recuperação - ${this.clinicaNome}`;
            const nomeDisplay = nomeUsuario || email.split('@')[0];

            const htmlContent = this.gerarTemplateRecuperacao(nomeDisplay, codigo);

            // Tentar SendGrid primeiro, depois SMTP
            const resultado = await this.enviarComFallback(email, assunto, htmlContent);

            if (resultado.sucesso) {
                console.log(`✅ Código enviado com sucesso para ${email}`);
                return {
                    sucesso: true,
                    provider: resultado.provider,
                    messageId: resultado.messageId
                };
            } else {
                throw new Error(resultado.erro);
            }

        } catch (error) {
            console.error('❌ Erro ao enviar código de recuperação:', error.message);
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }

    /**
     * Enviar confirmação de alteração de senha
     */
    async enviarConfirmacaoAlteracao(email, nomeUsuario = null, ip = null) {
        try {
            const assunto = `✅ Senha Alterada - ${this.clinicaNome}`;
            const nomeDisplay = nomeUsuario || email.split('@')[0];

            const htmlContent = this.gerarTemplateConfirmacao(nomeDisplay, ip);
            const resultado = await this.enviarComFallback(email, assunto, htmlContent);

            console.log('🔍 Debug resultado:', JSON.stringify(resultado, null, 2));

            if (resultado.sucesso) {
                console.log(`✅ Confirmação enviada para ${email}`);
                return { sucesso: true, provider: resultado.provider };
            } else {
                console.log(`❌ Falha no envio: ${resultado.erro}`);
                throw new Error(resultado.erro);
            }

        } catch (error) {
            console.error('❌ Erro ao enviar confirmação:', error.message);
            return { sucesso: false, erro: error.message };
        }
    }

    /**
     * Enviar alerta de segurança para admin
     */
    async enviarAlertaAdmin(tipo, detalhes) {
        try {
            const assunto = `🚨 Alerta de Segurança - ${tipo}`;
            const htmlContent = this.gerarTemplateAlerta(tipo, detalhes);

            const resultado = await this.enviarComFallback(
                this.adminEmail, 
                assunto, 
                htmlContent
            );

            return resultado;

        } catch (error) {
            console.error('❌ Erro ao enviar alerta:', error.message);
            return { sucesso: false, erro: error.message };
        }
    }

    /**
     * Método principal com fallback SendGrid → SMTP
     */
    async enviarComFallback(destinatario, assunto, htmlContent) {
        // Tentar SendGrid primeiro (se configurado)
        if (this.providerPrimario === 'sendgrid') {
            try {
                const msg = {
                    to: destinatario,
                    from: {
                        email: this.emailFrom,
                        name: this.emailFromName
                    },
                    subject: assunto,
                    html: htmlContent
                };

                const response = await sgMail.send(msg);
                
                return {
                    sucesso: true,
                    provider: 'SendGrid',
                    messageId: response[0].headers['x-message-id'],
                    statusCode: response[0].statusCode
                };

            } catch (error) {
                console.warn('⚠️ SendGrid falhou, tentando SMTP...', error.message);
                // Continuar para SMTP fallback
            }
        }

        // Fallback para SMTP
        try {
            const mailOptions = {
                from: `"${this.emailFromName}" <${this.emailFrom}>`,
                to: destinatario,
                subject: assunto,
                html: htmlContent
            };

            const info = await this.transporterSMTP.sendMail(mailOptions);
            
            return {
                sucesso: true,
                provider: 'SMTP',
                messageId: info.messageId
            };

        } catch (error) {
            console.error('❌ SMTP também falhou:', error.message);
            
            return {
                sucesso: false,
                erro: `Ambos provedores falharam. SendGrid + SMTP: ${error.message}`
            };
        }
    }

    /**
     * Template HTML para código de recuperação
     */
    gerarTemplateRecuperacao(nomeUsuario, codigo) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Código de Recuperação</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2c5aa0; margin-bottom: 10px;">🔑 Recuperação de Senha</h1>
                <h2 style="color: #666; font-weight: normal;">${this.clinicaNome}</h2>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Olá <strong>${nomeUsuario}</strong>,
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Recebemos uma solicitação para recuperar sua senha no Portal Médico.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <div style="background: white; border: 3px solid #2c5aa0; border-radius: 10px; padding: 20px; display: inline-block;">
                        <p style="margin: 0; font-size: 14px; color: #666; margin-bottom: 10px;">
                            Seu código de verificação:
                        </p>
                        <h1 style="margin: 0; font-size: 36px; color: #2c5aa0; letter-spacing: 8px; font-family: monospace;">
                            ${codigo}
                        </h1>
                    </div>
                </div>

                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #856404;">
                        ⏰ <strong>Este código expira em ${process.env.RECUPERACAO_VALIDADE_MINUTOS || 15} minutos</strong>
                    </p>
                </div>

                <p style="font-size: 14px; color: #666; margin-bottom: 0;">
                    Se você não solicitou esta recuperação, ignore este email ou entre em contato conosco.
                </p>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <div style="text-align: center; color: #666; font-size: 14px;">
                <p><strong>${this.clinicaNome}</strong></p>
                <p>${this.clinicaEndereco}</p>
                <p>📞 ${this.clinicaTelefone}</p>
                <p style="font-size: 12px; margin-top: 20px;">
                    Este é um email automático do sistema médico. Não responda.
                </p>
            </div>

        </body>
        </html>
        `;
    }

    /**
     * Template HTML para confirmação de alteração
     */
    gerarTemplateConfirmacao(nomeUsuario, ip) {
        const dataHora = new Date().toLocaleString('pt-BR');
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Senha Alterada</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #28a745; margin-bottom: 10px;">✅ Senha Alterada</h1>
                <h2 style="color: #666; font-weight: normal;">${this.clinicaNome}</h2>
            </div>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Olá <strong>${nomeUsuario}</strong>,
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Sua senha foi <strong>alterada com sucesso</strong> no Portal Médico.
                </p>

                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #495057;">📋 Detalhes da Alteração:</h3>
                    <p style="margin: 5px 0;"><strong>Data/Hora:</strong> ${dataHora}</p>
                    ${ip ? `<p style="margin: 5px 0;"><strong>IP:</strong> ${ip}</p>` : ''}
                    <p style="margin: 5px 0;"><strong>Método:</strong> Recuperação por código</p>
                </div>

                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #856404;">
                        🛡️ <strong>Importante:</strong> Se você não fez esta alteração, entre em contato conosco imediatamente.
                    </p>
                </div>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <div style="text-align: center; color: #666; font-size: 14px;">
                <p><strong>${this.clinicaNome}</strong></p>
                <p>${this.clinicaEndereco}</p>
                <p>📞 ${this.clinicaTelefone}</p>
            </div>

        </body>
        </html>
        `;
    }

    /**
     * Template para alertas de segurança (admin)
     */
    gerarTemplateAlerta(tipo, detalhes) {
        const dataHora = new Date().toLocaleString('pt-BR');
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Alerta de Segurança</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 10px;">
                <h1 style="color: #721c24; margin-top: 0;">🚨 Alerta de Segurança</h1>
                
                <p><strong>Tipo:</strong> ${tipo}</p>
                <p><strong>Data/Hora:</strong> ${dataHora}</p>
                
                <h3>Detalhes:</h3>
                <pre style="background: white; padding: 15px; border-radius: 5px; overflow-x: auto;">${JSON.stringify(detalhes, null, 2)}</pre>
                
                <p style="margin-bottom: 0; font-size: 14px; color: #721c24;">
                    Este alerta foi gerado automaticamente pelo sistema de segurança.
                </p>
            </div>

        </body>
        </html>
        `;
    }

    /**
     * Testar configuração de email
     */
    async testarConfiguracao() {
        try {
            console.log('🧪 Testando configuração de email...');
            
            const emailTeste = this.adminEmail;
            const resultado = await this.enviarComFallback(
                emailTeste,
                '🧪 Teste de Configuração - Sistema de Recuperação',
                `
                <h2>✅ Configuração de Email Funcionando!</h2>
                <p>Data/Hora: ${new Date().toLocaleString('pt-BR')}</p>
                <p>Provider: ${this.providerPrimario}</p>
                <p>Sistema: Portal Dr. Marcio - Recuperação de Senha</p>
                `
            );

            if (resultado.sucesso) {
                console.log('✅ Teste de email bem-sucedido!');
                console.log(`📧 Provider usado: ${resultado.provider}`);
                return true;
            } else {
                console.error('❌ Teste de email falhou:', resultado.erro);
                return false;
            }

        } catch (error) {
            console.error('❌ Erro no teste:', error.message);
            return false;
        }
    }
}

module.exports = EmailRecuperacaoService;
