// src/routes/procedimentos.routes.js
const express = require('express');
const { body } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// ==========================================
// CONFIGURAÇÃO DE PROCEDIMENTOS
// ==========================================

// GET /api/procedimentos - Listar todos os procedimentos
router.get('/', async (req, res) => {
    try {
        const { tipo, area_corpo, ativo } = req.query;
        
        let query = `
            SELECT p.*, 
                   COUNT(a.id) as total_adicionais,
                   COUNT(ac.id) as total_acessorios
            FROM procedimentos_config p
            LEFT JOIN procedimentos_adicionais a ON p.id = a.procedimento_id AND a.ativo = true
            LEFT JOIN procedimentos_acessorios ac ON p.id = ac.procedimento_id AND ac.ativo = true
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (tipo) {
            paramCount++;
            query += ` AND p.tipo = $${paramCount}`;
            params.push(tipo);
        }
        
        if (area_corpo) {
            paramCount++;
            query += ` AND p.area_corpo = $${paramCount}`;
            params.push(area_corpo);
        }
        
        if (ativo !== undefined) {
            paramCount++;
            query += ` AND p.ativo = $${paramCount}`;
            params.push(ativo === 'true');
        }
        
        query += ` GROUP BY p.id ORDER BY p.nome`;
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            data: result.rows
        });
        
    } catch (error) {
        console.error('Erro ao listar procedimentos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// POST /api/procedimentos - Criar novo procedimento
router.post('/', [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('tipo').isIn(['cirurgico', 'estetico']).withMessage('Tipo deve ser cirurgico ou estetico'),
    body('valor_equipe').optional().isFloat({ min: 0 }).withMessage('Valor da equipe deve ser um número válido'),
    body('valor_hospital').optional().isFloat({ min: 0 }).withMessage('Valor do hospital deve ser um número válido'),
    body('valor_anestesista').optional().isFloat({ min: 0 }).withMessage('Valor do anestesista deve ser um número válido'),
    body('valor_instrumentador').optional().isFloat({ min: 0 }).withMessage('Valor do instrumentador deve ser um número válido'),
    body('valor_assistente').optional().isFloat({ min: 0 }).withMessage('Valor do assistente deve ser um número válido')
], async (req, res) => {
    try {
        const {
            nome, tipo, area_corpo, descricao,
            valor_equipe, valor_hospital, valor_anestesista,
            valor_instrumentador, valor_assistente,
            pos_operatorio_dias, pos_operatorio_valor_dia,
            pos_operatorio_pacote, pos_operatorio_valor_pacote,
            tempo_estimado_minutos, observacoes
        } = req.body;
        
        const query = `
            INSERT INTO procedimentos_config (
                nome, tipo, area_corpo, descricao,
                valor_equipe, valor_hospital, valor_anestesista,
                valor_instrumentador, valor_assistente,
                pos_operatorio_dias, pos_operatorio_valor_dia,
                pos_operatorio_pacote, pos_operatorio_valor_pacote,
                tempo_estimado_minutos, observacoes, criado_por
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `;
        
        const values = [
            nome, tipo, area_corpo, descricao,
            valor_equipe || 0, valor_hospital || 0, valor_anestesista || 0,
            valor_instrumentador || 0, valor_assistente || 0,
            pos_operatorio_dias || 0, pos_operatorio_valor_dia || 0,
            pos_operatorio_pacote || false, pos_operatorio_valor_pacote || 0,
            tempo_estimado_minutos, observacoes, req.userId || 1
        ];
        
        const result = await pool.query(query, values);
        
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Procedimento criado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao criar procedimento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// PUT /api/procedimentos/:id - Atualizar procedimento
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateFields = [];
        const values = [];
        let paramCount = 0;
        
        // Campos atualizáveis
        const allowedFields = [
            'nome', 'tipo', 'area_corpo', 'descricao',
            'valor_equipe', 'valor_hospital', 'valor_anestesista',
            'valor_instrumentador', 'valor_assistente',
            'pos_operatorio_dias', 'pos_operatorio_valor_dia',
            'pos_operatorio_pacote', 'pos_operatorio_valor_pacote',
            'tempo_estimado_minutos', 'observacoes', 'ativo'
        ];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                paramCount++;
                updateFields.push(`${field} = $${paramCount}`);
                values.push(req.body[field]);
            }
        });
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo para atualizar'
            });
        }
        
        paramCount++;
        updateFields.push(`atualizado_em = CURRENT_TIMESTAMP`);
        values.push(id);
        
        const query = `
            UPDATE procedimentos_config 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Procedimento não encontrado'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Procedimento atualizado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao atualizar procedimento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ==========================================
// ADICIONAIS DE PROCEDIMENTOS
// ==========================================

// GET /api/procedimentos/:id/adicionais - Listar adicionais de um procedimento
router.get('/:id/adicionais', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT * FROM procedimentos_adicionais 
            WHERE procedimento_id = $1 AND ativo = true
            ORDER BY nome
        `;
        
        const result = await pool.query(query, [id]);
        
        res.json({
            success: true,
            data: result.rows
        });
        
    } catch (error) {
        console.error('Erro ao listar adicionais:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// POST /api/procedimentos/:id/adicionais - Adicionar adicional
router.post('/:id/adicionais', [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('tipo').isIn(['protese', 'laser', 'medicamento', 'material', 'outros']).withMessage('Tipo inválido'),
    body('valor').isFloat({ min: 0 }).withMessage('Valor deve ser um número válido')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, tipo, valor, obrigatorio, observacoes } = req.body;
        
        const query = `
            INSERT INTO procedimentos_adicionais (
                procedimento_id, nome, tipo, valor, obrigatorio, observacoes, criado_por
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        const values = [id, nome, tipo, valor, obrigatorio || false, observacoes, req.userId || 1];
        const result = await pool.query(query, values);
        
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Adicional criado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao criar adicional:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ==========================================
// ACESSÓRIOS DE PROCEDIMENTOS
// ==========================================

// GET /api/procedimentos/:id/acessorios - Listar acessórios de um procedimento
router.get('/:id/acessorios', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT * FROM procedimentos_acessorios 
            WHERE procedimento_id = $1 AND ativo = true
            ORDER BY nome
        `;
        
        const result = await pool.query(query, [id]);
        
        res.json({
            success: true,
            data: result.rows
        });
        
    } catch (error) {
        console.error('Erro ao listar acessórios:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// POST /api/procedimentos/:id/acessorios - Adicionar acessório
router.post('/:id/acessorios', [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('valor').optional().isFloat({ min: 0 }).withMessage('Valor deve ser um número válido')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, sem_custo, valor, quantidade_incluida, observacoes } = req.body;
        
        const query = `
            INSERT INTO procedimentos_acessorios (
                procedimento_id, nome, sem_custo, valor, quantidade_incluida, observacoes, criado_por
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        const values = [
            id, nome, sem_custo || true, valor || 0, 
            quantidade_incluida || 1, observacoes, req.userId || 1
        ];
        
        const result = await pool.query(query, values);
        
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Acessório criado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao criar acessório:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
