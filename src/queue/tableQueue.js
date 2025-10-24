// src/queue/tableQueue.js
// Table-based Queue Implementation (Fallback for environments without Redis)
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class TableQueue {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.initialized = false;
  }

  /**
   * Initialize table queue
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      // Test database connection
      await this.db.query('SELECT 1');
      
      // Verify jobs table exists
      const tableCheck = await this.db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'jobs'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        throw new Error('Jobs table does not exist. Please run migrations first.');
      }

      console.log('✅ TableQueue: Database connection established');
      this.initialized = true;
      return true;

    } catch (error) {
      console.error('❌ TableQueue: Failed to initialize:', error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Add a job to the queue
   */
  async addJob(queueName, jobType, data, options = {}) {
    try {
      const jobId = options.jobId || uuidv4();
      const maxAttempts = options.attempts || 3;
      const delay = options.delay || 0;

      // Calculate next attempt time
      const proximaTentativa = delay > 0 
        ? new Date(Date.now() + delay)
        : new Date();

      const query = `
        INSERT INTO jobs (
          job_id,
          tipo,
          payload,
          status,
          attempts,
          max_attempts,
          proxima_tentativa
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        jobId,
        `${queueName}:${jobType}`,
        JSON.stringify(data),
        'pending',
        0,
        maxAttempts,
        proximaTentativa
      ];

      const result = await this.db.query(query, values);
      const job = result.rows[0];

      console.log(`✅ TableQueue: Job ${jobId} added to queue '${queueName}'`);

      return {
        success: true,
        jobId: job.job_id,
        queueName,
        jobType
      };

    } catch (error) {
      console.error(`❌ TableQueue: Failed to add job to queue '${queueName}':`, error);
      throw error;
    }
  }

  /**
   * Get next pending job from queue
   */
  async getNextJob(queueName) {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Lock and fetch next pending job
      const query = `
        SELECT * FROM jobs
        WHERE tipo LIKE $1
          AND status = 'pending'
          AND attempts < max_attempts
          AND (proxima_tentativa IS NULL OR proxima_tentativa <= CURRENT_TIMESTAMP)
        ORDER BY criado_em ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      const result = await client.query(query, [`${queueName}:%`]);

      if (result.rows.length === 0) {
        await client.query('COMMIT');
        return null;
      }

      const job = result.rows[0];

      // Update job status to processing
      await client.query(`
        UPDATE jobs
        SET status = 'processing',
            atualizado_em = CURRENT_TIMESTAMP
        WHERE job_id = $1
      `, [job.job_id]);

      await client.query('COMMIT');

      return {
        id: job.job_id,
        name: job.tipo.split(':')[1],
        data: job.payload,
        attemptsMade: job.attempts,
        maxAttempts: job.max_attempts
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ TableQueue: Failed to get next job:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mark job as completed
   */
  async completeJob(jobId, result) {
    try {
      const query = `
        UPDATE jobs
        SET status = 'completed',
            resultado = $2,
            processado_em = CURRENT_TIMESTAMP,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE job_id = $1
      `;

      await this.db.query(query, [jobId, JSON.stringify(result)]);
      console.log(`✅ TableQueue: Job ${jobId} completed`);

    } catch (error) {
      console.error(`❌ TableQueue: Failed to mark job ${jobId} as completed:`, error);
      throw error;
    }
  }

  /**
   * Mark job as failed
   */
  async failJob(jobId, error, shouldRetry = true) {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Get current job state
      const jobResult = await client.query(
        'SELECT attempts, max_attempts FROM jobs WHERE job_id = $1',
        [jobId]
      );

      if (jobResult.rows.length === 0) {
        throw new Error(`Job ${jobId} not found`);
      }

      const { attempts, max_attempts } = jobResult.rows[0];
      const newAttempts = attempts + 1;
      const shouldFail = !shouldRetry || newAttempts >= max_attempts;

      if (shouldFail) {
        // Mark as failed
        await client.query(`
          UPDATE jobs
          SET status = 'failed',
              attempts = $2,
              erro = $3,
              atualizado_em = CURRENT_TIMESTAMP
          WHERE job_id = $1
        `, [jobId, newAttempts, error.message || String(error)]);

        console.log(`❌ TableQueue: Job ${jobId} failed after ${newAttempts} attempts`);

      } else {
        // Schedule retry with exponential backoff
        const backoffDelay = Math.min(Math.pow(2, newAttempts) * 1000, 60000); // Max 60s
        const nextRetry = new Date(Date.now() + backoffDelay);

        await client.query(`
          UPDATE jobs
          SET status = 'pending',
              attempts = $2,
              erro = $3,
              proxima_tentativa = $4,
              atualizado_em = CURRENT_TIMESTAMP
          WHERE job_id = $1
        `, [jobId, newAttempts, error.message || String(error), nextRetry]);

        console.log(`⚠️  TableQueue: Job ${jobId} will retry in ${backoffDelay}ms (attempt ${newAttempts}/${max_attempts})`);
      }

      await client.query('COMMIT');

    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ TableQueue: Failed to update failed job ${jobId}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(queueName, jobId) {
    try {
      const query = `
        SELECT * FROM jobs
        WHERE job_id = $1 AND tipo LIKE $2
      `;

      const result = await this.db.query(query, [jobId, `${queueName}:%`]);

      if (result.rows.length === 0) {
        return { exists: false };
      }

      const job = result.rows[0];

      return {
        exists: true,
        id: job.job_id,
        name: job.tipo.split(':')[1],
        data: job.payload,
        state: job.status,
        returnvalue: job.resultado,
        failedReason: job.erro,
        attemptsMade: job.attempts,
        timestamp: job.criado_em,
        processedOn: job.processado_em
      };

    } catch (error) {
      console.error(`❌ TableQueue: Failed to get job status:`, error);
      throw error;
    }
  }

  /**
   * Check if table queue is available
   */
  async isAvailable() {
    try {
      await this.db.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    try {
      await this.db.end();
      console.log('✅ TableQueue: Database connection closed');
      this.initialized = false;
    } catch (error) {
      console.error('❌ TableQueue: Error closing connection:', error);
      throw error;
    }
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName) {
    try {
      const query = `
        SELECT 
          status,
          COUNT(*) as count
        FROM jobs
        WHERE tipo LIKE $1
        GROUP BY status
      `;

      const result = await this.db.query(query, [`${queueName}:%`]);

      const metrics = {
        queueName,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0
      };

      result.rows.forEach(row => {
        switch (row.status) {
          case 'pending':
            metrics.waiting = parseInt(row.count);
            break;
          case 'processing':
            metrics.active = parseInt(row.count);
            break;
          case 'completed':
            metrics.completed = parseInt(row.count);
            break;
          case 'failed':
            metrics.failed = parseInt(row.count);
            break;
        }
        metrics.total += parseInt(row.count);
      });

      return metrics;

    } catch (error) {
      console.error(`❌ TableQueue: Failed to get queue metrics:`, error);
      throw error;
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanup(olderThanDays = 7) {
    try {
      const query = `
        DELETE FROM jobs
        WHERE status IN ('completed', 'failed')
          AND criado_em < CURRENT_TIMESTAMP - INTERVAL '${olderThanDays} days'
      `;

      const result = await this.db.query(query);
      console.log(`✅ TableQueue: Cleaned up ${result.rowCount} old jobs`);

      return result.rowCount;

    } catch (error) {
      console.error('❌ TableQueue: Failed to cleanup old jobs:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new TableQueue();
