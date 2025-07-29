// src/services/sms.service.js
const twilio = require('twilio');
const axios = require('axios');

class SMSService {
  constructor() {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.whatsappAPI = process.env.WHATSAPP_API_URL;
    this.whatsappToken = process.env.WHATSAPP_TOKEN;
  }

  async enviarSMS(telefone, mensagem) {
    try {
      const messageOptions = {
        body: mensagem,
        to: this.formatarTelefone(telefone)
      };

      // Usar Messaging Service ID se disponível, senão usar número direto
      if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
        messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
      } else {
        messageOptions.from = process.env.TWILIO_PHONE_NUMBER;
      }

      const message = await this.twilioClient.messages.create(messageOptions);
      
      return { sucesso: true, messageId: message.sid };
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      return { sucesso: false, erro: error.message };
    }
  }

  async enviarWhatsApp(telefone, mensagem, template = null) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatarTelefone(telefone),
        type: template ? 'template' : 'text'
      };

      if (template) {
        payload.template = {
          name: template.name,
          language: { code: 'pt_BR' },
          components: template.components
        };
      } else {
        payload.text = { body: mensagem };
      }

      const response = await axios.post(
        `${this.whatsappAPI}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.whatsappToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { sucesso: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      return { sucesso: false, erro: error.message };
    }
  }

  async enviarConfirmacaoAgendamento(dados) {
    const mensagem = `
🏥 *Confirmação de Agendamento*

Olá ${dados.nome}!

Seu agendamento foi confirmado:
📅 Data: ${new Date(dados.data).toLocaleDateString('pt-BR')}
🕐 Horário: ${new Date(dados.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
🩺 Serviço: ${dados.servico}

📍 Endereço: ${process.env.ENDERECO_CLINICA}
📞 Contato: ${process.env.TELEFONE_CLINICA}

Em caso de necessidade de reagendamento, entre em contato conosco.

Dr. Marcio - Cirurgia Plástica
    `.trim();

    // Tentar WhatsApp primeiro, depois SMS
    let resultado = await this.enviarWhatsApp(dados.telefone, mensagem);
    
    if (!resultado.sucesso) {
      resultado = await this.enviarSMS(dados.telefone, mensagem);
    }

    return resultado;
  }

  async enviarLembreteAgendamento(dados) {
    const template = {
      name: 'lembrete_consulta',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: dados.nome },
            { type: 'text', text: new Date(dados.data).toLocaleDateString('pt-BR') },
            { type: 'text', text: new Date(dados.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
            { type: 'text', text: dados.servico }
          ]
        }
      ]
    };

    return await this.enviarWhatsApp(dados.telefone, null, template);
  }

  async enviarCancelamentoAgendamento(dados) {
    const mensagem = `
❌ *Agendamento Cancelado*

Olá ${dados.nome}!

Informamos que seu agendamento foi cancelado:

📅 Data: ${dados.data}
🕐 Horário: ${dados.hora}
🩺 Serviço: ${dados.servico}
${dados.motivo ? `📝 Motivo: ${dados.motivo}` : ''}

Para reagendar, entre em contato conosco:
📞 ${process.env.TELEFONE_CLINICA}

Dr. Marcio - Cirurgia Plástica
    `.trim();

    // Tentar WhatsApp primeiro, depois SMS
    let resultado = await this.enviarWhatsApp(dados.telefone, mensagem);
    
    if (!resultado.sucesso) {
      resultado = await this.enviarSMS(dados.telefone, mensagem);
    }

    return resultado;
  }

  async enviarReagendamento(dados) {
    const mensagem = `
📅 *Agendamento Reagendado*

Olá ${dados.nome}!

Seu agendamento foi reagendado:

❌ *Anterior:*
📅 Data: ${dados.dataAnterior}
🕐 Horário: ${dados.horaAnterior}

✅ *Novo:*
📅 Data: ${dados.dataNova}
🕐 Horário: ${dados.horaNova}
🩺 Serviço: ${dados.servico}

📍 Local: ${process.env.ENDERECO_CLINICA}

*Lembre-se:*
• Chegue 15 min antes
• Traga documento com foto

Dr. Marcio - Cirurgia Plástica
    `.trim();

    // Tentar WhatsApp primeiro, depois SMS
    let resultado = await this.enviarWhatsApp(dados.telefone, mensagem);
    
    if (!resultado.sucesso) {
      resultado = await this.enviarSMS(dados.telefone, mensagem);
    }

    return resultado;
  }

  async enviarLembrete24h(dados) {
    const mensagem = `
🔔 *Lembrete de Consulta*

Olá ${dados.nome}!

Você tem uma consulta AMANHÃ:

📅 Data: ${dados.data}
🕐 Horário: ${dados.hora}
🩺 Serviço: ${dados.servico}

📍 Local: ${process.env.ENDERECO_CLINICA}

*Importante:*
• Chegue 15 min antes
• Traga RG ou CNH
• Use máscara

Para reagendar: ${process.env.TELEFONE_CLINICA}

Dr. Marcio - Cirurgia Plástica
    `.trim();

    // Tentar WhatsApp primeiro, depois SMS
    let resultado = await this.enviarWhatsApp(dados.telefone, mensagem);
    
    if (!resultado.sucesso) {
      resultado = await this.enviarSMS(dados.telefone, mensagem);
    }

    return resultado;
  }

  async enviarOrcamento(dados) {
    const servicosTexto = dados.servicos.map(s => 
      `• ${s.nome} (${s.quantidade || 1}x) - R$ ${s.valor.toFixed(2)}`
    ).join('\n');

    const mensagem = `
💰 *Orçamento ${dados.numeroOrcamento}*

Olá ${dados.nome}!

Segue seu orçamento:

*Serviços:*
${servicosTexto}

*Total: R$ ${dados.valorTotal.toFixed(2)}*
*Válido até: ${dados.validade}*

${dados.observacoes ? `*Observações:*\n${dados.observacoes}\n` : ''}

*Formas de Pagamento:*
• PIX (3% desconto)
• Cartão até 12x
• Dinheiro (5% desconto)

Para aceitar: ${process.env.TELEFONE_CLINICA}

Dr. Marcio - Cirurgia Plástica
    `.trim();

    // Tentar WhatsApp primeiro, depois SMS
    let resultado = await this.enviarWhatsApp(dados.telefone, mensagem);
    
    if (!resultado.sucesso) {
      resultado = await this.enviarSMS(dados.telefone, mensagem);
    }

    return resultado;
  }

  async enviarCodigoVerificacao(telefone, codigo) {
    const mensagem = `
🔐 *Código de Verificação*

Seu código de verificação é: *${codigo}*

⏰ Válido por 10 minutos
🔒 Não compartilhe este código

Dr. Marcio - Portal Médico
    `.trim();

    // SMS é mais adequado para códigos de verificação
    return await this.enviarSMS(telefone, mensagem);
  }

  async enviarBoasVindas(dados) {
    const mensagem = `
🎉 *Bem-vindo ao Portal Dr. Marcio!*

Olá ${dados.nome}!

Sua conta foi criada com sucesso!

*O que você pode fazer:*
• Agendar consultas online
• Receber lembretes automáticos
• Acessar histórico médico
• Solicitar orçamentos

*Dados para login:*
📧 Email: ${dados.email}

Acesse: ${process.env.FRONTEND_URL}/login

Dr. Marcio - Cirurgia Plástica
📞 ${process.env.TELEFONE_CLINICA}
    `.trim();

    // Tentar WhatsApp primeiro, depois SMS
    let resultado = await this.enviarWhatsApp(dados.telefone, mensagem);
    
    if (!resultado.sucesso) {
      resultado = await this.enviarSMS(dados.telefone, mensagem);
    }

    return resultado;
  }

  async enviarConfirmacaoPagamento(dados) {
    const mensagem = `
🎉 *Pagamento Confirmado!*

Olá ${dados.nome}!

Seu pagamento foi aprovado:

📋 Orçamento: ${dados.numeroOrcamento}
💰 Valor: R$ ${dados.valor.toFixed(2)}
✅ Status: PAGO
📅 Data: ${new Date().toLocaleDateString('pt-BR')}

*Próximos passos:*
• Entraremos em contato para agendar
• Prepare-se para sua transformação! 🌟

📞 Contato: ${process.env.TELEFONE_CLINICA}

Dr. Marcio - Cirurgia Plástica
Obrigado por confiar em nosso trabalho!
    `.trim();

    // Tentar WhatsApp primeiro, depois SMS
    let resultado = await this.enviarWhatsApp(dados.telefone, mensagem);
    
    if (!resultado.sucesso) {
      resultado = await this.enviarSMS(dados.telefone, mensagem);
    }

    return resultado;
  }

  formatarTelefone(telefone) {
    // Verificar se telefone foi fornecido
    if (!telefone) {
      throw new Error('Número de telefone é obrigatório');
    }
    
    // Remove caracteres não numéricos
    const numero = telefone.toString().replace(/\D/g, '');
    
    // Adiciona código do país se não tiver
    if (numero.length === 11) {
      return `+55${numero}`;
    } else if (numero.length === 13 && numero.startsWith('55')) {
      return `+${numero}`;
    }
    
    return telefone;
  }

  // Método para verificar status de entrega
  async verificarStatusEntrega(messageId, tipo = 'sms') {
    try {
      if (tipo === 'sms') {
        const message = await this.twilioClient.messages(messageId).fetch();
        return {
          status: message.status,
          erro: message.errorMessage
        };
      } else if (tipo === 'whatsapp') {
        const response = await axios.get(
          `${this.whatsappAPI}/messages/${messageId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.whatsappToken}`
            }
          }
        );
        return response.data;
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return { erro: error.message };
    }
  }

  // Método para testar configurações
  async testarConfiguracao() {
    const resultados = {
      twilio: false,
      whatsapp: false,
      erros: []
    };

    // Testar Twilio
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        await this.twilioClient.accounts.list({ limit: 1 });
        resultados.twilio = true;
        console.log('✅ Configuração Twilio válida');
      } else {
        resultados.erros.push('Credenciais Twilio não configuradas');
      }
    } catch (error) {
      resultados.erros.push(`Erro Twilio: ${error.message}`);
    }

    // Testar WhatsApp API
    try {
      if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_TOKEN) {
        const response = await axios.get(
          `${this.whatsappAPI}/phone_numbers`,
          {
            headers: {
              'Authorization': `Bearer ${this.whatsappToken}`
            }
          }
        );
        if (response.status === 200) {
          resultados.whatsapp = true;
          console.log('✅ Configuração WhatsApp válida');
        }
      } else {
        resultados.erros.push('Credenciais WhatsApp não configuradas');
      }
    } catch (error) {
      resultados.erros.push(`Erro WhatsApp: ${error.message}`);
    }

    return resultados;
  }

  // Método para envio em lote
  async enviarEmLote(mensagens) {
    const resultados = [];
    
    for (const msg of mensagens) {
      try {
        let resultado;
        
        if (msg.tipo === 'whatsapp') {
          resultado = await this.enviarWhatsApp(msg.telefone, msg.mensagem, msg.template);
        } else {
          resultado = await this.enviarSMS(msg.telefone, msg.mensagem);
        }
        
        resultados.push({
          telefone: msg.telefone,
          sucesso: resultado.sucesso,
          messageId: resultado.messageId,
          erro: resultado.erro
        });
        
        // Delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        resultados.push({
          telefone: msg.telefone,
          sucesso: false,
          erro: error.message
        });
      }
    }
    
    return resultados;
  }

  // Método para criar templates WhatsApp (apenas para referência)
  criarTemplateWhatsApp(nome, categoria, componentes) {
    return {
      name: nome,
      category: categoria,
      language: 'pt_BR',
      components: componentes
    };
  }

  // Templates pré-definidos
  obterTemplates() {
    return {
      lembrete_consulta: {
        name: 'lembrete_consulta',
        components: [
          {
            type: 'header',
            format: 'text',
            text: '🔔 Lembrete de Consulta'
          },
          {
            type: 'body',
            text: 'Olá {{1}}! Você tem uma consulta agendada para {{2}} às {{3}} - {{4}}. Não se esqueça!'
          },
          {
            type: 'footer',
            text: 'Dr. Marcio - Cirurgia Plástica'
          }
        ]
      },
      confirmacao_agendamento: {
        name: 'confirmacao_agendamento',
        components: [
          {
            type: 'header',
            format: 'text',
            text: '✅ Agendamento Confirmado'
          },
          {
            type: 'body',
            text: 'Olá {{1}}! Seu agendamento foi confirmado para {{2}} às {{3}} - {{4}}.'
          },
          {
            type: 'footer',
            text: 'Dr. Marcio - Cirurgia Plástica'
          }
        ]
      }
    };
  }
}

module.exports = new SMSService();
