// test/sms.test.js
const smsService = require('../src/services/sms.service');

async function testarSMSService() {
  console.log('📱 Testando Serviço de SMS/WhatsApp...\n');

  try {
    // 1. Testar configuração
    console.log('1️⃣ Testando configurações...');
    const config = await smsService.testarConfiguracao();
    
    console.log('📊 Resultados da configuração:');
    console.log(`  • Twilio: ${config.twilio ? '✅ Ativo' : '❌ Inativo'}`);
    console.log(`  • WhatsApp: ${config.whatsapp ? '✅ Ativo' : '❌ Inativo'}`);
    
    if (config.erros.length > 0) {
      console.log('⚠️ Erros encontrados:');
      config.erros.forEach(erro => console.log(`  • ${erro}`));
    }
    
    console.log('\n' + '='.repeat(50) + '\n');

    // 2. Testar formatação de telefone
    console.log('2️⃣ Testando formatação de telefones...');
    const telefonesTeste = [
      '11999999999',
      '(11) 99999-9999',
      '5511999999999',
      '+5511999999999'
    ];
    
    telefonesTeste.forEach(tel => {
      const formatado = smsService.formatarTelefone(tel);
      console.log(`  ${tel} → ${formatado}`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');

    // 3. Testar templates
    console.log('3️⃣ Testando templates WhatsApp...');
    const templates = smsService.obterTemplates();
    
    Object.keys(templates).forEach(nome => {
      console.log(`  📋 Template: ${nome}`);
      console.log(`     Componentes: ${templates[nome].components.length}`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');

    // 4. Simular envios (apenas se configuração estiver válida)
    if (config.twilio || config.whatsapp) {
      console.log('4️⃣ Simulando envios de teste...');
      
      const dadosTeste = {
        telefone: '+5511999999999', // Número fictício
        nome: 'João Silva',
        servico: 'Consulta Odontológica',
        data: new Date(),
        agendamentoId: 'TEST123'
      };

      // Teste de confirmação de agendamento
      console.log('📧 Testando confirmação de agendamento...');
      try {
        const resultado = await smsService.enviarConfirmacaoAgendamento(dadosTeste);
        console.log(`  Resultado: ${resultado.sucesso ? '✅ Sucesso' : '❌ Falhou'}`);
        if (resultado.messageId) {
          console.log(`  Message ID: ${resultado.messageId}`);
        }
        if (resultado.erro) {
          console.log(`  Erro: ${resultado.erro}`);
        }
      } catch (error) {
        console.log(`  ❌ Erro: ${error.message}`);
      }

      console.log('\n📱 Testando lembrete 24h...');
      try {
        const resultado = await smsService.enviarLembrete24h({
          telefone: '+5511999999999',
          nome: 'Maria Santos',
          servico: 'Limpeza Dental',
          data: 'Amanhã (29/07/2025)',
          hora: '14:30'
        });
        console.log(`  Resultado: ${resultado.sucesso ? '✅ Sucesso' : '❌ Falhou'}`);
        if (resultado.erro) {
          console.log(`  Erro: ${resultado.erro}`);
        }
      } catch (error) {
        console.log(`  ❌ Erro: ${error.message}`);
      }

      console.log('\n💰 Testando envio de orçamento...');
      try {
        const resultado = await smsService.enviarOrcamento({
          telefone: '+5511999999999',
          nome: 'Carlos Oliveira',
          numeroOrcamento: 'ORC-TEST-001',
          valorTotal: 850.00,
          validade: '31/08/2025',
          servicos: [
            { nome: 'Consulta Inicial', quantidade: 1, valor: 100.00 },
            { nome: 'Tratamento de Canal', quantidade: 2, valor: 300.00 }
          ],
          observacoes: 'Desconto especial para pagamento à vista'
        });
        console.log(`  Resultado: ${resultado.sucesso ? '✅ Sucesso' : '❌ Falhou'}`);
        if (resultado.erro) {
          console.log(`  Erro: ${resultado.erro}`);
        }
      } catch (error) {
        console.log(`  ❌ Erro: ${error.message}`);
      }

      console.log('\n🔐 Testando código de verificação...');
      try {
        const codigo = Math.floor(100000 + Math.random() * 900000);
        const resultado = await smsService.enviarCodigoVerificacao('+5511999999999', codigo);
        console.log(`  Resultado: ${resultado.sucesso ? '✅ Sucesso' : '❌ Falhou'}`);
        if (resultado.erro) {
          console.log(`  Erro: ${resultado.erro}`);
        }
      } catch (error) {
        console.log(`  ❌ Erro: ${error.message}`);
      }

    } else {
      console.log('⚠️ Configurações não disponíveis. Configure Twilio ou WhatsApp para testar envios.');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 5. Testar envio em lote
    console.log('5️⃣ Testando envio em lote...');
    const mensagensLote = [
      {
        tipo: 'sms',
        telefone: '+5511999999999',
        mensagem: 'Mensagem de teste 1'
      },
      {
        tipo: 'whatsapp',
        telefone: '+5511999999999',
        mensagem: 'Mensagem de teste 2'
      }
    ];

    try {
      const resultados = await smsService.enviarEmLote(mensagensLote);
      console.log('📊 Resultados do envio em lote:');
      resultados.forEach((resultado, index) => {
        console.log(`  Mensagem ${index + 1}: ${resultado.sucesso ? '✅ Sucesso' : '❌ Falhou'}`);
        if (resultado.erro) {
          console.log(`    Erro: ${resultado.erro}`);
        }
      });
    } catch (error) {
      console.log(`❌ Erro no envio em lote: ${error.message}`);
    }

    console.log('\n🎉 Testes do serviço SMS/WhatsApp concluídos!');
    console.log('\n📝 Notas importantes:');
    console.log('- Configure as credenciais Twilio e/ou WhatsApp no .env');
    console.log('- WhatsApp Business API requer templates aprovados');
    console.log('- SMS através do Twilio tem custos por mensagem');
    console.log('- Teste com números reais apenas em ambiente de produção');
    console.log('- Respeite os limites de taxa de cada provedor');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Função para testar um número específico (usar com cuidado)
async function testarNumeroReal(telefone) {
  console.log(`📱 Testando envio para número real: ${telefone}\n`);
  
  const codigo = Math.floor(100000 + Math.random() * 900000);
  
  try {
    const resultado = await smsService.enviarCodigoVerificacao(telefone, codigo);
    
    if (resultado.sucesso) {
      console.log('✅ SMS enviado com sucesso!');
      console.log(`📱 Código enviado: ${codigo}`);
      console.log(`📄 Message ID: ${resultado.messageId}`);
    } else {
      console.log('❌ Falha ao enviar SMS');
      console.log(`🚫 Erro: ${resultado.erro}`);
    }
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === '--real' && args[1]) {
    // Teste com número real: node test/sms.test.js --real +5511999999999
    testarNumeroReal(args[1]);
  } else {
    testarSMSService();
  }
}

module.exports = { 
  testarSMSService, 
  testarNumeroReal 
};
