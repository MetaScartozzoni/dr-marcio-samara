// src/services/orcamento.service.js
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');
const queueManager = require('../queue');

class OrcamentoService {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    this.templatePath = path.join(__dirname, '../templates/orcamento.html');
  }

  /**
   * Centralized calculation method for orçamento
   * @param {Array} itens - Array of items with descricao, qtd, valor_unitario
   * @param {Object} desconto - Discount object with percentual or desconto_valor
   * @returns {Object} - Calculated values: subtotal, desconto_valor, valor_final
   */
  calcularOrcamento(itens, desconto = {}) {
    // Validate items
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      throw new Error('Pelo menos um item deve ser incluído no orçamento');
    }

    for (const item of itens) {
      if (!item.descricao || typeof item.descricao !== 'string' || item.descricao.trim() === '') {
        throw new Error('Todos os itens devem ter descrição válida');
      }

      const qtd = Number(item.qtd || item.quantidade);
      const valorUnitario = Number(item.valor_unitario);

      if (isNaN(qtd) || qtd < 1) {
        throw new Error(`Quantidade deve ser >= 1 para item "${item.descricao}"`);
      }

      if (isNaN(valorUnitario) || valorUnitario < 0) {
        throw new Error(`Valor unitário deve ser >= 0 para item "${item.descricao}"`);
      }
    }

    // Calculate subtotal
    const subtotal = itens.reduce((total, item) => {
      const qtd = Number(item.qtd || item.quantidade);
      const valorUnitario = Number(item.valor_unitario);
      return total + (qtd * valorUnitario);
    }, 0);

    // Calculate discount
    let descontoValor = 0;
    
    if (desconto.desconto_valor !== undefined) {
      descontoValor = Number(desconto.desconto_valor);
      if (isNaN(descontoValor) || descontoValor < 0) {
        throw new Error('Desconto em valor deve ser >= 0');
      }
      if (descontoValor > subtotal) {
        throw new Error('Desconto não pode ser maior que o subtotal');
      }
    } else if (desconto.percentual !== undefined) {
      const percentual = Number(desconto.percentual);
      if (isNaN(percentual) || percentual < 0 || percentual > 100) {
        throw new Error('Desconto percentual deve estar entre 0 e 100');
      }
      descontoValor = (subtotal * percentual) / 100;
    }

    // Validate consistency if both are provided
    if (desconto.percentual !== undefined && desconto.desconto_valor !== undefined) {
      const expectedDesconto = (subtotal * Number(desconto.percentual)) / 100;
      const providedDesconto = Number(desconto.desconto_valor);
      
      // Allow small floating point differences
      if (Math.abs(expectedDesconto - providedDesconto) > 0.01) {
        throw new Error('Desconto percentual e valor são inconsistentes');
      }
    }

    const valorFinal = subtotal - descontoValor;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      desconto_valor: Math.round(descontoValor * 100) / 100,
      valor_final: Math.round(valorFinal * 100) / 100
    };
  }

  async gerarOrcamento(dadosOrcamento) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        paciente,
        atendimento,
        itens,
        desconto = {},
        observacoes = '',
        validade_dias = 30,
        forma_pagamento = []
      } = dadosOrcamento;

      // Validar dados de entrada
      this.validarDadosOrcamento(dadosOrcamento);

      // Calcular valores usando método centralizado
      const { subtotal, desconto_valor, valor_final } = this.calcularOrcamento(itens, desconto);

      // Gerar número do orçamento
      const numeroOrcamento = await this.gerarNumeroOrcamento(client);

      // Criar registro no banco
      const orcamento = await this.salvarOrcamento(client, {
        atendimento_id: atendimento?.id,
        paciente_id: paciente.id,
        numero_orcamento: numeroOrcamento,
        itens: JSON.stringify(itens),
        valor_total: subtotal,
        desconto: desconto_valor,
        valor_final: valor_final,
        validade: this.calcularDataValidade(validade_dias),
        observacoes,
        forma_pagamento: JSON.stringify(forma_pagamento),
        status: 'pendente'
      });

      // Gerar link de aceite
      const linkAceite = await this.gerarLinkAceite(orcamento.id);
      const tokenAceite = this.gerarTokenSeguro();

      // Atualizar registro com URLs e token
      await client.query(`
        UPDATE orcamentos 
        SET link_aceite = $1, token_aceite = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [linkAceite, tokenAceite, orcamento.id]);

      await client.query('COMMIT');

      // Enqueue PDF generation and notification job
      await this.enqueuePDFGeneration(orcamento.id);

      return {
        ...orcamento,
        link_aceite: linkAceite,
        token_aceite: tokenAceite,
        valor_total: subtotal,
        valor_desconto: desconto_valor,
        valor_final: valor_final
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao gerar orçamento:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Enqueue PDF generation and notification job
   */
  async enqueuePDFGeneration(orcamentoId) {
    try {
      await queueManager.addJob(
        'orcamento',
        'generate-pdf',
        { orcamentoId },
        { 
          jobId: `orcamento-pdf-${orcamentoId}`,
          attempts: 3
        }
      );

      console.log(`✅ PDF generation job enqueued for orcamento ${orcamentoId}`);
      
      return {
        success: true,
        message: 'PDF generation job enqueued successfully'
      };

    } catch (error) {
      console.error('Failed to enqueue PDF generation:', error);
      throw error;
    }
  }

  validarDadosOrcamento(dados) {
    const { paciente, itens } = dados;
    
    if (!paciente || !paciente.id) {
      throw new Error('Dados do paciente são obrigatórios');
    }
    
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      throw new Error('Pelo menos um item deve ser incluído no orçamento');
    }
  }

  async gerarLinkAceite(orcamentoId) {
    const baseUrl = process.env.FRONTEND_URL || 'https://awesome-aurora-465200-q9.uc.r.appspot.com';
    return `${baseUrl}/aceitar-orcamento/${orcamentoId}`;
  }

  gerarTokenSeguro() {
    return crypto.randomBytes(32).toString('hex');
  }

  calcularDataValidade(dias = 30) {
    const validade = new Date();
    validade.setDate(validade.getDate() + dias);
    return validade;
  }

  async gerarNumeroOrcamento(client) {
    const ano = new Date().getFullYear();
    const mes = new Date().getMonth() + 1;
    
    const query = `
      SELECT COUNT(*) as total 
      FROM orcamentos 
      WHERE EXTRACT(YEAR FROM created_at) = $1
        AND EXTRACT(MONTH FROM created_at) = $2
    `;
    
    const { rows: [{ total }] } = await client.query(query, [ano, mes]);
    const numero = parseInt(total) + 1;
    
    return `ORC${ano}${mes.toString().padStart(2, '0')}${numero.toString().padStart(4, '0')}`;
  }

  async salvarOrcamento(client, dados) {
    const query = `
      INSERT INTO orcamentos (
        atendimento_id, paciente_id, numero_orcamento, itens, 
        valor_total, desconto, valor_final, validade, observacoes,
        forma_pagamento, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      dados.atendimento_id,
      dados.paciente_id,
      dados.numero_orcamento,
      dados.itens,
      dados.valor_total,
      dados.desconto,
      dados.valor_final,
      dados.validade,
      dados.observacoes,
      dados.forma_pagamento,
      dados.status
    ];
    
    const { rows: [orcamento] } = await client.query(query, values);
    return orcamento;
  }



  // Métodos adicionais para gestão de orçamentos

  async buscarOrcamento(id) {
    const query = `
      SELECT o.*, p.full_name as paciente_nome, p.email as paciente_email, p.phone as paciente_telefone
      FROM orcamentos o
      JOIN usuarios p ON o.paciente_id = p.id
      WHERE o.id = $1
    `;
    
    const { rows: [orcamento] } = await this.db.query(query, [id]);
    
    if (orcamento) {
      orcamento.itens = JSON.parse(orcamento.itens);
      orcamento.forma_pagamento = JSON.parse(orcamento.forma_pagamento || '[]');
    }
    
    return orcamento;
  }

  async listarOrcamentos(filtros = {}) {
    let query = `
      SELECT o.*, p.full_name as paciente_nome, p.email as paciente_email
      FROM orcamentos o
      JOIN usuarios p ON o.paciente_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (filtros.paciente_id) {
      query += ` AND o.paciente_id = $${++paramCount}`;
      params.push(filtros.paciente_id);
    }
    
    if (filtros.status) {
      query += ` AND o.status = $${++paramCount}`;
      params.push(filtros.status);
    }
    
    if (filtros.data_inicio && filtros.data_fim) {
      query += ` AND o.created_at BETWEEN $${++paramCount} AND $${++paramCount}`;
      params.push(filtros.data_inicio, filtros.data_fim);
    }
    
    query += ` ORDER BY o.created_at DESC`;
    
    if (filtros.limit) {
      query += ` LIMIT $${++paramCount}`;
      params.push(filtros.limit);
    }
    
    const { rows: orcamentos } = await this.db.query(query, params);
    
    return orcamentos.map(orcamento => ({
      ...orcamento,
      itens: JSON.parse(orcamento.itens),
      forma_pagamento: JSON.parse(orcamento.forma_pagamento || '[]')
    }));
  }

  async aceitarOrcamento(id, token) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar token
      const { rows: [orcamento] } = await client.query(
        'SELECT * FROM orcamentos WHERE id = $1 AND token_aceite = $2',
        [id, token]
      );
      
      if (!orcamento) {
        throw new Error('Orçamento não encontrado ou token inválido');
      }
      
      if (orcamento.status !== 'pendente') {
        throw new Error('Este orçamento já foi processado');
      }
      
      if (new Date() > new Date(orcamento.validade)) {
        throw new Error('Este orçamento expirou');
      }
      
      // Atualizar status
      await client.query(
        'UPDATE orcamentos SET status = $1, aceito_em = CURRENT_TIMESTAMP WHERE id = $2',
        ['aceito', id]
      );
      
      await client.query('COMMIT');
      
      return { sucesso: true, message: 'Orçamento aceito com sucesso' };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async rejeitarOrcamento(id, motivo = '') {
    const query = `
      UPDATE orcamentos 
      SET status = 'rejeitado', rejeitado_em = CURRENT_TIMESTAMP, motivo_rejeicao = $1
      WHERE id = $2 AND status = 'pendente'
      RETURNING *
    `;
    
    const { rows: [orcamento] } = await this.db.query(query, [motivo, id]);
    
    if (!orcamento) {
      throw new Error('Orçamento não encontrado ou já processado');
    }
    
    return orcamento;
  }

  async duplicarOrcamento(id) {
    const orcamentoOriginal = await this.buscarOrcamento(id);
    
    if (!orcamentoOriginal) {
      throw new Error('Orçamento original não encontrado');
    }
    
    // Buscar dados do paciente
    const { rows: [paciente] } = await this.db.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [orcamentoOriginal.paciente_id]
    );
    
    return this.gerarOrcamento({
      paciente,
      itens: orcamentoOriginal.itens,
      desconto: (orcamentoOriginal.desconto / orcamentoOriginal.valor_total) * 100,
      observacoes: `Duplicado do orçamento ${orcamentoOriginal.numero_orcamento}\n${orcamentoOriginal.observacoes}`,
      forma_pagamento: orcamentoOriginal.forma_pagamento
    });
  }

  async gerarRelatorioOrcamentos(periodo) {
    const query = `
      SELECT 
        COUNT(*) as total_orcamentos,
        COUNT(*) FILTER (WHERE status = 'aceito') as aceitos,
        COUNT(*) FILTER (WHERE status = 'rejeitado') as rejeitados,
        COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
        SUM(valor_final) FILTER (WHERE status = 'aceito') as valor_total_aceito,
        AVG(valor_final) as valor_medio
      FROM orcamentos
      WHERE created_at >= $1 AND created_at <= $2
    `;
    
    const { rows: [relatorio] } = await this.db.query(query, [periodo.inicio, periodo.fim]);
    
    return {
      ...relatorio,
      taxa_conversao: relatorio.total_orcamentos > 0 
        ? (relatorio.aceitos / relatorio.total_orcamentos * 100).toFixed(2)
        : 0,
      valor_total_aceito: parseFloat(relatorio.valor_total_aceito || 0),
      valor_medio: parseFloat(relatorio.valor_medio || 0)
    };
  }
}

module.exports = new OrcamentoService();
