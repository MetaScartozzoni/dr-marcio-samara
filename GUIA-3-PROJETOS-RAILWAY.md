# 🚀 GUIA DE USO - 3 PROJETOS RAILWAY INTEGRADOS

## 📊 ESTRUTURA DOS PROJETOS

### 🏥 **PROJETO 3 - PORTAL-DR-MARCIO** (PRODUÇÃO)
```
Railway: Portal-Dr-Marcio
GitHub: portal-dr-marcio (branch: main)
Database: maglev.proxy.rlwy.net:39156
Status: PRODUÇÃO ATIVA
Uso: Portal médico oficial
```

### 🧪 **PROJETO 2 - PORTA-DESENVOLVIMENTO** 
```
Railway: Porta-Desenvolvimento
GitHub: portal-dr-marcio (branch: main/develop)
Database: yamabiko.proxy.rlwy.net:14783
Status: DESENVOLVIMENTO ATIVO  
Uso: Testes e staging
```

### 💾 **PROJETO 1 - ROMANTIC-GROWTH** (BACKUP)
```
Railway: romantic-growth
GitHub: N/A (backup only)
Database: nozomi.proxy.rlwy.net:11598
Status: BACKUP AUTOMÁTICO
Uso: Backup seguro (6h intervals)
```

## 🔄 WORKFLOW DE DESENVOLVIMENTO

### 1️⃣ **DESENVOLVIMENTO LOCAL**
```bash
# Usar Project 2 para desenvolvimento
export DATABASE_URL=$DATABASE_URL_DEV
NODE_ENV=development npm start
```

### 2️⃣ **TESTAR NO PROJECT 2**
```bash
# Push para GitHub
git push origin main

# Railway auto-deploy no Project 2
# Testar: porta-desenvolvimento.up.railway.app
```

### 3️⃣ **DEPLOY PARA PRODUÇÃO**
```bash
# Após testar no Project 2
# Railway auto-deploy no Project 3
# Produção: portal-dr-marcio.up.railway.app
```

### 4️⃣ **BACKUP AUTOMÁTICO**
```bash
# Project 1 faz backup do Project 3
# A cada 6 horas automaticamente
# Retention: 30 dias
```

## 🎯 COMANDOS ÚTEIS

### 📊 **VERIFICAR STATUS**
```bash
# Testar conexões
node testar-project2-dev.js    # Project 2
node teste-railway-final.js    # Project 3
node testar-project1.js        # Project 1

# Verificar backup
node railway-backup-system.js --status
```

### 🔄 **ALTERNAR AMBIENTES**
```bash
# Desenvolvimento (Project 2)
export DATABASE_URL=$DATABASE_URL_DEV
echo "Usando: Desenvolvimento"

# Produção (Project 3)  
export DATABASE_URL=$DATABASE_URL
echo "Usando: Produção"

# Backup (Project 1)
export DATABASE_URL=$DATABASE_URL_BACKUP
echo "Usando: Backup"
```

### 🧪 **CRIAR DADOS DE TESTE**
```bash
# Apenas no Project 2 (desenvolvimento)
export DATABASE_URL=$DATABASE_URL_DEV
node criar-dados-teste.js
```

## 🔐 CONFIGURAÇÕES DE SEGURANÇA

### ✅ **PRODUÇÃO (Project 3)**
- SSL obrigatório
- Backup automático
- Logs de auditoria
- Rate limiting ativo

### 🧪 **DESENVOLVIMENTO (Project 2)**
- Dados anonimizados
- Ambiente isolado
- Testes seguros
- Estrutura idêntica

### 💾 **BACKUP (Project 1)**
- Cópia automática
- Retenção 30 dias
- Monitoramento ativo
- Recovery point < 6h

## 🎉 BENEFÍCIOS DA ESTRUTURA

✅ **Separação completa** Prod/Dev/Backup
✅ **GitHub integrado** com deploy automático  
✅ **Backup automático** da produção
✅ **Ambiente seguro** para desenvolvimento
✅ **Workflow CI/CD** completo
✅ **Conformidade LGPD/CFM**
✅ **Monitoramento 24/7**

## 🚨 CUIDADOS IMPORTANTES

⚠️  **NUNCA** usar dados de produção no desenvolvimento
⚠️  **SEMPRE** testar no Project 2 antes da produção
⚠️  **VERIFICAR** backups regularmente
⚠️  **MANTER** ambientes sincronizados

---
**🏥 Portal Dr. Marcio - Sistema Enterprise Médico**
**✅ 3 Projetos Railway + GitHub + Backup Automático**
