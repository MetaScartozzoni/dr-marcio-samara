// src/services/orcamento.service.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
const AWS = require('aws-sdk');
const crypto = require('crypto');

class OrcamentoService {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    this.templatePath = path.join(__dirname, '../templates/orcamento.html');
    
    // Configurar AWS S3 para upload de PDFs
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.bucketName = process.env.AWS_S3_BUCKET || 'portal-dr-marcio-pdfs';
  }

  async gerarOrcamento(dadosOrcamento) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        paciente,
        atendimento,
        itens,
        desconto = 0,
        observacoes = '',
        validade_dias = 30,
        forma_pagamento = []
      } = dadosOrcamento;

      // Validar dados de entrada
      this.validarDadosOrcamento(dadosOrcamento);

      // Calcular valores
      const valorTotal = itens.reduce((total, item) => {
        return total + (item.quantidade * item.valor_unitario);
      }, 0);

      const valorDesconto = (valorTotal * desconto) / 100;
      const valorFinal = valorTotal - valorDesconto;

      // Gerar número do orçamento
      const numeroOrcamento = await this.gerarNumeroOrcamento(client);

      // Criar registro no banco
      const orcamento = await this.salvarOrcamento(client, {
        atendimento_id: atendimento?.id,
        paciente_id: paciente.id,
        numero_orcamento: numeroOrcamento,
        itens: JSON.stringify(itens),
        valor_total: valorTotal,
        desconto: valorDesconto,
        valor_final: valorFinal,
        validade: this.calcularDataValidade(validade_dias),
        observacoes,
        forma_pagamento: JSON.stringify(forma_pagamento),
        status: 'pendente'
      });

      // Gerar PDF
      const pdfUrl = await this.gerarPDF(orcamento, paciente, itens);
      
      // Gerar link de aceite
      const linkAceite = await this.gerarLinkAceite(orcamento.id);
      const tokenAceite = this.gerarTokenSeguro();

      // Atualizar registro com URLs e token
      await this.atualizarUrls(client, orcamento.id, pdfUrl, linkAceite, tokenAceite);

      await client.query('COMMIT');

      return {
        ...orcamento,
        pdf_url: pdfUrl,
        link_aceite: linkAceite,
        token_aceite: tokenAceite,
        valor_total: valorTotal,
        valor_desconto: valorDesconto,
        valor_final: valorFinal
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao gerar orçamento:', error);
      throw error;
    } finally {
      client.release();
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
    
    for (const item of itens) {
      if (!item.descricao || !item.quantidade || !item.valor_unitario) {
        throw new Error('Todos os itens devem ter descrição, quantidade e valor unitário');
      }
      
      if (item.quantidade <= 0 || item.valor_unitario <= 0) {
        throw new Error('Quantidade e valor unitário devem ser positivos');
      }
    }
  }

  async gerarPDF(orcamento, paciente, itens) {
    let browser;
    
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Carregar template HTML
      const template = await fs.readFile(this.templatePath, 'utf8');
      
      // Substituir variáveis no template
      const html = this.processarTemplate(template, {
        orcamento,
        paciente,
        itens,
        dataAtual: new Date().toLocaleDateString('pt-BR'),
        logoUrl: process.env.LOGO_URL || '/images/logo.png'
      });

      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Configurações do PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="width: 100%; font-size: 10px; padding: 5px; text-align: center;">
            <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
          </div>
        `
      });

      // Upload para S3
      const fileName = `orcamento_${orcamento.numero_orcamento}.pdf`;
      const pdfUrl = await this.uploadPDF(fileName, pdfBuffer);

      return pdfUrl;

    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  processarTemplate(template, dados) {
    let html = template;
    
    // Substituir variáveis básicas
    html = html.replace(/{{(\w+)}}/g, (match, key) => {
      return dados[key] || '';
    });

    // Substituir dados do orçamento
    html = html.replace(/{{orcamento\.(\w+)}}/g, (match, key) => {
      return dados.orcamento[key] || '';
    });

    // Substituir dados do paciente
    html = html.replace(/{{paciente\.(\w+)}}/g, (match, key) => {
      return dados.paciente[key] || '';
    });

    // Processar lista de itens
    const itensHtml = dados.itens.map((item, index) => `
      <tr ${index % 2 === 0 ? 'class="even-row"' : ''}>
        <td class="item-desc">${item.descricao}</td>
        <td class="text-center">${item.quantidade}</td>
        <td class="text-right">R$ ${item.valor_unitario.toFixed(2).replace('.', ',')}</td>
        <td class="text-right font-weight-bold">R$ ${(item.quantidade * item.valor_unitario).toFixed(2).replace('.', ',')}</td>
      </tr>
    `).join('');

    html = html.replace('{{itens}}', itensHtml);

    // Calcular e substituir totais
    const valorTotal = dados.itens.reduce((total, item) => total + (item.quantidade * item.valor_unitario), 0);
    const valorDesconto = dados.orcamento.desconto || 0;
    const valorFinal = valorTotal - valorDesconto;

    html = html.replace('{{valor_total}}', `R$ ${valorTotal.toFixed(2).replace('.', ',')}`);
    html = html.replace('{{valor_desconto}}', `R$ ${valorDesconto.toFixed(2).replace('.', ',')}`);
    html = html.replace('{{valor_final}}', `R$ ${valorFinal.toFixed(2).replace('.', ',')}`);

    return html;
  }

  async uploadPDF(fileName, pdfBuffer) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: `orcamentos/${fileName}`,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ACL: 'private', // Apenas acesso autorizado
        Metadata: {
          'created-at': new Date().toISOString(),
          'type': 'orcamento'
        }
      };

      const result = await this.s3.upload(params).promise();
      
      // Gerar URL assinada válida por 7 dias
      const signedUrl = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: `orcamentos/${fileName}`,
        Expires: 60 * 60 * 24 * 7 // 7 dias
      });

      return signedUrl;

    } catch (error) {
      console.error('Erro no upload do PDF:', error);
      
      // Fallback: salvar localmente se S3 falhar
      const localPath = path.join(process.cwd(), 'uploads', 'orcamentos', fileName);
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      await fs.writeFile(localPath, pdfBuffer);
      
      return `/uploads/orcamentos/${fileName}`;
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

  async atualizarUrls(client, orcamentoId, pdfUrl, linkAceite, tokenAceite) {
    const query = `
      UPDATE orcamentos 
      SET pdf_url = $1, link_aceite = $2, token_aceite = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `;
    
    await client.query(query, [pdfUrl, linkAceite, tokenAceite, orcamentoId]);
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
