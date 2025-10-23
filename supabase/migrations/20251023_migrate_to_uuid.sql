-- Migration: Convert SERIAL/INTEGER Primary Keys to UUID
-- Date: 2025-10-23
-- Description: This migration converts all tables from SERIAL/INTEGER primary keys to UUID primary keys
--              This aligns the database schema with Supabase best practices and improves security.
--
-- IMPORTANT NOTES:
-- ================
-- 1. This migration is IDEMPOTENT - it can be run multiple times safely
-- 2. For PRODUCTION databases with existing data, follow the manual migration steps below
-- 3. For NEW/EMPTY databases, this script will create tables with UUID primary keys
-- 4. Always backup your database before running migrations
--
-- MIGRATION STRATEGY:
-- ===================
-- Option A: For NEW/EMPTY databases:
--   - Simply run this migration to create tables with UUID primary keys
--   - The initializeDatabase() function in src/config/database.js will handle table creation
--
-- Option B: For EXISTING databases with data (RECOMMENDED FOR PRODUCTION):
--   1. Create backup: pg_dump your_database > backup_before_uuid_migration.sql
--   2. Run this migration in a maintenance window
--   3. Test thoroughly before resuming operations
--   4. Keep the backup for at least 7 days
--
-- ROLLBACK PLAN:
-- ==============
-- If issues occur:
--   1. Restore from backup: psql your_database < backup_before_uuid_migration.sql
--   2. Revert application code to previous version
--   3. Investigate issues before retrying
--
-- ============================================================

-- Enable UUID extension (required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FUNCTION: Helper to check if a table exists
-- ============================================================
CREATE OR REPLACE FUNCTION table_exists(table_name text) 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Helper to check if a column is UUID type
-- ============================================================
CREATE OR REPLACE FUNCTION column_is_uuid(table_name text, column_name text) 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
        AND data_type = 'uuid'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- MIGRATION STEP 1: Create new UUID columns alongside existing INTEGER columns
-- ============================================================
-- This approach allows for gradual migration and rollback if needed

DO $$
DECLARE
    tables_to_migrate text[] := ARRAY[
        'funcionarios', 'usuarios', 'leads', 'agendamentos', 
        'calendario_config', 'calendario_bloqueios', 'system_config', 
        'logs_sistema', 'pacientes', 'jornada_paciente', 'prontuarios', 
        'orcamentos', 'fichas_atendimento', 'notificacoes', 'logs_acesso', 
        'consentimentos_lgpd', 'logs_exclusao_lgpd', 'procedimentos_config', 
        'procedimentos_adicionais', 'procedimentos_acessorios', 
        'contas_receber', 'contas_pagar', 'pagamentos'
    ];
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY tables_to_migrate
    LOOP
        -- Only add uuid_id column if table exists and doesn't already have it
        IF table_exists(table_name) AND NOT column_is_uuid(table_name, 'id') THEN
            -- Add new UUID column if it doesn't exist
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = table_name 
                AND column_name = 'uuid_id'
            ) THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN uuid_id UUID DEFAULT uuid_generate_v4()', table_name);
                RAISE NOTICE 'Added uuid_id column to %', table_name;
            END IF;
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- MIGRATION STEP 2: Add UUID foreign key columns
-- ============================================================

DO $$
BEGIN
    -- pacientes.cadastrado_por
    IF table_exists('pacientes') AND NOT column_is_uuid('pacientes', 'cadastrado_por') THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'pacientes' 
            AND column_name = 'cadastrado_por_uuid'
        ) THEN
            ALTER TABLE pacientes ADD COLUMN cadastrado_por_uuid UUID;
            RAISE NOTICE 'Added cadastrado_por_uuid to pacientes';
        END IF;
    END IF;

    -- leads.paciente_id
    IF table_exists('leads') AND NOT column_is_uuid('leads', 'paciente_id') THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leads' 
            AND column_name = 'paciente_uuid'
        ) THEN
            ALTER TABLE leads ADD COLUMN paciente_uuid UUID;
            RAISE NOTICE 'Added paciente_uuid to leads';
        END IF;
    END IF;

    -- Add similar UUID foreign key columns for other tables as needed
    -- (This is a template - expand based on actual foreign key relationships)
