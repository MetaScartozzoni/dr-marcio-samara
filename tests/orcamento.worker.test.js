// tests/orcamento.worker.test.js
const OrcamentoWorker = require('../src/workers/orcamentoWorker');

// Mock dependencies
jest.mock('puppeteer');
jest.mock('pg');
jest.mock('../services/notifications');

const puppeteer = require('puppeteer');
const { Pool } = require('pg');
const notificationService = require('../src/services/notifications');

describe('Orcamento Worker', () => {
  let worker;
  let mockDb;
  let mockClient;

  beforeEach(() => {
    // Setup mock database
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    
    mockDb = {
      connect: jest.fn().mockResolvedValue(mockClient),
      query: jest.fn()
    };

    Pool.mockImplementation(() => mockDb);

    // Setup environment
    process.env.DATABASE_URL = 'postgresql://test';
    process.env.PDF_STORAGE_PATH = '/tmp/test-pdfs';
    delete process.env.REDIS_URL; // Test polling mode by default

    worker = new OrcamentoWorker();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize in polling mode when REDIS_URL not set', () => {
      expect(worker.mode).toBe('polling');
    });

    test('should initialize in bullmq mode when REDIS_URL is set', () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      const redisWorker = new OrcamentoWorker();
      expect(redisWorker.mode).toBe('bullmq');
    });
  });

  describe('PDF Generation', () => {
    let mockBrowser;
    let mockPage;

    beforeEach(() => {
      // Mock Puppeteer
      mockPage = {
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from('fake pdf content'))
      };

      mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined)
      };

      puppeteer.launch.mockResolvedValue(mockBrowser);
    });

    test('should process PDF generation successfully', async () => {
      const mockOrcamento = {
        id: '123',
        numero_orcamento: 'ORC20251001',
        paciente_id: 'pac123',
        paciente_nome: 'João Silva',
        paciente_email: 'joao@example.com',
        paciente_telefone: '11999999999',
        valor_final: 1000,
        itens: JSON.stringify([
          { descricao: 'Consulta', quantidade: 1, valor_unitario: 1000 }
        ])
      };

      mockDb.query.mockResolvedValue({
        rows: [mockOrcamento]
      });

      const result = await worker.processPDFGeneration({ orcamentoId: '123' });

      expect(result.success).toBe(true);
      expect(result.orcamentoId).toBe('123');
      expect(puppeteer.launch).toHaveBeenCalled();
      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();

      // Verify database was updated with PDF status
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orcamentos'),
        expect.arrayContaining([expect.stringContaining('/pdfs/'), '123'])
      );
    });

    test('should handle missing orcamento gracefully', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await expect(
        worker.processPDFGeneration({ orcamentoId: 'nonexistent' })
      ).rejects.toThrow('Orcamento nonexistent not found');
    });

    test('should update orcamento with failed status on error', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '123', itens: '[]' }]
      });

      puppeteer.launch.mockRejectedValue(new Error('Puppeteer failed'));

      await expect(
        worker.processPDFGeneration({ orcamentoId: '123' })
      ).rejects.toThrow('Puppeteer failed');

      // Verify failed status was set
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("pdf_status = 'failed'"),
        expect.arrayContaining(['123'])
      );
    });

    test('should close browser even on error', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          id: '123',
          itens: JSON.stringify([{ quantidade: 1, valor_unitario: 100 }])
        }]
      });

      mockPage.pdf.mockRejectedValue(new Error('PDF generation failed'));

      await expect(
        worker.processPDFGeneration({ orcamentoId: '123' })
      ).rejects.toThrow();

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('Template Processing', () => {
    test('should replace template variables correctly', () => {
      const template = `
        <div>{{orcamento.numero_orcamento}}</div>
        <div>{{paciente.full_name}}</div>
        <div>{{dataAtual}}</div>
      `;

      const data = {
        orcamento: { numero_orcamento: 'ORC001' },
        paciente: { full_name: 'João Silva' },
        dataAtual: '23/10/2025',
        itens: []
      };

      const result = worker.processTemplate(template, data);

      expect(result).toContain('ORC001');
      expect(result).toContain('João Silva');
      expect(result).toContain('23/10/2025');
    });

    test('should generate items HTML correctly', () => {
      const template = '{{itens}}';
      const data = {
        orcamento: {},
        paciente: {},
        itens: [
          { descricao: 'Item 1', quantidade: 2, valor_unitario: 50 },
          { descricao: 'Item 2', quantidade: 1, valor_unitario: 100 }
        ]
      };

      const result = worker.processTemplate(template, data);

      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
      expect(result).toContain('R$ 50,00');
      expect(result).toContain('R$ 100,00');
    });

    test('should calculate and format totals correctly', () => {
      const template = '{{valor_total}} {{valor_desconto}} {{valor_final}}';
      const data = {
        orcamento: { desconto: 50 },
        paciente: {},
        itens: [
          { descricao: 'Item', quantidade: 2, valor_unitario: 100 }
        ]
      };

      const result = worker.processTemplate(template, data);

      expect(result).toContain('R$ 200,00');
      expect(result).toContain('R$ 50,00');
      expect(result).toContain('R$ 150,00');
    });
  });

  describe('Job Polling', () => {
    test('should fetch and process pending job', async () => {
      const mockJob = {
        id: 'job123',
        type: 'orcamento:generate_pdf',
        payload: { orcamentoId: 'orc123' },
        attempts: 0,
        max_attempts: 3
      };

      // First query gets the job, second updates it
      mockClient.query
        .mockResolvedValueOnce({ rows: [mockJob] }) // SELECT job
        .mockResolvedValueOnce({ rows: [] }) // UPDATE to processing
        .mockResolvedValueOnce({ rows: [] }); // UPDATE to completed

      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // Job update to completed
        .mockResolvedValueOnce({
          rows: [{
            id: 'orc123',
            numero_orcamento: 'ORC001',
            itens: JSON.stringify([])
          }]
        }); // Orcamento fetch

      // Mock PDF generation dependencies
      const mockPage = {
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from('pdf'))
      };

      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined)
      };

      puppeteer.launch.mockResolvedValue(mockBrowser);

      await worker.pollAndProcessJobs();

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM jobs'),
        undefined
      );
    });

    test('should handle no pending jobs', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await worker.pollAndProcessJobs();

      expect(mockClient.query).toHaveBeenCalledTimes(2); // BEGIN and SELECT
    });

    test('should retry failed jobs up to max attempts', async () => {
      const mockJob = {
        id: 'job123',
        type: 'orcamento:generate_pdf',
        payload: { orcamentoId: 'orc123' },
        attempts: 2,
        max_attempts: 3
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockJob] })
        .mockResolvedValueOnce({ rows: [] });

      mockDb.query.mockResolvedValue({ rows: [] });

      puppeteer.launch.mockRejectedValue(new Error('Temporary failure'));

      await worker.pollAndProcessJobs();

      // Should update to failed since attempts (2) + 1 >= max_attempts (3)
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE jobs'),
        expect.arrayContaining(['failed', expect.any(String), 'job123'])
      );
    });
  });

  describe('Notifications', () => {
    test('should send email notification when enabled', async () => {
      process.env.SEND_NOTIFICATION_ON_PDF = 'true';

      const mockOrcamento = {
        id: '123',
        numero_orcamento: 'ORC001',
        paciente_nome: 'João Silva',
        paciente_email: 'joao@example.com',
        valor_final: 1000,
        itens: JSON.stringify([])
      };

      mockDb.query.mockResolvedValue({ rows: [mockOrcamento] });

      const mockPage = {
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from('pdf'))
      };

      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined)
      };

      puppeteer.launch.mockResolvedValue(mockBrowser);
      notificationService.sendEmail.mockResolvedValue({ success: true });

      await worker.processPDFGeneration({ orcamentoId: '123' });

      expect(notificationService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'joao@example.com',
          subject: expect.stringContaining('ORC001')
        })
      );
    });

    test('should not fail job if email notification fails', async () => {
      process.env.SEND_NOTIFICATION_ON_PDF = 'true';

      const mockOrcamento = {
        id: '123',
        numero_orcamento: 'ORC001',
        paciente_nome: 'João',
        paciente_email: 'joao@example.com',
        valor_final: 1000,
        itens: JSON.stringify([])
      };

      mockDb.query.mockResolvedValue({ rows: [mockOrcamento] });

      const mockPage = {
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from('pdf'))
      };

      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined)
      };

      puppeteer.launch.mockResolvedValue(mockBrowser);
      notificationService.sendEmail.mockRejectedValue(new Error('Email failed'));

      // Should not throw
      const result = await worker.processPDFGeneration({ orcamentoId: '123' });
      expect(result.success).toBe(true);
    });
  });
});
