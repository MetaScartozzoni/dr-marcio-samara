// src/queue/index.js
// Queue Manager - Automatically selects BullMQ (Redis) or TableQueue fallback
const bullQueue = require('./bull');
const tableQueue = require('./tableQueue');

class QueueManager {
  constructor() {
    this.activeQueue = null;
    this.queueType = null;
    this.initialized = false;
  }

  /**
   * Initialize queue system (tries Redis first, falls back to table-based)
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Try to initialize BullMQ with Redis first
    const bullAvailable = await bullQueue.initialize();

    if (bullAvailable) {
      this.activeQueue = bullQueue;
      this.queueType = 'bullmq';
      console.log('📊 QueueManager: Using BullMQ (Redis) for job queue');
    } else {
      // Fallback to table-based queue
      const tableAvailable = await tableQueue.initialize();
      
      if (tableAvailable) {
        this.activeQueue = tableQueue;
        this.queueType = 'table';
        console.log('📊 QueueManager: Using Table-based queue (fallback)');
      } else {
        throw new Error('Failed to initialize any queue system');
      }
    }

    this.initialized = true;
  }

  /**
   * Add a job to the queue
   */
  async addJob(queueName, jobType, data, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    return await this.activeQueue.addJob(queueName, jobType, data, options);
  }

  /**
   * Get job status
   */
  async getJobStatus(queueName, jobId) {
    if (!this.initialized) {
      await this.initialize();
    }

    return await this.activeQueue.getJobStatus(queueName, jobId);
  }

  /**
   * Check if queue system is available
   */
  async isAvailable() {
    if (!this.initialized) {
      return false;
    }

    return await this.activeQueue.isAvailable();
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName) {
    if (!this.initialized) {
      await this.initialize();
    }

    return await this.activeQueue.getQueueMetrics(queueName);
  }

  /**
   * Get active queue type
   */
  getQueueType() {
    return this.queueType;
  }

  /**
   * Get next job (for workers - only available in table queue)
   */
  async getNextJob(queueName) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.queueType === 'table') {
      return await this.activeQueue.getNextJob(queueName);
    }

    throw new Error('getNextJob is only available with table-based queue');
  }

  /**
   * Mark job as completed (for workers)
   */
  async completeJob(jobId, result) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.queueType === 'table') {
      return await this.activeQueue.completeJob(jobId, result);
    }

    // BullMQ handles this automatically through workers
    console.log(`✅ QueueManager: Job ${jobId} completed`);
  }

  /**
   * Mark job as failed (for workers)
   */
  async failJob(jobId, error, shouldRetry = true) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.queueType === 'table') {
      return await this.activeQueue.failJob(jobId, error, shouldRetry);
    }

    // BullMQ handles this automatically through workers
    console.log(`❌ QueueManager: Job ${jobId} failed`);
  }

  /**
   * Close all connections
   */
  async close() {
    if (this.activeQueue) {
      await this.activeQueue.close();
      this.initialized = false;
      this.activeQueue = null;
      this.queueType = null;
    }
  }
}

// Export singleton instance
module.exports = new QueueManager();
