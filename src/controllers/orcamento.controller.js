// src/controllers/orcamento.controller.js
const { validationResult } = require('express-validator');
const Logger = require('../utils/logger');
const orcamentoService = require('../services/orcamento.service');

class OrcamentoController {
    constructor(db) {
        this.db = db;
        this.logger = new Logger(db);
    }

    // ==========================================
    // CRIAR ORÇAMENTO INTEGRADO
    // ==========================================
    async criarOrcamento(req, res) {
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
                ficha_atendimento_id,
                valor_total,
                descricao_procedimento,
                forma_pagamento,
                observacoes,
                vencimento_dias = 7
            } = req.body;

            // 1. GERAR NÚMERO DO ORÇAMENTO
            const numero_orcamento = await this.gerarNumeroOrcamento();

            // 2. CALCULAR DATA DE VENCIMENTO
            const vencimento = new Date();
            vencimento.setDate(vencimento.getDate() + vencimento_dias);

            // 3. CRIAR ORÇAMENTO
            const orcamentoResult = await client.query(`
                INSERT INTO orcamentos (
                    paciente_id, ficha_atendimento_id, numero_orcamento,
                    valor_total, descricao_procedimento, forma_pagamento,
                    observacoes, vencimento, criado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                paciente_id, ficha_atendimento_id, numero_orcamento,
                valor_total, descricao_procedimento, forma_pagamento,
                observacoes, vencimento, req.userId
            ]);

            const orcamento = orcamentoResult.rows[0];

            // 4. ATUALIZAR CONTADORES DO PRONTUÁRIO
            await client.query(`
                UPDATE prontuarios 
                SET total_orcamentos = total_orcamentos + 1
                WHERE paciente_id = $1
            `, [paciente_id]);

            // 5. ATUALIZAR VALOR TOTAL DO PACIENTE
            await client.query(`
                UPDATE pacientes 
                SET valor_total_tratamentos = valor_total_tratamentos + $1,
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [valor_total, paciente_id]);

            // 6. ATUALIZAR JORNADA DO PACIENTE
            await client.query(`
                UPDATE jornada_paciente 
                SET etapa_atual = 'orcamento_elaborado',
                    etapa_anterior = etapa_atual,
                    proxima_acao = 'Enviar orçamento para paciente',
                    orcamento_id = $2,
                    prazo_acao = CURRENT_TIMESTAMP + INTERVAL '2 hours',
                    prioridade = 'atencao',
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE paciente_id = $1 AND status = 'ativo'
            `, [paciente_id, orcamento.id]);

            await client.query('COMMIT');

            // LOG DA AÇÃO
            await this.logger.logOrcamento(
                `Orçamento ${numero_orcamento} criado - Valor: R$ ${valor_total}`,
                orcamento.id,
                req.userId || req.user?.id,
                {
                    paciente_id,
                    valor_total,
                    numero_orcamento,
                    ficha_atendimento_id,
                    ip: req.ip,
                    user_agent: req.get('User-Agent')
                }
            );

            // Enqueue PDF generation job
            try {
                await orcamentoService.enqueuePDFGeneration(orcamento.id);
            } catch (queueError) {
                console.error('Failed to enqueue PDF generation:', queueError);
                // Don't fail the request if queue fails
            }

            res.status(202).json({
                success: true,
                message: 'Orçamento criado com sucesso! PDF será gerado em breve.',
                data: {
                    orcamento: {
                        id: orcamento.id,
                        numero_orcamento: orcamento.numero_orcamento,
                        paciente_id: orcamento.paciente_id,
                        valor_total: orcamento.valor_total,
                        descricao_procedimento: orcamento.descricao_procedimento,
                        forma_pagamento: orcamento.forma_pagamento,
                        status: orcamento.status,
                        vencimento: orcamento.vencimento,
                        criado_em: orcamento.criado_em
                    }
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao criar orçamento:', error);
            
            if (error.code === '23505') {
                return res.status(409).json({
                    success: false,
                    message: 'Número de orçamento já existe'
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
    // ENVIAR ORÇAMENTO PARA PACIENTE
    // ==========================================
    async enviarOrcamento(req, res) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            const { id } = req.params;
            const { canal_envio = 'email' } = req.body;

            // Buscar dados do orçamento e paciente
            const orcamentoResult = await client.query(`
                SELECT 
                    o.*,
                    p.nome as paciente_nome,
                    p.email as paciente_email,
                    p.telefone as paciente_telefone
                FROM orcamentos o
                JOIN pacientes p ON o.paciente_id = p.id
                WHERE o.id = $1
            `, [id]);

            if (orcamentoResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Orçamento não encontrado'
                });
            }

            const orcamento = orcamentoResult.rows[0];

            if (orcamento.status === 'enviado') {
                return res.status(400).json({
                    success: false,
                    message: 'Orçamento já foi enviado'
                });
            }

            // Atualizar status para enviado
            await client.query(`
                UPDATE orcamentos 
                SET status = 'enviado',
                    enviado_em = CURRENT_TIMESTAMP,
                    etapa_jornada = 'enviado'
                WHERE id = $1
            `, [id]);

            // Atualizar jornada do paciente
            await client.query(`
                UPDATE jornada_paciente 
                SET etapa_atual = 'orcamento_enviado',
                    etapa_anterior = etapa_atual,
                    proxima_acao = 'Aguardar resposta do paciente',
                    prazo_acao = $2,
                    prioridade = 'normal',
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE paciente_id = $1 AND status = 'ativo'
            `, [orcamento.paciente_id, orcamento.vencimento]);

            await client.query('COMMIT');

            res.json({
                success: true,
                message: `Orçamento enviado com sucesso via ${canal_envio}!`,
                data: {
                    numero_orcamento: orcamento.numero_orcamento,
                    paciente_nome: orcamento.paciente_nome,
                    valor_total: orcamento.valor_total,
                    vencimento: orcamento.vencimento,
                    canal_envio
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao enviar orçamento:', error);
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
    async gerarNumeroOrcamento() {
        const ano = new Date().getFullYear();
        const mes = (new Date().getMonth() + 1).toString().padStart(2, '0');
        
        // Buscar próximo número sequencial do mês
        const result = await this.db.query(`
            SELECT COUNT(*) + 1 as proximo_numero
            FROM orcamentos 
            WHERE EXTRACT(YEAR FROM criado_em) = $1 
            AND EXTRACT(MONTH FROM criado_em) = $2
        `, [ano, parseInt(mes)]);

        const sequencial = result.rows[0].proximo_numero.toString().padStart(4, '0');
        return `ORC${ano}${mes}${sequencial}`;
    }

    // ==========================================
    // GERAR PDF PARA ORÇAMENTO EXISTENTE
    // ==========================================
    async gerarPDF(req, res) {
        try {
            const { id } = req.params;

            // Verificar se orçamento existe
            const orcamentoResult = await this.db.query(
                'SELECT * FROM orcamentos WHERE id = $1',
                [id]
            );

            if (orcamentoResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Orçamento não encontrado'
                });
            }

            // Enqueue PDF generation job
            await orcamentoService.enqueuePDFGeneration(id);

            res.status(202).json({
                success: true,
                message: 'Geração de PDF enfileirada com sucesso',
                data: {
                    orcamento_id: id,
                    status: 'processing'
                }
            });

        } catch (error) {
            console.error('Erro ao enfileirar geração de PDF:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = OrcamentoController;
