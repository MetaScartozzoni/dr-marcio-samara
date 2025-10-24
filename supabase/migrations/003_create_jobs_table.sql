-- =====================================================
-- MIGRATION: Create Jobs Table for Queue Fallback
-- Date: 2025-10-23
-- Description: Table-based job queue for environments without Redis
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    resultado JSONB,
    erro TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processado_em TIMESTAMP WITH TIME ZONE,
    proxima_tentativa TIMESTAMP WITH TIME ZONE,
    CONSTRAINT jobs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_criado_em ON jobs(criado_em);
CREATE INDEX IF NOT EXISTS idx_jobs_tipo ON jobs(tipo);
CREATE INDEX IF NOT EXISTS idx_jobs_status_criado ON jobs(status, criado_em);
CREATE INDEX IF NOT EXISTS idx_jobs_proxima_tentativa ON jobs(proxima_tentativa) WHERE status = 'pending';

-- Create function to update atualizado_em timestamp
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for atualizado_em
DROP TRIGGER IF EXISTS trigger_update_jobs_timestamp ON jobs;
CREATE TRIGGER trigger_update_jobs_timestamp
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_jobs_updated_at();

-- Add pdf_url column to orcamentos table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orcamentos' AND column_name = 'pdf_url'
    ) THEN
        ALTER TABLE orcamentos ADD COLUMN pdf_url TEXT;
    END IF;
END $$;

-- Add notification_sent column to orcamentos table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orcamentos' AND column_name = 'notification_sent'
    ) THEN
        ALTER TABLE orcamentos ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add notification_sent_at column to orcamentos table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orcamentos' AND column_name = 'notification_sent_at'
    ) THEN
        ALTER TABLE orcamentos ADD COLUMN notification_sent_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create comment on table
COMMENT ON TABLE jobs IS 'Table-based job queue for async task processing as a fallback when Redis is not available';
COMMENT ON COLUMN jobs.tipo IS 'Type of job: generate_pdf, send_notification, etc.';
COMMENT ON COLUMN jobs.payload IS 'Job data in JSON format';
COMMENT ON COLUMN jobs.status IS 'Job status: pending, processing, completed, failed, cancelled';
COMMENT ON COLUMN jobs.attempts IS 'Number of processing attempts';
COMMENT ON COLUMN jobs.max_attempts IS 'Maximum number of retry attempts';
COMMENT ON COLUMN jobs.resultado IS 'Job result data in JSON format';
COMMENT ON COLUMN jobs.erro IS 'Error message if job failed';
COMMENT ON COLUMN jobs.proxima_tentativa IS 'Timestamp for next retry attempt';
