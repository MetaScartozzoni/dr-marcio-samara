// tests/db-uuid-setup.test.js
// Tests for UUID primary key setup in database tables

const { Pool } = require('pg');
const { isValidUuid } = require('../src/utils/db');

// Test database configuration
// In CI, use environment variables; locally use test database
const testDbConfig = {
    connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    ssl: process.env.TEST_DATABASE_URL ? { rejectUnauthorized: false } : undefined
};

describe('UUID Database Setup', () => {
    let pool;
    let client;

    beforeAll(async () => {
        // Skip tests if no database is configured
        if (!testDbConfig.connectionString) {
            console.warn('No TEST_DATABASE_URL or DATABASE_URL found, skipping database tests');
            return;
        }

        pool = new Pool(testDbConfig);
        client = await pool.connect();
    });

    afterAll(async () => {
        if (client) {
            client.release();
        }
        if (pool) {
            await pool.end();
        }
    });

    test('uuid-ossp extension is enabled', async () => {
        if (!client) {
            console.warn('Skipping test: no database connection');
            return;
        }

        const result = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
            ) as extension_exists
        `);

        expect(result.rows[0].extension_exists).toBe(true);
    });

    test('uuid_generate_v4() function is available', async () => {
        if (!client) {
            console.warn('Skipping test: no database connection');
            return;
        }

        const result = await client.query('SELECT uuid_generate_v4() as test_uuid');
        const testUuid = result.rows[0].test_uuid;

        expect(testUuid).toBeDefined();
        expect(isValidUuid(testUuid)).toBe(true);
    });

    describe('Table Primary Key Types', () => {
        const tablesToCheck = [
            'funcionarios',
            'usuarios',
            'pacientes',
            'prontuarios',
            'orcamentos',
            'fichas_atendimento',
            'agendamentos',
            'jornada_paciente',
            'leads',
            'notificacoes',
            'logs_sistema',
            'system_config',
            'calendario_config',
            'calendario_bloqueios',
            'procedimentos_config',
            'procedimentos_adicionais',
            'procedimentos_acessorios',
            'contas_receber',
            'contas_pagar',
            'pagamentos',
            'logs_acesso',
            'consentimentos_lgpd',
            'logs_exclusao_lgpd'
        ];

        tablesToCheck.forEach(tableName => {
            test(`${tableName} table has UUID primary key`, async () => {
                if (!client) {
                    console.warn('Skipping test: no database connection');
                    return;
                }

                // Check if table exists first
                const tableExists = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    ) as exists
                `, [tableName]);

                if (!tableExists.rows[0].exists) {
                    console.warn(`Table ${tableName} does not exist, skipping test`);
                    return;
                }

                // Check primary key column type
                const result = await client.query(`
                    SELECT 
                        c.column_name,
                        c.data_type,
                        c.column_default
                    FROM information_schema.columns c
                    JOIN information_schema.table_constraints tc 
                        ON tc.table_name = c.table_name
                    JOIN information_schema.key_column_usage kcu 
                        ON kcu.constraint_name = tc.constraint_name 
                        AND kcu.column_name = c.column_name
                    WHERE c.table_schema = 'public'
                        AND c.table_name = $1
                        AND tc.constraint_type = 'PRIMARY KEY'
                `, [tableName]);

                expect(result.rows.length).toBeGreaterThan(0);
                
                const pkColumn = result.rows[0];
                expect(pkColumn.column_name).toBe('id');
                expect(pkColumn.data_type).toBe('uuid');
                expect(pkColumn.column_default).toContain('uuid_generate_v4()');
            });
        });
    });

    describe('Foreign Key Types', () => {
        test('pacientes.cadastrado_por references funcionarios with UUID', async () => {
            if (!client) {
                console.warn('Skipping test: no database connection');
                return;
            }

            const tableExists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'pacientes'
                ) as exists
            `);

            if (!tableExists.rows[0].exists) {
                console.warn('Table pacientes does not exist, skipping test');
                return;
            }

            const result = await client.query(`
                SELECT data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                    AND table_name = 'pacientes' 
                    AND column_name = 'cadastrado_por'
            `);

            if (result.rows.length > 0) {
                expect(result.rows[0].data_type).toBe('uuid');
            }
        });

        test('orcamentos.paciente_id references pacientes with UUID', async () => {
            if (!client) {
                console.warn('Skipping test: no database connection');
                return;
            }

            const tableExists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'orcamentos'
                ) as exists
            `);

            if (!tableExists.rows[0].exists) {
                console.warn('Table orcamentos does not exist, skipping test');
                return;
            }

            const result = await client.query(`
                SELECT data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                    AND table_name = 'orcamentos' 
                    AND column_name = 'paciente_id'
            `);

            expect(result.rows.length).toBeGreaterThan(0);
            expect(result.rows[0].data_type).toBe('uuid');
        });

        test('fichas_atendimento foreign keys are UUID type', async () => {
            if (!client) {
                console.warn('Skipping test: no database connection');
                return;
            }

            const tableExists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'fichas_atendimento'
                ) as exists
            `);

            if (!tableExists.rows[0].exists) {
                console.warn('Table fichas_atendimento does not exist, skipping test');
                return;
            }

            const foreignKeys = ['paciente_id', 'prontuario_id', 'agendamento_id', 'orcamento_id', 'criado_por', 'atualizado_por'];

            for (const fkColumn of foreignKeys) {
                const result = await client.query(`
                    SELECT data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                        AND table_name = 'fichas_atendimento' 
                        AND column_name = $1
                `, [fkColumn]);

                if (result.rows.length > 0) {
                    expect(result.rows[0].data_type).toBe('uuid');
                }
            }
        });
    });

    describe('UUID Utility Functions', () => {
        test('isValidUuid identifies valid UUIDs', () => {
            const validUuids = [
                '550e8400-e29b-41d4-a716-446655440000',
                'a3bb189e-8bf9-3888-9912-ace4e6543002',
                '123e4567-e89b-12d3-a456-426614174000'
            ];

            validUuids.forEach(uuid => {
                expect(isValidUuid(uuid)).toBe(true);
            });
        });

        test('isValidUuid rejects invalid UUIDs', () => {
            const invalidInputs = [
                '123',
                'not-a-uuid',
                '550e8400-e29b-41d4-a716',
                '550e8400e29b41d4a716446655440000', // Missing dashes
                null,
                undefined,
                123,
                {}
            ];

            invalidInputs.forEach(input => {
                expect(isValidUuid(input)).toBe(false);
            });
        });
    });

    describe('UUID Column Defaults', () => {
        test('inserting without ID generates UUID automatically', async () => {
            if (!client) {
                console.warn('Skipping test: no database connection');
                return;
            }

            // Check if funcionarios table exists
            const tableExists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'funcionarios'
                ) as exists
            `);

            if (!tableExists.rows[0].exists) {
                console.warn('Table funcionarios does not exist, skipping test');
                return;
            }

            // Begin transaction for test
            await client.query('BEGIN');

            try {
                // Insert without specifying ID
                const result = await client.query(`
                    INSERT INTO funcionarios (nome, email, senha, tipo)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                `, ['Test User', `test-${Date.now()}@example.com`, 'hashed_password', 'staff']);

                const generatedId = result.rows[0].id;

                expect(generatedId).toBeDefined();
                expect(isValidUuid(generatedId)).toBe(true);

                // Rollback transaction
                await client.query('ROLLBACK');
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        });
    });

    describe('Query with UUID Parameters', () => {
        test('can query records using UUID parameter', async () => {
            if (!client) {
                console.warn('Skipping test: no database connection');
                return;
            }

            // Check if funcionarios table exists
            const tableExists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'funcionarios'
                ) as exists
            `);

            if (!tableExists.rows[0].exists) {
                console.warn('Table funcionarios does not exist, skipping test');
                return;
            }

            await client.query('BEGIN');

            try {
                // Insert a test record
                const insertResult = await client.query(`
                    INSERT INTO funcionarios (nome, email, senha, tipo)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                `, ['Test User 2', `test2-${Date.now()}@example.com`, 'hashed_password', 'staff']);

                const testId = insertResult.rows[0].id;

                // Query using UUID with explicit cast
                const selectResult = await client.query(
                    'SELECT * FROM funcionarios WHERE id = $1::uuid',
                    [testId]
                );

                expect(selectResult.rows.length).toBe(1);
                expect(selectResult.rows[0].id).toBe(testId);
                expect(selectResult.rows[0].nome).toBe('Test User 2');

                await client.query('ROLLBACK');
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        });
    });
});
