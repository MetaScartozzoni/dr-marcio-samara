// src/services/token.service.js
// Responsible for token lifecycle for orcamentos (generate/validate/revoke).
// Uses HMAC-SHA256 with secret process.env.SAMARA_TOKEN_SECRET (must be set in GitHub Secrets).
const crypto = require('crypto');

class TokenService {
  /**
   * db: instance of pg Pool or client with .query(sql, params)
   */
  constructor(db) {
    this.db = db;
    this.secret = process.env.SAMARA_TOKEN_SECRET || process.env.APP_TOKEN_SECRET || process.env.JWT_SECRET;
    if (!this.secret) {
      console.warn('SAMARA_TOKEN_SECRET is not set. Tokens will not be secure without this secret.');
    }
  }

  _hmacHex(raw) {
    return crypto.createHmac('sha256', this.secret).update(raw).digest('hex');
  }

  _timingSafeEqual(a, b) {
    const bufA = Buffer.from(a || '', 'utf8');
    const bufB = Buffer.from(b || '', 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Generate a raw token (returned once) and store only HMAC in DB.
   * expiresInMinutes: number | null
   * createdBy: UUID | null
   */
  async generateTokenForOrcamento(orcamentoId, { expiresInMinutes = null, createdBy = null } = {}) {
    if (!this.secret) throw new Error('Token secret not configured');

    const rawToken = crypto.randomBytes(32).toString('hex'); // 64 chars
    const tokenHash = this._hmacHex(rawToken);

    // Build query with optional expiry
    const expiresSql = expiresInMinutes ? `token_expires_at = NOW() + INTERVAL '${parseInt(expiresInMinutes, 10)} minutes',` : '';
    const query = `
      UPDATE orcamentos
      SET token_hash = $1,
          ${expiresSql}
          token_enabled = true,
          token_created_by = $2,
          token_created_at = NOW(),
          atualizado_em = NOW()
      WHERE id = $3::uuid
      RETURNING id, token_enabled, token_expires_at
    `;
    const params = [tokenHash, createdBy, orcamentoId];

    const { rows } = await this.db.query(query, params);
    if (!rows || rows.length === 0) {
      throw new Error('Orçamento não encontrado');
    }

    return {
      rawToken,
      orcamentoId: rows[0].id,
      token_enabled: rows[0].token_enabled,
      token_expires_at: rows[0].token_expires_at
    };
  }

  /**
   * Validate raw token for given orcamentoId
   */
  async validateOrcamentoToken(orcamentoId, rawToken) {
    if (!rawToken) return false;
    const query = `
      SELECT token_hash, token_enabled, token_expires_at
      FROM orcamentos
      WHERE id = $1::uuid
      LIMIT 1
    `;
    const { rows } = await this.db.query(query, [orcamentoId]);
    if (!rows || rows.length === 0) return false;

    const r = rows[0];
    if (!r.token_enabled) return false;
    if (r.token_expires_at && new Date(r.token_expires_at) < new Date()) return false;

    const candidate = this._hmacHex(rawToken);
    return this._timingSafeEqual(candidate, r.token_hash);
  }

  /**
   * Revoke token (clear hash and disable)
   */
  async revokeOrcamentoToken(orcamentoId) {
    const query = `
      UPDATE orcamentos
      SET token_hash = NULL,
          token_enabled = false,
          token_expires_at = NULL,
          token_created_by = NULL,
          token_created_at = NULL,
          atualizado_em = NOW()
      WHERE id = $1::uuid
      RETURNING id
    `;
    const { rows } = await this.db.query(query, [orcamentoId]);
    return rows && rows.length > 0;
  }
}

module.exports = TokenService;