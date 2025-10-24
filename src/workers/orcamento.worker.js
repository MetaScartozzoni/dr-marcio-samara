// src/workers/orcamento.worker.js
// Worker for processing orçamento jobs (PDF generation and notifications)
const { Worker } = require('bullmq');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
const bullQueue = require('../queue/bull');
const tableQueue = require('../queue/tableQueue');
const notifierService = require('../services/notifier.service');

class OrcamentoWorker {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    this.templatePath = path.join(__dirname, '../templates/orcamento.html');
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'orcamentos');
    this.worker = null;
    this.running = false;
  }

  /**
   * Start the worker
   */
  async start() {
    if (this.running) {
      console.log('⚠️  Worker already running');
      return;
    }

    console.log('🚀 Starting Orcamento Worker...');

    // Determine which queue system to use
    const bullAvailable = await bullQueue.initialize();

    if (bullAvailable) {
      await this.startBullWorker();
    } else {
      await this.startTableWorker();
    }

    this.running = true;
    console.log('✅ Orcamento Worker started successfully');
  }

  /**
   * Start BullMQ worker
   */
  async startBullWorker() {
    const queue = bullQueue.getQueue('orcamento');
    
    this.worker = new Worker(
      'orcamento',
      async (job) => {
        console.log(`📋 Processing job ${job.id}: ${job.name}`);
        
        try {
          let result;
          
          switch (job.name) {
            case 'generate-pdf':
              result = await this.processPDFGeneration(job.data);
              break;
            default:
              throw new Error(`Unknown job type: ${job.name}`);
          }
          
          console.log(`✅ Job ${job.id} completed successfully`);
          return result;
          
        } catch (error) {
          console.error(`❌ Job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        connection: bullQueue.connection,
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
        limiter: {
          max: 10,
          duration: 60000 // 10 jobs per minute
        }
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err.message);
    });

    console.log('✅ BullMQ worker started');
  }

  /**
   * Start table-based worker (polling)
   */
  async startTableWorker() {
    await tableQueue.initialize();
    
    console.log('✅ Table-based worker started (polling mode)');
    
    // Poll for jobs every 5 seconds
    this.pollInterval = setInterval(async () => {
      try {
        const job = await tableQueue.getNextJob('orcamento');
        
        if (job) {
          console.log(`📋 Processing job ${job.id}: ${job.name}`);
          
          try {
            let result;
            
            switch (job.name) {
              case 'generate-pdf':
                result = await this.processPDFGeneration(job.data);
                break;
              default:
                throw new Error(`Unknown job type: ${job.name}`);
            }
            
            await tableQueue.completeJob(job.id, result);
            console.log(`✅ Job ${job.id} completed successfully`);
            
          } catch (error) {
            console.error(`❌ Job ${job.id} failed:`, error);
            await tableQueue.failJob(job.id, error, true);
          }
        }
        
      } catch (error) {
        console.error('❌ Error polling for jobs:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  /**
   * Process PDF generation job
   */
  async processPDFGeneration(data) {
    const { orcamentoId } = data;
    
    console.log(`📄 Generating PDF for orcamento ${orcamentoId}`);

    try {
      // Fetch orcamento data
      const orcamentoData = await this.fetchOrcamentoData(orcamentoId);
      
      if (!orcamentoData) {
        throw new Error(`Orcamento ${orcamentoId} not found`);
      }

      // Generate PDF
      const pdfBuffer = await this.generatePDF(orcamentoData);
      
      // Upload/store PDF
      const pdfUrl = await this.storePDF(orcamentoData.orcamento.numero_orcamento, pdfBuffer);
      
      // Update database with PDF URL
      await this.updateOrcamentoPDF(orcamentoId, pdfUrl);
      
      // Send notification
      if (notifierService.isAvailable()) {
        try {
          await notifierService.sendOrcamentoNotification(
            orcamentoData.orcamento,
            orcamentoData.paciente,
            pdfUrl
          );
          
          // Mark notification as sent
          await this.db.query(`
            UPDATE orcamentos
            SET notification_sent = true,
                notification_sent_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [orcamentoId]);
          
          console.log(`✅ Notification sent for orcamento ${orcamentoId}`);
          
        } catch (notifError) {
          console.error('⚠️  Failed to send notification:', notifError);
          // Don't fail the job if notification fails
        }
      }

      return {
        success: true,
        orcamentoId,
        pdfUrl,
        notificationSent: notifierService.isAvailable()
      };

    } catch (error) {
      console.error(`❌ Failed to generate PDF for orcamento ${orcamentoId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch orcamento data from database
   */
  async fetchOrcamentoData(orcamentoId) {
    const query = `
      SELECT 
        o.*,
        p.full_name as paciente_nome,
        p.email as paciente_email,
        p.phone as paciente_telefone,
        p.birth_date as paciente_nascimento
      FROM orcamentos o
      LEFT JOIN usuarios p ON o.paciente_id = p.id
      WHERE o.id = $1
    `;

    const result = await this.db.query(query, [orcamentoId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    
    return {
      orcamento: {
        id: row.id,
        numero_orcamento: row.numero_orcamento,
        valor_total: row.valor_total,
        desconto: row.desconto,
        valor_final: row.valor_final,
        validade: row.validade,
        observacoes: row.observacoes,
        status: row.status,
        link_aceite: row.link_aceite,
        created_at: row.created_at || row.criado_em
      },
      paciente: {
        id: row.paciente_id,
        full_name: row.paciente_nome,
        email: row.paciente_email,
        phone: row.paciente_telefone,
        birth_date: row.paciente_nascimento
      },
      itens: JSON.parse(row.itens || '[]')
    };
  }

  /**
   * Generate PDF using Puppeteer
   */
  async generatePDF(data) {
    let browser;
    
    try {
      // Skip if in test mode
      if (process.env.SKIP_PDF_WORKER === 'true') {
        console.log('⚠️  Skipping PDF generation (SKIP_PDF_WORKER=true)');
        return Buffer.from('mock-pdf-content');
      }

      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
      });

      const page = await browser.newPage();
      
      // Load and compile template
      const templateContent = await fs.readFile(this.templatePath, 'utf8');
      const template = handlebars.compile(templateContent);
      
      // Prepare template data
      const html = template({
        orcamento: data.orcamento,
        paciente: data.paciente,
        itens: this.formatItens(data.itens),
        dataAtual: new Date().toLocaleDateString('pt-BR'),
        logoUrl: process.env.LOGO_URL || '',
        valor_total: this.formatCurrency(data.orcamento.valor_total),
        valor_desconto: this.formatCurrency(data.orcamento.desconto || 0),
        valor_final: this.formatCurrency(data.orcamento.valor_final)
      });

      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF
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

      return pdfBuffer;

    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Format items for template
   */
  formatItens(itens) {
    return itens.map((item, index) => {
      const qtd = Number(item.qtd || item.quantidade || 1);
      const valorUnitario = Number(item.valor_unitario || 0);
      const total = qtd * valorUnitario;
      
      return `
        <tr ${index % 2 === 0 ? 'class="even-row"' : ''}>
          <td class="item-desc">${item.descricao}</td>
          <td class="text-center">${qtd}</td>
          <td class="text-right">R$ ${valorUnitario.toFixed(2).replace('.', ',')}</td>
          <td class="text-right font-weight-bold">R$ ${total.toFixed(2).replace('.', ',')}</td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Format currency for display
   */
  formatCurrency(value) {
    return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
  }

  /**
   * Store PDF (local or S3)
   */
  async storePDF(numeroOrcamento, pdfBuffer) {
    const fileName = `orcamento_${numeroOrcamento}.pdf`;
    
    // For now, store locally. Can be extended to support S3 later.
    if (process.env.STORAGE_TYPE === 's3') {
      // TODO: Implement S3 upload
      console.warn('⚠️  S3 storage not yet implemented, falling back to local storage');
    }
    
    // Store locally
    await fs.mkdir(this.uploadsDir, { recursive: true });
    const filePath = path.join(this.uploadsDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const pdfUrl = `${baseUrl}/uploads/orcamentos/${fileName}`;
    
    console.log(`✅ PDF stored locally: ${filePath}`);
    
    return pdfUrl;
  }

  /**
   * Update orcamento with PDF URL
   */
  async updateOrcamentoPDF(orcamentoId, pdfUrl) {
    await this.db.query(`
      UPDATE orcamentos
      SET pdf_url = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [pdfUrl, orcamentoId]);
    
    console.log(`✅ Updated orcamento ${orcamentoId} with PDF URL`);
  }

  /**
   * Stop the worker
   */
  async stop() {
    console.log('🛑 Stopping Orcamento Worker...');
    
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    this.running = false;
    console.log('✅ Orcamento Worker stopped');
  }
}

// If run directly, start the worker
if (require.main === module) {
  const worker = new OrcamentoWorker();
  
  worker.start().catch(error => {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM signal');
    await worker.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT signal');
    await worker.stop();
    process.exit(0);
  });
}

module.exports = OrcamentoWorker;
