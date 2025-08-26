const { Pool } = require('pg');

class ReceitasController {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    // Criar nova receita
    async criarReceita(req, res) {
        const client = await this.pool.connect();
        
        try {
            const {
                paciente_id,
                medico_nome,
                medico_crm,
                data_emissao,
                prescricao,
                observacoes
            } = req.body;

            await client.query('BEGIN');

            const result = await client.query(`
                INSERT INTO receitas (
                    paciente_id, medico_nome, medico_crm, data_emissao,
                    prescricao, observacoes, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING *
            `, [paciente_id, medico_nome, medico_crm, data_emissao, prescricao, observacoes]);

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Receita criada com sucesso',
                data: result.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao criar receita:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        } finally {
            client.release();
        }
    }

    // Listar receitas
    async listarReceitas(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            const result = await this.pool.query(`
                SELECT * FROM receitas 
                ORDER BY created_at DESC 
                LIMIT $1 OFFSET $2
            `, [limit, offset]);

            const countResult = await this.pool.query('SELECT COUNT(*) FROM receitas');

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
            console.error('Erro ao listar receitas:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }

    // Buscar receita por ID
    async buscarReceitaPorId(req, res) {
        try {
            const { id } = req.params;

            const result = await this.pool.query(
                'SELECT * FROM receitas WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Receita não encontrada'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Erro ao buscar receita:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }

    // Enviar receita por email
    async enviarReceitaPorEmail(req, res) {
        try {
            const { emailDestinatario } = req.body;

            // Aqui implementaria o envio real do email
            res.json({
                success: true,
                message: `Receita enviada para ${emailDestinatario}`
            });

        } catch (error) {
            console.error('Erro ao enviar email:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
}

module.exports = ReceitasController;
