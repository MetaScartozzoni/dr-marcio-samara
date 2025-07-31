// src/controllers/paciente.controller.js
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

class PacienteController {
    constructor(db) {
        this.db = db;
    }

    // ==========================================
    // CRIAR PACIENTE COM INTEGRAÇÃO COMPLETA
    // ==========================================
    async criarPaciente(req, res) {
        const client = await this.db.connect();
        
        try {
            // Validação de entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors.array() 
                });
            }

            await client.query('BEGIN');

            const {
                nome,
                cpf,
                email,
                telefone,
                data_nascimento,
                endereco,
                convenio,
                tem_acesso_dashboard = false,
                observacoes_gerais
            } = req.body;

            // 1. CRIAR REGISTRO DO PACIENTE
            const pacienteResult = await client.query(`
                INSERT INTO pacientes (
                    nome, cpf, email, telefone, data_nascimento, 
                    endereco, convenio, tem_acesso_dashboard, 
                    observacoes_gerais, criado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `, [
                nome, cpf, email, telefone, data_nascimento,
                endereco, convenio, tem_acesso_dashboard,
                observacoes_gerais, req.userId
            ]);

            const paciente = pacienteResult.rows[0];
            let senha_temporaria = null;

            // 2. SE TEM ACESSO AO DASHBOARD, CRIAR USUÁRIO
            if (tem_acesso_dashboard && email) {
                senha_temporaria = this.gerarSenhaTemporaria();
                const senhaHash = await bcrypt.hash(senha_temporaria, 10);

                const usuarioResult = await client.query(`
                    INSERT INTO usuarios (
                        nome, email, senha, tipo, ativo,
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, 'paciente', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                `, [nome, email, senhaHash]);

                // Atualizar paciente com usuario_id
                await client.query(`
                    UPDATE pacientes SET usuario_id = $1 WHERE id = $2
                `, [usuarioResult.rows[0].id, paciente.id]);

                paciente.usuario_id = usuarioResult.rows[0].id;
            }

            // 3. CRIAR PRONTUÁRIO AUTOMATICAMENTE
            const numeroProntuario = await this.gerarNumeroProntuario(paciente.id);
            const prontuarioResult = await client.query(`
                INSERT INTO prontuarios (paciente_id, numero_prontuario)
                VALUES ($1, $2)
                RETURNING *
            `, [paciente.id, numeroProntuario]);

            // 4. INICIALIZAR JORNADA DO PACIENTE
            await client.query(`
                INSERT INTO jornada_paciente (
                    paciente_id, etapa_atual, proxima_acao, prioridade
                ) VALUES ($1, 'cadastrado', 'Aguardando primeiro agendamento', 'normal')
            `, [paciente.id]);

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Paciente criado com sucesso!',
                data: {
                    paciente: {
                        id: paciente.id,
                        nome: paciente.nome,
                        cpf: paciente.cpf,
                        email: paciente.email,
                        telefone: paciente.telefone,
                        tem_acesso_dashboard: paciente.tem_acesso_dashboard
                    },
                    prontuario: prontuarioResult.rows[0],
                    acesso_dashboard: tem_acesso_dashboard,
                    senha_temporaria: senha_temporaria
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao criar paciente:', error);
            
            if (error.code === '23505') {
                return res.status(409).json({
                    success: false,
                    message: 'CPF ou email já cadastrado no sistema'
                });
            }

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
    // BUSCAR PACIENTE COM DADOS COMPLETOS
    // ==========================================
    async buscarPaciente(req, res) {
        try {
            const { id, cpf } = req.params;
            let whereClause = '';
            let param = '';

            if (id) {
                whereClause = 'p.id = $1';
                param = id;
            } else if (cpf) {
                whereClause = 'p.cpf = $1';
                param = cpf.replace(/\D/g, '');
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'ID ou CPF deve ser fornecido'
                });
            }

            const query = `
                SELECT 
                    p.*,
                    pr.numero_prontuario,
                    pr.total_fichas_atendimento,
                    pr.total_orcamentos,
                    pr.total_evolucoes,
                    jp.etapa_atual,
                    jp.proxima_acao,
                    jp.prioridade,
                    jp.prazo_acao,
                    u.email as email_usuario,
                    COUNT(a.id) as total_agendamentos
                FROM pacientes p
                LEFT JOIN prontuarios pr ON p.id = pr.paciente_id
                LEFT JOIN jornada_paciente jp ON p.id = jp.paciente_id AND jp.status = 'ativo'
                LEFT JOIN usuarios u ON p.usuario_id = u.id
                LEFT JOIN agendamentos a ON p.id = a.paciente_id
                WHERE ${whereClause}
                GROUP BY p.id, pr.id, jp.id, u.id
            `;

            const result = await this.db.query(query, [param]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente não encontrado'
                });
            }

            const paciente = result.rows[0];

            // Buscar histórico de agendamentos
            const agendamentosResult = await this.db.query(`
                SELECT 
                    a.*,
                    fa.id as ficha_id,
                    o.numero_orcamento,
                    o.status as orcamento_status
                FROM agendamentos a
                LEFT JOIN fichas_atendimento fa ON a.id = fa.agendamento_id
                LEFT JOIN orcamentos o ON fa.id = o.ficha_atendimento_id
                WHERE a.paciente_id = $1
                ORDER BY a.data_agendamento DESC
                LIMIT 10
            `, [paciente.id]);

            res.json({
                success: true,
                data: {
                    paciente: {
                        id: paciente.id,
                        nome: paciente.nome,
                        cpf: paciente.cpf,
                        email: paciente.email,
                        telefone: paciente.telefone,
                        data_nascimento: paciente.data_nascimento,
                        endereco: paciente.endereco,
                        convenio: paciente.convenio,
                        status: paciente.status,
                        tem_acesso_dashboard: paciente.tem_acesso_dashboard,
                        primeira_consulta: paciente.primeira_consulta,
                        total_consultas: paciente.total_consultas,
                        valor_total_tratamentos: paciente.valor_total_tratamentos,
                        observacoes_gerais: paciente.observacoes_gerais
                    },
                    prontuario: {
                        numero: paciente.numero_prontuario,
                        total_fichas: paciente.total_fichas_atendimento,
                        total_orcamentos: paciente.total_orcamentos,
                        total_evolucoes: paciente.total_evolucoes
                    },
                    jornada: {
                        etapa_atual: paciente.etapa_atual,
                        proxima_acao: paciente.proxima_acao,
                        prioridade: paciente.prioridade,
                        prazo_acao: paciente.prazo_acao
                    },
                    estatisticas: {
                        total_agendamentos: parseInt(paciente.total_agendamentos)
                    },
                    historico_agendamentos: agendamentosResult.rows
                }
            });

        } catch (error) {
            console.error('Erro ao buscar paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // ==========================================
    // LISTAR PACIENTES COM FILTROS
    // ==========================================
    async listarPacientes(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                nome,
                status = 'ativo',
                tem_acesso_dashboard,
                etapa_jornada,
                prioridade
            } = req.query;

            let whereConditions = ['p.status = $1'];
            let params = [status];
            let paramCount = 1;

            if (nome) {
                whereConditions.push(`p.nome ILIKE $${++paramCount}`);
                params.push(`%${nome}%`);
            }

            if (tem_acesso_dashboard !== undefined) {
                whereConditions.push(`p.tem_acesso_dashboard = $${++paramCount}`);
                params.push(tem_acesso_dashboard === 'true');
            }

            if (etapa_jornada) {
                whereConditions.push(`jp.etapa_atual = $${++paramCount}`);
                params.push(etapa_jornada);
            }

            if (prioridade) {
                whereConditions.push(`jp.prioridade = $${++paramCount}`);
                params.push(prioridade);
            }

            const offset = (page - 1) * limit;
            params.push(limit, offset);

            const query = `
                SELECT 
                    p.id, p.nome, p.cpf, p.email, p.telefone,
                    p.tem_acesso_dashboard, p.total_consultas,
                    p.criado_em, p.primeira_consulta,
                    pr.numero_prontuario,
                    jp.etapa_atual, jp.prioridade, jp.prazo_acao,
                    COUNT(*) OVER() as total_count
                FROM pacientes p
                LEFT JOIN prontuarios pr ON p.id = pr.paciente_id
                LEFT JOIN jornada_paciente jp ON p.id = jp.paciente_id AND jp.status = 'ativo'
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY p.criado_em DESC
                LIMIT $${++paramCount} OFFSET $${++paramCount}
            `;

            const result = await this.db.query(query, params);

            const totalPages = result.rows.length > 0 ? 
                Math.ceil(result.rows[0].total_count / limit) : 0;

            res.json({
                success: true,
                data: {
                    pacientes: result.rows.map(row => ({
                        id: row.id,
                        nome: row.nome,
                        cpf: row.cpf,
                        email: row.email,
                        telefone: row.telefone,
                        tem_acesso_dashboard: row.tem_acesso_dashboard,
                        total_consultas: row.total_consultas,
                        primeira_consulta: row.primeira_consulta,
                        numero_prontuario: row.numero_prontuario,
                        etapa_atual: row.etapa_atual,
                        prioridade: row.prioridade,
                        prazo_acao: row.prazo_acao,
                        criado_em: row.criado_em
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
            console.error('Erro ao listar pacientes:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // ==========================================
    // CONCEDER/REVOGAR ACESSO AO DASHBOARD
    // ==========================================
    async gerenciarAcessoDashboard(req, res) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            const { id } = req.params;
            const { tem_acesso_dashboard, email } = req.body;

            // Buscar paciente atual
            const pacienteResult = await client.query(`
                SELECT * FROM pacientes WHERE id = $1
            `, [id]);

            if (pacienteResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente não encontrado'
                });
            }

            const paciente = pacienteResult.rows[0];
            let senha_temporaria = null;

            if (tem_acesso_dashboard && !paciente.usuario_id) {
                // CONCEDER ACESSO - Criar usuário
                if (!email && !paciente.email) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email é obrigatório para conceder acesso ao dashboard'
                    });
                }

                const emailFinal = email || paciente.email;
                senha_temporaria = this.gerarSenhaTemporaria();
                const senhaHash = await bcrypt.hash(senha_temporaria, 10);

                const usuarioResult = await client.query(`
                    INSERT INTO usuarios (
                        nome, email, senha, tipo, ativo,
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, 'paciente', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                `, [paciente.nome, emailFinal, senhaHash]);

                await client.query(`
                    UPDATE pacientes 
                    SET tem_acesso_dashboard = true, 
                        usuario_id = $1,
                        email = $2
                    WHERE id = $3
                `, [usuarioResult.rows[0].id, emailFinal, id]);

            } else if (!tem_acesso_dashboard && paciente.usuario_id) {
                // REVOGAR ACESSO - Remover usuário
                await client.query(`
                    DELETE FROM usuarios WHERE id = $1
                `, [paciente.usuario_id]);

                await client.query(`
                    UPDATE pacientes 
                    SET tem_acesso_dashboard = false, 
                        usuario_id = NULL
                    WHERE id = $1
                `, [id]);
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: tem_acesso_dashboard ? 
                    'Acesso ao dashboard concedido com sucesso!' : 
                    'Acesso ao dashboard revogado com sucesso!',
                data: {
                    tem_acesso_dashboard,
                    senha_temporaria
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao gerenciar acesso dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        } finally {
            client.release();
        }
    }

    // ==========================================
    // MÉTODOS AUXILIARES
    // ==========================================
    gerarSenhaTemporaria() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let senha = '';
        for (let i = 0; i < 8; i++) {
            senha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return senha;
    }

    async gerarNumeroProntuario(pacienteId) {
        const ano = new Date().getFullYear();
        const sequencial = pacienteId.toString().padStart(4, '0');
        return `PRON${ano}${sequencial}`;
    }

    // ==========================================
    // BUSCAR HISTÓRICO COMPLETO DO PACIENTE
    // ==========================================
    async buscarHistoricoCompleto(req, res) {
        try {
            const { id } = req.params;

            // Buscar todos os dados relacionados ao paciente
            const queries = {
                agendamentos: `
                    SELECT * FROM agendamentos 
                    WHERE paciente_id = $1 
                    ORDER BY data_agendamento DESC
                `,
                fichas: `
                    SELECT fa.*, a.data_agendamento 
                    FROM fichas_atendimento fa
                    LEFT JOIN agendamentos a ON fa.agendamento_id = a.id
                    WHERE fa.paciente_id = $1 
                    ORDER BY fa.criado_em DESC
                `,
                orcamentos: `
                    SELECT * FROM orcamentos 
                    WHERE paciente_id = $1 
                    ORDER BY criado_em DESC
                `,
                evolucoes: `
                    SELECT * FROM gestao_evolucao 
                    WHERE paciente_id = $1 
                    ORDER BY data_evolucao DESC
                `,
                jornada: `
                    SELECT * FROM jornada_paciente 
                    WHERE paciente_id = $1 
                    ORDER BY criado_em DESC
                `
            };

            const results = {};
            for (const [key, query] of Object.entries(queries)) {
                const result = await this.db.query(query, [id]);
                results[key] = result.rows;
            }

            res.json({
                success: true,
                data: results
            });

        } catch (error) {
            console.error('Erro ao buscar histórico completo:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
}

module.exports = PacienteController;
