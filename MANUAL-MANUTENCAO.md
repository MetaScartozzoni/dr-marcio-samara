# Manual de Manutenção - Portal Dr. Marcio

## Estrutura do Projeto

O Portal Dr. Marcio é uma aplicação web completa com as seguintes características:

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js com Express
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Funções Serverless**: Supabase Edge Functions
- **Autenticação**: Sistema personalizado + Supabase Auth

## Diretórios Principais

- `/assets`: Recursos estáticos (CSS, JS, imagens)
- `/components`: Componentes reutilizáveis
- `/features`: Funcionalidades específicas para profissionais
- `/src`: Código-fonte principal
- `/api`: Endpoints da API
- `/supabase`: Funções Edge do Supabase

## Como Realizar Manutenção

### Alterações no Frontend

Para alterar páginas HTML:
1. Edite os arquivos HTML na raiz do projeto
2. Verifique referências a arquivos CSS e JS

Para alterar estilos:
1. Edite os arquivos em `/assets/css/main.css` para estilos globais
2. Edite os arquivos em `/components/portal-components.css` para componentes

### Alterações no Backend

Para modificar endpoints da API:
1. Edite os arquivos relevantes em `/api` ou no arquivo `server.js`
2. Reinicie o servidor após alterações

Para modificar funções Edge:
1. Edite os arquivos em `/supabase/functions`
2. Faça deploy das funções Edge para o Supabase

### Deploy

Para fazer deploy:
1. Siga as instruções no arquivo README-PRODUCAO-RAILWAY.md para deploy no Railway
2. Ou use o procedimento de deploy Docker documentado

## Solução de Problemas Comuns

### Problema com Estilos

Se os estilos não carregarem:
1. Verifique se os caminhos para os arquivos CSS estão corretos
2. Verifique se o servidor está servindo os arquivos estáticos corretamente

### Problemas de Autenticação

Se a autenticação falhar:
1. Verifique a conexão com o Supabase
2. Verifique as credenciais no arquivo `.env`
3. Teste as funções Edge diretamente

## Contatos para Suporte

- Desenvolvimento: [seu-email@exemplo.com]
- Supabase: [contato-supabase@exemplo.com]
