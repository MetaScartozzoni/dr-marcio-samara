# Portal Dr. Marcio - Monorepo

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

## Banco de Dados e UUIDs

### Estrutura do Banco
O sistema utiliza PostgreSQL com **UUID** como tipo de chave primária em todas as tabelas. A extensão `uuid-ossp` é habilitada automaticamente na inicialização.

### Migrações
- **Novos bancos**: A função `initializeDatabase()` em `src/config/database.js` cria automaticamente todas as tabelas com UUIDs
- **Bancos existentes**: Use o script de migração em `supabase/migrations/20251023_migrate_to_uuid.sql`

### Trabalhando com UUIDs no Código

#### Utilitários UUID
O módulo `src/utils/db.js` fornece funções auxiliares para trabalhar com UUIDs:

```javascript
const { uuidParam, whereUuid, isValidUuid, queryWithUuid } = require('../utils/db');

// Exemplo 1: Casting explícito em WHERE
const query = `SELECT * FROM pacientes WHERE id = ${uuidParam(1)}`;
// Gera: SELECT * FROM pacientes WHERE id = $1::uuid

// Exemplo 2: Validação de UUID
if (!isValidUuid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid UUID format' });
}

// Exemplo 3: Query com casting automático
await queryWithUuid(client, 
    'SELECT * FROM pacientes WHERE id = $1', 
    [patientId],
    { uuidParams: [1] }
);
```

#### Boas Práticas
1. **Validação de entrada**: Sempre valide IDs recebidos como UUID antes de usar em queries
2. **Casting em comparações**: Use `$1::uuid` ao comparar IDs em queries WHERE/JOIN
3. **Geração de UUIDs**: Use `uuid_generate_v4()` no SQL ou o pacote `uuid` no Node.js
4. **Rotas**: Aceite UUIDs completos em parâmetros de rota (não apenas integers)

### Migração de Dados em Produção
Para migrar um banco com dados existentes:

1. **Backup completo**: `pg_dump your_db > backup.sql`
2. **Janela de manutenção**: Planeje downtime ou use modo somente leitura
3. **Execute a migração**: Siga as etapas no arquivo `supabase/migrations/20251023_migrate_to_uuid.sql`
4. **Teste extensivamente**: Valide todas as funcionalidades antes de retomar operações
5. **Mantenha backup**: Por pelo menos 7 dias após migração bem-sucedida

## Observação
Todos os arquivos essenciais já estão organizados nas pastas correspondentes. Consulte este README para referência rápida.

---

> Para dúvidas ou problemas, consulte a documentação principal ou entre em contato com o responsável pelo módulo.
