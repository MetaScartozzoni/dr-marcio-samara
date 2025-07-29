// src/controllers/orcamento.controller.js
const orcamentoService = require('../services/orcamento.service');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');

class OrcamentoController {
  
  // Criar novo orçamento
  async criarOrcamento(req, res) {
    try {
      const {
        paciente_id,
        atendimento_id,
        itens,
        desconto = 0,
        observacoes = '',
        validade_dias = 30,
        forma_pagamento = [],
        enviar_notificacao = true
      } = req.body;

      // Buscar dados do paciente
      const { Pool } = require('pg');
      const db = new Pool({ connectionString: process.env.DATABASE_URL });
      
      const { rows: [paciente] } = await db.query(
        'SELECT * FROM usuarios WHERE id = $1',
        [paciente_id]
      );

      if (!paciente) {
        return res.status(404).json({ erro: 'Paciente não encontrado' });
      }

      // Buscar dados do atendimento se fornecido
      let atendimento = null;
      if (atendimento_id) {
        const { rows: [att] } = await db.query(
          'SELECT * FROM agendamentos WHERE id = $1',
          [atendimento_id]
        );
        atendimento = att;
      }

      // Gerar orçamento
      const orcamento = await orcamentoService.gerarOrcamento({
        paciente,
        atendimento,
        itens,
        desconto,
        observacoes,
        validade_dias,
        forma_pagamento
      });

      // Enviar notificações se solicitado
      if (enviar_notificacao) {
        try {
          // Email
          await emailService.enviarOrcamento({
            email: paciente.email,
            nome: paciente.full_name,
            numero_orcamento: orcamento.numero_orcamento,
            valor_final: orcamento.valor_final,
            link_aceite: orcamento.link_aceite,
            pdf_url: orcamento.pdf_url
          });

          // SMS se tiver telefone
          if (paciente.phone) {
            await smsService.enviarOrcamento({
              telefone: paciente.phone,
              nome: paciente.full_name,
              numero_orcamento: orcamento.numero_orcamento,
              valor_final: orcamento.valor_final,
              link_aceite: orcamento.link_aceite
            });
          }
        } catch (notificationError) {
          console.error('Erro ao enviar notificações:', notificationError);
          // Não falha a criação do orçamento por causa das notificações
        }
      }

      res.status(201).json({
        sucesso: true,
        message: 'Orçamento criado com sucesso',
        orcamento
      });

    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Buscar orçamento por ID
  async buscarOrcamento(req, res) {
    try {
      const { id } = req.params;
      const orcamento = await orcamentoService.buscarOrcamento(id);

      if (!orcamento) {
        return res.status(404).json({ erro: 'Orçamento não encontrado' });
      }

      // Verificar permissões
      if (req.user.role !== 'admin' && req.user.role !== 'staff') {
        if (req.user.id !== orcamento.paciente_id) {
          return res.status(403).json({ erro: 'Acesso negado' });
        }
      }

      res.json(orcamento);

    } catch (error) {
      console.error('Erro ao buscar orçamento:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Listar orçamentos
  async listarOrcamentos(req, res) {
    try {
      const {
        paciente_id,
        status,
        data_inicio,
        data_fim,
        page = 1,
        limit = 10
      } = req.query;

      let filtros = {};

      // Filtros baseados na role do usuário
      if (req.user.role === 'patient') {
        filtros.paciente_id = req.user.id;
      } else if (paciente_id) {
        filtros.paciente_id = paciente_id;
      }

      if (status) filtros.status = status;
      if (data_inicio && data_fim) {
        filtros.data_inicio = data_inicio;
        filtros.data_fim = data_fim;
      }

      // Paginação
      const offset = (page - 1) * limit;
      filtros.limit = limit;
      filtros.offset = offset;

      const orcamentos = await orcamentoService.listarOrcamentos(filtros);

      // Contar total para paginação
      const { Pool } = require('pg');
      const db = new Pool({ connectionString: process.env.DATABASE_URL });
      
      let countQuery = 'SELECT COUNT(*) FROM orcamentos o WHERE 1=1';
      const countParams = [];
      let paramCount = 0;

      if (filtros.paciente_id) {
        countQuery += ` AND o.paciente_id = $${++paramCount}`;
        countParams.push(filtros.paciente_id);
      }

      if (filtros.status) {
        countQuery += ` AND o.status = $${++paramCount}`;
        countParams.push(filtros.status);
      }

      const { rows: [{ count }] } = await db.query(countQuery, countParams);
      const totalPages = Math.ceil(count / limit);

      res.json({
        orcamentos,
        paginacao: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(count),
          totalPages
        }
      });

    } catch (error) {
      console.error('Erro ao listar orçamentos:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Aceitar orçamento
  async aceitarOrcamento(req, res) {
    try {
      const { id } = req.params;
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ erro: 'Token de aceite é obrigatório' });
      }

      const resultado = await orcamentoService.aceitarOrcamento(id, token);

      // Notificar a clínica sobre a aceitação
      try {
        const orcamento = await orcamentoService.buscarOrcamento(id);
        
        await emailService.notificarAceitacaoOrcamento({
          orcamento,
          paciente_nome: orcamento.paciente_nome,
          paciente_email: orcamento.paciente_email
        });

      } catch (notificationError) {
        console.error('Erro ao notificar aceitação:', notificationError);
      }

      res.json(resultado);

    } catch (error) {
      console.error('Erro ao aceitar orçamento:', error);
      res.status(400).json({
        erro: error.message
      });
    }
  }

  // Rejeitar orçamento
  async rejeitarOrcamento(req, res) {
    try {
      const { id } = req.params;
      const { motivo = '' } = req.body;

      const orcamento = await orcamentoService.rejeitarOrcamento(id, motivo);

      // Notificar a clínica sobre a rejeição
      try {
        await emailService.notificarRejeicaoOrcamento({
          orcamento,
          motivo
        });

      } catch (notificationError) {
        console.error('Erro ao notificar rejeição:', notificationError);
      }

      res.json({
        sucesso: true,
        message: 'Orçamento rejeitado',
        orcamento
      });

    } catch (error) {
      console.error('Erro ao rejeitar orçamento:', error);
      res.status(400).json({
        erro: error.message
      });
    }
  }

  // Duplicar orçamento
  async duplicarOrcamento(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar permissões
      if (req.user.role !== 'admin' && req.user.role !== 'staff') {
        return res.status(403).json({ erro: 'Acesso negado' });
      }

      const novoOrcamento = await orcamentoService.duplicarOrcamento(id);

      res.status(201).json({
        sucesso: true,
        message: 'Orçamento duplicado com sucesso',
        orcamento: novoOrcamento
      });

    } catch (error) {
      console.error('Erro ao duplicar orçamento:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Reenviar orçamento
  async reenviarOrcamento(req, res) {
    try {
      const { id } = req.params;
      const { via = ['email', 'sms'] } = req.body;

      const orcamento = await orcamentoService.buscarOrcamento(id);

      if (!orcamento) {
        return res.status(404).json({ erro: 'Orçamento não encontrado' });
      }

      if (orcamento.status !== 'pendente') {
        return res.status(400).json({ erro: 'Apenas orçamentos pendentes podem ser reenviados' });
      }

      const resultados = { sucesso: true, enviados: [] };

      // Reenviar por email
      if (via.includes('email')) {
        try {
          await emailService.enviarOrcamento({
            email: orcamento.paciente_email,
            nome: orcamento.paciente_nome,
            numero_orcamento: orcamento.numero_orcamento,
            valor_final: orcamento.valor_final,
            link_aceite: orcamento.link_aceite,
            pdf_url: orcamento.pdf_url
          });
          resultados.enviados.push('email');
        } catch (emailError) {
          console.error('Erro ao reenviar email:', emailError);
        }
      }

      // Reenviar por SMS
      if (via.includes('sms') && orcamento.paciente_telefone) {
        try {
          await smsService.enviarOrcamento({
            telefone: orcamento.paciente_telefone,
            nome: orcamento.paciente_nome,
            numero_orcamento: orcamento.numero_orcamento,
            valor_final: orcamento.valor_final,
            link_aceite: orcamento.link_aceite
          });
          resultados.enviados.push('sms');
        } catch (smsError) {
          console.error('Erro ao reenviar SMS:', smsError);
        }
      }

      res.json({
        ...resultados,
        message: `Orçamento reenviado via: ${resultados.enviados.join(', ')}`
      });

    } catch (error) {
      console.error('Erro ao reenviar orçamento:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Gerar relatório de orçamentos
  async gerarRelatorio(req, res) {
    try {
      const {
        data_inicio,
        data_fim,
        formato = 'json'
      } = req.query;

      if (!data_inicio || !data_fim) {
        return res.status(400).json({
          erro: 'Período é obrigatório',
          message: 'Informe data_inicio e data_fim'
        });
      }

      const relatorio = await orcamentoService.gerarRelatorioOrcamentos({
        inicio: data_inicio,
        fim: data_fim
      });

      if (formato === 'pdf') {
        // TODO: Implementar geração de relatório em PDF
        return res.status(501).json({ erro: 'Formato PDF ainda não implementado' });
      }

      res.json({
        periodo: { data_inicio, data_fim },
        relatorio
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Download do PDF do orçamento
  async downloadPDF(req, res) {
    try {
      const { id } = req.params;
      const orcamento = await orcamentoService.buscarOrcamento(id);

      if (!orcamento) {
        return res.status(404).json({ erro: 'Orçamento não encontrado' });
      }

      // Verificar permissões
      if (req.user.role !== 'admin' && req.user.role !== 'staff') {
        if (req.user.id !== orcamento.paciente_id) {
          return res.status(403).json({ erro: 'Acesso negado' });
        }
      }

      if (!orcamento.pdf_url) {
        return res.status(404).json({ erro: 'PDF não encontrado' });
      }

      // Redirecionar para a URL do PDF
      res.redirect(orcamento.pdf_url);

    } catch (error) {
      console.error('Erro ao fazer download do PDF:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Atualizar status do orçamento (admin/staff apenas)
  async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, observacoes_internas } = req.body;

      if (req.user.role !== 'admin' && req.user.role !== 'staff') {
        return res.status(403).json({ erro: 'Acesso negado' });
      }

      const statusValidos = ['pendente', 'aceito', 'rejeitado', 'expirado', 'cancelado'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({ erro: 'Status inválido' });
      }

      const { Pool } = require('pg');
      const db = new Pool({ connectionString: process.env.DATABASE_URL });

      const query = `
        UPDATE orcamentos 
        SET status = $1, observacoes_internas = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;

      const { rows: [orcamento] } = await db.query(query, [status, observacoes_internas, id]);

      if (!orcamento) {
        return res.status(404).json({ erro: 'Orçamento não encontrado' });
      }

      res.json({
        sucesso: true,
        message: 'Status atualizado com sucesso',
        orcamento
      });

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // Dashboard de estatísticas de orçamentos
  async estatisticas(req, res) {
    try {
      const {
        periodo = '30', // dias
        usuario_id
      } = req.query;

      if (req.user.role !== 'admin' && req.user.role !== 'staff') {
        return res.status(403).json({ erro: 'Acesso negado' });
      }

      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));

      const { Pool } = require('pg');
      const db = new Pool({ connectionString: process.env.DATABASE_URL });

      let query = `
        SELECT 
          COUNT(*) as total_orcamentos,
          COUNT(*) FILTER (WHERE status = 'aceito') as aceitos,
          COUNT(*) FILTER (WHERE status = 'rejeitado') as rejeitados,
          COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
          COUNT(*) FILTER (WHERE status = 'expirado') as expirados,
          SUM(valor_final) FILTER (WHERE status = 'aceito') as valor_total_aceito,
          AVG(valor_final) as valor_medio,
          MIN(valor_final) as menor_valor,
          MAX(valor_final) as maior_valor
        FROM orcamentos 
        WHERE created_at >= $1
      `;

      const params = [dataInicio];

      if (usuario_id) {
        query += ` AND paciente_id = $2`;
        params.push(usuario_id);
      }

      const { rows: [stats] } = await db.query(query, params);

      // Estatísticas por período (últimos 7 dias)
      const queryPeriodo = `
        SELECT 
          DATE(created_at) as data,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'aceito') as aceitos,
          SUM(valor_final) FILTER (WHERE status = 'aceito') as valor_dia
        FROM orcamentos 
        WHERE created_at >= $1
        GROUP BY DATE(created_at)
        ORDER BY data DESC
        LIMIT 7
      `;

      const { rows: estatisticasPorDia } = await db.query(queryPeriodo, [dataInicio]);

      res.json({
        resumo: {
          ...stats,
          taxa_conversao: stats.total_orcamentos > 0 
            ? ((stats.aceitos / stats.total_orcamentos) * 100).toFixed(2)
            : 0,
          valor_total_aceito: parseFloat(stats.valor_total_aceito || 0),
          valor_medio: parseFloat(stats.valor_medio || 0),
          menor_valor: parseFloat(stats.menor_valor || 0),
          maior_valor: parseFloat(stats.maior_valor || 0)
        },
        periodo: {
          dias: parseInt(periodo),
          data_inicio: dataInicio.toISOString().split('T')[0]
        },
        evolucao_diaria: estatisticasPorDia
      });

    } catch (error) {
      console.error('Erro ao gerar estatísticas:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
}

module.exports = new OrcamentoController();
