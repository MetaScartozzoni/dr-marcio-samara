// src/controllers/agendamento.controller.js
const { Pool } = require('pg');
const Redis = require('redis');
const { validationResult } = require('express-validator');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');

class AgendamentoController {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.redis = Redis.createClient(process.env.REDIS_URL);
  }

  // Obter disponibilidade em tempo real
  async getDisponibilidade(req, res) {
    try {
      const { data_inicio, data_fim } = req.query;
      
      // Cache key para disponibilidade
      const cacheKey = `disponibilidade:${data_inicio}:${data_fim}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Buscar disponibilidade base
      const disponibilidadeQuery = `
        SELECT dia_semana, hora_inicio, hora_fim 
        FROM disponibilidade 
        WHERE ativo = true
      `;
      const { rows: disponibilidade } = await this.db.query(disponibilidadeQuery);

      // Buscar agendamentos existentes
      const agendamentosQuery = `
        SELECT data_agendamento, data_fim 
        FROM agendamentos 
        WHERE data_agendamento BETWEEN $1 AND $2 
        AND status NOT IN ('cancelado', 'reagendado')
      `;
      const { rows: agendamentos } = await this.db.query(agendamentosQuery, [data_inicio, data_fim]);

      // Buscar bloqueios
      const bloqueiosQuery = `
        SELECT data_inicio, data_fim 
        FROM bloqueios_agenda 
        WHERE data_inicio <= $2 AND data_fim >= $1
      `;
      const { rows: bloqueios } = await this.db.query(bloqueiosQuery, [data_inicio, data_fim]);

      // Calcular slots disponíveis
      const slotsDisponiveis = this.calcularSlotsDisponiveis(
        disponibilidade, 
        agendamentos, 
        bloqueios, 
        data_inicio, 
        data_fim
      );

      // Cache por 5 minutos
      await this.redis.setex(cacheKey, 300, JSON.stringify(slotsDisponiveis));

      res.json(slotsDisponiveis);
    } catch (error) {
      console.error('Erro ao obter disponibilidade:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  }

  // Criar novo agendamento
  async criarAgendamento(req, res) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        paciente_id,
        servico_id,
        data_agendamento,
        observacoes
      } = req.body;

      // Verificar se o slot ainda está disponível
      const conflictQuery = `
        SELECT id FROM agendamentos 
        WHERE data_agendamento = $1 
        AND status NOT IN ('cancelado', 'reagendado')
      `;
      const { rows: conflicts } = await client.query(conflictQuery, [data_agendamento]);

      if (conflicts.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ erro: 'Horário não disponível' });
      }

      // Buscar duração do serviço
      const servicoQuery = `
        SELECT duracao_minutos, nome, preco_base 
        FROM servicos 
        WHERE id = $1 AND ativo = true
      `;
      const { rows: servicos } = await client.query(servicoQuery, [servico_id]);

      if (servicos.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ erro: 'Serviço não encontrado' });
      }

      const servico = servicos[0];
      const dataFim = new Date(data_agendamento);
      dataFim.setMinutes(dataFim.getMinutes() + servico.duracao_minutos);

      // Criar agendamento
      const insertQuery = `
        INSERT INTO agendamentos (
          paciente_id, servico_id, data_agendamento, 
          data_fim, observacoes, status, valor_consulta
        ) VALUES ($1, $2, $3, $4, $5, 'agendado', $6)
        RETURNING *
      `;
      
      const { rows: [novoAgendamento] } = await client.query(insertQuery, [
        paciente_id,
        servico_id,
        data_agendamento,
        dataFim,
        observacoes,
        servico.preco_base
      ]);

      await client.query('COMMIT');

      // Invalidar cache de disponibilidade
      const dataStr = new Date(data_agendamento).toISOString().split('T')[0];
      await this.redis.del(`disponibilidade:${dataStr}*`);

      // Enviar confirmação por email e SMS
      await this.enviarConfirmacao(novoAgendamento, servico);

      // Agendar lembrete
      await this.agendarLembrete(novoAgendamento);

      res.status(201).json({
        sucesso: true,
        agendamento: novoAgendamento,
        message: 'Agendamento criado com sucesso'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao criar agendamento:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    } finally {
      client.release();
    }
  }

  // Listar agendamentos
  async listarAgendamentos(req, res) {
    try {
      const { 
        data_inicio, 
        data_fim, 
        status, 
        paciente_id,
        page = 1, 
        limit = 20 
      } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (data_inicio) {
        whereClause += ` AND a.data_agendamento >= $${++paramCount}`;
        params.push(data_inicio);
      }

      if (data_fim) {
        whereClause += ` AND a.data_agendamento <= $${++paramCount}`;
        params.push(data_fim);
      }

      if (status) {
        whereClause += ` AND a.status = $${++paramCount}`;
        params.push(status);
      }

      if (paciente_id) {
        whereClause += ` AND a.paciente_id = $${++paramCount}`;
        params.push(paciente_id);
      }

      const offset = (page - 1) * limit;
      whereClause += ` ORDER BY a.data_agendamento DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const query = `
        SELECT 
          a.*,
          u.full_name as paciente_nome,
          u.email as paciente_email,
          u.telefone as paciente_telefone,
          s.nome as servico_nome,
          s.categoria as servico_categoria,
          s.duracao_minutos,
          s.cor_calendario
        FROM agendamentos a
        JOIN usuarios u ON a.paciente_id = u.id
        JOIN servicos s ON a.servico_id = s.id
        ${whereClause}
      `;

      const { rows: agendamentos } = await this.db.query(query, params);

      // Contar total para paginação
      const countQuery = `
        SELECT COUNT(*) as total
        FROM agendamentos a
        ${whereClause.replace(/LIMIT.*$/, '')}
      `;
      const { rows: [{ total }] } = await this.db.query(
        countQuery, 
        params.slice(0, -2) // Remove limit e offset
      );

      res.json({
        agendamentos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  }

  // Reagendar consulta
  async reagendarConsulta(req, res) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const { nova_data, motivo } = req.body;

      // Verificar se agendamento existe
      const agendamentoQuery = `
        SELECT a.*, s.duracao_minutos, s.nome as servico_nome,
               u.full_name, u.email, u.telefone
        FROM agendamentos a
        JOIN servicos s ON a.servico_id = s.id
        JOIN usuarios u ON a.paciente_id = u.id
        WHERE a.id = $1
      `;
      const { rows: agendamentos } = await client.query(agendamentoQuery, [id]);

      if (agendamentos.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ erro: 'Agendamento não encontrado' });
      }

      const agendamento = agendamentos[0];

      // Verificar disponibilidade do novo horário
      const novaDataFim = new Date(nova_data);
      novaDataFim.setMinutes(novaDataFim.getMinutes() + agendamento.duracao_minutos);

      const conflictQuery = `
        SELECT id FROM agendamentos 
        WHERE data_agendamento = $1 
        AND status NOT IN ('cancelado', 'reagendado')
        AND id != $2
      `;
      const { rows: conflicts } = await client.query(conflictQuery, [nova_data, id]);

      if (conflicts.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ erro: 'Novo horário não disponível' });
      }

      // Atualizar agendamento
      const updateQuery = `
        UPDATE agendamentos 
        SET data_agendamento = $1, data_fim = $2, 
            observacoes = COALESCE(observacoes || ' | ', '') || $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      
      const { rows: [agendamentoAtualizado] } = await client.query(updateQuery, [
        nova_data,
        novaDataFim,
        `Reagendado: ${motivo}`,
        id
      ]);

      await client.query('COMMIT');

      // Invalidar cache
      await this.invalidarCacheDisponibilidade(nova_data);
      await this.invalidarCacheDisponibilidade(agendamento.data_agendamento);

      // Enviar notificação de reagendamento
      await this.enviarNotificacaoReagendamento(agendamentoAtualizado, agendamento);

      res.json({
        sucesso: true,
        agendamento: agendamentoAtualizado,
        message: 'Agendamento reagendado com sucesso'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao reagendar:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    } finally {
      client.release();
    }
  }

  // Cancelar agendamento
  async cancelarAgendamento(req, res) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const { motivo } = req.body;

      // Verificar se agendamento existe
      const agendamentoQuery = `
        SELECT a.*, u.full_name, u.email, u.telefone, s.nome as servico_nome
        FROM agendamentos a
        JOIN usuarios u ON a.paciente_id = u.id
        JOIN servicos s ON a.servico_id = s.id
        WHERE a.id = $1
      `;
      const { rows: agendamentos } = await client.query(agendamentoQuery, [id]);

      if (agendamentos.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ erro: 'Agendamento não encontrado' });
      }

      const agendamento = agendamentos[0];

      // Verificar se pode cancelar (ex: não pode cancelar consulta que já passou)
      if (new Date(agendamento.data_agendamento) < new Date()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ erro: 'Não é possível cancelar consulta que já passou' });
      }

      // Atualizar status para cancelado
      const updateQuery = `
        UPDATE agendamentos 
        SET status = 'cancelado', 
            motivo_cancelamento = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const { rows: [agendamentoCancelado] } = await client.query(updateQuery, [motivo, id]);

      await client.query('COMMIT');

      // Invalidar cache de disponibilidade
      await this.invalidarCacheDisponibilidade(agendamento.data_agendamento);

      // Enviar notificação de cancelamento
      await this.enviarNotificacaoCancelamento(agendamentoCancelado);

      res.json({
        sucesso: true,
        agendamento: agendamentoCancelado,
        message: 'Agendamento cancelado com sucesso'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao cancelar agendamento:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    } finally {
      client.release();
    }
  }

  // Confirmar presença
  async confirmarPresenca(req, res) {
    try {
      const { id } = req.params;

      const updateQuery = `
        UPDATE agendamentos 
        SET status = 'confirmado', 
            confirmacao_enviada = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'agendado'
        RETURNING *
      `;
      
      const { rows: agendamentos } = await this.db.query(updateQuery, [id]);

      if (agendamentos.length === 0) {
        return res.status(404).json({ erro: 'Agendamento não encontrado ou já confirmado' });
      }

      res.json({
        sucesso: true,
        agendamento: agendamentos[0],
        message: 'Presença confirmada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  }

  // Métodos auxiliares
  calcularSlotsDisponiveis(disponibilidade, agendamentos, bloqueios, dataInicio, dataFim) {
    const slots = [];
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    // Lógica complexa de cálculo de slots disponíveis
    // Considerando disponibilidade, agendamentos e bloqueios
    
    for (let data = new Date(inicio); data <= fim; data.setDate(data.getDate() + 1)) {
      const diaSemana = data.getDay();
      const dispDia = disponibilidade.find(d => d.dia_semana === diaSemana);
      
      if (dispDia) {
        // Gerar slots de 30 em 30 minutos
        const horaInicio = new Date(data);
        const [horas, minutos] = dispDia.hora_inicio.split(':');
        horaInicio.setHours(parseInt(horas), parseInt(minutos), 0, 0);
        
        const horaFim = new Date(data);
        const [horasFim, minutosFim] = dispDia.hora_fim.split(':');
        horaFim.setHours(parseInt(horasFim), parseInt(minutosFim), 0, 0);
        
        for (let slot = new Date(horaInicio); slot < horaFim; slot.setMinutes(slot.getMinutes() + 30)) {
          const slotFim = new Date(slot);
          slotFim.setMinutes(slotFim.getMinutes() + 30);
          
          // Verificar se não há conflitos
          const temConflito = agendamentos.some(ag => {
            const agInicio = new Date(ag.data_agendamento);
            const agFim = new Date(ag.data_fim);
            return (slot < agFim && slotFim > agInicio);
          });
          
          const temBloqueio = bloqueios.some(bl => {
            const blInicio = new Date(bl.data_inicio);
            const blFim = new Date(bl.data_fim);
            return (slot < blFim && slotFim > blInicio);
          });
          
          // Não permitir agendamentos no passado
          const agora = new Date();
          const isPassado = slot < agora;
          
          if (!temConflito && !temBloqueio && !isPassado) {
            slots.push({
              inicio: slot.toISOString(),
              fim: slotFim.toISOString(),
              disponivel: true,
              data: slot.toISOString().split('T')[0],
              hora: slot.toTimeString().substring(0, 5)
            });
          }
        }
      }
    }
    
    return slots;
  }

  async invalidarCacheDisponibilidade(data) {
    try {
      const dataStr = new Date(data).toISOString().split('T')[0];
      const pattern = `disponibilidade:*${dataStr}*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      console.error('Erro ao invalidar cache:', error);
    }
  }

  async enviarConfirmacao(agendamento, servico) {
    try {
      // Buscar dados do paciente
      const pacienteQuery = `
        SELECT full_name, email, telefone, preferencia_contato 
        FROM usuarios 
        WHERE id = $1
      `;
      const { rows: [paciente] } = await this.db.query(pacienteQuery, [agendamento.paciente_id]);

      const dadosConfirmacao = {
        nome: paciente.full_name,
        servico: servico.nome,
        data: new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR'),
        hora: new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        agendamentoId: agendamento.id
      };

      // Email de confirmação (sempre enviar)
      if (paciente.email) {
        await emailService.enviarConfirmacaoAgendamento({
          email: paciente.email,
          ...dadosConfirmacao
        });
      }

      // SMS de confirmação (baseado na preferência)
      if (paciente.telefone && ['sms', 'whatsapp'].includes(paciente.preferencia_contato)) {
        await smsService.enviarConfirmacaoAgendamento({
          telefone: paciente.telefone,
          ...dadosConfirmacao
        });
      }

      // Registrar notificação no banco
      await this.registrarNotificacao({
        usuario_id: agendamento.paciente_id,
        tipo: 'confirmacao_agendamento',
        titulo: 'Agendamento Confirmado',
        mensagem: `Seu agendamento para ${servico.nome} foi confirmado para ${dadosConfirmacao.data} às ${dadosConfirmacao.hora}`,
        agendamento_id: agendamento.id
      });

    } catch (error) {
      console.error('Erro ao enviar confirmação:', error);
    }
  }

  async enviarNotificacaoReagendamento(agendamentoNovo, agendamentoAntigo) {
    try {
      const pacienteQuery = `
        SELECT full_name, email, telefone 
        FROM usuarios 
        WHERE id = $1
      `;
      const { rows: [paciente] } = await this.db.query(pacienteQuery, [agendamentoNovo.paciente_id]);

      const novaData = new Date(agendamentoNovo.data_agendamento);
      const antigaData = new Date(agendamentoAntigo.data_agendamento);

      await emailService.enviarNotificacaoReagendamento({
        email: paciente.email,
        nome: paciente.full_name,
        antigaData: antigaData.toLocaleDateString('pt-BR'),
        antigaHora: antigaData.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        novaData: novaData.toLocaleDateString('pt-BR'),
        novaHora: novaData.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });

    } catch (error) {
      console.error('Erro ao enviar notificação de reagendamento:', error);
    }
  }

  async enviarNotificacaoCancelamento(agendamento) {
    try {
      await emailService.enviarNotificacaoCancelamento({
        email: agendamento.email,
        nome: agendamento.full_name,
        servico: agendamento.servico_nome,
        data: new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR'),
        motivo: agendamento.motivo_cancelamento
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de cancelamento:', error);
    }
  }

  async registrarNotificacao(dados) {
    try {
      const insertQuery = `
        INSERT INTO notificacoes (
          usuario_id, tipo, titulo, mensagem, 
          canal, agendamento_id, enviada
        ) VALUES ($1, $2, $3, $4, 'sistema', $5, true)
      `;
      
      await this.db.query(insertQuery, [
        dados.usuario_id,
        dados.tipo,
        dados.titulo,
        dados.mensagem,
        dados.agendamento_id
      ]);
    } catch (error) {
      console.error('Erro ao registrar notificação:', error);
    }
  }

  async agendarLembrete(agendamento) {
    try {
      // Agendar lembrete para 24h antes
      const dataLembrete = new Date(agendamento.data_agendamento);
      dataLembrete.setHours(dataLembrete.getHours() - 24);

      // Só agendar se for no futuro
      if (dataLembrete > new Date()) {
        await this.registrarNotificacao({
          usuario_id: agendamento.paciente_id,
          tipo: 'lembrete_consulta',
          titulo: 'Lembrete de Consulta',
          mensagem: `Você tem uma consulta agendada para amanhã`,
          agendamento_id: agendamento.id
        });

        // Aqui você pode integrar com um sistema de filas (Bull/Agenda)
        // para agendar o envio do lembrete no horário certo
      }
    } catch (error) {
      console.error('Erro ao agendar lembrete:', error);
    }
  }
}

module.exports = new AgendamentoController();
