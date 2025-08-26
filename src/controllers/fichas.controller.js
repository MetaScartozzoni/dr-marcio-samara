const { Pool } = require('pg');

class FichasController {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    // Criar nova ficha de atendimento
    async criarFicha(req, res) {
        const client = await this.pool.connect();
        
        try {
            const {
                paciente_id,
                pacienteNome,
                pacienteIdade,
                dataAtendimento,
                tipoConsulta,
                queixaPrincipal,
                historiaDoenca,
                alergias,
                medicacoes,
                pressao,
                fc,
                peso,
                altura,
                exameFisico,
                diagnostico,
                conduta,
                observacoes,
                proximoRetorno
            } = req.body;

            await client.query('BEGIN');

            const result = await client.query(`
                INSERT INTO fichas_atendimento (
                    paciente_id, paciente_nome, paciente_idade, data_atendimento,
                    tipo_consulta, queixa_principal, historia_doenca, alergias,
                    medicacoes_atuais, pressao_arterial, frequencia_cardiaca,
                    peso, altura, exame_fisico, diagnostico, conduta,
                    observacoes, proximo_retorno, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
                ) RETURNING *
            `, [
                paciente_id, pacienteNome, pacienteIdade, dataAtendimento,
                tipoConsulta, queixaPrincipal, historiaDoenca, alergias,
                medicacoes, pressao, fc, peso, altura, exameFisico,
                diagnostico, conduta, observacoes, proximoRetorno
            ]);

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Ficha de atendimento criada com sucesso',
                data: result.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao criar ficha:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } finally {
            client.release();
        }
    }

    // Listar todas as fichas
    async listarFichas(req, res) {
        try {
            const { page = 1, limit = 10, paciente } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT * FROM fichas_atendimento 
                WHERE 1=1
            `;
            let params = [];

            if (paciente) {
                query += ` AND LOWER(paciente_nome) LIKE LOWER($${params.length + 1})`;
                params.push(`%${paciente}%`);
            }

            query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);

            const result = await this.pool.query(query, params);

            // Contar total
            const countQuery = paciente 
                ? 'SELECT COUNT(*) FROM fichas_atendimento WHERE LOWER(paciente_nome) LIKE LOWER($1)'
                : 'SELECT COUNT(*) FROM fichas_atendimento';
            const countParams = paciente ? [`%${paciente}%`] : [];
            const countResult = await this.pool.query(countQuery, countParams);

            res.json({
                success: true,
                data: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].count),
                    pages: Math.ceil(countResult.rows[0].count / limit)
                }
            });

        } catch (error) {
            console.error('Erro ao listar fichas:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Buscar ficha por ID
    async buscarFichaPorId(req, res) {
        try {
            const { id } = req.params;

            const result = await this.pool.query(
                'SELECT * FROM fichas_atendimento WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Ficha não encontrada'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Erro ao buscar ficha:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Buscar fichas por paciente
    async buscarFichasPorPaciente(req, res) {
        try {
            const { pacienteId } = req.params;

            const result = await this.pool.query(
                'SELECT * FROM fichas_atendimento WHERE paciente_id = $1 ORDER BY created_at DESC',
                [pacienteId]
            );

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Erro ao buscar fichas do paciente:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Atualizar ficha
    async atualizarFicha(req, res) {
        const client = await this.pool.connect();

        try {
            const { id } = req.params;
            const {
                paciente_id,
                pacienteNome,
                pacienteIdade,
                dataAtendimento,
                tipoConsulta,
                queixaPrincipal,
                historiaDoenca,
                alergias,
                medicacoes,
                pressao,
                fc,
                peso,
                altura,
                exameFisico,
                diagnostico,
                conduta,
                observacoes,
                proximoRetorno
            } = req.body;

            await client.query('BEGIN');

            const result = await client.query(`
                UPDATE fichas_atendimento SET
                    paciente_id = $1, paciente_nome = $2, paciente_idade = $3,
                    data_atendimento = $4, tipo_consulta = $5, queixa_principal = $6,
                    historia_doenca = $7, alergias = $8, medicacoes_atuais = $9,
                    pressao_arterial = $10, frequencia_cardiaca = $11, peso = $12,
                    altura = $13, exame_fisico = $14, diagnostico = $15,
                    conduta = $16, observacoes = $17, proximo_retorno = $18,
                    updated_at = NOW()
                WHERE id = $19
                RETURNING *
            `, [
                paciente_id, pacienteNome, pacienteIdade, dataAtendimento,
                tipoConsulta, queixaPrincipal, historiaDoenca, alergias,
                medicacoes, pressao, fc, peso, altura, exameFisico,
                diagnostico, conduta, observacoes, proximoRetorno, id
            ]);

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    error: 'Ficha não encontrada'
                });
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Ficha atualizada com sucesso',
                data: result.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao atualizar ficha:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } finally {
            client.release();
        }
    }

    // Deletar ficha
    async deletarFicha(req, res) {
        try {
            const { id } = req.params;

            const result = await this.pool.query(
                'DELETE FROM fichas_atendimento WHERE id = $1 RETURNING *',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Ficha não encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Ficha deletada com sucesso'
            });

        } catch (error) {
            console.error('Erro ao deletar ficha:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Gerar PDF da ficha
    async gerarPDFFicha(req, res) {
        try {
            const { id } = req.params;

            const result = await this.pool.query(
                'SELECT * FROM fichas_atendimento WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Ficha não encontrada'
                });
            }

            const ficha = result.rows[0];

            // Aqui você implementaria a geração do PDF
            // Por enquanto, retorna os dados da ficha
            res.json({
                success: true,
                message: 'PDF gerado com sucesso',
                data: ficha
            });

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Enviar ficha por email
    async enviarFichaPorEmail(req, res) {
        try {
            const { id } = req.params;
            const { emailDestinatario } = req.body;

            const result = await this.pool.query(
                'SELECT * FROM fichas_atendimento WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Ficha não encontrada'
                });
            }

            // Aqui você implementaria o envio do email
            // Por enquanto, simula o envio
            res.json({
                success: true,
                message: `Ficha de atendimento enviada para ${emailDestinatario}`
            });

        } catch (error) {
            console.error('Erro ao enviar email:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = FichasController;
