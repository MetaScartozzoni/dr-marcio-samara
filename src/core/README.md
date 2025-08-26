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

## Observação
Todos os arquivos essenciais já estão organizados nas pastas correspondentes. Consulte este README para referência rápida.

---

> Para dúvidas ou problemas, consulte a documentação principal ou entre em contato com o responsável pelo módulo.
