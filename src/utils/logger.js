// src/utils/logger.js
class Logger {
    constructor(db) {
        this.db = db;
    }

    /**
     * Registra uma ação no sistema de logs
     * @param {string} tipo - Tipo do log (PACIENTE, ORCAMENTO, FICHA, etc.)
     * @param {string} descricao - Descrição da ação
     * @param {number} usuarioId - ID do usuário que executou a ação
     * @param {object} detalhes - Detalhes adicionais em JSON
     */
    async log(tipo, descricao, usuarioId = null, detalhes = {}) {
        try {
            await this.db.query(`
                INSERT INTO logs_sistema (tipo, descricao, usuario_id, detalhes, data_evento, criado_em)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
            `, [tipo, descricao, usuarioId, JSON.stringify(detalhes)]);
            
            console.log(`📝 LOG [${tipo}]: ${descricao}`);
        } catch (error) {
            console.error('❌ Erro ao registrar log:', error.message);
        }
    }

    // Métodos específicos para cada tipo de ação
    async logPaciente(acao, pacienteId, usuarioId, detalhes = {}) {
        await this.log('PACIENTE', acao, usuarioId, {
            paciente_id: pacienteId,
            ...detalhes
        });
    }

    async logOrcamento(acao, orcamentoId, usuarioId, detalhes = {}) {
        await this.log('ORCAMENTO', acao, usuarioId, {
            orcamento_id: orcamentoId,
            ...detalhes
        });
    }

    async logFicha(acao, fichaId, usuarioId, detalhes = {}) {
        await this.log('FICHA_ATENDIMENTO', acao, usuarioId, {
            ficha_id: fichaId,
            ...detalhes
        });
    }

    async logAcesso(acao, usuarioId, detalhes = {}) {
        await this.log('ACESSO', acao, usuarioId, detalhes);
    }

    async logSistema(acao, usuarioId, detalhes = {}) {
        await this.log('SISTEMA', acao, usuarioId, detalhes);
    }

    /**
     * Busca logs para o painel admin
     * @param {object} filtros - Filtros de busca
     * @returns {Promise<Array>} Lista de logs
     */
    async buscarLogs(filtros = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            if (filtros.tipo) {
                paramCount++;
                whereClause += ` AND tipo = $${paramCount}`;
                params.push(filtros.tipo);
            }

            if (filtros.usuario_id) {
                paramCount++;
                whereClause += ` AND usuario_id = $${paramCount}`;
                params.push(filtros.usuario_id);
            }

            if (filtros.data_inicio) {
                paramCount++;
                whereClause += ` AND data_evento >= $${paramCount}`;
                params.push(filtros.data_inicio);
            }

            if (filtros.data_fim) {
                paramCount++;
                whereClause += ` AND data_evento <= $${paramCount}`;
                params.push(filtros.data_fim);
            }

            const limit = filtros.limit || 100;
            paramCount++;
            const limitClause = `LIMIT $${paramCount}`;
            params.push(limit);

            const query = `
                SELECT 
                    l.*,
                    CASE 
                        WHEN l.usuario_id IS NOT NULL THEN 
                            COALESCE(u.nome, f.nome, 'Usuário Desconhecido')
                        ELSE 'Sistema'
                    END as nome_usuario
                FROM logs_sistema l
                LEFT JOIN usuarios u ON l.usuario_id = u.id
                LEFT JOIN funcionarios f ON l.usuario_id = f.id
                ${whereClause}
                ORDER BY l.data_evento DESC, l.criado_em DESC
                ${limitClause}
            `;

            const result = await this.db.query(query, params);
            return result.rows;

        } catch (error) {
            console.error('❌ Erro ao buscar logs:', error.message);
            throw error;
        }
    }

    /**
     * Estatísticas de logs para dashboard admin
     */
    async estatisticasLogs() {
        try {
            const estatisticas = await this.db.query(`
                SELECT 
                    tipo,
                    COUNT(*) as total,
                    COUNT(CASE WHEN data_evento >= NOW() - INTERVAL '24 hours' THEN 1 END) as ultimas_24h,
                    COUNT(CASE WHEN data_evento >= NOW() - INTERVAL '7 days' THEN 1 END) as ultima_semana,
                    MAX(data_evento) as ultimo_evento
                FROM logs_sistema
                GROUP BY tipo
                ORDER BY total DESC
            `);

            const totalGeral = await this.db.query(`
                SELECT 
                    COUNT(*) as total_logs,
                    COUNT(DISTINCT usuario_id) as usuarios_ativos,
                    COUNT(CASE WHEN data_evento >= NOW() - INTERVAL '24 hours' THEN 1 END) as atividade_24h
                FROM logs_sistema
                WHERE data_evento >= NOW() - INTERVAL '30 days'
            `);

            return {
                por_tipo: estatisticas.rows,
                geral: totalGeral.rows[0]
            };

        } catch (error) {
            console.error('❌ Erro ao gerar estatísticas:', error.message);
            throw error;
        }
    }
}

module.exports = Logger;
