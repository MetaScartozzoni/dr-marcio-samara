-- Migration: add token columns for orcamentos (idempotent)
-- Run on Postgres with uuid-ossp extension available.
-- Adds optional token support (hash only) to allow card-token workflow.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add columns if not exists
ALTER TABLE IF EXISTS orcamentos
    ADD COLUMN IF NOT EXISTS token_hash TEXT,
    ADD COLUMN IF NOT EXISTS token_salt TEXT,
    ADD COLUMN IF NOT EXISTS token_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS token_created_by UUID,
    ADD COLUMN IF NOT EXISTS token_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add foreign key if usuarios table exists and column not already referencing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu USING (constraint_name, table_schema)
        WHERE tc.table_name = 'orcamentos' AND kcu.column_name = 'token_created_by'
    ) THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
            ALTER TABLE orcamentos
            ADD CONSTRAINT fk_orcamentos_token_created_by
            FOREIGN KEY (token_created_by) REFERENCES usuarios(id) ON DELETE SET NULL;
        END IF;
    END IF;
END$$;

-- Indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_orcamentos_token_enabled ON orcamentos(token_enabled);
CREATE INDEX IF NOT EXISTS idx_orcamentos_token_expires_at ON orcamentos(token_expires_at);

-- Rollback note:
-- To rollback, manually drop the added columns and constraints after validating no logic depends on them:
-- ALTER TABLE orcamentos DROP COLUMN IF EXISTS token_hash, token_salt, token_enabled, token_expires_at, token_created_by, token_created_at;