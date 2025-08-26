// src/routes/financeiro.routes.js
const express = require('express');
const { body } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// ==========================================
// CONTAS A RECEBER (RECEITAS)
// ==========================================

// GET /api/financeiro/receber - Listar contas a receber
router.get('/receber', async (req, res) => {
    try {
        const { status, data_inicio, data_fim, paciente_id } = req.query;
        
        let query = `
            SELECT cr.*,
                   p.nome as paciente_nome,
                   p.telefone as paciente_telefone,
                   o.numero_orcamento
            FROM contas_receber cr
            JOIN pacientes p ON cr.paciente_id = p.id
            LEFT JOIN orcamentos o ON cr.orcamento_id = o.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (status) {
            paramCount++;
            query += ` AND cr.status = $${paramCount}`;
            params.push(status);
        }
        
        if (data_inicio) {
            paramCount++;
            query += ` AND cr.data_vencimento >= $${paramCount}`;
            params.push(data_inicio);
        }
        
        if (data_fim) {
            paramCount++;
            query += ` AND cr.data_vencimento <= $${paramCount}`;
            params.push(data_fim);
        }
        
        if (paciente_id) {
            paramCount++;
            query += ` AND cr.paciente_id = $${paramCount}`;
            params.push(paciente_id);
        }
        
        query += ` ORDER BY cr.data_vencimento ASC`;
        
        const result = await pool.query(query, params);
        
        // Calcular totais
        const totals = await pool.query(`
            SELECT 
                SUM(valor_total) as total_geral,
                SUM(valor_pago) as total_pago,
                SUM(valor_pendente) as total_pendente,
                COUNT(*) as total_contas
            FROM contas_receber cr
            WHERE 1=1 ${status ? 'AND status = $1' : ''}
        `, status ? [status] : []);
        
        res.json({
            success: true,
            data: result.rows,
            totals: totals.rows[0]
        });
        
    } catch (error) {
        console.error('Erro ao listar contas a receber:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// POST /api/financeiro/receber - Criar conta a receber
router.post('/receber', [
    body('paciente_id').isInt({ min: 1 }).withMessage('ID do paciente é obrigatório'),
    body('procedimento').notEmpty().withMessage('Procedimento é obrigatório'),
    body('valor_total').isFloat({ min: 0 }).withMessage('Valor total deve ser um número válido'),
    body('data_vencimento').isDate().withMessage('Data de vencimento é obrigatória')
], async (req, res) => {
    try {
        const {
            paciente_id, orcamento_id, procedimento, valor_total,
            data_vencimento, observacoes
        } = req.body;
        
        const query = `
            INSERT INTO contas_receber (
                paciente_id, orcamento_id, procedimento, valor_total,
                valor_pendente, data_vencimento, observacoes, criado_por
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const values = [
            paciente_id, orcamento_id, procedimento, valor_total,
            valor_total, data_vencimento, observacoes, req.userId || 1
        ];
        
        const result = await pool.query(query, values);
        
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Conta a receber criada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao criar conta a receber:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// PUT /api/financeiro/receber/:id/pagar - Registrar pagamento
router.put('/receber/:id/pagar', [
    body('valor_pago').isFloat({ min: 0 }).withMessage('Valor pago deve ser um número válido'),
    body('forma_pagamento').notEmpty().withMessage('Forma de pagamento é obrigatória')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { valor_pago, forma_pagamento, observacoes } = req.body;
        
        // Buscar conta atual
        const contaAtual = await pool.query(`
            SELECT * FROM contas_receber WHERE id = $1
        `, [id]);
        
        if (contaAtual.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Conta não encontrada'
            });
        }
        
        const conta = contaAtual.rows[0];
        const novoValorPago = parseFloat(conta.valor_pago) + parseFloat(valor_pago);
        const novoValorPendente = parseFloat(conta.valor_total) - novoValorPago;
        const novoStatus = novoValorPendente <= 0 ? 'pago' : 'pendente';
        
        const query = `
            UPDATE contas_receber 
            SET valor_pago = $1,
                valor_pendente = $2,
                status = $3,
                data_pagamento = CURRENT_TIMESTAMP,
                forma_pagamento = $4,
                observacoes = $5
            WHERE id = $6
            RETURNING *
        `;
        
        const values = [
            novoValorPago, novoValorPendente, novoStatus,
            forma_pagamento, observacoes, id
        ];
        
        const result = await pool.query(query, values);
        
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Pagamento registrado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ==========================================
// CONTAS A PAGAR (DESPESAS)
// ==========================================

// GET /api/financeiro/pagar - Listar contas a pagar
router.get('/pagar', async (req, res) => {
    try {
        const { status, tipo, funcionario_id, data_inicio, data_fim } = req.query;
        
        let query = `
            SELECT cp.*,
                   f.nome as funcionario_nome,
                   o.numero_orcamento
            FROM contas_pagar cp
            LEFT JOIN funcionarios f ON cp.funcionario_id = f.id
            LEFT JOIN orcamentos o ON cp.orcamento_relacionado = o.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (status) {
            paramCount++;
            query += ` AND cp.status = $${paramCount}`;
            params.push(status);
        }
        
        if (tipo) {
            paramCount++;
            query += ` AND cp.tipo = $${paramCount}`;
            params.push(tipo);
        }
        
        if (funcionario_id) {
            paramCount++;
            query += ` AND cp.funcionario_id = $${paramCount}`;
            params.push(funcionario_id);
        }
        
        if (data_inicio) {
            paramCount++;
            query += ` AND cp.data_vencimento >= $${paramCount}`;
            params.push(data_inicio);
        }
        
        if (data_fim) {
            paramCount++;
            query += ` AND cp.data_vencimento <= $${paramCount}`;
            params.push(data_fim);
        }
        
        query += ` ORDER BY cp.data_vencimento ASC`;
        
        const result = await pool.query(query, params);
        
        // Calcular totais
        const totals = await pool.query(`
            SELECT 
                SUM(valor) as total_valor,
                COUNT(*) as total_contas
            FROM contas_pagar
            WHERE status = 'pendente'
        `);
        
        res.json({
            success: true,
            data: result.rows,
            totals: totals.rows[0]
        });
        
    } catch (error) {
        console.error('Erro ao listar contas a pagar:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// POST /api/financeiro/pagar - Criar conta a pagar
router.post('/pagar', [
    body('tipo').isIn(['salario', 'comissao', 'bonus', 'reembolso', 'outros']).withMessage('Tipo inválido'),
    body('descricao').notEmpty().withMessage('Descrição é obrigatória'),
    body('valor').isFloat({ min: 0 }).withMessage('Valor deve ser um número válido'),
    body('data_vencimento').isDate().withMessage('Data de vencimento é obrigatória')
], async (req, res) => {
    try {
        const {
            funcionario_id, tipo, descricao, valor, data_vencimento,
            orcamento_relacionado, observacoes
        } = req.body;
        
        const query = `
            INSERT INTO contas_pagar (
                funcionario_id, tipo, descricao, valor, data_vencimento,
                orcamento_relacionado, observacoes, criado_por
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const values = [
            funcionario_id, tipo, descricao, valor, data_vencimento,
            orcamento_relacionado, observacoes, req.userId || 1
        ];
        
        const result = await pool.query(query, values);
        
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Conta a pagar criada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao criar conta a pagar:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// PUT /api/financeiro/pagar/:id/pagar - Marcar como paga
router.put('/pagar/:id/pagar', [
    body('forma_pagamento').notEmpty().withMessage('Forma de pagamento é obrigatória')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { forma_pagamento, observacoes } = req.body;
        
        const query = `
            UPDATE contas_pagar 
            SET status = 'pago',
                data_pagamento = CURRENT_TIMESTAMP,
                forma_pagamento = $1,
                observacoes = $2
            WHERE id = $3
            RETURNING *
        `;
        
        const values = [forma_pagamento, observacoes, id];
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Conta não encontrada'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Conta marcada como paga'
        });
        
    } catch (error) {
        console.error('Erro ao marcar conta como paga:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ==========================================
// RELATÓRIOS FINANCEIROS
// ==========================================

// GET /api/financeiro/dashboard - Dashboard financeiro
router.get('/dashboard', async (req, res) => {
    try {
        const { mes, ano } = req.query;
        const currentMonth = mes || new Date().getMonth() + 1;
        const currentYear = ano || new Date().getFullYear();
        
        // Receitas do mês
        const receitas = await pool.query(`
            SELECT 
                SUM(valor_total) as total_receitas,
                SUM(valor_pago) as receitas_pagas,
                SUM(valor_pendente) as receitas_pendentes,
                COUNT(*) as total_contas_receber
            FROM contas_receber 
            WHERE EXTRACT(MONTH FROM data_vencimento) = $1 
            AND EXTRACT(YEAR FROM data_vencimento) = $2
        `, [currentMonth, currentYear]);
        
        // Despesas do mês
        const despesas = await pool.query(`
            SELECT 
                SUM(valor) as total_despesas,
                COUNT(*) as total_contas_pagar
            FROM contas_pagar 
            WHERE EXTRACT(MONTH FROM data_vencimento) = $1 
            AND EXTRACT(YEAR FROM data_vencimento) = $2
        `, [currentMonth, currentYear]);
        
        // Contas vencidas
        const vencidas = await pool.query(`
            SELECT 
                COUNT(*) as contas_vencidas_receber,
                SUM(valor_pendente) as valor_vencido_receber
            FROM contas_receber 
            WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE
            
            UNION ALL
            
            SELECT 
                COUNT(*) as contas_vencidas_pagar,
                SUM(valor) as valor_vencido_pagar
            FROM contas_pagar 
            WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE
        `);
        
        res.json({
            success: true,
            data: {
                receitas: receitas.rows[0],
                despesas: despesas.rows[0],
                vencidas: vencidas.rows,
                mes_atual: currentMonth,
                ano_atual: currentYear
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar dashboard financeiro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
