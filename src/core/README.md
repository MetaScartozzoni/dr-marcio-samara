# Portal Dr. Marcio - Core Documentation

## Estrutura
- `apps/web`: Frontend React
- `apps/api`: Backend Node/Express
- `packages/shared`: Tipos compartilhados
- `supabase/migrations`: Migrations SQL
- `scripts/backup`: Scripts de backup Supabase
- `.github/workflows`: CI/CD automações

## Como rodar localmente

1. Instale dependências:
   ```bash
   npm install
   ```
2. Configure `.env` copiando de `.env.example`
3. Inicie frontend e backend:
   ```bash
   npm run dev:web
   npm run dev:api
   ```

# Módulo de Funcionalidades Essenciais

Este módulo utiliza e organiza os arquivos já existentes do projeto para garantir o fluxo principal do sistema: cadastro, login, painel e integrações essenciais.

## Organização dos Arquivos

### Controllers
- Cadastro: `src/controllers/paciente.controller.js`, `src/controllers/funcionarios.controller.js`
- Login: `src/middleware/auth.middleware.js`, `src/auth/auth-system-complete.js`
- Painel: `src/controllers/admin.controller.js`, `src/components/dashboard/Dashboard.jsx`
- Orçamento: `src/controllers/orcamento.controller.js`

### Services
- Cadastro/Login: `src/services/api.js`, `src/services/email.service.js`, `src/services/email-recuperacao.service.js`
- Painel: `src/services/agendamento.service.js`, `src/services/orcamento.service.js`
- Notificações: `src/services/notifier.service.js`

### Components (Frontend)
- Login: `src/components/auth/Login.jsx`
- Painel: `src/components/dashboard/Dashboard.jsx`, `src/components/dashboard/AgendamentoRapido.jsx`
- Listagem de pacientes: `src/components/paciente/PacienteList.jsx`

### Rotas
- Cadastro: `src/routes/pacientes.routes.js`, `src/routes/funcionarios.routes.js`
- Login: `src/routes/rotas-recuperacao-senha.js`, `src/routes/admin.routes.js`
- Painel: `src/routes/admin.routes.js`, `src/routes/dashboard.routes.js`

## Como usar
- Utilize as rotas e controllers já existentes para cadastro, login e painel.
- Importe os services para lógica de negócio e integração.
- Use os components para renderização no frontend.
- Todas as rotas sensíveis já estão protegidas pelo `authMiddleware`.

## Exemplo de fluxo
1. Cadastro: Frontend chama `/api/pacientes` ou `/api/funcionarios` → Controller → Service → Banco
2. Login: Frontend chama `/api/login` → Middleware → Controller → Service → Gera token
3. Painel: Frontend chama `/api/admin` ou `/api/painel` → Controller → Service → Retorna dados do painel

## Manutenção
- Elimine arquivos duplicados e desatualizados.
- Atualize este README sempre que houver mudanças relevantes.

## Observação
Todos os arquivos essenciais já estão organizados nas pastas correspondentes. Consulte este README para referência rápida.

---

# Orçamento Workflow - Queue and Worker System

## Overview

The orçamento workflow has been refactored to use asynchronous job processing:

1. **Creation**: When an orçamento is created via API, it's saved to the database and returns immediately with HTTP 202
2. **Job Queue**: A job is enqueued for PDF generation and notification sending
3. **Worker**: A background worker processes jobs, generates PDFs, and sends notifications
4. **Completion**: PDF URL is saved to database and notifications are sent to the patient

## Architecture

### Queue Systems

The system supports two queue implementations:

#### 1. BullMQ (Primary - Redis-based)
- High performance, distributed queue
- Requires Redis connection
- Automatic retries with exponential backoff
- Job metrics and monitoring

#### 2. Table-based Queue (Fallback)
- Uses PostgreSQL `jobs` table
- Works without Redis (simple deployments)
- Polling-based worker
- Good for development and low-traffic environments

The system automatically selects BullMQ if Redis is available, otherwise falls back to table-based queue.

## Environment Variables

### Required

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Application
BASE_URL=https://your-domain.com
CLINIC_NAME="Dr. Marcio Clinic"
CLINIC_PHONE="(11) 99999-9999"
CLINIC_EMAIL="contato@clinic.com"
```

### Optional - Redis (BullMQ)

```bash
# Redis Configuration (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=false
```

### Optional - Email Notifications

Configure ONE of the following:

#### SendGrid (Recommended)
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@clinic.com
```

#### SMTP
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
SMTP_FROM=noreply@clinic.com
```

### Optional - SMS Notifications

```bash
# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+5511999999999
# OR
TWILIO_MESSAGING_SERVICE_SID=your-messaging-service-sid
```

### Optional - PDF Generation

```bash
# Puppeteer Configuration
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser  # For custom Chrome/Chromium path
SKIP_PDF_WORKER=false  # Set to 'true' to skip PDF generation (testing only)
LOGO_URL=https://cdn.example.com/logo.png
```

### Optional - Storage

```bash
# Storage Type (default: local)
STORAGE_TYPE=local  # or 's3' (S3 not yet implemented)
```

### Optional - Worker Configuration

```bash
WORKER_CONCURRENCY=2  # Number of concurrent jobs (BullMQ only)
```

## Running the Worker

### Development

```bash
# Start the worker
node src/workers/orcamento.worker.js
```

### Production - Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start worker
pm2 start src/workers/orcamento.worker.js --name orcamento-worker

# View logs
pm2 logs orcamento-worker

# Restart
pm2 restart orcamento-worker

# Stop
pm2 stop orcamento-worker
```

## Database Migration

Run the migration to create the jobs table:

```bash
psql $DATABASE_URL -f supabase/migrations/003_create_jobs_table.sql
```

## API Endpoints

### Create Orçamento (with async PDF generation)

```http
POST /api/orcamentos
Content-Type: application/json

{
  "paciente_id": "uuid",
  "itens": [
    {
      "descricao": "Consulta",
      "qtd": 1,
      "valor_unitario": 150.00
    }
  ],
  "desconto": {
    "percentual": 10
  },
  "observacoes": "Desconto especial"
}
```

Response: `202 Accepted`

### Manually Trigger PDF Generation

```http
POST /api/orcamentos/:id/generate-pdf
```

Response: `202 Accepted`

## Calculation Service

The centralized calculation method validates and calculates orçamento values with validation rules for items and discounts.

### Validation Rules

**Items:**
- `descricao`: Required, non-empty string
- `qtd`: Required, must be >= 1
- `valor_unitario`: Required, must be >= 0

**Discounts:**
- `percentual`: Must be between 0-100
- `desconto_valor`: Must be >= 0 and <= subtotal
- If both provided, they must be consistent

## Troubleshooting

### Worker not processing jobs

1. Check if worker is running: `ps aux | grep orcamento.worker`
2. Check logs for errors
3. Verify database connection
4. If using Redis, verify connection: `redis-cli ping`

### PDF generation fails

1. Check if Chromium/Chrome is installed
2. Set `PUPPETEER_EXECUTABLE_PATH` if using system Chrome
3. Check file permissions on uploads directory

### Notifications not sending

1. Verify email/SMS provider credentials
2. Review worker logs for notification errors

---

> Para dúvidas ou problemas, consulte a documentação principal ou entre em contato com o responsável pelo módulo.