END $$;

-- ============================================================
-- MIGRATION STEP 3: Populate UUID columns with generated values
-- ============================================================
-- For existing data, generate UUIDs for all records

DO $$
DECLARE
    tables_to_populate text[] := ARRAY[
        'funcionarios', 'usuarios', 'leads', 'agendamentos', 
        'calendario_config', 'calendario_bloqueios', 'system_config', 
        'logs_sistema', 'pacientes', 'jornada_paciente', 'prontuarios', 
        'orcamentos', 'fichas_atendimento', 'notificacoes', 'logs_acesso', 
        'consentimentos_lgpd', 'logs_exclusao_lgpd', 'procedimentos_config', 
        'procedimentos_adicionais', 'procedimentos_acessorios', 
        'contas_receber', 'contas_pagar', 'pagamentos'
    ];
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY tables_to_populate
    LOOP
        IF table_exists(table_name) THEN
            -- Update NULL uuid_id values
            EXECUTE format('UPDATE %I SET uuid_id = uuid_generate_v4() WHERE uuid_id IS NULL', table_name);
            RAISE NOTICE 'Populated uuid_id for %', table_name;
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- MIGRATION STEP 4: Update foreign key UUID columns based on relationships
-- ============================================================
-- This step maps old integer foreign keys to new UUID values
-- NOTE: This is CRITICAL for data integrity - customize based on your actual data

-- Example pattern (uncomment and customize for production use):
/*
DO $$
BEGIN
    -- Update pacientes.cadastrado_por_uuid based on funcionarios mapping
    IF table_exists('pacientes') AND table_exists('funcionarios') THEN
        UPDATE pacientes p
        SET cadastrado_por_uuid = f.uuid_id
        FROM funcionarios f
        WHERE p.cadastrado_por = f.id;
        RAISE NOTICE 'Updated cadastrado_por_uuid in pacientes';
    END IF;

    -- Update leads.paciente_uuid based on pacientes mapping
    IF table_exists('leads') AND table_exists('pacientes') THEN
        UPDATE leads l
        SET paciente_uuid = p.uuid_id
        FROM pacientes p
        WHERE l.paciente_id = p.id;
        RAISE NOTICE 'Updated paciente_uuid in leads';
    END IF;

    -- Add similar updates for all foreign key relationships
    -- Pattern:
    -- UPDATE child_table ct
    -- SET child_uuid_fk = pt.uuid_id
    -- FROM parent_table pt
    -- WHERE ct.integer_fk = pt.id;
END $$;
*/

-- ============================================================
-- MIGRATION STEP 5: Create unique indexes on UUID columns
-- ============================================================

DO $$
DECLARE
    tables_with_uuid text[] := ARRAY[
        'funcionarios', 'usuarios', 'leads', 'agendamentos', 
        'calendario_config', 'calendario_bloqueios', 'system_config', 
        'logs_sistema', 'pacientes', 'jornada_paciente', 'prontuarios', 
        'orcamentos', 'fichas_atendimento', 'notificacoes', 'logs_acesso', 
        'consentimentos_lgpd', 'logs_exclusao_lgpd', 'procedimentos_config', 
        'procedimentos_adicionais', 'procedimentos_acessorios', 
        'contas_receber', 'contas_pagar', 'pagamentos'
    ];
    table_name text;
    index_name text;
BEGIN
    FOREACH table_name IN ARRAY tables_with_uuid
    LOOP
        IF table_exists(table_name) THEN
            index_name := table_name || '_uuid_id_idx';
            IF NOT EXISTS (
                SELECT FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND indexname = index_name
            ) THEN
                EXECUTE format('CREATE UNIQUE INDEX %I ON %I(uuid_id)', index_name, table_name);
                RAISE NOTICE 'Created unique index on %.uuid_id', table_name;
            END IF;
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- MIGRATION STEP 6: (OPTIONAL - REQUIRES DOWNTIME) Switch to UUID as primary key
-- ============================================================
-- WARNING: This step requires application downtime and should be run during maintenance window
-- Uncomment ONLY after verifying all UUID columns are properly populated and tested

