// src/controllers/lgpd.controller.js
const lgpdService = require('../services/lgpd.service');
const { validationResult } = require('express-validator');

class LGPDController {
  // Registrar consentimento do usuário
  async registrarConsentimento(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          erro: 'Dados inválidos',
          detalhes: errors.array()
        });
      }

      const { tipo_consentimento, finalidade } = req.body;
      const usuario_id = req.user.id;
      const ip_origem = req.ip || req.connection.remoteAddress;

      const consentimento = await lgpdService.registrarConsentimento(
        usuario_id,
        tipo_consentimento,
        finalidade,
        ip_origem
      );

      res.status(201).json({
        mensagem: 'Consentimento registrado com sucesso',
        consentimento,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao registrar consentimento:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: 'Falha ao registrar consentimento'
      });
    }
  }

  // Revogar consentimento
  async revogarConsentimento(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          erro: 'Dados inválidos',
          detalhes: errors.array()
        });
      }

      const { tipo_consentimento, motivo } = req.body;
      const usuario_id = req.user.id;

      const consentimento = await lgpdService.revogarConsentimento(
        usuario_id,
        tipo_consentimento,
        motivo
      );

      if (!consentimento) {
        return res.status(404).json({
          erro: 'Consentimento não encontrado ou já revogado'
        });
      }

      res.json({
        mensagem: 'Consentimento revogado com sucesso',
        consentimento,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao revogar consentimento:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: 'Falha ao revogar consentimento'
      });
    }
  }

  // Listar consentimentos do usuário
  async listarConsentimentos(req, res) {
    try {
      const usuario_id = req.user.id;

      const consentimentos = await lgpdService.verificarConsentimentos(usuario_id);

      res.json({
        usuario_id,
        consentimentos,
        total: consentimentos.length,
        consultado_em: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao listar consentimentos:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: 'Falha ao consultar consentimentos'
      });
    }
  }

  // Exportar dados do usuário (Portabilidade)
  async exportarDados(req, res) {
    try {
      const usuario_id = req.user.id;
      const { formato = 'JSON' } = req.query;

      // Verificar se tem consentimento para exportação
      const temConsentimento = await lgpdService.temConsentimento(
        usuario_id, 
        'PROCESSAMENTO_DADOS'
      );

      if (!temConsentimento) {
        return res.status(403).json({
          erro: 'Consentimento necessário',
          mensagem: 'É necessário consentimento para exportação de dados'
        });
      }

      const dadosExportados = await lgpdService.exportarDadosUsuario(
        usuario_id,
        formato.toUpperCase()
      );

      // Definir headers para download
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `dados_pessoais_${usuario_id}_${timestamp}.json`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');

      res.json({
        status: 'sucesso',
        mensagem: 'Dados exportados conforme Art. 20 da LGPD',
        dados: dadosExportados,
        observacoes: {
          direito_portabilidade: 'Art. 20 da Lei 13.709/2018',
          formato_exportacao: formato,
          data_exportacao: new Date().toISOString(),
          validade_dados: '30 dias a partir da exportação'
        }
      });

    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: 'Falha na exportação de dados'
      });
    }
  }

  // Solicitar exclusão de dados (Direito ao Esquecimento)
  async solicitarExclusao(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          erro: 'Dados inválidos',
          detalhes: errors.array()
        });
      }

      const { motivo, confirmar_exclusao } = req.body;
      const usuario_id = req.user.id;

      if (!confirmar_exclusao) {
        return res.status(400).json({
          erro: 'Confirmação necessária',
          mensagem: 'É necessário confirmar a exclusão dos dados'
        });
      }

      // Executar exclusão/anonimização
      const resultado = await lgpdService.excluirDadosUsuario(
        usuario_id,
        motivo,
        `usuario_${usuario_id}`
      );

      res.json({
        mensagem: 'Solicitação de exclusão processada com sucesso',
        resultado,
        observacoes: {
          direito_esquecimento: 'Art. 17 da Lei 13.709/2018',
          processo: 'Dados anonimizados conforme LGPD',
          irreversivel: true,
          prazo_conclusao: 'Imediato'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao processar exclusão:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: 'Falha ao processar solicitação de exclusão'
      });
    }
  }

  // Verificar se usuário tem consentimento específico
  async verificarConsentimento(req, res) {
    try {
      const { tipo_consentimento } = req.params;
      const usuario_id = req.user.id;

      const temConsentimento = await lgpdService.temConsentimento(
        usuario_id,
        tipo_consentimento
      );

      res.json({
        usuario_id,
        tipo_consentimento,
        tem_consentimento: temConsentimento,
        consultado_em: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao verificar consentimento:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: 'Falha ao verificar consentimento'
      });
    }
  }

  // Relatório de conformidade LGPD (Admin)
  async relatorioConformidade(req, res) {
    try {
      // Verificar se usuário é admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          erro: 'Acesso negado',
          mensagem: 'Apenas administradores podem acessar relatórios'
        });
      }

      const { data_inicio, data_fim } = req.query;

      if (!data_inicio || !data_fim) {
        return res.status(400).json({
          erro: 'Parâmetros obrigatórios',
          mensagem: 'data_inicio e data_fim são obrigatórios'
        });
      }

      const relatorio = await lgpdService.relatorioConformidade(
        data_inicio,
        data_fim
      );

      res.json({
        titulo: 'Relatório de Conformidade LGPD',
        relatorio,
        gerado_por: req.user.email,
        gerado_em: new Date().toISOString(),
        observacoes: {
          lei: 'Lei Geral de Proteção de Dados - Lei 13.709/2018',
          orgao_fiscalizador: 'ANPD - Autoridade Nacional de Proteção de Dados',
          confidencial: true
        }
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: 'Falha ao gerar relatório de conformidade'
      });
    }
  }

  // Política de privacidade e termos LGPD
  async politicaPrivacidade(req, res) {
    try {
      const politica = {
        titulo: 'Política de Privacidade e Proteção de Dados',
        versao: '2.0',
        data_atualizacao: '2024-01-01',
        base_legal: 'Lei 13.709/2018 - Lei Geral de Proteção de Dados Pessoais',
        
        controlador_dados: {
          nome: 'Dr. Marcio Scartozzoni',
          email: 'privacidade@drmarcio.com.br',
          telefone: '+55 11 99999-9999'
        },

        tipos_dados_coletados: [
          'Dados de identificação (nome, CPF, email, telefone)',
          'Dados de saúde (histórico médico, exames, prescrições)',
          'Dados de localização (endereço para atendimento)',
          'Dados de navegação (logs de acesso, cookies)'
        ],

        finalidades_tratamento: [
          'Prestação de serviços médicos',
          'Agendamento de consultas',
          'Emissão de orçamentos',
          'Comunicação com pacientes',
          'Cumprimento de obrigações legais',
          'Melhoria dos serviços'
        ],

        direitos_titular: [
          'Confirmação da existência de tratamento (Art. 18, I)',
          'Acesso aos dados (Art. 18, II)',
          'Correção de dados incompletos ou inexatos (Art. 18, III)',
          'Anonimização ou exclusão (Art. 18, IV)',
          'Portabilidade dos dados (Art. 18, V)',
          'Eliminação dos dados tratados com consentimento (Art. 18, VI)',
          'Informação sobre uso compartilhado (Art. 18, VII)',
          'Informação sobre não consentimento (Art. 18, VIII)',
          'Revogação do consentimento (Art. 18, IX)'
        ],

        prazo_resposta: '15 dias úteis conforme Art. 19 da LGPD',
        canal_comunicacao: 'privacidade@drmarcio.com.br',

        cookies_tecnologia: {
          uso: 'Melhoria da experiência do usuário',
          tipos: ['Essenciais', 'Funcionais', 'Analíticos'],
          controle: 'Configurações do navegador'
        },

        compartilhamento_dados: [
          'Não compartilhamos dados pessoais com terceiros',
          'Dados podem ser compartilhados apenas com autorização legal',
          'Processadores de pagamento (com consentimento)',
          'Autoridades competentes (quando exigido por lei)'
        ],

        seguranca_dados: [
          'Criptografia de dados em trânsito e repouso',
          'Controle de acesso baseado em roles',
          'Logs de auditoria',
          'Backup seguro',
          'Treinamento da equipe'
        ]
      };

      res.json(politica);

    } catch (error) {
      console.error('Erro ao obter política:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: 'Falha ao carregar política de privacidade'
      });
    }
  }

  // Endpoint para aceitar/rejeitar cookies
  async gerenciarCookies(req, res) {
    try {
      const { aceitar_essenciais, aceitar_funcionais, aceitar_analiticos } = req.body;
      const usuario_id = req.user ? req.user.id : null;

      // Registrar preferências de cookies
      if (usuario_id) {
        await lgpdService.registrarConsentimento(
          usuario_id,
          'COOKIES',
          JSON.stringify({
            essenciais: aceitar_essenciais,
            funcionais: aceitar_funcionais,
            analiticos: aceitar_analiticos
          })
        );
      }

      // Definir cookies de preferência
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 365 * 24 * 60 * 60 * 1000 // 1 ano
      };

      res.cookie('cookie_essenciais', aceitar_essenciais, cookieOptions);
      res.cookie('cookie_funcionais', aceitar_funcionais, cookieOptions);
      res.cookie('cookie_analiticos', aceitar_analiticos, cookieOptions);

      res.json({
        mensagem: 'Preferências de cookies atualizadas',
        preferencias: {
          essenciais: aceitar_essenciais,
          funcionais: aceitar_funcionais,
          analiticos: aceitar_analiticos
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao gerenciar cookies:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: 'Falha ao atualizar preferências'
      });
    }
  }
}

module.exports = new LGPDController();
