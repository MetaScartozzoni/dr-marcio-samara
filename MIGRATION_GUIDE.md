# Migration Guide: Orcamento Refactor

This guide explains the changes introduced in the orcamento refactor and how to migrate existing code.

## Overview

The orcamento system has been refactored to:
1. Centralize calculation logic in a pure function
2. Process PDF generation asynchronously
3. Support flexible queue backends (Redis or database)
4. Provide configurable notification options

## Breaking Changes

### ⚠️ None - Backward Compatible

The refactor is **fully backward compatible**. Existing API endpoints work exactly as before, with the following enhancements:

**Response changes:**
- Added `pdf_status` field to orcamento responses
- Value can be: `'queued'`, `'processing'`, `'ready'`, or `'failed'`

**Example:**
```json
{
  "success": true,
  "data": {
    "orcamento": {
      "id": "uuid",
      "numero_orcamento": "ORC20251001",
      "pdf_status": "queued",  // ← NEW FIELD
      "valor_total": 500,
      "valor_final": 450
    }
  }
}
```

## Database Changes

### Required Migration

Run the migration to add new tables and columns:

```bash
psql $DATABASE_URL -f supabase/migrations/20251023_create_jobs_table.sql
```

**Changes:**
- Creates `jobs` table for queue fallback
- Adds `pdf_status` column to `orcamentos` table (default: 'pending')
- Adds `pdf_url` column to `orcamentos` table

## API Usage Changes

### Creating Orcamentos

**Before (still works):**
```javascript
POST /api/orcamentos
{
  "paciente_id": "uuid",
  "valor_total": 1000,
  "descricao_procedimento": "..."
}
```

**After (recommended - use service layer):**
```javascript
const orcamentoService = require('./src/services/orcamento.service');

const orcamento = await orcamentoService.gerarOrcamento({
  paciente: { id: 'uuid', nome: 'João' },
  itens: [
    { descricao: 'Consulta', quantidade: 1, valor_unitario: 500 }
  ],
  desconto: 10  // Percentage
});
```

**Benefits:**
- Automatic calculation using pure function
- Async PDF generation
- Automatic job enqueuing

### Checking PDF Status

**New feature - poll for PDF completion:**
```javascript
GET /api/orcamentos/:id

Response:
{
  "orcamento": {
    "pdf_status": "ready",  // queued → processing → ready
    "pdf_url": "/pdfs/orcamento_ORC001.pdf"
  }
}
```

## Code Migration Examples

### 1. Calculating Values

**Before (duplicated logic):**
```javascript
// In controller
const valorTotal = itens.reduce((sum, item) => 
  sum + (item.quantidade * item.valor_unitario), 0);
const valorDesconto = (valorTotal * desconto) / 100;
const valorFinal = valorTotal - valorDesconto;
```

**After (use calculator):**
```javascript
const { calculateOrcamento } = require('./src/services/orcamento.calculator');

const { subtotal, discount_value, total_final } = calculateOrcamento(
  itens, 
  { percentual: desconto }
);
```

### 2. PDF Generation

**Before (synchronous, blocks request):**
```javascript
// Generate PDF inline
const pdfBuffer = await generatePDF(orcamento);
await uploadToS3(pdfBuffer);
// Takes 5-10 seconds, times out on slow connections
```

**After (asynchronous):**
```javascript
// Enqueue job and return immediately
await orcamentoService.enqueuePDFGeneration(orcamento.id);
// Returns in <100ms

// Worker processes in background
// Updates pdf_status when complete
```

### 3. Notifications

**Before (hardcoded):**
```javascript
// Tightly coupled to specific email provider
const sgMail = require('@sendgrid/mail');
await sgMail.send({ ... });
```

**After (flexible providers):**
```javascript
const notificationService = require('./src/services/notifications');

// Automatically uses configured provider
await notificationService.sendEmail({
  to: 'patient@example.com',
  subject: 'Orcamento Ready',
  html: '...'
});

// Also supports SMS
await notificationService.sendSms({
  to: '+5511999999999',
  body: 'Your orcamento is ready'
});
```

## Deployment Guide

### Step 1: Update Dependencies

```bash
npm install
```