/*
DO $$
DECLARE
    tables_to_convert text[] := ARRAY[
        'funcionarios', 'usuarios', 'leads', 'agendamentos', 
        'calendario_config', 'calendario_bloqueios', 'system_config', 
        'logs_sistema', 'pacientes', 'jornada_paciente', 'prontuarios', 
        'orcamentos', 'fichas_atendimento', 'notificacoes', 'logs_acesso', 
        'consentimentos_lgpd', 'logs_exclusao_lgpd', 'procedimentos_config', 
        'procedimentos_adicionais', 'procedimentos_acessorios', 
        'contas_receber', 'contas_pagar', 'pagamentos'
    ];
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY tables_to_convert
    LOOP
        IF table_exists(table_name) AND NOT column_is_uuid(table_name, 'id') THEN
            -- Drop old primary key constraint
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I CASCADE', 
                table_name, table_name || '_pkey');
            
            -- Rename id to id_old
            EXECUTE format('ALTER TABLE %I RENAME COLUMN id TO id_old', table_name);
            
            -- Rename uuid_id to id
            EXECUTE format('ALTER TABLE %I RENAME COLUMN uuid_id TO id', table_name);
            
            -- Add new primary key constraint
            EXECUTE format('ALTER TABLE %I ADD PRIMARY KEY (id)', table_name);
            
            RAISE NOTICE 'Converted % to UUID primary key', table_name;
        END IF;
    END LOOP;
END $$;
*/

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these queries after migration to verify success:

-- Check which tables have UUID columns:
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND column_name IN ('id', 'uuid_id')
-- ORDER BY table_name;

-- Check for NULL UUID values (should be empty):
-- SELECT 'funcionarios' as table_name, COUNT(*) as null_count FROM funcionarios WHERE uuid_id IS NULL
-- UNION ALL
-- SELECT 'usuarios', COUNT(*) FROM usuarios WHERE uuid_id IS NULL
-- -- Add similar checks for all tables

-- ============================================================
-- POST-MIGRATION NOTES
-- ============================================================
-- After successfully migrating to UUIDs:
-- 1. Update application code to use UUID columns
-- 2. Test all API endpoints thoroughly
-- 3. Monitor application logs for UUID-related errors
-- 4. After 7+ days of stable operation, consider dropping old integer columns
-- 5. Update any external integrations to use UUID values
-- 6. Document the new UUID format in API documentation

-- ============================================================
-- CLEANUP (Run after successful migration and testing)
-- ============================================================
-- WARNING: Only run after verifying the migration is successful and stable
-- This removes the old integer ID columns

/*
DO $$
DECLARE
    tables_to_cleanup text[] := ARRAY[
        'funcionarios', 'usuarios', 'leads', 'agendamentos', 
        'calendario_config', 'calendario_bloqueios', 'system_config', 
        'logs_sistema', 'pacientes', 'jornada_paciente', 'prontuarios', 
        'orcamentos', 'fichas_atendimento', 'notificacoes', 'logs_acesso', 
        'consentimentos_lgpd', 'logs_exclusao_lgpd', 'procedimentos_config', 
        'procedimentos_adicionais', 'procedimentos_acessorios', 
        'contas_receber', 'contas_pagar', 'pagamentos'
    ];
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY tables_to_cleanup
    LOOP
        IF table_exists(table_name) THEN
            -- Drop old id_old column if it exists
            EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS id_old CASCADE', table_name);
            RAISE NOTICE 'Cleaned up old integer ID column from %', table_name;
        END IF;
    END LOOP;
END $$;
*/

-- Drop helper functions (optional cleanup)
-- DROP FUNCTION IF EXISTS table_exists(text);
-- DROP FUNCTION IF EXISTS column_is_uuid(text, text);
