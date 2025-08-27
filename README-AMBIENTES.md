# Guia de Deploy do Portal Dr. Marcio

## Ambientes de Implantação

### Ambiente de Desenvolvimento
- **Finalidade**: Desenvolvimento de novas funcionalidades
- **URL**: Local (http://localhost:3000)
- **Acesso**: Somente equipe de desenvolvimento

### Ambiente de Teste (QA)
- **Finalidade**: Testes e validações de funcionalidades
- **URL**: https://qa.drmarcio.site
- **Acesso**: Equipe interna e testadores

### Ambiente de Homologação (Staging)
- **Finalidade**: Validação final antes de produção
- **URL**: https://staging.drmarcio.site
- **Acesso**: Cliente e stakeholders

### Ambiente de Produção
- **Finalidade**: Sistema em uso por usuários finais
- **URL**: https://drmarcio.site
- **Acesso**: Público/usuários autenticados

## Instruções para Deploy

### Deploy para QA

```bash
# Preparar o código para ambiente de QA
npm run build:qa

# Deploy para servidor de QA
rsync -avz --delete dist/ usuario@servidor:/caminho/para/qa/
```

### Deploy para Staging

```bash
# Preparar o código para ambiente de staging
npm run build:staging

# Deploy para servidor de staging
rsync -avz --delete dist/ usuario@servidor:/caminho/para/staging/
```

### Deploy para Produção

```bash
# Preparar o código para ambiente de produção
npm run build:prod

# Deploy para servidor de produção
rsync -avz --delete dist/ usuario@servidor:/caminho/para/producao/
```

## Banco de Dados

Cada ambiente possui seu próprio banco de dados:

| Ambiente | Banco de Dados | Prefixo de Tabelas |
|----------|---------------|-------------------|
| QA | qa_portal_drmarcio | qa_ |
| Staging | staging_portal_drmarcio | stg_ |
| Produção | portal_drmarcio | (sem prefixo) |

## Variáveis de Ambiente

As variáveis de ambiente são configuradas de acordo com cada ambiente:

- `.env.qa` - Variáveis para ambiente de QA
- `.env.staging` - Variáveis para ambiente de staging
- `.env.production` - Variáveis para ambiente de produção

## Processo de Promoção Entre Ambientes

1. O código é desenvolvido e testado localmente
2. Após aprovação local, é feito deploy para QA
3. Após aprovação em QA, é feito deploy para Staging
4. Após aprovação em Staging, é feito deploy para Produção

Cada promoção entre ambientes requer aprovação formal da equipe responsável.

## Monitoramento

- QA: Logs básicos
- Staging: Logs completos e métricas de performance
- Produção: Logs completos, métricas de performance e alertas

## Contatos para Suporte

- Problemas em QA: [qa@drmarcio.site](mailto:qa@drmarcio.site)
- Problemas em Staging: [staging@drmarcio.site](mailto:staging@drmarcio.site)
- Problemas em Produção: [suporte@drmarcio.site](mailto:suporte@drmarcio.site)
