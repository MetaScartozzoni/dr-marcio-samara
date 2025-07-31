# 🚀 Guia de Deploy Railway - Portal Dr. Marcio

## 📋 Pré-requisitos

1. **Conta Railway**: https://railway.app
2. **Repositório GitHub**: Conectado ao Railway
3. **PostgreSQL**: Add-on configurado no Railway

## 🔧 Configuração Step-by-Step

### 1. Criar Novo Projeto no Railway

```bash
# Via CLI Railway (opcional)
railway login
railway init
railway add postgresql
```

### 2. Configurar Variáveis de Ambiente

No Railway Dashboard → Variables, adicione:

```bash
DATABASE_URL=${{ Postgres.DATABASE_URL }}
NODE_ENV=production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
JWT_SECRET=seu-jwt-secret-muito-seguro
TELEFONE_CLINICA=(11) 99999-9999
ENDERECO_CLINICA=Rua Exemplo, 123 - São Paulo, SP
```

### 3. Configurar Build & Deploy

No Railway Dashboard → Settings:

- **Build Command**: `npm install`
- **Start Command**: `npm start` 
- **Root Directory**: `/` (raiz do projeto)

### 4. Conectar GitHub

1. Railway Dashboard → Connect GitHub
2. Selecionar repositório `portal-dr-marcio`
3. Branch: `main`
4. Auto-deploy: ✅ Ativado

## 🗄️ Configuração Database

### Variável Railway

```bash
# No Railway, esta variável é criada automaticamente:
DATABASE_URL=${{ Postgres.DATABASE_URL }}
```

### Estrutura Atual (Compatível)

Seu arquivo `src/config/database.js` já está preparado:

```javascript
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { 
        rejectUnauthorized: false 
    } : false
});
```

## 📁 Estrutura de Deploy

```
projeto/
├── server.js              # Entry point
├── package.json           # Dependencies
├── Procfile              # Railway process
├── railway.json          # Railway config
├── src/
│   ├── config/
│   │   └── database.js   # DB connection
│   └── ...
└── scripts/
    └── railway-deploy.js # Deploy helper
```

## 🚀 Processo de Deploy

### Automático (Recomendado)

1. Push para `main` branch
2. Railway detecta mudanças
3. Build automático
4. Deploy automático
5. Database inicializa automaticamente

### Manual (via CLI)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Link project
railway link

# 4. Deploy
railway up
```

## ✅ Verificação Pós-Deploy

### 1. Logs do Sistema

```bash
railway logs
```

### 2. Status do Database

Acesse: `https://seu-app.railway.app/api/system/status`

### 3. Teste de Conexão

```bash
# Via Railway CLI
railway shell
node scripts/railway-deploy.js
```

## 🔍 Troubleshooting

### Erro de Conexão Database

```bash
# Verificar variável
railway variables

# Testar conexão
railway shell
echo $DATABASE_URL
```

### Erro de Build

```bash
# Ver logs detalhados
railway logs --follow

# Limpar cache
railway environment --delete-cache
```

### SSL/TLS Issues

Configuração já incluída no `database.js`:

```javascript
ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false,
    sslmode: 'require'
} : false
```

## 📊 Monitoramento

### Métricas Railway

- CPU Usage
- Memory Usage  
- Network Traffic
- Database Connections

### Logs de Sistema

```bash
# Tempo real
railway logs --follow

# Filtrados
railway logs --filter="ERROR"
```

## 🔒 Segurança

### Variáveis Sensíveis

✅ **Correto**:
```bash
JWT_SECRET=${{ secrets.JWT_SECRET }}
DATABASE_URL=${{ Postgres.DATABASE_URL }}
```

❌ **Incorreto**:
```bash
JWT_SECRET=123456
DATABASE_URL=postgresql://user:pass@host:port/db
```

### SSL/HTTPS

Railway fornece HTTPS automático para:
- `https://seu-app.railway.app`
- Domínios customizados

## 🎯 Próximos Passos

1. ✅ **Deploy Inicial** - Configuração básica
2. 🔧 **Configurar Email** - SMTP settings
3. 📱 **Testar Sistema** - Funcionalidades completas
4. 🌐 **Domínio Custom** - (opcional)
5. 📊 **Monitoramento** - Logs e métricas

---

## 📞 Suporte

- **Railway Docs**: https://docs.railway.app
- **Status**: https://status.railway.app
- **Community**: https://discord.gg/railway
