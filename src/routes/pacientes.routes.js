// src/routes/pacientes.routes.js
const express = require('express');
const { body, param, query } = require('express-validator');
const PacienteController = require('../controllers/paciente.controller');
const FichaController = require('../controllers/ficha.controller');
const OrcamentoController = require('../controllers/orcamento.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// TODO: Inicializar controllers após correção de dependências
// const { pool } = require('../config/database');
// const pacienteController = new PacienteController(pool);
// const fichaController = new FichaController(pool);
// const orcamentoController = new OrcamentoController(pool);

module.exports = router;

// ==========================================
// VALIDAÇÕES
// ==========================================
const validarPaciente = [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('cpf').isLength({ min: 11, max: 14 }).withMessage('CPF inválido'),
    body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('data_nascimento').optional().isDate().withMessage('Data de nascimento inválida')
];

const validarFicha = [
    body('paciente_id').isInt().withMessage('ID do paciente é obrigatório'),
    body('peso').optional().isFloat({ min: 0 }).withMessage('Peso deve ser um número positivo'),
    body('altura').optional().isFloat({ min: 0 }).withMessage('Altura deve ser um número positivo'),
    body('procedimento_desejado').notEmpty().withMessage('Procedimento desejado é obrigatório')
];

const validarOrcamento = [
    body('paciente_id').isInt().withMessage('ID do paciente é obrigatório'),
    body('valor_total').isFloat({ min: 0 }).withMessage('Valor total deve ser um número positivo'),
    body('descricao_procedimento').notEmpty().withMessage('Descrição do procedimento é obrigatória')
];

// ==========================================
// ROTAS DE PACIENTES
// ==========================================

// Criar paciente
router.post('/', 
    authenticateToken,
    validarPaciente,
    async (req, res) => {
        await pacienteController.criarPaciente(req, res);
    }
);

// Buscar paciente por ID ou CPF
router.get('/:id', 
    authenticateToken,
    param('id').notEmpty().withMessage('ID ou CPF é obrigatório'),
    async (req, res) => {
        await pacienteController.buscarPaciente(req, res);
    }
);

// Buscar por CPF específico
router.get('/cpf/:cpf', 
    authenticateToken,
    param('cpf').isLength({ min: 11, max: 14 }).withMessage('CPF inválido'),
    async (req, res) => {
        req.params.id = req.params.cpf;
        await pacienteController.buscarPaciente(req, res);
    }
);

// Listar pacientes com filtros
router.get('/', 
    authenticateToken,
    query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve estar entre 1 e 100'),
    async (req, res) => {
        await pacienteController.listarPacientes(req, res);
    }
);

// Gerenciar acesso ao dashboard
router.patch('/:id/dashboard', 
    authenticateToken,
    param('id').isInt().withMessage('ID do paciente inválido'),
    body('tem_acesso_dashboard').isBoolean().withMessage('Acesso dashboard deve ser true ou false'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    async (req, res) => {
        await pacienteController.gerenciarAcessoDashboard(req, res);
    }
);

// Buscar histórico completo do paciente
router.get('/:id/historico', 
    authenticateToken,
    param('id').isInt().withMessage('ID do paciente inválido'),
    async (req, res) => {
        await pacienteController.buscarHistoricoCompleto(req, res);
    }
);

// ==========================================
// ROTAS DE FICHAS DE ATENDIMENTO
// ==========================================

// Criar ficha de atendimento
router.post('/:id/fichas', 
    authenticateToken,
    param('id').isInt().withMessage('ID do paciente inválido'),
    validarFicha,
    async (req, res) => {
        req.body.paciente_id = req.params.id;
        await fichaController.criarFicha(req, res);
    }
);

// Listar fichas do paciente
router.get('/:id/fichas', 
    authenticateToken,
    param('id').isInt().withMessage('ID do paciente inválido'),
    async (req, res) => {
        req.params.paciente_id = req.params.id;
        await fichaController.listarFichasPorPaciente(req, res);
    }
);

// Buscar ficha específica
router.get('/:id/fichas/:ficha_id', 
    authenticateToken,
    param('id').isInt().withMessage('ID do paciente inválido'),
    param('ficha_id').isInt().withMessage('ID da ficha inválido'),
    async (req, res) => {
        req.params.id = req.params.ficha_id;
        await fichaController.buscarFicha(req, res);
    }
);

// Atualizar ficha de atendimento
router.patch('/:id/fichas/:ficha_id', 
    authenticateToken,
    param('id').isInt().withMessage('ID do paciente inválido'),
    param('ficha_id').isInt().withMessage('ID da ficha inválido'),
    async (req, res) => {
        req.params.id = req.params.ficha_id;
        await fichaController.atualizarFicha(req, res);
    }
);

// Finalizar ficha de atendimento
router.patch('/:id/fichas/:ficha_id/finalizar', 
    authenticateToken,
    param('id').isInt().withMessage('ID do paciente inválido'),
    param('ficha_id').isInt().withMessage('ID da ficha inválido'),
    async (req, res) => {
        req.params.id = req.params.ficha_id;
        await fichaController.finalizarFicha(req, res);
    }
);

// ==========================================
// ROTAS DE ORÇAMENTOS
// ==========================================

// Criar orçamento
router.post('/:id/orcamentos', 
    authenticateToken,
    param('id').isInt().withMessage('ID do paciente inválido'),
    validarOrcamento,
    async (req, res) => {
        req.body.paciente_id = req.params.id;
        await orcamentoController.criarOrcamento(req, res);
    }
);

// Enviar orçamento para paciente
router.patch('/:id/orcamentos/:orcamento_id/enviar', 
    authenticateToken,
    param('id').isInt().withMessage('ID do paciente inválido'),
    param('orcamento_id').isInt().withMessage('ID do orçamento inválido'),
    async (req, res) => {
        req.params.id = req.params.orcamento_id;
        await orcamentoController.enviarOrcamento(req, res);
    }
);

// ==========================================
// ROTAS ESPECIAIS PARA INTEGRAÇÃO FRONTEND
// ==========================================

// Buscar paciente por CPF para modal do calendário
router.get('/buscar/cpf/:cpf', 
    authenticateToken,
    param('cpf').isLength({ min: 11, max: 14 }).withMessage('CPF inválido'),
    async (req, res) => {
        try {
            // Remover formatação do CPF
            const cpfLimpo = req.params.cpf.replace(/\D/g, '');
            
            const query = `
                SELECT 
                    p.*,
                    pr.numero_prontuario,
                    COUNT(a.id) as total_agendamentos,
                    MAX(a.data_agendamento) as ultimo_agendamento
                FROM pacientes p
                LEFT JOIN prontuarios pr ON p.id = pr.paciente_id
                LEFT JOIN agendamentos a ON p.id = a.paciente_id
                WHERE p.cpf = $1
                GROUP BY p.id, pr.id
            `;

            const result = await pacienteController.db.query(query, [cpfLimpo]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente não encontrado'
                });
            }

            const paciente = result.rows[0];

            // Buscar histórico recente de agendamentos
            const historicoResult = await pacienteController.db.query(`
                SELECT 
                    a.data_agendamento,
                    a.tipo_consulta,
                    a.status,
                    fa.procedimento_desejado,
                    o.numero_orcamento,
                    o.valor_total,
                    o.status as orcamento_status
                FROM agendamentos a
                LEFT JOIN fichas_atendimento fa ON a.id = fa.agendamento_id
                LEFT JOIN orcamentos o ON fa.id = o.ficha_atendimento_id
                WHERE a.paciente_id = $1
                ORDER BY a.data_agendamento DESC
                LIMIT 5
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
                        numero_prontuario: paciente.numero_prontuario,
                        total_consultas: paciente.total_consultas,
                        primeira_consulta: paciente.primeira_consulta
                    },
                    estatisticas: {
                        total_agendamentos: parseInt(paciente.total_agendamentos),
                        ultimo_agendamento: paciente.ultimo_agendamento
                    },
                    historico_recente: historicoResult.rows
                }
            });

        } catch (error) {
            console.error('Erro ao buscar paciente por CPF:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

// Criar paciente durante agendamento
router.post('/agendamento/criar', 
    authenticateToken,
    [
        body('nome').notEmpty().withMessage('Nome é obrigatório'),
        body('cpf').isLength({ min: 11, max: 14 }).withMessage('CPF inválido'),
        body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
        body('agendamento').isObject().withMessage('Dados do agendamento são obrigatórios'),
        body('criar_caderno').optional().isBoolean()
    ],
    async (req, res) => {
        const client = await pacienteController.db.connect();
        
        try {
            await client.query('BEGIN');

            const { agendamento, criar_caderno, ...dadosPaciente } = req.body;

            // 1. Criar paciente
            req.body = dadosPaciente;
            const responsePaciente = await new Promise((resolve) => {
                const mockRes = {
                    status: (code) => ({
                        json: (data) => resolve({ status: code, data })
                    }),
                    json: (data) => resolve({ status: 200, data })
                };
                pacienteController.criarPaciente(req, mockRes);
            });

            if (responsePaciente.status !== 201) {
                throw new Error('Erro ao criar paciente');
            }

            const paciente = responsePaciente.data.data.paciente;

            // 2. Criar agendamento se fornecido
            let novoAgendamento = null;
            if (agendamento) {
                const agendamentoResult = await client.query(`
                    INSERT INTO agendamentos (
                        paciente_id, data_agendamento, tipo_consulta,
                        observacoes, caderno_criado
                    ) VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `, [
                    paciente.id,
                    agendamento.data_agendamento,
                    agendamento.tipo_consulta,
                    agendamento.observacoes,
                    criar_caderno || false
                ]);

                novoAgendamento = agendamentoResult.rows[0];

                // Atualizar jornada do paciente
                await client.query(`
                    UPDATE jornada_paciente 
                    SET etapa_atual = 'agendamento_confirmado',
                        proxima_acao = 'Aguardando consulta',
                        agendamento_id = $2,
                        prazo_acao = $3
                    WHERE paciente_id = $1
                `, [paciente.id, novoAgendamento.id, agendamento.data_agendamento]);
            }

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Paciente criado e agendamento realizado com sucesso!',
                data: {
                    paciente,
                    agendamento: novoAgendamento,
                    caderno_criado: criar_caderno || false
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao criar paciente com agendamento:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        } finally {
            client.release();
        }
    }
);

module.exports = router;
