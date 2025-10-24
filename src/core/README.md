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

## API Endpoints

### Prontuários

#### GET /api/prontuarios/:id
Busca um prontuário completo por UUID com dados relacionados paginados.

**Autenticação:** Requer token JWT via header `Authorization: Bearer <token>`

**Parâmetros de URL:**
- `id` (UUID): ID do prontuário

**Query Parameters (opcionais):**
- `fichas_limit` (number, 1-50): Número de fichas a retornar (padrão: 5)
- `orcamentos_limit` (number, 1-50): Número de orçamentos a retornar (padrão: 5)
- `exames_limit` (number, 1-50): Número de exames a retornar (padrão: 5)
- `agendamentos_limit` (number, 1-50): Número de agendamentos a retornar (padrão: 5)
- `show_sensitive` (boolean): Exibir dados sensíveis sem mascaramento (padrão: false)
- `fichas_cursor` (timestamp): Cursor de paginação para fichas
- `orcamentos_cursor` (timestamp): Cursor de paginação para orçamentos
- `exames_cursor` (timestamp): Cursor de paginação para exames
- `agendamentos_cursor` (timestamp): Cursor de paginação para agendamentos

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "prontuario": {
      "id": "uuid",
      "numeroProntuario": "string",
      "dataCriacao": "timestamp",
      "ativo": true,
      "observacoes": "string"
    },
    "paciente": {
      "id": "uuid",
      "nomeCompleto": "string",
      "cpf": "***.***.***-12" (mascarado por padrão),
      "telefone": "***-***-1234" (mascarado por padrão),
      "email": "ab***@example.com" (mascarado por padrão),
      "dataNascimento": "date"
    },
    "fichasAtendimento": [...],
    "orcamentos": [...],
    "exames": [...],
    "agendamentos": [...],
    "pagination": {
      "fichas": { "hasNext": false, "nextCursor": null },
      "orcamentos": { "hasNext": false, "nextCursor": null },
      "exames": { "hasNext": false, "nextCursor": null },
      "agendamentos": { "hasNext": false, "nextCursor": null }
    }
  }
}
```

**Exemplo de uso com cURL:**
```bash
# Buscar prontuário com dados padrão
curl -X GET "https://your-domain.com/api/prontuarios/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Buscar com paginação customizada
curl -X GET "https://your-domain.com/api/prontuarios/550e8400-e29b-41d4-a716-446655440000?fichas_limit=10&show_sensitive=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Buscar próxima página de fichas
curl -X GET "https://your-domain.com/api/prontuarios/550e8400-e29b-41d4-a716-446655440000?fichas_cursor=2024-10-23T10:00:00Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Códigos de Erro:**
- `400`: ID inválido ou parâmetros incorretos
- `401`: Token não fornecido, inválido ou expirado
- `404`: Prontuário não encontrado
- `500`: Erro interno do servidor

**Segurança:**
- Dados sensíveis do paciente (CPF, telefone, email) são mascarados por padrão
- Use `show_sensitive=true` apenas quando necessário e com permissões adequadas
- TODO: Implementar verificações de permissão específicas do Caderno Digital em PR subsequente

**Notas de Implementação:**
- Utiliza uuid-ossp para casting de UUIDs em queries SQL
- Queries parametrizadas previnem SQL injection
- Paginação baseada em cursores para melhor performance
- Joins otimizados para evitar problemas N+1

## Observação
Todos os arquivos essenciais já estão organizados nas pastas correspondentes. Consulte este README para referência rápida.

---

> Para dúvidas ou problemas, consulte a documentação principal ou entre em contato com o responsável pelo módulo.
