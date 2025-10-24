// src/controllers/ficha.controller.js
const { validationResult } = require('express-validator');

// NOTE: UUID COMPATIBILITY
// This controller works with UUID primary keys. PostgreSQL parameterized queries
// handle UUID types automatically. For explicit casting, use $1::uuid in SQL.
// Validate UUIDs using validateUuidParam() middleware or isValidUuid() utility.

class FichaController {
    constructor(db) {
        this.db = db;
    }

    // ==========================================
    // CRIAR FICHA DE ATENDIMENTO
    // ==========================================
    async criarFicha(req, res) {
        const client = await this.db.connect();
        
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors.array() 
                });
            }

            await client.query('BEGIN');

            const {
                paciente_id,
                agendamento_id,
                peso,
                altura,
                pressao_arterial,
                procedimento_desejado,
                motivo_principal,
                historico_medico,
                medicamentos_uso,
                alergias,
                observacoes_clinicas
            } = req.body;

            // 1. BUSCAR PRONTUÁRIO DO PACIENTE
            const prontuarioResult = await client.query(`
                SELECT id FROM prontuarios WHERE paciente_id = $1
            `, [paciente_id]);

            if (prontuarioResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Prontuário não encontrado para este paciente'
                });
            }

            const prontuario_id = prontuarioResult.rows[0].id;

            // 2. CALCULAR IMC SE PESO E ALTURA FORNECIDOS
            let imc = null;
            if (peso && altura) {
                imc = (peso / (altura * altura)).toFixed(2);
            }

            // 3. CRIAR FICHA DE ATENDIMENTO
            const fichaResult = await client.query(`
                INSERT INTO fichas_atendimento (
                    paciente_id, prontuario_id, agendamento_id,
                    peso, altura, imc, pressao_arterial, procedimento_desejado,
                    motivo_principal, historico_medico, medicamentos_uso,
                    alergias, observacoes_clinicas, criado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *
            `, [
                paciente_id, prontuario_id, agendamento_id,
                peso, altura, imc, pressao_arterial, procedimento_desejado,
                motivo_principal, historico_medico, medicamentos_uso,
                alergias, observacoes_clinicas, req.userId
            ]);

            const ficha = fichaResult.rows[0];

            // 4. ATUALIZAR CONTADORES DO PRONTUÁRIO
            await client.query(`
                UPDATE prontuarios 
                SET total_fichas_atendimento = total_fichas_atendimento + 1
                WHERE id = $1
            `, [prontuario_id]);

            // 5. ATUALIZAR STATUS DO AGENDAMENTO SE FORNECIDO
            if (agendamento_id) {
                await client.query(`
                    UPDATE agendamentos 
                    SET status = 'realizado', etapa_jornada = 'consulta_realizada'
                    WHERE id = $1
                `, [agendamento_id]);
            }

            // 6. ATUALIZAR JORNADA DO PACIENTE
            await client.query(`
                UPDATE jornada_paciente 
                SET etapa_atual = 'consulta_realizada',
                    etapa_anterior = etapa_atual,
                    proxima_acao = 'Elaborar orçamento',
                    prazo_acao = CURRENT_TIMESTAMP + INTERVAL '24 hours',
                    prioridade = 'atencao',
                    agendamento_id = $2,
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE paciente_id = $1 AND status = 'ativo'
            `, [paciente_id, agendamento_id]);

            // 7. ATUALIZAR DADOS DO PACIENTE
            await client.query(`
                UPDATE pacientes 
                SET total_consultas = total_consultas + 1,
                    primeira_consulta = COALESCE(primeira_consulta, CURRENT_DATE),
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [paciente_id]);

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Ficha de atendimento criada com sucesso!',
                data: {
                    ficha: {
                        id: ficha.id,
                        paciente_id: ficha.paciente_id,
                        prontuario_id: ficha.prontuario_id,
                        agendamento_id: ficha.agendamento_id,
                        peso: ficha.peso,
                        altura: ficha.altura,
                        imc: ficha.imc,
                        pressao_arterial: ficha.pressao_arterial,
                        procedimento_desejado: ficha.procedimento_desejado,
                        motivo_principal: ficha.motivo_principal,
                        status: ficha.status,
                        criado_em: ficha.criado_em
                    }
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao criar ficha de atendimento:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } finally {
            client.release();
        }
    }

    // ==========================================
    // BUSCAR FICHA POR ID
    // ==========================================
    async buscarFicha(req, res) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    fa.*,
                    p.nome as paciente_nome,
                    p.cpf as paciente_cpf,
                    pr.numero_prontuario,
                    a.data_agendamento,
                    a.tipo_consulta,
                    f.nome as criado_por_nome
                FROM fichas_atendimento fa
                JOIN pacientes p ON fa.paciente_id = p.id
                JOIN prontuarios pr ON fa.prontuario_id = pr.id
                LEFT JOIN agendamentos a ON fa.agendamento_id = a.id
                LEFT JOIN funcionarios f ON fa.criado_por = f.id
                WHERE fa.id = $1
            `;

            const result = await this.db.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Ficha de atendimento não encontrada'
                });
            }

            const ficha = result.rows[0];

            res.json({
                success: true,
                data: {
                    ficha: {
                        id: ficha.id,
                        paciente: {
                            id: ficha.paciente_id,
                            nome: ficha.paciente_nome,
                            cpf: ficha.paciente_cpf
                        },
                        prontuario: {
                            id: ficha.prontuario_id,
                            numero: ficha.numero_prontuario
                        },
                        agendamento: ficha.agendamento_id ? {
                            id: ficha.agendamento_id,
                            data: ficha.data_agendamento,
                            tipo: ficha.tipo_consulta
                        } : null,
                        dados_clinicos: {
                            peso: ficha.peso,
                            altura: ficha.altura,
                            imc: ficha.imc,
                            pressao_arterial: ficha.pressao_arterial,
                            procedimento_desejado: ficha.procedimento_desejado,
                            motivo_principal: ficha.motivo_principal,
                            historico_medico: ficha.historico_medico,
                            medicamentos_uso: ficha.medicamentos_uso,
                            alergias: ficha.alergias,
                            observacoes_clinicas: ficha.observacoes_clinicas
                        },
                        status: ficha.status,
                        criado_em: ficha.criado_em,
                        criado_por: ficha.criado_por_nome,
                        finalizada_em: ficha.finalizada_em
                    }
                }
            });

        } catch (error) {
            console.error('Erro ao buscar ficha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // ==========================================
    // LISTAR FICHAS POR PACIENTE
    // ==========================================
    async listarFichasPorPaciente(req, res) {
        try {
            const { paciente_id } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    fa.id,
                    fa.procedimento_desejado,
                    fa.status,
                    fa.criado_em,
                    fa.finalizada_em,
                    a.data_agendamento,
                    a.tipo_consulta,
                    f.nome as criado_por_nome,
                    COUNT(*) OVER() as total_count
                FROM fichas_atendimento fa
                LEFT JOIN agendamentos a ON fa.agendamento_id = a.id
                LEFT JOIN funcionarios f ON fa.criado_por = f.id
                WHERE fa.paciente_id = $1
                ORDER BY fa.criado_em DESC
                LIMIT $2 OFFSET $3
            `;

            const result = await this.db.query(query, [paciente_id, limit, offset]);

            const totalPages = result.rows.length > 0 ? 
                Math.ceil(result.rows[0].total_count / limit) : 0;

            res.json({
                success: true,
                data: {
                    fichas: result.rows.map(row => ({
                        id: row.id,
                        procedimento_desejado: row.procedimento_desejado,
                        status: row.status,
                        agendamento: row.data_agendamento ? {
                            data: row.data_agendamento,
                            tipo: row.tipo_consulta
                        } : null,
                        criado_em: row.criado_em,
                        criado_por: row.criado_por_nome,
                        finalizada_em: row.finalizada_em
                    })),
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: result.rows.length > 0 ? result.rows[0].total_count : 0,
                        totalPages
                    }
                }
            });

        } catch (error) {
            console.error('Erro ao listar fichas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // ==========================================
    // FINALIZAR FICHA DE ATENDIMENTO
    // ==========================================
    async finalizarFicha(req, res) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            const { id } = req.params;
            const { observacoes_finais } = req.body;

            // Atualizar ficha como finalizada
            const result = await client.query(`
                UPDATE fichas_atendimento 
                SET status = 'finalizada',
                    finalizada_em = CURRENT_TIMESTAMP,
                    observacoes_clinicas = COALESCE(observacoes_clinicas, '') || 
                        CASE WHEN $2 IS NOT NULL THEN E'\n\nObservações finais: ' || $2 ELSE '' END
                WHERE id = $1 AND status = 'em_andamento'
                RETURNING paciente_id
            `, [id, observacoes_finais]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Ficha não encontrada ou já finalizada'
                });
            }

            const paciente_id = result.rows[0].paciente_id;

            // Atualizar jornada se ainda não foi para próxima etapa
            await client.query(`
                UPDATE jornada_paciente 
                SET etapa_atual = 'consulta_finalizada',
                    proxima_acao = 'Elaborar e enviar orçamento',
                    prazo_acao = CURRENT_TIMESTAMP + INTERVAL '12 hours',
                    prioridade = 'atencao'
                WHERE paciente_id = $1 AND etapa_atual = 'consulta_realizada'
            `, [paciente_id]);

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Ficha de atendimento finalizada com sucesso!'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao finalizar ficha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        } finally {
            client.release();
        }
    }

    // ==========================================
    // ATUALIZAR FICHA DE ATENDIMENTO
    // ==========================================
    async atualizarFicha(req, res) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            const { id } = req.params;
            const {
                peso,
                altura,
                pressao_arterial,
                procedimento_desejado,
                motivo_principal,
                historico_medico,
                medicamentos_uso,
                alergias,
                observacoes_clinicas
            } = req.body;

            // Calcular IMC se peso e altura fornecidos
            let imc = null;
            if (peso && altura) {
                imc = (peso / (altura * altura)).toFixed(2);
            }

            const result = await client.query(`
                UPDATE fichas_atendimento 
                SET peso = COALESCE($2, peso),
                    altura = COALESCE($3, altura),
                    imc = COALESCE($4, imc),
                    pressao_arterial = COALESCE($5, pressao_arterial),
                    procedimento_desejado = COALESCE($6, procedimento_desejado),
                    motivo_principal = COALESCE($7, motivo_principal),
                    historico_medico = COALESCE($8, historico_medico),
                    medicamentos_uso = COALESCE($9, medicamentos_uso),
                    alergias = COALESCE($10, alergias),
                    observacoes_clinicas = COALESCE($11, observacoes_clinicas)
                WHERE id = $1 AND status = 'em_andamento'
                RETURNING *
            `, [
                id, peso, altura, imc, pressao_arterial, procedimento_desejado,
                motivo_principal, historico_medico, medicamentos_uso,
                alergias, observacoes_clinicas
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Ficha não encontrada ou já finalizada'
                });
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Ficha atualizada com sucesso!',
                data: {
                    ficha: result.rows[0]
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao atualizar ficha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        } finally {
            client.release();
        }
    }

    // ==========================================
    // BUSCAR FICHAS POR PERÍODO
    // ==========================================
    async buscarFichasPorPeriodo(req, res) {
        try {
            const { data_inicio, data_fim } = req.query;

            if (!data_inicio || !data_fim) {
                return res.status(400).json({
                    success: false,
                    message: 'Data de início e fim são obrigatórias'
                });
            }

            const query = `
                SELECT 
                    fa.id,
                    fa.procedimento_desejado,
                    fa.status,
                    fa.criado_em,
                    p.nome as paciente_nome,
                    p.cpf as paciente_cpf,
                    pr.numero_prontuario,
                    f.nome as criado_por_nome
                FROM fichas_atendimento fa
                JOIN pacientes p ON fa.paciente_id = p.id
                JOIN prontuarios pr ON fa.prontuario_id = pr.id
                LEFT JOIN funcionarios f ON fa.criado_por = f.id
                WHERE DATE(fa.criado_em) BETWEEN $1 AND $2
                ORDER BY fa.criado_em DESC
            `;

            const result = await this.db.query(query, [data_inicio, data_fim]);

            res.json({
                success: true,
                data: {
                    fichas: result.rows,
                    total: result.rows.length,
                    periodo: {
                        inicio: data_inicio,
                        fim: data_fim
                    }
                }
            });

        } catch (error) {
            console.error('Erro ao buscar fichas por período:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
}

module.exports = FichaController;
