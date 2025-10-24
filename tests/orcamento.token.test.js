// tests/orcamento.token.test.js
const TokenService = require('../src/services/token.service');

describe('TokenService lifecycle', () => {
  let dbMock;
  let service;

  beforeEach(() => {
    dbMock = { query: jest.fn() };
    process.env.SAMARA_TOKEN_SECRET = 'test-secret';
    service = new TokenService(dbMock);
  });

  test('generateTokenForOrcamento returns raw token and calls DB', async () => {
    dbMock.query.mockResolvedValueOnce({ rows: [{ id: 'uuid-1', token_enabled: true, token_expires_at: null }] });
    const res = await service.generateTokenForOrcamento('uuid-1', { expiresInMinutes: null, createdBy: 'user-1' });
    expect(res.rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(dbMock.query).toHaveBeenCalled();
  });

  test('validateOrcamentoToken returns true for valid token', async () => {
    const rawToken = 'b'.repeat(64);
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.SAMARA_TOKEN_SECRET).update(rawToken).digest('hex');
    dbMock.query.mockResolvedValueOnce({ rows: [{ token_hash: hmac, token_enabled: true, token_expires_at: null }] });
    const ok = await service.validateOrcamentoToken('uuid-1', rawToken);
    expect(ok).toBe(true);
  });

  test('revokeOrcamentoToken disables token', async () => {
    dbMock.query.mockResolvedValueOnce({ rows: [{ id: 'uuid-1' }] });
    const ok = await service.revokeOrcamentoToken('uuid-1');
    expect(ok).toBe(true);
  });

});