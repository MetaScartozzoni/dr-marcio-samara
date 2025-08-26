# 🚀 Portal Dr. Marcio - Instruções para Deploy em Produção

Este documento contém instruções detalhadas para deploy do Portal Dr. Marcio em ambientes de produção.

## 🗂️ Estrutura de Arquivos para Produção

### 📁 Arquivos Principais
- `index.html`: Página inicial
- `login.html`: Página de login
- `dashboard-admin.html`: Dashboard administrativo
- Outras páginas HTML do portal

### 📁 Pastas Essenciais
- `assets/`: CSS, JS, imagens
- `components/`: Sistema de componentes
- `features/`: Funcionalidades profissionais
- `integrations/`: Integrações externas
- `analytics/`: Sistema de métricas
- `api/`: API serverless para Vercel/Railway

## 🚢 Opções de Deploy

### Opção 1: Deploy no Vercel (Recomendado)

1. **Instalação do CLI da Vercel**:
   ```bash
   npm i -g vercel
   ```

2. **Login na Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy para produção**:
   ```bash
   vercel --prod
   ```

### Opção 2: Deploy no Railway

1. **Instalação do CLI do Railway**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Login no Railway**:
   ```bash
   railway login
   ```

3. **Inicializar projeto**:
   ```bash
   railway init
   ```

4. **Deploy para produção**:
   ```bash
   railway up
   ```

## ⚙️ Configuração do Supabase

O projeto utiliza Supabase como banco de dados. As configurações estão no arquivo `/assets/js/config.js`.

### Passos para configurar o Supabase:

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para Settings > API
4. Copie a URL e a chave anônima (anon/public)
5. Atualize as seguintes variáveis em `/assets/js/config.js`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## 🔐 Variáveis de Ambiente

Ao configurar o projeto na Vercel ou Railway, defina as seguintes variáveis de ambiente:

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-service-role
```

## ✅ Checklist de Deploy

1. Verificar se as URLs de API estão configuradas para produção
2. Remover arquivos de desenvolvimento conforme ARQUIVOS-NAO-SUBIR.md
3. Verificar configurações do Supabase no config.js
4. Configurar variáveis de ambiente na plataforma de deploy
5. Validar sistema de autenticação
6. Testar APIs serverless
7. Verificar recursos estáticos (imagens, CSS, JS)

## 📝 Notas Importantes

- O sistema está configurado para funcionar sem backend dedicado, utilizando Supabase para armazenamento e autenticação
- As APIs serverless estão na pasta `/api` e funcionam automaticamente com Vercel e Railway
- O PWA está configurado para funcionar offline

## 🚨 Troubleshooting

- **Erro de CORS**: Verifique se as origens permitidas estão configuradas no Supabase
- **Problemas de autenticação**: Verifique as configurações de autenticação no Supabase
- **Erro 404 nas APIs**: Verifique se os arquivos na pasta `/api` estão corretos

Para mais informações, consulte a documentação do Supabase: https://supabase.com/docs/reference

---

© 2025 Portal Dr. Marcio Scartozzoni. Todos os direitos reservados.
