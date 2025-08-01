# 🚀 Guia de Deploy - Railway

## ✅ Sistema Pronto para Deploy

O sistema foi preparado e testado com sucesso. Todos os arquivos estão commitados e prontos.

## 📋 Checklist Pré-Deploy

- ✅ `server-integrado.js` funcionando localmente
- ✅ `package.json` atualizado com start command correto
- ✅ `railway.toml` configurado
- ✅ `.env.production` com variáveis de ambiente
- ✅ Código commitado e pushed para GitHub
- ✅ APIs testadas e funcionais
- ✅ Fluxo integrado validado

## 🛠 Passos para Deploy no Railway

### 1. Acessar Railway Dashboard
- Acesse: https://railway.app/
- Faça login com sua conta GitHub

### 2. Criar/Atualizar Projeto
- Clique em "New Project"
- Selecione "Deploy from GitHub repo"
- Escolha: `MetaScartozzoni/portal-dr-marcio`

### 3. Configurar Variáveis de Ambiente
```
PORT=3004
NODE_ENV=production
DATABASE_URL=postgresql://postgres:WkUrpFTYaDSNSqWqrjKpbEuPqBsdjCjh@viaduct.proxy.rlwy.net:18240/railway
```

### 4. Verificar Configurações
- Build Command: Automático (NPM)
- Start Command: `npm start` (definido no package.json)
- Health Check: `/api/status`

### 5. Deploy
- Clique em "Deploy"
- Aguarde o build completar
- URL será gerada automaticamente

## 🌐 URLs Após Deploy

Após o deploy, as seguintes URLs estarão disponíveis:

- **Sistema Principal**: `https://your-app-name.up.railway.app/`
- **API Status**: `https://your-app-name.up.railway.app/api/status`
- **Dashboard**: `https://your-app-name.up.railway.app/dashboard`
- **Caderno Digital**: `https://your-app-name.up.railway.app/caderno-digital`

## 📊 Endpoints para Testar

```bash
# Status da aplicação
curl https://your-app-name.up.railway.app/api/status

# Dashboard com estatísticas
curl https://your-app-name.up.railway.app/api/dashboard

# Fluxo completo do paciente 1
curl https://your-app-name.up.railway.app/api/fluxo/1

# Listar pacientes
curl https://your-app-name.up.railway.app/api/pacientes
```

## 🔧 Configurações Importantes

### railway.toml
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node server-integrado.js"
healthcheckPath = "/api/status"
healthcheckTimeout = 120
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[env]
NODE_ENV = "production"
```

### package.json
```json
{
  "main": "server-integrado.js",
  "scripts": {
    "start": "node server-integrado.js"
  }
}
```

## 🚨 Troubleshooting

### Se o deploy falhar:
1. Verificar logs no Railway Dashboard
2. Confirmar que o `server-integrado.js` existe
3. Verificar se todas as dependências estão no package.json
4. Testar localmente com `npm start`

### Se a aplicação não responder:
1. Verificar health check em `/api/status`
2. Verificar logs de runtime
3. Confirmar variáveis de ambiente

## ✅ Dados de Teste Inclusos

O sistema já inclui dados de exemplo:
- 2 pacientes cadastrados
- 2 agendamentos
- 1 ficha de atendimento
- 1 orçamento (R$ 20.000,00)
- 1 receita pré-operatória
- 1 solicitação de exames

## 🎯 Próximos Passos Após Deploy

1. Testar todas as URLs
2. Verificar funcionamento do fluxo integrado
3. Configurar domínio personalizado (opcional)
4. Configurar banco de dados PostgreSQL (se necessário)
5. Integrar com SendGrid/Twilio (se necessário)

---

**Sistema pronto para produção!** 🚀
