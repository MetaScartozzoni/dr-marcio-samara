// src/workers/orcamentoWorker.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
const notificationService = require('../services/notifications');

class OrcamentoWorker {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    this.templatePath = path.join(__dirname, '../templates/orcamento.html');
    this.pdfStoragePath = process.env.PDF_STORAGE_PATH || '/tmp/pdfs';
    this.redisUrl = process.env.REDIS_URL;
    this.mode = this.redisUrl ? 'bullmq' : 'polling';
    this.isRunning = false;
    this.pollInterval = parseInt(process.env.POLL_INTERVAL_MS || '5000'); // 5 seconds default
  }

  /**
   * Start the worker in appropriate mode
   */
  async start() {
    console.log(`Starting orcamento worker in ${this.mode} mode...`);
    
    if (this.mode === 'bullmq') {
      await this.startBullMQWorker();
    } else {
      await this.startPollingWorker();
    }
  }

  /**
   * Start BullMQ worker when Redis is available
   */
  async startBullMQWorker() {
    try {
      const { Worker } = require('bullmq');
      const { default: IORedis } = require('ioredis');
      
      const connection = new IORedis(this.redisUrl, {
        maxRetriesPerRequest: null
      });

      const worker = new Worker(
        'orcamento',
        async (job) => {
          console.log(`Processing job ${job.id} of type ${job.name}`);
          
          if (job.name === 'generate_pdf') {
            return await this.processPDFGeneration(job.data);
          }
          
          throw new Error(`Unknown job type: ${job.name}`);
        },
        { connection }
      );

      worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed successfully`);
      });

      worker.on('failed', (job, err) => {
        console.error(`Job ${job.id} failed:`, err.message);
      });

      console.log('BullMQ worker started successfully');
      this.isRunning = true;
    } catch (error) {
      console.error('Failed to start BullMQ worker:', error);
      console.log('Falling back to polling mode...');
      this.mode = 'polling';
      await this.startPollingWorker();
    }
  }

  /**
   * Start polling worker for jobs table
   */
  async startPollingWorker() {
    this.isRunning = true;
    console.log(`Polling worker started. Checking every ${this.pollInterval}ms`);

    while (this.isRunning) {
      try {
        await this.pollAndProcessJobs();
      } catch (error) {
        console.error('Error in polling cycle:', error);
      }
      
      // Wait before next poll
      await this.sleep(this.pollInterval);
    }
  }

  /**
   * Poll jobs table and process pending jobs
   */
  async pollAndProcessJobs() {
    const client = await this.db.connect();
    
    try {
      // Lock and fetch a pending job
      await client.query('BEGIN');
      
      const result = await client.query(`
        SELECT * FROM jobs 
        WHERE status = 'pending' 
        AND attempts < max_attempts
        ORDER BY created_at ASC 
        LIMIT 1 
        FOR UPDATE SKIP LOCKED
      `);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return;
      }

      const job = result.rows[0];
      
      // Mark as processing
      await client.query(`
        UPDATE jobs 
        SET status = 'processing', 
            attempts = attempts + 1, 
            started_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [job.id]);
      
      await client.query('COMMIT');

      console.log(`Processing job ${job.id} of type ${job.type}`);

      // Process the job
      let result_data;
      try {
        if (job.type === 'orcamento:generate_pdf') {
          result_data = await this.processPDFGeneration(job.payload);
        } else {
          throw new Error(`Unknown job type: ${job.type}`);
        }

        // Mark as completed
        await this.db.query(`
          UPDATE jobs 
          SET status = 'completed', 
              completed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [job.id]);

        console.log(`Job ${job.id} completed successfully`);
        
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error.message);
        
        // Update job with error
        const newStatus = job.attempts + 1 >= job.max_attempts ? 'failed' : 'pending';
        await this.db.query(`
          UPDATE jobs 
          SET status = $1, 
              last_error = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [newStatus, error.message, job.id]);
      }

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process PDF generation job
   */
  async processPDFGeneration(data) {
    const { orcamentoId } = data;
    
    if (!orcamentoId) {
      throw new Error('orcamentoId is required');
    }

    let browser;
    
    try {
      // Fetch orcamento data
      const orcamentoResult = await this.db.query(`
        SELECT o.*, 
               u.full_name as paciente_nome,
               u.email as paciente_email,
               u.phone as paciente_telefone,
               u.birth_date as paciente_birth_date
        FROM orcamentos o
        JOIN usuarios u ON o.paciente_id = u.id
        WHERE o.id = $1
      `, [orcamentoId]);

      if (orcamentoResult.rows.length === 0) {
        throw new Error(`Orcamento ${orcamentoId} not found`);
      }

      const orcamento = orcamentoResult.rows[0];
      const itens = typeof orcamento.itens === 'string' 
        ? JSON.parse(orcamento.itens) 
        : orcamento.itens;

      // Generate PDF
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
      
      // Load and process template
      const template = await fs.readFile(this.templatePath, 'utf8');
      const html = this.processTemplate(template, {
        orcamento,
        paciente: {
          full_name: orcamento.paciente_nome,
          email: orcamento.paciente_email,
          phone: orcamento.paciente_telefone,
          birth_date: orcamento.paciente_birth_date
        },
        itens,
        dataAtual: new Date().toLocaleDateString('pt-BR'),
        logoUrl: process.env.LOGO_URL || '/images/logo.png'
      });

      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      // Save PDF
      const fileName = `orcamento_${orcamento.numero_orcamento}.pdf`;
      const pdfUrl = await this.savePDF(fileName, pdfBuffer);

      // Update orcamento with PDF URL
      await this.db.query(`
        UPDATE orcamentos 
        SET pdf_url = $1, pdf_status = 'ready', updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [pdfUrl, orcamentoId]);

      console.log(`PDF generated for orcamento ${orcamentoId}: ${pdfUrl}`);

      // Optionally send notification
      if (orcamento.paciente_email && process.env.SEND_NOTIFICATION_ON_PDF === 'true') {
        try {
          await notificationService.sendEmail({
            to: orcamento.paciente_email,
            subject: `Orçamento ${orcamento.numero_orcamento} - Dr. Márcio`,
            html: `
              <p>Olá ${orcamento.paciente_nome},</p>
              <p>Seu orçamento está pronto!</p>
              <p>Número: ${orcamento.numero_orcamento}</p>
              <p>Valor Total: R$ ${orcamento.valor_final}</p>
              <p>Acesse o sistema para visualizar os detalhes.</p>
            `
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
          // Don't fail the job if email fails
        }
      }

      return { success: true, pdfUrl, orcamentoId };

    } catch (error) {
      // Mark PDF generation as failed in database
      await this.db.query(`
        UPDATE orcamentos 
        SET pdf_status = 'failed', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [orcamentoId]);
      
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Process HTML template with data
   */
  processTemplate(template, dados) {
    let html = template;
    
    // Replace simple variables
    html = html.replace(/{{(\w+)}}/g, (match, key) => {
      return dados[key] || '';
    });

    // Replace orcamento fields
    html = html.replace(/{{orcamento\.(\w+)}}/g, (match, key) => {
      return dados.orcamento[key] || '';
    });

    // Replace paciente fields
    html = html.replace(/{{paciente\.(\w+)}}/g, (match, key) => {
      return dados.paciente[key] || '';
    });

    // Process items list
    const itensHtml = dados.itens.map((item, index) => `
      <tr ${index % 2 === 0 ? 'class="even-row"' : ''}>
        <td class="item-desc">${item.descricao}</td>
        <td class="text-center">${item.quantidade}</td>
        <td class="text-right">R$ ${item.valor_unitario.toFixed(2).replace('.', ',')}</td>
        <td class="text-right font-weight-bold">R$ ${(item.quantidade * item.valor_unitario).toFixed(2).replace('.', ',')}</td>
      </tr>
    `).join('');

    html = html.replace('{{itens}}', itensHtml);

    // Calculate and replace totals
    const valorTotal = dados.itens.reduce((total, item) => 
      total + (item.quantidade * item.valor_unitario), 0);
    const valorDesconto = dados.orcamento.desconto || 0;
    const valorFinal = valorTotal - valorDesconto;

    html = html.replace('{{valor_total}}', `R$ ${valorTotal.toFixed(2).replace('.', ',')}`);
    html = html.replace('{{valor_desconto}}', `R$ ${valorDesconto.toFixed(2).replace('.', ',')}`);
    html = html.replace('{{valor_final}}', `R$ ${valorFinal.toFixed(2).replace('.', ',')}`);

    return html;
  }

  /**
   * Save PDF to storage
   */
  async savePDF(fileName, pdfBuffer) {
    // Ensure directory exists
    await fs.mkdir(this.pdfStoragePath, { recursive: true });
    
    const filePath = path.join(this.pdfStoragePath, fileName);
    await fs.writeFile(filePath, pdfBuffer);
    
    // Return URL (in production, this would be S3 URL or similar)
    return `/pdfs/${fileName}`;
  }

  /**
   * Stop the worker
   */
  stop() {
    console.log('Stopping worker...');
    this.isRunning = false;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// If running directly, start the worker
if (require.main === module) {
  const worker = new OrcamentoWorker();
  
  worker.start().catch(error => {
    console.error('Worker failed to start:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    worker.stop();
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    worker.stop();
  });
}

module.exports = OrcamentoWorker;
