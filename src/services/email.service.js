// src/services/email.service.js
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    this.templatesPath = path.join(__dirname, '../templates/email');
  }

  async enviarConfirmacaoAgendamento(dados) {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
            <h1>Agendamento Confirmado</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Olá, <strong>${dados.nome}</strong>!</p>
            
            <p>Seu agendamento foi confirmado com sucesso:</p>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Serviço:</strong> ${dados.servico}</p>
              <p><strong>Data:</strong> ${new Date(dados.data).toLocaleDateString('pt-BR')}</p>
              <p><strong>Horário:</strong> ${new Date(dados.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            
            <p><strong>Informações importantes:</strong></p>
            <ul>
              <li>Chegue 15 minutos antes do horário</li>
              <li>Traga um documento com foto</li>
              <li>Endereço: ${process.env.ENDERECO_CLINICA}</li>
            </ul>
            
            <hr style="margin: 30px 0;">
            
            <div style="text-align: center; color: #6c757d;">
              <p><strong>Portal Dr. Marcio</strong></p>
              <p>📞 ${process.env.TELEFONE_CLINICA}</p>
              <p>📧 ${process.env.EMAIL_FROM}</p>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: dados.email,
        subject: 'Confirmação de Agendamento - Dr. Marcio',
        html
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erro ao enviar confirmação de agendamento:', error);
      throw error;
    }
  }

  async enviarLembrete24h(dados) {
    try {
      const { email, nome, servico, data, hora } = dados;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #17a2b8; color: white; padding: 20px; text-align: center;">
            <h1>🔔 Lembrete de Consulta</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Olá, <strong>${nome}</strong>!</p>
            
            <p>Este é um lembrete de que você tem uma consulta agendada para <strong>amanhã</strong>:</p>
            
            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Serviço:</strong> ${servico}</p>
              <p><strong>Data:</strong> ${data}</p>
              <p><strong>Horário:</strong> ${hora}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4>📍 Informações importantes:</h4>
              <ul>
                <li><strong>Chegada:</strong> 15 minutos antes do horário</li>
                <li><strong>Documentos:</strong> RG ou CNH</li>
                <li><strong>Endereço:</strong> ${process.env.ENDERECO_CLINICA}</li>
                <li><strong>Estacionamento:</strong> Disponível no local</li>
              </ul>
            </div>
            
            <p>Em caso de impossibilidade de comparecimento, entre em contato conosco com antecedência.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="tel:${process.env.TELEFONE_CLINICA.replace(/\D/g, '')}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                📞 Ligar Agora
              </a>
            </div>
            
            <hr style="margin: 30px 0;">
            
            <div style="text-align: center; color: #6c757d;">
              <p><strong>Portal Dr. Marcio</strong></p>
              <p>📞 ${process.env.TELEFONE_CLINICA}</p>
              <p>📧 ${process.env.EMAIL_FROM}</p>
              <p>📍 ${process.env.ENDERECO_CLINICA}</p>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `🔔 Lembrete: Consulta Agendada para Amanhã - ${servico}`,
        html
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erro ao enviar lembrete 24h:', error);
      throw error;
    }
  }

  async enviarEmailOrcamento(dados) {
    try {
      const { email, nome, numeroOrcamento, valorTotal, validade, servicos, observacoes, pdfUrl } = dados;
      
      const servicosHtml = servicos.map(s => 
        `<tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${s.nome}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${s.quantidade || 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${s.valor.toFixed(2)}</td>
        </tr>`
      ).join('');

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0066cc; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Dr. Márcio</h1>
            <p style="margin: 5px 0 0 0;">Orçamento Profissional</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #0066cc; margin: 0;">Orçamento #${numeroOrcamento}</h2>
              <p style="color: #666; margin: 5px 0;">Válido até: ${validade}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p><strong>Prezado(a) ${nome},</strong></p>
              <p>Conforme solicitado, segue o orçamento detalhado dos serviços:</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Serviço</th>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Qtd</th>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${servicosHtml}
              </tbody>
              <tfoot>
                <tr style="background: #e9ecef; font-weight: bold;">
                  <td colspan="2" style="padding: 12px; border: 1px solid #ddd; text-align: right;">Total:</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #0066cc;">R$ ${valorTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            
            ${observacoes ? `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #0066cc;">Observações:</h4>
              <p style="margin-bottom: 0;">${observacoes}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/pagamento/${numeroOrcamento}" 
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
                💳 Pagar Agora
              </a>
              <a href="tel:${process.env.TELEFONE_CLINICA.replace(/\D/g, '')}"
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
                📞 Entrar em Contato
              </a>
            </div>
            
            <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center; color: #666;">
              <p><strong>Portal Dr. Marcio</strong></p>
              <p>📞 ${process.env.TELEFONE_CLINICA} | 📧 ${process.env.EMAIL_FROM}</p>
              <p>📍 ${process.env.ENDERECO_CLINICA}</p>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Orçamento #${numeroOrcamento} - Dr. Marcio`,
        html,
        attachments: pdfUrl ? [{
          filename: `orcamento_${numeroOrcamento}.pdf`,
          path: pdfUrl
        }] : []
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erro ao enviar orçamento por email:', error);
      throw error;
    }
  }

  async enviarConfirmacaoPagamento(dados) {
    try {
      const { email, nome, numeroOrcamento, valor } = dados;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
            <h1>🎉 Pagamento Confirmado!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Olá, <strong>${nome}</strong>!</p>
            
            <p>Confirmamos o recebimento do seu pagamento:</p>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p><strong>Orçamento:</strong> ${numeroOrcamento}</p>
              <p><strong>Valor Pago:</strong> R$ ${valor.toFixed(2)}</p>
              <p><strong>Status:</strong> ✅ Aprovado</p>
              <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            
            <p><strong>Próximos passos:</strong></p>
            <ul>
              <li>Entraremos em contato para agendar sua consulta</li>
              <li>Você receberá um email com os detalhes do agendamento</li>
              <li>Prepare-se para sua transformação! 🌟</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="tel:${process.env.TELEFONE_CLINICA.replace(/\D/g, '')}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                📞 Falar Conosco
              </a>
            </div>
            
            <hr style="margin: 30px 0;">
            
            <div style="text-align: center; color: #6c757d;">
              <p><strong>Portal Dr. Marcio</strong></p>
              <p>📞 ${process.env.TELEFONE_CLINICA} | 📧 ${process.env.EMAIL_FROM}</p>
              <p>📍 ${process.env.ENDERECO_CLINICA}</p>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `✅ Pagamento Confirmado - Orçamento ${numeroOrcamento}`,
        html
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erro ao enviar confirmação de pagamento:', error);
      throw error;
    }
  }

  async enviarCancelamentoAgendamento(dados) {
    try {
      const { email, nome, servico, data, hora, motivo } = dados;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
            <h1>Agendamento Cancelado</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Olá, <strong>${nome}</strong>!</p>
            
            <p>Informamos que seu agendamento foi cancelado:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Serviço:</strong> ${servico}</p>
              <p><strong>Data:</strong> ${data}</p>
              <p><strong>Horário:</strong> ${hora}</p>
              ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
            </div>
            
            <p>Se desejar agendar novamente, entre em contato conosco.</p>
            
            <hr style="margin: 30px 0;">
            
            <div style="text-align: center; color: #6c757d;">
              <p><strong>Portal Dr. Marcio</strong></p>
              <p>📞 ${process.env.TELEFONE_CLINICA}</p>
              <p>📧 ${process.env.EMAIL_FROM}</p>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Agendamento Cancelado - Dr. Marcio',
        html
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erro ao enviar email de cancelamento:', error);
      throw error;
    }
  }

  async testarConfiguracao() {
    try {
      await this.transporter.verify();
      console.log('✅ Configuração de email válida');
      return true;
    } catch (error) {
      console.error('❌ Erro na configuração de email:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
