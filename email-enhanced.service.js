const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.configurado = false;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            // Configuração SendGrid SMTP
            if (process.env.SENDGRID_API_KEY) {
                this.transporter = nodemailer.createTransporter({
                    host: 'smtp.sendgrid.net',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'apikey',
                        pass: process.env.SENDGRID_API_KEY
                    }
                });
                this.configurado = true;
                console.log('✅ Email service configurado com SendGrid');
            } else {
                console.log('⚠️ SENDGRID_API_KEY não encontrada - emails não serão enviados');
            }
        } catch (error) {
            console.error('❌ Erro ao configurar email service:', error);
        }
    }

    async enviarCodigoAtivacao(email, codigo, nome = 'Usuário') {
        if (!this.configurado) {
            console.log('📧 [SIMULADO] Código de ativação para', email, ':', codigo);
            return { success: true, message: 'Email simulado (sem configuração SMTP)' };
        }

        try {
            const mailOptions = {
                from: 'noreply@mscartozzoni.com.br',
                to: email,
                subject: '🔐 Código de Ativação - Portal Dr. Marcio',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0; font-size: 28px;">🏥 Portal Dr. Marcio</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Sistema de Gestão Médica</p>
                        </div>
                        
                        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #333; margin-bottom: 20px;">Olá, ${nome}!</h2>
                            
                            <p style="color: #666; line-height: 1.6;">
                                Bem-vindo ao Portal Dr. Marcio Scartozzoni. Para ativar sua conta, 
                                use o código de verificação abaixo:
                            </p>
                            
                            <div style="background: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                                <p style="margin: 0; color: #666; font-size: 14px;">Código de Ativação:</p>
                                <h1 style="margin: 10px 0 0 0; color: #007bff; font-size: 32px; letter-spacing: 3px; font-weight: bold;">${codigo}</h1>
                            </div>
                            
                            <p style="color: #666; line-height: 1.6;">
                                ⏰ <strong>Este código expira em 15 minutos.</strong><br>
                                🔒 Por segurança, não compartilhe este código com ninguém.
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
                            
                            <p style="color: #999; font-size: 12px; text-align: center;">
                                Se você não solicitou este código, ignore este email.<br>
                                © 2024 Dr. Marcio Scartozzoni - Todos os direitos reservados
                            </p>
                        </div>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email de ativação enviado para:', email);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Erro ao enviar email de ativação:', error);
            return { success: false, error: error.message };
        }
    }

    async enviarConfirmacaoAtivacao(email, nome = 'Usuário') {
        if (!this.configurado) {
            console.log('📧 [SIMULADO] Confirmação de ativação para', email);
            return { success: true, message: 'Email simulado (sem configuração SMTP)' };
        }

        try {
            const mailOptions = {
                from: 'noreply@mscartozzoni.com.br',
                to: email,
                subject: '✅ Conta Ativada - Portal Dr. Marcio',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0; font-size: 28px;">🏥 Portal Dr. Marcio</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Conta Ativada com Sucesso!</p>
                        </div>
                        
                        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #333; margin-bottom: 20px;">Parabéns, ${nome}!</h2>
                            
                            <p style="color: #666; line-height: 1.6;">
                                Sua conta foi ativada com sucesso! Agora você pode acessar 
                                todos os recursos do Portal Dr. Marcio Scartozzoni.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://portal-dr-marcio.up.railway.app/login.html" 
                                   style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                    🚀 Acessar Portal
                                </a>
                            </div>
                            
                            <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                                <h4 style="margin: 0 0 10px 0; color: #155724;">O que você pode fazer agora:</h4>
                                <ul style="margin: 0; padding-left: 20px; color: #666;">
                                    <li>Agendar consultas online</li>
                                    <li>Acessar seus resultados de exames</li>
                                    <li>Visualizar histórico médico</li>
                                    <li>Receber lembretes importantes</li>
                                </ul>
                            </div>
                            
                            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
                            
                            <p style="color: #999; font-size: 12px; text-align: center;">
                                Obrigado por escolher nossos serviços!<br>
                                © 2024 Dr. Marcio Scartozzoni - Todos os direitos reservados
                            </p>
                        </div>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email de confirmação enviado para:', email);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Erro ao enviar confirmação:', error);
            return { success: false, error: error.message };
        }
    }

    async enviarNotificacaoPreCadastro(emailAdmin, dadosUsuario) {
        if (!this.configurado) {
            console.log('📧 [SIMULADO] Notificação de pré-cadastro para admin');
            return { success: true, message: 'Email simulado (sem configuração SMTP)' };
        }

        try {
            const mailOptions = {
                from: 'noreply@mscartozzoni.com.br',
                to: emailAdmin,
                subject: '👤 Novo Pré-Cadastro Pendente - Portal Dr. Marcio',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0; font-size: 28px;">🏥 Portal Dr. Marcio</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Novo Pré-Cadastro Pendente</p>
                        </div>
                        
                        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #333; margin-bottom: 20px;">Novo usuário aguardando aprovação</h2>
                            
                            <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                <h4 style="margin: 0 0 15px 0; color: #495057;">Dados do Usuário:</h4>
                                <p style="margin: 5px 0; color: #666;"><strong>Nome:</strong> ${dadosUsuario.nome}</p>
                                <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${dadosUsuario.email}</p>
                                <p style="margin: 5px 0; color: #666;"><strong>Telefone:</strong> ${dadosUsuario.telefone || 'Não informado'}</p>
                                <p style="margin: 5px 0; color: #666;"><strong>CPF:</strong> ${dadosUsuario.cpf || 'Não informado'}</p>
                                <p style="margin: 5px 0; color: #666;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://portal-dr-marcio.up.railway.app/admin.html" 
                                   style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                    🔍 Revisar no Admin
                                </a>
                            </div>
                            
                            <p style="color: #666; line-height: 1.6; font-style: italic;">
                                Este usuário completou o processo de pré-cadastro e está aguardando 
                                sua aprovação para acessar o sistema.
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
                            
                            <p style="color: #999; font-size: 12px; text-align: center;">
                                Sistema de Notificações Automáticas<br>
                                © 2024 Dr. Marcio Scartozzoni - Todos os direitos reservados
                            </p>
                        </div>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Notificação enviada para admin');
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error);
            return { success: false, error: error.message };
        }
    }

    async testarConfiguracao() {
        if (!this.configurado) {
            return {
                success: false,
                message: 'SendGrid não configurado - adicione SENDGRID_API_KEY nas variáveis de ambiente'
            };
        }

        try {
            // Teste simples de verificação do transporter
            await this.transporter.verify();
            return {
                success: true,
                message: 'Configuração SendGrid OK - emails prontos para envio'
            };
        } catch (error) {
            return {
                success: false,
                message: `Erro na configuração SendGrid: ${error.message}`
            };
        }
    }
}

module.exports = new EmailService();
