const { Pool } = require('pg');

class ExamesController {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    // Criar nova solicitação de exame
    async criarSolicitacao(req, res) {
        const client = await this.pool.connect();
        
        try {
            const {
                paciente_id,
                medico_nome,
                medico_crm,
                data_solicitacao,
                tipo_exame,
                exames_solicitados,
                justificativa_clinica,
                cid_10
            } = req.body;

            await client.query('BEGIN');

            const result = await client.query(`
                INSERT INTO exames (
                    paciente_id, medico_nome, medico_crm, data_solicitacao,
                    tipo_exame, exames_solicitados, justificativa_clinica,
                    cid_10, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                RETURNING *
            `, [paciente_id, medico_nome, medico_crm, data_solicitacao, 
                tipo_exame, exames_solicitados, justificativa_clinica, cid_10]);

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Solicitação de exame criada com sucesso',
                data: result.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao criar solicitação:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        } finally {
            client.release();
        }
    }

    // Listar exames
    async listarExames(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            const result = await this.pool.query(`
                SELECT * FROM exames 
                ORDER BY created_at DESC 
                LIMIT $1 OFFSET $2
            `, [limit, offset]);

            const countResult = await this.pool.query('SELECT COUNT(*) FROM exames');

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
            console.error('Erro ao listar exames:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }

    // Buscar exame por ID
    async buscarExamePorId(req, res) {
        try {
            const { id } = req.params;

            const result = await this.pool.query(
                'SELECT * FROM exames WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Exame não encontrado'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Erro ao buscar exame:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }

    // Enviar exame por email
    async enviarExamePorEmail(req, res) {
        try {
            const { emailDestinatario } = req.body;

            // Aqui implementaria o envio real do email
            res.json({
                success: true,
                message: `Solicitação de exame enviada para ${emailDestinatario}`
            });

        } catch (error) {
            console.error('Erro ao enviar email:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
}

module.exports = ExamesController;