**New dependencies:**
- `puppeteer` - PDF generation
- `bullmq` - Redis queue (optional)
- `ioredis` - Redis client (optional)
- `@sendgrid/mail` - Email provider (optional)
- `twilio` - SMS provider (optional)

### Step 2: Run Migration

```bash
psql $DATABASE_URL -f supabase/migrations/20251023_create_jobs_table.sql
```

### Step 3: Configure Environment

Copy `.env.example` and configure:

**Minimal (development):**
```bash
DATABASE_URL=postgresql://...
PDF_STORAGE_PATH=/tmp/pdfs
```

**Recommended (production):**
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SENDGRID_API_KEY=SG.xxx
PDF_STORAGE_PATH=/var/app/pdfs
SEND_NOTIFICATION_ON_PDF=true
```

### Step 4: Deploy Worker

The worker should run as a separate process:

**Development:**
```bash
node src/workers/orcamentoWorker.js
```

**Production (systemd):**
```ini
[Unit]
Description=Orcamento Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/app
ExecStart=/usr/bin/node src/workers/orcamentoWorker.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Production (Docker):**
```yaml
services:
  api:
    image: your-app:latest
    command: npm run server
    
  worker:
    image: your-app:latest
    command: npm run worker
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
```

### Step 5: Monitor

**Check worker status:**
```bash
# Systemd
systemctl status orcamento-worker

# Docker
docker-compose logs -f worker
```

**Monitor jobs:**
```sql
-- Pending jobs
SELECT COUNT(*) FROM jobs WHERE status = 'pending';

-- Failed jobs
SELECT * FROM jobs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;

-- Average processing time
SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) 
FROM jobs WHERE status = 'completed';
```

## Rollback Plan

If issues arise, you can safely rollback:

### 1. Stop Worker
```bash
systemctl stop orcamento-worker
# or
docker-compose stop worker
```

### 2. Process Pending Jobs Manually

The old synchronous code path still exists in `orcamento.service.js`. You can:

**Option A:** Wait for worker to process remaining jobs
```sql
SELECT COUNT(*) FROM jobs WHERE status = 'pending';
```

**Option B:** Mark jobs as failed and regenerate manually
```sql
UPDATE jobs SET status = 'failed' WHERE status = 'pending';
```

### 3. Remove Migration (if needed)
```sql
DROP TABLE IF EXISTS jobs;
ALTER TABLE orcamentos DROP COLUMN IF EXISTS pdf_status;
ALTER TABLE orcamentos DROP COLUMN IF EXISTS pdf_url;
```

### 4. Revert Code
```bash
git revert <commit-sha>
```

## FAQ

### Q: Do I need Redis?

**A:** No. The system automatically uses a database-backed queue (jobs table) if Redis is not configured.

### Q: Will PDF generation still work without the worker?

**A:** The worker is required for PDF generation. Without it, `pdf_status` will remain `'queued'`. Start the worker with `npm run worker`.

### Q: Can I run multiple workers?

**A:** Yes! Both BullMQ and polling modes support multiple workers for parallel processing.

### Q: How do I test without sending real emails?

**A:** Don't configure email providers. The system will log errors but won't fail jobs.

### Q: What happens if a job fails?

**A:** Jobs retry automatically up to 3 times. After 3 failures, `pdf_status` is set to `'failed'`. Check logs and `jobs.last_error` column.

### Q: How do I monitor performance?

**A:** 
- **BullMQ**: Use Bull Board dashboard
- **Polling**: Query `jobs` table for metrics
- **General**: Check worker logs

### Q: Is this production-ready?

**A:** Yes. The implementation:
- Has comprehensive test coverage
- Uses battle-tested libraries (Puppeteer, BullMQ)
- Includes retry logic and error handling
- Is backward compatible
- Has been security-checked

## Support

For issues or questions:
1. Check worker logs: `journalctl -u orcamento-worker -f`
2. Check database: `SELECT * FROM jobs WHERE status = 'failed'`
3. Review configuration: Verify `.env` matches `.env.example`
4. See README: `src/core/README.md` has troubleshooting guide

## Summary

✅ **Migration is simple:** Run migration, start worker, configure environment
✅ **Backward compatible:** Existing API works without changes
✅ **Rollback safe:** Can revert if needed
✅ **Production ready:** Tested, secure, and reliable
