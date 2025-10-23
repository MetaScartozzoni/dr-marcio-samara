// src/orcamento.queue.test.js
// Integration tests for queue and job enqueueing

// Skip these tests in CI if DATABASE_URL or REDIS not available
const skipTests = !process.env.DATABASE_URL || process.env.SKIP_QUEUE_TESTS === 'true';

if (skipTests) {
  describe.skip('Orcamento Queue (Skipped - No Database)', () => {
    test('placeholder', () => {});
  });
} else {
  
const queueManager = require('./queue');

describe('Orcamento Queue', () => {
  
  beforeAll(async () => {
    // Initialize queue system
    await queueManager.initialize();
  });

  afterAll(async () => {
    // Clean up
    await queueManager.close();
  });

  describe('Queue Manager', () => {
    
    test('should initialize queue system', async () => {
      const isAvailable = await queueManager.isAvailable();
      expect(isAvailable).toBe(true);
    });

    test('should return queue type', () => {
      const queueType = queueManager.getQueueType();
      expect(['bullmq', 'table']).toContain(queueType);
    });

    test('should add job to queue', async () => {
      const result = await queueManager.addJob(
        'orcamento',
        'generate-pdf',
        { orcamentoId: 'test-123' },
        { jobId: 'test-job-1' }
      );

      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.queueName).toBe('orcamento');
      expect(result.jobType).toBe('generate-pdf');
    });

    test('should get job status', async () => {
      // Add a job first
      const addResult = await queueManager.addJob(
        'orcamento',
        'generate-pdf',
        { orcamentoId: 'test-456' },
        { jobId: 'test-job-2' }
      );

      // Get job status
      const status = await queueManager.getJobStatus('orcamento', addResult.jobId);
      
      expect(status.exists).toBe(true);
      expect(status.id).toBe(addResult.jobId);
      expect(status.name).toBe('generate-pdf');
    });

    test('should return not exists for unknown job', async () => {
      const status = await queueManager.getJobStatus('orcamento', 'non-existent-job');
      expect(status.exists).toBe(false);
    });

    test('should get queue metrics', async () => {
      const metrics = await queueManager.getQueueMetrics('orcamento');
      
      expect(metrics).toHaveProperty('queueName');
      expect(metrics).toHaveProperty('waiting');
      expect(metrics).toHaveProperty('active');
      expect(metrics).toHaveProperty('completed');
      expect(metrics).toHaveProperty('failed');
      expect(metrics).toHaveProperty('total');
      
      expect(metrics.queueName).toBe('orcamento');
      expect(typeof metrics.total).toBe('number');
    });

  });

  describe('Job enqueueing behavior', () => {
    
    test('should handle concurrent job additions', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          queueManager.addJob(
            'orcamento',
            'generate-pdf',
            { orcamentoId: `concurrent-${i}` },
            { jobId: `concurrent-job-${i}` }
          )
        );
      }

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.jobId).toBeDefined();
      });
    });

    test('should accept job with custom options', async () => {
      const result = await queueManager.addJob(
        'orcamento',
        'generate-pdf',
        { orcamentoId: 'custom-options' },
        { 
          jobId: 'custom-options-job',
          attempts: 5,
          delay: 1000
        }
      );

      expect(result.success).toBe(true);
      expect(result.jobId).toBe('custom-options-job');
    });

  });

  describe('Integration with orcamento service', () => {
    
    test('should enqueue PDF generation via service', async () => {
      const orcamentoService = require('../src/services/orcamento.service');
      
      const result = await orcamentoService.enqueuePDFGeneration('test-orcamento-789');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('enqueued successfully');
    });

  });

});

describe('Worker Behavior (Table Queue Only)', () => {
  
  beforeAll(async () => {
    await queueManager.initialize();
  });

  afterAll(async () => {
    await queueManager.close();
  });

  test('should get next job if using table queue', async () => {
    const queueType = queueManager.getQueueType();
    
    if (queueType === 'table') {
      // Add a job
      await queueManager.addJob(
        'orcamento',
        'test-job',
        { test: 'data' }
      );

      // Try to get next job
      const job = await queueManager.getNextJob('orcamento');
      
      if (job) {
        expect(job.id).toBeDefined();
        expect(job.name).toBeDefined();
        expect(job.data).toBeDefined();
      }
    } else {
      // Skip test for BullMQ
      console.log('Skipping table queue specific test (using BullMQ)');
    }
  });

});

} // End of conditional test block
