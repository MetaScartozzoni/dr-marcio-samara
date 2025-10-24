// tests/uuid-utils.test.js
// Unit tests for UUID utility functions (no database required)

const { 
    uuidParam, 
    whereUuid, 
    isValidUuid, 
    processUuidQuery 
} = require('../src/utils/db');

describe('UUID Utility Functions', () => {
    describe('isValidUuid', () => {
        test('returns true for valid UUIDs', () => {
            // Note: UUIDs must have valid version (1-5) and variant (8, 9, a, b) fields
            const validUuids = [
                '550e8400-e29b-41d4-a716-446655440000',  // Version 4
                'a3bb189e-8bf9-3888-9912-ace4e6543002',  // Version 3
                '123e4567-e89b-12d3-a456-426614174000',  // Version 1
                '6ba7b810-9dad-11d1-80b4-00c04fd430c8',  // Version 1
                '6ba7b811-9dad-11d1-80b4-00c04fd430c8'   // Version 1
            ];

            validUuids.forEach(uuid => {
                expect(isValidUuid(uuid)).toBe(true);
            });
        });

        test('returns false for invalid UUIDs', () => {
            const invalidInputs = [
                '123',
                'not-a-uuid',
                '550e8400-e29b-41d4-a716', // Too short
                '550e8400e29b41d4a716446655440000', // Missing dashes
                '550e8400-e29b-41d4-a716-446655440000-extra', // Too long
                'gggggggg-gggg-gggg-gggg-gggggggggggg', // Invalid chars
                '00000000-0000-0000-0000-000000000000', // Invalid version/variant
                'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', // Invalid version/variant
                '123e4567-e89b-62d3-a456-426614174000', // Invalid version (6)
                '123e4567-e89b-42d3-c456-426614174000', // Invalid variant (c)
                null,
                undefined,
                123,
                {},
                [],
                '',
                '   ',
                true,
                false
            ];

            invalidInputs.forEach(input => {
                expect(isValidUuid(input)).toBe(false);
            });
        });

        test('is case-insensitive', () => {
            const uuid1 = '550e8400-e29b-41d4-a716-446655440000';
            const uuid2 = '550E8400-E29B-41D4-A716-446655440000';
            const uuid3 = '550e8400-E29B-41d4-A716-446655440000';

            expect(isValidUuid(uuid1)).toBe(true);
            expect(isValidUuid(uuid2)).toBe(true);
            expect(isValidUuid(uuid3)).toBe(true);
        });
    });

    describe('uuidParam', () => {
        test('generates correct UUID parameter cast', () => {
            expect(uuidParam(1)).toBe('$1::uuid');
            expect(uuidParam(2)).toBe('$2::uuid');
            expect(uuidParam(10)).toBe('$10::uuid');
            expect(uuidParam(99)).toBe('$99::uuid');
        });

        test('handles various parameter indices', () => {
            for (let i = 1; i <= 20; i++) {
                expect(uuidParam(i)).toBe(`$${i}::uuid`);
            }
        });
    });

    describe('whereUuid', () => {
        test('generates WHERE clause with default column name', () => {
            expect(whereUuid()).toBe('WHERE id = $1::uuid');
        });

        test('generates WHERE clause with custom column name', () => {
            expect(whereUuid('user_id')).toBe('WHERE user_id = $1::uuid');
            expect(whereUuid('paciente_id')).toBe('WHERE paciente_id = $1::uuid');
            expect(whereUuid('organization_id')).toBe('WHERE organization_id = $1::uuid');
        });

        test('generates WHERE clause with custom parameter index', () => {
            expect(whereUuid('id', 2)).toBe('WHERE id = $2::uuid');
            expect(whereUuid('user_id', 5)).toBe('WHERE user_id = $5::uuid');
            expect(whereUuid('paciente_id', 10)).toBe('WHERE paciente_id = $10::uuid');
        });

        test('handles both custom column name and parameter index', () => {
            expect(whereUuid('user_id', 3)).toBe('WHERE user_id = $3::uuid');
            expect(whereUuid('organization_id', 7)).toBe('WHERE organization_id = $7::uuid');
        });
    });

    describe('processUuidQuery', () => {
        test('replaces UUID placeholders in queries', () => {
            const query1 = 'SELECT * FROM users WHERE id = {uuid:1}';
            expect(processUuidQuery(query1)).toBe('SELECT * FROM users WHERE id = $1::uuid');

            const query2 = 'SELECT * FROM users WHERE id = {uuid:1} AND org_id = {uuid:2}';
            expect(processUuidQuery(query2)).toBe(
                'SELECT * FROM users WHERE id = $1::uuid AND org_id = $2::uuid'
            );
        });

        test('handles multiple placeholders', () => {
            const query = `
                SELECT * FROM relations 
                WHERE user_id = {uuid:1} 
                AND patient_id = {uuid:2} 
                AND organization_id = {uuid:3}
            `;
            const expected = `
                SELECT * FROM relations 
                WHERE user_id = $1::uuid 
                AND patient_id = $2::uuid 
                AND organization_id = $3::uuid
            `;
            expect(processUuidQuery(query)).toBe(expected);
        });

        test('handles queries with no UUID placeholders', () => {
            const query = 'SELECT * FROM users WHERE name = $1';
            expect(processUuidQuery(query)).toBe(query);
        });

        test('handles empty queries', () => {
            expect(processUuidQuery('')).toBe('');
            expect(processUuidQuery('   ')).toBe('   ');
        });

        test('handles high parameter indices', () => {
            const query = 'SELECT * WHERE id = {uuid:15} AND ref = {uuid:20}';
            expect(processUuidQuery(query)).toBe(
                'SELECT * WHERE id = $15::uuid AND ref = $20::uuid'
            );
        });
    });

    describe('UUID format edge cases', () => {
        test('validates version 4 UUIDs (most common)', () => {
            // Version 4 UUIDs have '4' in the third group
            const v4Uuid = '123e4567-e89b-42d3-a456-426614174000';
            expect(isValidUuid(v4Uuid)).toBe(true);
        });

        test('validates other UUID versions', () => {
            const v1Uuid = '123e4567-e89b-11d3-a456-426614174000'; // Version 1
            const v3Uuid = '123e4567-e89b-31d3-a456-426614174000'; // Version 3
            const v5Uuid = '123e4567-e89b-51d3-a456-426614174000'; // Version 5

            expect(isValidUuid(v1Uuid)).toBe(true);
            expect(isValidUuid(v3Uuid)).toBe(true);
            expect(isValidUuid(v5Uuid)).toBe(true);
        });

        test('validates UUID variant bits', () => {
            // Variant bits should be 8, 9, a, or b
            const validVariants = [
                '123e4567-e89b-42d3-8456-426614174000', // Variant 8
                '123e4567-e89b-42d3-9456-426614174000', // Variant 9
                '123e4567-e89b-42d3-a456-426614174000', // Variant a
                '123e4567-e89b-42d3-b456-426614174000'  // Variant b
            ];

            validVariants.forEach(uuid => {
                expect(isValidUuid(uuid)).toBe(true);
            });
        });

        test('rejects UUIDs with invalid structure', () => {
            const invalidStructures = [
                '123e4567e89b-42d3-a456-426614174000', // Wrong dash position
                '123e4567-e89b42d3-a456-426614174000', // Missing dash
                '123e4567-e89b-42d3a456-426614174000', // Missing dash
                '123e4567-e89b-42d3-a456426614174000', // Missing dash
                '123e4567-e89b-42d3-a456-42661417400', // Too short
                '123e4567-e89b-42d3-a456-4266141740000' // Too long
            ];

            invalidStructures.forEach(uuid => {
                expect(isValidUuid(uuid)).toBe(false);
            });
        });
    });

    describe('Real-world query examples', () => {
        test('builds patient lookup query', () => {
            const query = `SELECT * FROM pacientes ${whereUuid()}`;
            expect(query).toBe('SELECT * FROM pacientes WHERE id = $1::uuid');
        });

        test('builds complex join query', () => {
            const query = `
                SELECT p.*, o.* 
                FROM pacientes p
                JOIN orcamentos o ON p.id = o.paciente_id
                WHERE p.id = ${uuidParam(1)} 
                AND o.status = $2
            `;
            expect(query).toContain('WHERE p.id = $1::uuid');
        });

        test('builds update query with UUID', () => {
            const query = `
                UPDATE fichas_atendimento 
                SET status = $1, atualizado_por = ${uuidParam(2)}
                WHERE id = ${uuidParam(3)}
            `;
            expect(query).toContain('atualizado_por = $2::uuid');
            expect(query).toContain('WHERE id = $3::uuid');
        });
    });
});

describe('UUID Migration Compatibility', () => {
    test('UUID format is consistent with PostgreSQL uuid_generate_v4()', () => {
        // uuid_generate_v4() generates UUIDs in standard RFC 4122 format
        const postgresGeneratedUuid = '550e8400-e29b-41d4-a716-446655440000';
        expect(isValidUuid(postgresGeneratedUuid)).toBe(true);
    });

    test('handles UUIDs from different sources', () => {
        // Node.js uuid package format
        const nodeUuid = require('uuid');
        const generatedUuid = nodeUuid.v4();
        expect(isValidUuid(generatedUuid)).toBe(true);
    });

    test('utility functions work together', () => {
        const paramIndex = 1;
        const param = uuidParam(paramIndex);
        const where = whereUuid('user_id', paramIndex);
        
        expect(param).toBe('$1::uuid');
        expect(where).toContain(param);
    });
});
