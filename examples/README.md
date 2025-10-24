# Examples

This directory contains example scripts and usage demonstrations for the refactored orcamento system.

## Available Examples

### Calculator Test (`test-calculator.js`)

Demonstrates the pure calculation function with various scenarios:
- Simple calculations (multiple items)
- Percentage discounts
- Fixed value discounts
- Complex medical procedures
- Error handling

**Run:**
```bash
node examples/test-calculator.js
```

**Output:**
```
============================================================
Testing Orcamento Calculator
============================================================

1. Simple calculation (2 items, no discount):
✓ Subtotal: R$ 800.00
✓ Discount: R$ 0.00
✓ Total: R$ 800.00

2. With 10% discount:
✓ Subtotal: R$ 1000.00
✓ Discount: R$ 100.00
✓ Total: R$ 900.00

...
```

## Using the Calculator in Your Code

```javascript
const { calculateOrcamento } = require('./src/services/orcamento.calculator');

// Define items
const items = [
  { descricao: 'Consulta', quantidade: 1, valor_unitario: 500 },
  { descricao: 'Exame', quantidade: 2, valor_unitario: 150 }
];

// Calculate with 10% discount
const result = calculateOrcamento(items, { percentual: 10 });

console.log(result);
// {
//   subtotal: 800,
//   discount_value: 80,
//   total_final: 720
// }
```

## Using the Notifications Service

```javascript
const notificationService = require('./src/services/notifications');

// Send email
await notificationService.sendEmail({
  to: 'patient@example.com',
  subject: 'Your Orcamento is Ready',
  html: '<p>Your orcamento has been prepared...</p>'
});

// Send SMS (if Twilio configured)
await notificationService.sendSms({
  to: '+5511999999999',
  body: 'Your orcamento is ready. Check your email.'
});
```

## Running the Worker

The worker processes PDF generation jobs asynchronously.

**Start worker:**
```bash
# With environment variables
DATABASE_URL=postgresql://... node src/workers/orcamentoWorker.js

# Or with .env file
node src/workers/orcamentoWorker.js
```

**Worker modes:**
- **BullMQ mode** (if REDIS_URL is set): High-performance Redis queue
- **Polling mode** (fallback): Polls jobs table every X seconds

**Monitor jobs:**
```sql
-- View pending jobs
SELECT * FROM jobs WHERE status = 'pending';

-- View failed jobs
SELECT * FROM jobs WHERE status = 'failed';

-- View job statistics
SELECT status, COUNT(*) FROM jobs GROUP BY status;
```

## Testing the Complete Flow

1. **Setup database:**
```bash
psql $DATABASE_URL -f supabase/migrations/20251023_create_jobs_table.sql
```

2. **Start worker:**
```bash
node src/workers/orcamentoWorker.js
```

3. **Create orcamento via API:**
```bash
curl -X POST http://localhost:3000/api/orcamentos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "paciente_id": "patient-uuid",
    "itens": [
      {"descricao": "Consulta", "quantidade": 1, "valor_unitario": 500}
    ],
    "desconto": 10
  }'
```

4. **Response:**
```json
{
  "success": true,
  "data": {
    "orcamento": {
      "id": "orcamento-uuid",
      "numero_orcamento": "ORC20251001",
      "pdf_status": "queued",
      "valor_total": 500,
      "valor_desconto": 50,
      "valor_final": 450
    }
  }
}
```

5. **Check PDF status:**
```sql
SELECT pdf_status, pdf_url FROM orcamentos WHERE id = 'orcamento-uuid';
-- Initially: pdf_status = 'queued', pdf_url = NULL
-- After worker processes: pdf_status = 'ready', pdf_url = '/pdfs/orcamento_ORC20251001.pdf'
```

## Environment Variables

See `.env.example` for complete list of configuration options.

**Minimal setup (polling mode):**
```bash
DATABASE_URL=postgresql://localhost/dbname
PDF_STORAGE_PATH=/tmp/pdfs
```

**Production setup (BullMQ mode):**
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SENDGRID_API_KEY=SG.xxx
PDF_STORAGE_PATH=/var/app/pdfs
SEND_NOTIFICATION_ON_PDF=true
```
