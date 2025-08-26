# Portal Dr. Marcio - Sistema de Gestão para Clínica Médica

Este repositório contém o código fonte do Portal Dr. Marcio, uma plataforma completa de gestão para clínicas médicas.

## 📋 Estrutura do Projeto

O projeto está organizado da seguinte forma:

- `/assets` - Arquivos CSS, JavaScript e mídia
- `/components` - Componentes reutilizáveis
- `/features` - Funcionalidades específicas para profissionais
- `/integrations` - Integração com serviços externos
- `/modules` - Módulos do sistema
- `/supabase` - Funções Edge do Supabase e configurações

## 🚀 Deploy na Vercel

Este projeto está configurado para ser implantado na Vercel. Siga os passos abaixo para fazer o deploy:

1. Clone este repositório
2. Instale a [Vercel CLI](https://vercel.com/cli):
   ```bash
   npm i -g vercel
   ```
3. Faça login na sua conta Vercel:
   ```bash
   vercel login
   ```
4. Para fazer o deploy em ambiente de desenvolvimento:
   ```bash
   vercel
   ```
5. Para fazer o deploy em produção:
   ```bash
   vercel --prod
   ```

Ou, configure o deploy automático através do GitHub:

1. Conecte seu repositório GitHub à Vercel
2. Configure o deploy automático a partir da branch principal

## ⚙️ Configuração do Ambiente

O projeto utiliza variáveis de ambiente para configuração. Certifique-se de definir as seguintes variáveis no painel de configuração da Vercel:

- `NODE_VERSION` - Versão do Node.js (recomendado: 18)
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `EDGE_FUNCTION_URL` - URL base das funções Edge

## 🔒 Funções do Supabase

As funções Edge do Supabase são responsáveis por:

- Autenticação de usuários (auth-manager)
- Gerenciamento administrativo (admin-management)
- Processamento de dados (data-processor)

## 📄 Arquivos Especiais

- `vercel.json` - Configuração de rotas e headers para a Vercel
- `deno.json` - Configuração para o runtime Deno (usado nas funções Edge)
- `_middleware.js` - Middleware para gerenciamento de autenticação e redirecionamentos
- `sw.js` - Service Worker para funcionalidades offline

## 📚 Documentação

Para mais informações sobre a API e como usar o sistema, consulte os seguintes arquivos:

- `README-SISTEMA-COMPLETO.md`
- `README-SUPABASE-OFICIAL.md`

## 📱 PWA

O sistema está configurado como um Progressive Web App (PWA), permitindo instalação em dispositivos móveis e funcionalidades offline básicas.

## 🔧 Suporte

Em caso de problemas com o deploy ou configuração, verifique:

1. Se todas as variáveis de ambiente estão corretamente configuradas
2. Se os arquivos de configuração (`vercel.json`, `deno.json`) estão corretos
3. Se as dependências estão atualizadas

---

© 2024 Dr. Marcio - Todos os direitos reservados
