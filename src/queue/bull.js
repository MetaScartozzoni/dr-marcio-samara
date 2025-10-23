// src/queue/bull.js
// BullMQ Queue Implementation with Redis
const { Queue } = require('bullmq');
const Redis = require('ioredis');

class BullQueue {
  constructor() {
    this.connection = null;
    this.queues = new Map();
    this.initialized = false;
  }

  /**
   * Initialize Redis connection and queues
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      // Create Redis connection
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // Stop retrying
          }
          return Math.min(times * 1000, 3000);
        }
      };

      // Add password if configured
      if (process.env.REDIS_PASSWORD) {
        redisConfig.password = process.env.REDIS_PASSWORD;
      }

      // Add TLS if configured
      if (process.env.REDIS_TLS === 'true') {
        redisConfig.tls = {};
      }

      this.connection = new Redis(redisConfig);

      // Test connection
      await this.connection.ping();
      
      console.log('✅ BullMQ: Redis connection established');
      this.initialized = true;
      return true;

    } catch (error) {
      console.warn('⚠️  BullMQ: Failed to connect to Redis:', error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Get or create a queue
   */
  getQueue(queueName) {
    if (!this.initialized || !this.connection) {
      throw new Error('BullMQ not initialized. Call initialize() first.');
    }

    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: {
            age: 24 * 3600, // keep for 24 hours
            count: 100
          },
          removeOnFail: {
            age: 7 * 24 * 3600 // keep for 7 days
          }
        }
      });

      this.queues.set(queueName, queue);
      console.log(`✅ BullMQ: Queue '${queueName}' created`);
    }

    return this.queues.get(queueName);
  }

  /**
   * Add a job to the queue
   */
  async addJob(queueName, jobType, data, options = {}) {
    try {
      const queue = this.getQueue(queueName);
      
      const job = await queue.add(jobType, data, {
        ...options,
        jobId: options.jobId || undefined
      });

      console.log(`✅ BullMQ: Job ${job.id} added to queue '${queueName}'`);
      return {
        success: true,
        jobId: job.id,
        queueName,
        jobType
      };

    } catch (error) {
      console.error(`❌ BullMQ: Failed to add job to queue '${queueName}':`, error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(queueName, jobId) {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);
      
      if (!job) {
        return { exists: false };
      }

      const state = await job.getState();
      
      return {
        exists: true,
        id: job.id,
        name: job.name,
        data: job.data,
        state,
        progress: job.progress,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn
      };

    } catch (error) {
      console.error(`❌ BullMQ: Failed to get job status:`, error);
      throw error;
    }
  }

  /**
   * Check if Redis is available
   */
  async isAvailable() {
    if (!this.connection) {
      return false;
    }

    try {
      await this.connection.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Close all connections
   */
  async close() {
    try {
      // Close all queues
      for (const [name, queue] of this.queues) {
        await queue.close();
        console.log(`✅ BullMQ: Queue '${name}' closed`);
      }
      
      // Close Redis connection
      if (this.connection) {
        await this.connection.quit();
        console.log('✅ BullMQ: Redis connection closed');
      }
      
      this.queues.clear();
      this.initialized = false;

    } catch (error) {
      console.error('❌ BullMQ: Error closing connections:', error);
      throw error;
    }
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName) {
    try {
      const queue = this.getQueue(queueName);
      
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount()
      ]);

      return {
        queueName,
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed
      };

    } catch (error) {
      console.error(`❌ BullMQ: Failed to get queue metrics:`, error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new BullQueue();
