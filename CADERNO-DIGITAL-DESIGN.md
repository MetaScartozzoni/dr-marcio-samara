# Caderno Digital - Sensitive Storage Design

## Overview

This document describes the design for secure sensitive data storage in the Caderno Digital system using PostgreSQL's `pgcrypto` extension. This will be implemented in a future PR.

## Current Implementation (uuid-ossp)

The current implementation uses `uuid-ossp` extension for generating UUIDs for primary identifiers:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE prontuarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ...
);
```

## Future Implementation (pgcrypto for Sensitive Data)

### Objectives

1. **Secure Token Generation**: Generate cryptographically secure tokens for patient access to their Caderno Digital
2. **Data Encryption**: Encrypt sensitive patient data at rest using pgcrypto
3. **Compliance**: Meet LGPD requirements for data protection

### Architecture

#### 1. Extension Setup

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Note: uuid-ossp will remain for regular UUID generation
-- pgcrypto provides gen_random_uuid() which is also suitable for UUIDs
-- and additional encryption functions
```

#### 2. Patient Access Tokens

Create a secure token system for patient dashboard access:

```sql
CREATE TABLE caderno_digital_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    
    -- Cryptographically secure access token
    access_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Expiration and status
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT false,
    last_used TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES usuarios(id),
    
    -- Index for fast token lookup
    CONSTRAINT token_valid CHECK (NOT revoked OR expires_at > NOW())
);

CREATE INDEX idx_caderno_tokens_access ON caderno_digital_tokens(access_token) 
    WHERE NOT revoked AND expires_at > NOW();
CREATE INDEX idx_caderno_tokens_paciente ON caderno_digital_tokens(paciente_id);
```

#### 3. Sensitive Data Encryption

Encrypt sensitive fields in patient records:

```sql
-- Example: Encrypted patient notes
CREATE TABLE paciente_notas_privadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    
    -- Encrypted content using AES
    -- Store IV (initialization vector) separately for security
    conteudo_encrypted BYTEA NOT NULL,
    encryption_iv BYTEA NOT NULL DEFAULT gen_random_bytes(16),
    
    -- Metadata (not encrypted)
    tipo_nota TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_por UUID REFERENCES usuarios(id),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to encrypt data
CREATE OR REPLACE FUNCTION encrypt_patient_note(
    p_content TEXT,
    p_encryption_key TEXT
) RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(p_content, p_encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt data
CREATE OR REPLACE FUNCTION decrypt_patient_note(
    p_encrypted BYTEA,
    p_encryption_key TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(p_encrypted, p_encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 4. Token Management Service

```javascript
// src/services/caderno-digital-token.service.js
class CadernoDigitalTokenService {
  constructor(db) {
    this.db = db;
    this.tokenExpirationDays = 90; // 3 months
  }

  /**
   * Generate secure access token for patient
   * Uses pgcrypto's gen_random_bytes for cryptographic security
   */
  async generateToken(pacienteId, createdBy) {
    const query = `
      INSERT INTO caderno_digital_tokens (
        paciente_id,
        expires_at,
        created_by
      ) VALUES (
        $1::uuid,
        NOW() + INTERVAL '${this.tokenExpirationDays} days',
        $2::uuid
      )
      RETURNING id, access_token, expires_at
    `;

    const result = await this.db.query(query, [pacienteId, createdBy]);
    return result.rows[0];
  }

  /**
   * Validate and refresh token
   */
  async validateToken(accessToken) {
    const query = `
      UPDATE caderno_digital_tokens
      SET last_used = NOW()
      WHERE access_token = $1
        AND NOT revoked
        AND expires_at > NOW()
      RETURNING id, paciente_id, expires_at
    `;

    const result = await this.db.query(query, [accessToken]);
    
    if (result.rows.length === 0) {
      throw new Error('Token inválido ou expirado');
    }

    return result.rows[0];
  }

  /**
   * Revoke token
   */
  async revokeToken(tokenId, revokedBy) {
    const query = `
      UPDATE caderno_digital_tokens
      SET 
        revoked = true,
        revoked_at = NOW(),
        revoked_by = $2::uuid
      WHERE id = $1::uuid
    `;

    await this.db.query(query, [tokenId, revokedBy]);
  }
}

module.exports = CadernoDigitalTokenService;
```

### Security Considerations

1. **Key Management**
   - Encryption keys should be stored in environment variables, not in database
   - Rotate keys periodically
   - Use different keys for different types of sensitive data

2. **Token Security**
   - Use `gen_random_bytes(32)` for 256-bit security
   - Encode as hex for URL-safe transmission
   - Implement token rotation (auto-renewal before expiry)
   - Allow users to revoke tokens

3. **Audit Trail**
   - Log all token generation and usage
   - Log all encryption/decryption operations
   - Maintain LGPD compliance logs

4. **Performance**
   - Index frequently queried encrypted fields' metadata
   - Cache decrypted data in application layer (with TTL)
   - Use connection pooling for better performance

### Migration Path

1. **Phase 1** (Current): Use uuid-ossp for basic UUID generation
2. **Phase 2**: Install pgcrypto extension alongside uuid-ossp
3. **Phase 3**: Implement token generation system
4. **Phase 4**: Migrate sensitive data to encrypted storage
5. **Phase 5**: Audit and test encryption/decryption performance

### Compatibility Notes

- **uuid-ossp** will continue to be used for regular table primary keys
- **pgcrypto** will be used specifically for:
  - Secure token generation (`gen_random_bytes`)
  - Sensitive data encryption (`pgp_sym_encrypt`)
  - Random UUID generation when needed (`gen_random_uuid`)

Both extensions can coexist without conflicts.

### References

- PostgreSQL pgcrypto documentation: https://www.postgresql.org/docs/current/pgcrypto.html
- LGPD compliance requirements
- OWASP cryptographic storage guidelines

### Implementation Priority

**High Priority:**
- Patient access token system
- Audit logging

**Medium Priority:**
- Encrypt medical history notes
- Encrypt payment information

**Low Priority:**
- Encrypt archived data
- Key rotation automation

---

**Status**: Design document - Implementation pending in future PR
**Last Updated**: 2024-10-23
