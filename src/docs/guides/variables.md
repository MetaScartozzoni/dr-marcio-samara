---
title: Guia de Variáveis Railway
description: Guia rápido para criar e gerenciar variáveis de ambiente no projeto Railway, usando variáveis de serviço e variáveis compartilhadas para backend, banco de dados e API REST.
---

## Visão Geral

No Railway, variáveis de ambiente são usadas para configurar serviços e proteger segredos (chaves de API, strings de conexão etc.). Ao criar um projeto para o Portal Dr. Marcio (backend em Node/Next.js e banco PostgreSQL), você definirá variáveis de serviço para cada serviço e variáveis compartilhadas para dados que serão usados em mais de um serviço.

Variáveis ficam disponíveis em todos os momentos de execução (build, deploy, `railway run` e `railway shell`) ([docs.railway.com](https://docs.railway.com/guides/variables#:~:text=Variables%20provide%20a%20way%20to,in%20order%20to%20apply%20them)). O Railway também oferece variáveis de referência e variáveis seladas para maior segurança ([docs.railway.com](https://docs.railway.com/guides/variables#:~:text=Sealed%20Variables%20Railway%20provides%20the,dot%20menu%20on%20the)).

## Variáveis de Serviço

Variáveis de serviço são definidas dentro de cada serviço e só valem para ele. Para este projeto haverá dois serviços principais:

- **backend** (aplicação Node/Next.js).
- **private** (serviço PostgreSQL).

Use o CLI da Railway para criar variáveis:

```
# Definir a URL de conexão do banco para o serviço de banco de dados
railway variables set --service private DATABASE_URL <sua-string-conexao>

# Definir a chave de API interna usada pelo backend
railway variables set --service backend SAMARA_API_KEY <sua-chave-secreta>

# Definir a porta (caso necessário) e habilitar o domínio público para o backend
railway variables set --service backend PORT 3000
```

Estas variáveis são expostas como variáveis de ambiente no serviço correspondente. Para outros valores sensíveis (tokens de email, chaves SMTP etc.) defina uma variável de serviço específica no serviço que as utiliza.

Para proteger o valor, adicione a flag `--sealed` ao definir a variável. Variáveis seladas não podem ser lidas posteriormente, somente substituídas ([docs.railway.com](https://docs.railway.com/guides/variables#:~:text=Sealed%20Variables%20Railway%20provides%20the,dot%20menu%20on%20the)):

```
railway variables set --service backend SUPABASE_KEY <valor> --sealed
```

## Variáveis Compartilhadas (Shared)

Variáveis compartilhadas (`shared variables`) são definidas no nível do projeto e podem ser reutilizadas por vários serviços. É uma boa prática quando a mesma informação (por exemplo uma chave de API) é usada por mais de um serviço.

1. Acesse **Project Settings > Variables > Shared Variables** no painel do Railway.
2. Crie uma nova variável com o nome `SAMARA_API_KEY` e insira o valor da chave.
3. Marque os serviços que devem herdar essa variável (por exemplo `backend` e `front` se existir).  
4. Dentro de cada serviço, referencie a variável utilizando a sintaxe de referência:

```
SAMARA_API_KEY=${{ shared.SAMARA_API_KEY }}
```

Assim, os serviços utilizam o mesmo valor centralizado, facilitando manutenção.

## Variáveis de Referência

No Railway, você pode referenciar variáveis definidas em outros serviços ou como shared. A sintaxe é `${{ service.VARIABLE_NAME }}` para serviços ou `${{ shared.VARIABLE_NAME }}` para variáveis compartilhadas. Exemplo:

```
DATABASE_URL=${{ private.DATABASE_URL }}
API_KEY=${{ shared.SAMARA_API_KEY }}
API_URL=https://${{ backend.RAILWAY_PUBLIC_DOMAIN }}
```

- `private` é o nome do serviço de banco.
- `backend` é o serviço da API.
- `RAILWAY_PUBLIC_DOMAIN` é uma variável gerada automaticamente que contém o domínio público do serviço.

A referência garante que, se o valor base mudar, todos os locais que o referenciam são atualizados.

## Variáveis Seladas

Para credenciais sensíveis utilize variáveis seladas. Ao selar uma variável pelo painel ou CLI, o valor fica encriptado e não pode ser visualizado depois ([docs.railway.com](https://docs.railway.com/guides/variables#:~:text=Sealed%20Variables%20Railway%20provides%20the,dot%20menu%20on%20the)). Utilize `--sealed` ao criar variáveis com o CLI ou selecione a opção *Sealed* na interface.

## Boas Práticas

- **Isolar segredos**: Use variáveis seladas para tokens sensíveis e chaves secretas.
- **Centralizar valores comuns**: Use variáveis compartilhadas para valores reaproveitados em vários serviços.
- **Referenciar em vez de duplicar**: Sempre que possível, utilize a sintaxe de referência (`${{ ... }}`) para apontar para variáveis já definidas. Isso evita inconsistências.
- **Nomeação clara**: Escolha nomes descritivos (ex.: `DATABASE_URL`, `SAMARA_API_KEY`, `SUPABASE_URL`) para que outros membros saibam do que se trata.
- **Integração com o Frontend**: Exponha apenas as variáveis necessárias para o front (como a URL da API). Use `RAILWAY_PUBLIC_DOMAIN` para gerar o endpoint REST acessível pelo front.

Seguindo este guia você poderá configurar o backend e o banco no Railway, definindo variáveis de ambiente de forma organizada e segura, garantindo a integração correta entre API REST, PostgreSQL e o frontend do portal, seja em desktop ou mobile.
