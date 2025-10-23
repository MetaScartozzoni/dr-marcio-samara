// src/services/prontuario.service.js
/**
 * Service for fetching complete prontuário data with efficient queries
 * Uses UUID casting with uuid-ossp extension
 */

class ProntuarioService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Fetch complete prontuário data with pagination
   * @param {string} id - Prontuário UUID
   * @param {Object} options - Query options
   * @param {number} options.fichasLimit - Max fichas to fetch (default: 5)
   * @param {number} options.orcamentosLimit - Max orcamentos to fetch (default: 5)
   * @param {number} options.examesLimit - Max exames to fetch (default: 5)
   * @param {number} options.agendamentosLimit - Max agendamentos to fetch (default: 5)
   * @param {string} options.fichasCursor - Pagination cursor for fichas
   * @param {string} options.orcamentosCursor - Pagination cursor for orcamentos
   * @param {string} options.examesCursor - Pagination cursor for exames
   * @param {string} options.agendamentosCursor - Pagination cursor for agendamentos
   * @returns {Promise<Object>} Complete prontuário data
   * 
   * NOTE: Query structure intentionally uses explicit branches for cursor vs non-cursor
   * to ensure correct parameter indexing. Future refactoring could extract common parts
   * to a helper function, but current implementation prioritizes correctness and clarity.
   */
  async buscarCompleto(id, options = {}) {
    const {
      fichasLimit = 5,
      orcamentosLimit = 5,
      examesLimit = 5,
      agendamentosLimit = 5,
      fichasCursor = null,
      orcamentosCursor = null,
      examesCursor = null,
      agendamentosCursor = null
    } = options;

    const client = await this.db.connect();
    
    try {
      // First, fetch the prontuário and verify it exists
      // Note: Based on the schema, prontuários are actually individual consultation records
      // not a single prontuário per patient. We'll interpret :id as prontuario_id
      const prontuarioQuery = `
        SELECT 
          p.id,
          p.paciente_id,
          p.agendamento_id,
          p.medico_id,
          p.data_consulta,
          p.observacoes,
          p.criado_em,
          p.atualizado_em
        FROM prontuarios p
        WHERE p.id = $1::uuid
      `;

      const prontuarioResult = await client.query(prontuarioQuery, [id]);
      
      if (prontuarioResult.rows.length === 0) {
        throw new Error('Prontuário não encontrado');
      }

      const prontuario = prontuarioResult.rows[0];

      // Fetch patient data
      const pacienteQuery = `
        SELECT 
          p.id,
          p.nome_completo,
          p.cpf,
          p.telefone,
          p.email,
          p.data_nascimento
        FROM pacientes p
        WHERE p.id = $1::uuid
      `;

      const pacienteResult = await client.query(pacienteQuery, [prontuario.paciente_id]);
      const paciente = pacienteResult.rows[0] || null;

      // Fetch fichas_atendimento (other consultation records for this patient)
      // In this schema, prontuarios ARE the consultation records (fichas)
      let fichasQuery;
      let fichasParams;
      
      if (fichasCursor) {
        fichasQuery = `
          SELECT 
            p.id,
            p.paciente_id as prontuario_id,
            p.agendamento_id,
            p.data_consulta,
            p.anamnese,
            p.exame_fisico,
            p.diagnostico,
            p.tratamento,
            p.prescricao,
            p.exames_solicitados,
            p.observacoes,
            p.criado_em,
            p.atualizado_em
          FROM prontuarios p
          WHERE p.paciente_id = $1::uuid
            AND p.id != $2::uuid
            AND p.criado_em < $3::timestamp
          ORDER BY p.criado_em DESC
          LIMIT $4
        `;
        fichasParams = [prontuario.paciente_id, id, fichasCursor, fichasLimit + 1];
      } else {
        fichasQuery = `
          SELECT 
            p.id,
            p.paciente_id as prontuario_id,
            p.agendamento_id,
            p.data_consulta,
            p.anamnese,
            p.exame_fisico,
            p.diagnostico,
            p.tratamento,
            p.prescricao,
            p.exames_solicitados,
            p.observacoes,
            p.criado_em,
            p.atualizado_em
          FROM prontuarios p
          WHERE p.paciente_id = $1::uuid
            AND p.id != $2::uuid
          ORDER BY p.criado_em DESC
          LIMIT $3
        `;
        fichasParams = [prontuario.paciente_id, id, fichasLimit + 1];
      }

      const fichasResult = await client.query(fichasQuery, fichasParams);
      const fichas = fichasResult.rows.slice(0, fichasLimit);
      const hasMoreFichas = fichasResult.rows.length > fichasLimit;

      // Fetch orcamentos - need to check if this table exists in the schema
      // Based on database.js, orcamentos table exists
      let orcamentosQuery;
      let orcamentosParams;
      
      if (orcamentosCursor) {
        orcamentosQuery = `
          SELECT 
            o.id,
            o.protocolo,
            o.paciente_id,
            o.valor_total,
            o.descricao_procedimento,
            o.status,
            o.data_validade,
            o.criado_em,
            o.atualizado_em
          FROM orcamentos o
          WHERE o.paciente_id = $1::uuid
            AND o.criado_em < $2::timestamp
          ORDER BY o.criado_em DESC
          LIMIT $3
        `;
        orcamentosParams = [prontuario.paciente_id, orcamentosCursor, orcamentosLimit + 1];
      } else {
        orcamentosQuery = `
          SELECT 
            o.id,
            o.protocolo,
            o.paciente_id,
            o.valor_total,
            o.descricao_procedimento,
            o.status,
            o.data_validade,
            o.criado_em,
            o.atualizado_em
          FROM orcamentos o
          WHERE o.paciente_id = $1::uuid
          ORDER BY o.criado_em DESC
          LIMIT $2
        `;
        orcamentosParams = [prontuario.paciente_id, orcamentosLimit + 1];
      }

      let orcamentos = [];
      let hasMoreOrcamentos = false;
      
      try {
        const orcamentosResult = await client.query(orcamentosQuery, orcamentosParams);
        orcamentos = orcamentosResult.rows.slice(0, orcamentosLimit);
        hasMoreOrcamentos = orcamentosResult.rows.length > orcamentosLimit;
      } catch (error) {
        console.warn('Orcamentos table not found or query failed:', error.message);
      }

      // Fetch exames
      let examesQuery;
      let examesParams;
      
      if (examesCursor) {
        examesQuery = `
          SELECT 
            e.id,
            e.prontuario_id,
            e.nome_exame,
            e.tipo_exame,
            e.laboratorio,
            e.data_solicitacao,
            e.data_realizacao,
            e.data_resultado,
            e.status,
            e.criado_em,
            e.atualizado_em
          FROM exames e
          WHERE e.prontuario_id = $1::uuid
            AND e.criado_em < $2::timestamp
          ORDER BY e.criado_em DESC
          LIMIT $3
        `;
        examesParams = [id, examesCursor, examesLimit + 1];
      } else {
        examesQuery = `
          SELECT 
            e.id,
            e.prontuario_id,
            e.nome_exame,
            e.tipo_exame,
            e.laboratorio,
            e.data_solicitacao,
            e.data_realizacao,
            e.data_resultado,
            e.status,
            e.criado_em,
            e.atualizado_em
          FROM exames e
          WHERE e.prontuario_id = $1::uuid
          ORDER BY e.criado_em DESC
          LIMIT $2
        `;
        examesParams = [id, examesLimit + 1];
      }

      let exames = [];
      let hasMoreExames = false;

      try {
        const examesResult = await client.query(examesQuery, examesParams);
        exames = examesResult.rows.slice(0, examesLimit);
        hasMoreExames = examesResult.rows.length > examesLimit;
      } catch (error) {
        console.warn('Exames query failed:', error.message);
      }

      // Fetch agendamentos
      let agendamentosQuery;
      let agendamentosParams;
      
      if (agendamentosCursor) {
        agendamentosQuery = `
          SELECT 
            a.id,
            a.paciente_id,
            a.data_hora,
            a.tipo_consulta,
            a.status,
            a.motivo_consulta,
            a.observacoes,
            a.criado_em,
            a.atualizado_em
          FROM agendamentos a
          WHERE a.paciente_id = $1::uuid
            AND a.criado_em < $2::timestamp
          ORDER BY a.criado_em DESC
          LIMIT $3
        `;
        agendamentosParams = [prontuario.paciente_id, agendamentosCursor, agendamentosLimit + 1];
      } else {
        agendamentosQuery = `
          SELECT 
            a.id,
            a.paciente_id,
            a.data_hora,
            a.tipo_consulta,
            a.status,
            a.motivo_consulta,
            a.observacoes,
            a.criado_em,
            a.atualizado_em
          FROM agendamentos a
          WHERE a.paciente_id = $1::uuid
          ORDER BY a.criado_em DESC
          LIMIT $2
        `;
        agendamentosParams = [prontuario.paciente_id, agendamentosLimit + 1];
      }

      let agendamentos = [];
      let hasMoreAgendamentos = false;

      try {
        const agendamentosResult = await client.query(agendamentosQuery, agendamentosParams);
        agendamentos = agendamentosResult.rows.slice(0, agendamentosLimit);
        hasMoreAgendamentos = agendamentosResult.rows.length > agendamentosLimit;
      } catch (error) {
        console.warn('Agendamentos query failed:', error.message);
      }

      return {
        prontuario: {
          id: prontuario.id,
          numero_prontuario: `PRONT-${prontuario.id.split('-')[0].toUpperCase()}`,
          criado_em: prontuario.criado_em,
          ativo: true,
          observacoes: prontuario.observacoes
        },
        paciente,
        fichasAtendimento: fichas,
        orcamentos,
        exames,
        agendamentos,
        pagination: {
          fichas: {
            hasNext: hasMoreFichas,
            nextCursor: hasMoreFichas ? fichas[fichas.length - 1].criado_em : null
          },
          orcamentos: {
            hasNext: hasMoreOrcamentos,
            nextCursor: hasMoreOrcamentos ? orcamentos[orcamentos.length - 1].criado_em : null
          },
          exames: {
            hasNext: hasMoreExames,
            nextCursor: hasMoreExames ? exames[exames.length - 1].criado_em : null
          },
          agendamentos: {
            hasNext: hasMoreAgendamentos,
            nextCursor: hasMoreAgendamentos ? agendamentos[agendamentos.length - 1].criado_em : null
          }
        }
      };

    } finally {
      client.release();
    }
  }

  /**
   * Validate UUID format
   * @param {string} id - UUID to validate
   * @returns {boolean} True if valid UUID
   */
  validateUUID(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}

module.exports = ProntuarioService;
