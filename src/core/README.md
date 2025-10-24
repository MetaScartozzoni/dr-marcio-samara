# Portal Dr. Marcio - Monorepo

## Estrutura
- `apps/web`: Frontend React
- `apps/api`: Backend Node/Express
- `packages/shared`: Tipos compartilhados
- `supabase/migrations`: Migrations SQL
- `scripts/backup`: Scripts de backup Supabase
- `.github/workflows`: CI/CD automações
- `src/workers`: Background workers for async tasks

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
4. Inicie o worker de orçamentos (opcional):
   ```bash
   node src/workers/orcamentoWorker.js
   ```

## Configuração de Variáveis de Ambiente

### Sistema de Filas (Queue System)

O sistema suporta dois modos de operação para processamento assíncrono:

#### Modo 1: Redis + BullMQ (Recomendado para Produção)
```bash
REDIS_URL=redis://localhost:6379
# ou para Redis Cloud/Heroku:
# REDIS_URL=redis://user:password@host:port
```

**Vantagens:**
- Alta performance e escalabilidade
- Suporte a múltiplos workers
- Retries automáticos e filas distribuídas

#### Modo 2: Fallback com Tabela de Jobs (Sem Redis)
Se `REDIS_URL` não estiver configurado, o sistema automaticamente utiliza uma tabela PostgreSQL (`jobs`) para gerenciar a fila.

**Configuração:**
```bash
# Não defina REDIS_URL e o sistema usará o fallback
DATABASE_URL=postgresql://user:pass@host:5432/dbname
POLL_INTERVAL_MS=5000  # Intervalo de polling em ms (padrão: 5000)
```

**Como funciona:**
- Jobs são inseridos na tabela `jobs` com status 'pending'
- Worker faz polling da tabela a cada X segundos
- Suporta retries e controle de tentativas
- Ideal para ambientes de desenvolvimento ou pequena escala

### Geração de PDFs

```bash
PDF_STORAGE_PATH=/tmp/pdfs  # Caminho local para salvar PDFs (padrão: /tmp/pdfs)
LOGO_URL=https://example.com/logo.png  # URL do logo da clínica
```

Para integração futura com S3:
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Notificações por Email

O sistema suporta três provedores de email (em ordem de prioridade):

#### Opção 1: SendGrid (Recomendado)
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@drmarcio.com.br
```

#### Opção 2: Hostinger SMTP
```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=seu-email@seudominio.com.br
SMTP_PASS=sua-senha
SMTP_FROM=noreply@seudominio.com.br
SMTP_SECURE=false  # true para porta 465, false para 587
```

#### Opção 3: Outro SMTP
```bash
SMTP_HOST=smtp.gmail.com  # ou outro provedor
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
SMTP_FROM=noreply@example.com
```

**Comportamento:**
- Se `SENDGRID_API_KEY` estiver configurado, usa SendGrid
- Caso contrário, usa SMTP se configurado
- Se nenhum provedor estiver configurado, lança erro ao tentar enviar email

### Notificações por SMS

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM=+5511999999999  # Número Twilio verificado
```

### Configuração de Notificações Automáticas

```bash
SEND_NOTIFICATION_ON_PDF=true  # Enviar email automaticamente quando PDF estiver pronto
```

## Arquitetura do Sistema de Orçamentos

### Fluxo de Criação de Orçamento

1. **Controller** recebe requisição POST `/api/orcamentos`
2. **Service** valida dados e usa `orcamento.calculator.js` para calcular valores
3. **Service** salva orçamento no banco com `pdf_status: 'queued'`
4. **Service** enfileira job de geração de PDF:
   - Se Redis disponível: usa BullMQ
   - Caso contrário: insere na tabela `jobs`
5. **API** retorna `201 Created` com dados do orçamento e `pdf_status: 'queued'`

### Processamento Assíncrono (Worker)

1. **Worker** detecta modo de operação (BullMQ ou polling)
2. Processa job de geração de PDF:
   - Busca dados do orçamento no banco
   - Renderiza HTML usando template Handlebars
   - Usa Puppeteer para gerar PDF
   - Salva PDF em storage (local ou S3)
   - Atualiza orçamento: `pdf_status: 'ready'` e `pdf_url`
3. Opcionalmente envia notificação por email/SMS
4. Em caso de erro:
   - Retry automático (até 3 tentativas)
   - Status final: `pdf_status: 'failed'`

### Migrations

Execute as migrations do banco de dados:
```bash
# Via Supabase CLI
supabase db push

# Ou manualmente via psql
psql $DATABASE_URL -f supabase/migrations/20251023_create_jobs_table.sql
```

A migration cria:
- Tabela `jobs` para queue fallback
- Campos `pdf_status` e `pdf_url` na tabela `orcamentos`
- Índices para performance de polling

## Testes

Execute os testes unitários:
```bash
npm test

# Testes específicos
npm test orcamento.calculator.test.js
npm test orcamento.worker.test.js
```

## Monitoramento

### Verificar Status da Fila

**BullMQ (Redis):**
Use ferramentas como Bull Board ou Redis CLI para monitorar filas

**Jobs Table (Fallback):**
```sql
-- Ver jobs pendentes
SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at;

-- Ver jobs com falhas
SELECT * FROM jobs WHERE status = 'failed' ORDER BY created_at DESC;

-- Ver estatísticas
SELECT status, COUNT(*) FROM jobs GROUP BY status;
```

### Logs do Worker

O worker registra logs para:
- Início/parada
- Jobs processados (sucesso/falha)
- Erros de PDF ou notificação

Exemplo:
```
Starting orcamento worker in polling mode...
Polling worker started. Checking every 5000ms
Processing job job123 of type orcamento:generate_pdf
PDF generated for orcamento orc123: /pdfs/orcamento_ORC20251001.pdf
Job job123 completed successfully
```

## Troubleshooting

### PDF não está sendo gerado

1. Verifique se o worker está rodando:
   ```bash
   ps aux | grep orcamentoWorker
   ```

2. Verifique logs do worker

3. Verifique status na tabela:
   ```sql
   SELECT pdf_status, pdf_url FROM orcamentos WHERE id = 'xxx';
   ```

### Notificações não estão sendo enviadas

1. Verifique configuração de providers:
   ```bash
   echo $SENDGRID_API_KEY
   echo $SMTP_HOST
   ```

2. Teste provider isoladamente

3. Verifique se `SEND_NOTIFICATION_ON_PDF=true`

### Worker não processa jobs

1. **Modo BullMQ:** Verifique conexão Redis
   ```bash
   redis-cli ping
   ```

2. **Modo Polling:** Verifique se há jobs pendentes
   ```sql
   SELECT * FROM jobs WHERE status = 'pending';
   ```

3. Verifique `DATABASE_URL` está configurado corretamente
# Módulo de Funcionalidades Essenciais

Este módulo utiliza e organiza os arquivos já existentes do projeto para garantir o fluxo principal do sistema: cadastro, login, painel e integrações essenciais.

## Organização dos Arquivos

### Controllers
- Cadastro: `src/controllers/paciente.controller.js`, `src/controllers/funcionarios.controller.js`
- Login: `src/middleware/auth.middleware.js`, `src/auth/auth-system-complete.js`
- Painel: `src/controllers/admin.controller.js`, `src/components/dashboard/Dashboard.jsx`

### Services
- Cadastro/Login: `src/services/api.js`, `src/services/email.service.js`, `src/services/email-recuperacao.service.js`
- Painel: `src/services/agendamento.service.js`, `src/services/orcamento.service.js`

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

> Para dúvidas ou problemas, consulte a documentação principal ou entre em contato com o responsável pelo módulo.
