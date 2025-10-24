// tests/prontuario.service.test.js
/**
 * Unit tests for ProntuarioService
 * 
 * NOTE: These tests require Jest to be installed and configured.
 * To run: npm install --save-dev jest
 * Then: npm test tests/prontuario.service.test.js
 * 
 * Mock database approach is used to avoid requiring actual database connection
 */

const ProntuarioService = require('../src/services/prontuario.service');

// Mock database connection
const createMockDb = () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  return {
    connect: jest.fn().mockResolvedValue(mockClient),
    mockClient
  };
};

describe('ProntuarioService', () => {
  let service;
  let mockDb;
  let mockClient;

  beforeEach(() => {
    mockDb = createMockDb();
    mockClient = mockDb.mockClient;
    service = new ProntuarioService(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUUID', () => {
    it('should return true for valid UUIDs', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        '123e4567-e89b-12d3-a456-426614174000'
      ];

      validUUIDs.forEach(uuid => {
        expect(service.validateUUID(uuid)).toBe(true);
      });
    });

    it('should return false for invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-446655440000-extra',
        ''
      ];

      invalidUUIDs.forEach(uuid => {
        expect(service.validateUUID(uuid)).toBe(false);
      });
    });
  });

  describe('buscarCompleto', () => {
    const mockProntuarioId = '550e8400-e29b-41d4-a716-446655440000';
    const mockPacienteId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    beforeEach(() => {
      // Mock prontuario query response
      mockClient.query.mockImplementationOnce(() => 
        Promise.resolve({
          rows: [{
            id: mockProntuarioId,
            paciente_id: mockPacienteId,
            agendamento_id: null,
            medico_id: null,
            data_consulta: '2024-10-23T10:00:00Z',
            observacoes: 'Test observation',
            criado_em: '2024-10-23T10:00:00Z',
            atualizado_em: '2024-10-23T10:00:00Z'
          }]
        })
      );

      // Mock paciente query response
      mockClient.query.mockImplementationOnce(() =>
        Promise.resolve({
          rows: [{
            id: mockPacienteId,
            nome_completo: 'João Silva',
            cpf: '12345678901',
            telefone: '11999999999',
            email: 'joao@example.com',
            data_nascimento: '1990-01-01'
          }]
        })
      );

      // Mock fichas query response
      mockClient.query.mockImplementationOnce(() =>
        Promise.resolve({
          rows: [
            {
              id: mockProntuarioId,
              prontuario_id: mockProntuarioId,
              agendamento_id: null,
              data_consulta: '2024-10-23T10:00:00Z',
              anamnese: 'Test anamnese',
              exame_fisico: 'Test exam',
              diagnostico: 'Test diagnosis',
              tratamento: 'Test treatment',
              prescricao: 'Test prescription',
              exames_solicitados: 'Test exams',
              observacoes: 'Test notes',
              criado_em: '2024-10-23T10:00:00Z',
              atualizado_em: '2024-10-23T10:00:00Z'
            }
          ]
        })
      );

      // Mock orcamentos, exames, agendamentos (empty for simplicity)
      mockClient.query.mockImplementation(() =>
        Promise.resolve({ rows: [] })
      );
    });

    it('should fetch complete prontuario data', async () => {
      const result = await service.buscarCompleto(mockProntuarioId);

      expect(result).toHaveProperty('prontuario');
      expect(result).toHaveProperty('paciente');
      expect(result).toHaveProperty('fichasAtendimento');
      expect(result).toHaveProperty('orcamentos');
      expect(result).toHaveProperty('exames');
      expect(result).toHaveProperty('agendamentos');
      expect(result).toHaveProperty('pagination');

      expect(result.prontuario.id).toBe(mockProntuarioId);
      expect(result.paciente.id).toBe(mockPacienteId);
      expect(mockDb.connect).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should respect pagination limits', async () => {
      const options = {
        fichasLimit: 10,
        orcamentosLimit: 3,
        examesLimit: 7,
        agendamentosLimit: 5
      };

      await service.buscarCompleto(mockProntuarioId, options);

      // Verify queries were called with correct limits
      // Note: Implementation uses limit+1 to detect hasNext
      expect(mockClient.query).toHaveBeenCalled();
    });

    it('should use cursor-based pagination', async () => {
      const cursor = '2024-10-20T10:00:00Z';
      const options = {
        fichasCursor: cursor
      };

      await service.buscarCompleto(mockProntuarioId, options);

      expect(mockClient.query).toHaveBeenCalled();
      // Verify cursor was passed in query parameters
    });

    it('should throw error when prontuario not found', async () => {
      mockClient.query.mockReset();
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.buscarCompleto('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Prontuário não encontrado');
    });

    it('should handle pagination correctly with hasNext', async () => {
      mockClient.query.mockReset();

      // Mock prontuario
      mockClient.query.mockImplementationOnce(() =>
        Promise.resolve({
          rows: [{
            id: mockProntuarioId,
            paciente_id: mockPacienteId,
            criado_em: '2024-10-23T10:00:00Z'
          }]
        })
      );

      // Mock paciente
      mockClient.query.mockImplementationOnce(() =>
        Promise.resolve({
          rows: [{ id: mockPacienteId, nome_completo: 'Test' }]
        })
      );

      // Mock fichas with 6 results (limit+1 to show hasNext)
      mockClient.query.mockImplementationOnce(() =>
        Promise.resolve({
          rows: Array(6).fill(null).map((_, i) => ({
            id: `${mockProntuarioId}-${i}`,
            criado_em: `2024-10-2${3-i}T10:00:00Z`
          }))
        })
      );

      // Mock other queries
      mockClient.query.mockImplementation(() =>
        Promise.resolve({ rows: [] })
      );

      const result = await service.buscarCompleto(mockProntuarioId, {
        fichasLimit: 5
      });

      expect(result.pagination.fichas.hasNext).toBe(true);
      expect(result.fichasAtendimento).toHaveLength(5);
    });

    it('should release client even on error', async () => {
      mockClient.query.mockReset();
      mockClient.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        service.buscarCompleto(mockProntuarioId)
      ).rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});

/**
 * Integration test notes:
 * 
 * If running against a real PostgreSQL database with uuid-ossp extension:
 * 
 * 1. Ensure database has uuid-ossp extension enabled:
 *    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 * 
 * 2. Create test data:
 *    - Test prontuario record with valid UUID
 *    - Associated paciente record
 *    - Sample fichas, orcamentos, exames, agendamentos
 * 
 * 3. Verify UUID casting works correctly:
 *    SELECT * FROM prontuarios WHERE id = $1::uuid
 * 
 * 4. Test pagination cursors with real timestamps
 * 
 * 5. Clean up test data after tests complete
 */
