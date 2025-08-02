# 🚂 GUIA COMPLETO: CONFIGURAÇÃO PROJECT 1 COMO BACKUP
## Portal Dr. Marcio - Sistema de Backup Automático Railway

---

## 🎯 OBJETIVO
Transformar o **Project 1** em um sistema de backup automático do **Project 3** (produção), garantindo disaster recovery e compliance médico.

---

## 📋 PASSO A PASSO DETALHADO

### **1️⃣ ACESSAR RAILWAY DASHBOARD**
```
🌐 URL: https://railway.app/dashboard
👤 Login: Sua conta Railway
📂 Localizar: Project 1
```

### **2️⃣ CONFIGURAR POSTGRESQL NO PROJECT 1**
```
1. Entre no Project 1
2. Clique em "Add Service" ou "+"
3. Selecione "PostgreSQL" 
4. Aguarde criação (2-3 minutos)
5. PostgreSQL aparecerá na lista de serviços
```

### **3️⃣ OBTER URL DE CONEXÃO**
```
1. Clique no serviço PostgreSQL criado
2. Vá na aba "Variables"
3. Procure por "DATABASE_URL"
4. Clique no ícone de "copiar" ao lado
5. URL terá formato: postgresql://postgres:senha@host:porta/railway
```

### **4️⃣ CONFIGURAR NO SISTEMA LOCAL**
```bash
# Opção A: Adicionar no arquivo .env principal
echo "DATABASE_URL_BACKUP=sua_url_aqui" >> .env

# Opção B: Editar manualmente o .env
# Adicione a linha:
DATABASE_URL_BACKUP=postgresql://postgres:abcd1234@viaduct.proxy.rlwy.net:12345/railway
```

### **5️⃣ INICIAR SISTEMA DE BACKUP**
```bash
# Executar sistema
node railway-backup-system.js

# Ou em background
nohup node railway-backup-system.js > backup.log 2>&1 &
```

---

## 🔧 CONFIGURAÇÃO AVANÇADA

### **VARIÁVEIS DE AMBIENTE OPCIONAIS**
```bash
# Intervalo de backup (em horas)
BACKUP_INTERVAL_HOURS=6

# Dias de retenção
BACKUP_RETENTION_DAYS=30

# Diretório local de backup
BACKUP_DIR=./backups

# Email para alertas
BACKUP_ALERT_EMAIL=admin@clinica.com
```

---

## 📊 MONITORAMENTO E VERIFICAÇÃO

### **COMANDOS DE VERIFICAÇÃO**
```bash
# Status do sistema
node -e "
const BackupSystem = require('./railway-backup-system.js');
const bs = new BackupSystem();
bs.exibirStatus();
"

# Backup manual (teste)
node -e "
const BackupSystem = require('./railway-backup-system.js');
const bs = new BackupSystem();
bs.backupManual();
"

# Verificar logs
tail -f backup.log
```

### **VERIFICAR SE FUNCIONOU**
```bash
# 1. Verificar diretório de backup
ls -la backups/

# 2. Verificar logs
cat backup.log

# 3. Testar conexão com Project 1
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_BACKUP,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()').then(r => console.log('✅ Project 1:', r.rows[0].now));
"
```

---

## 🚨 DISASTER RECOVERY

### **PROCEDIMENTO DE EMERGÊNCIA**
```bash
# Se Project 3 (produção) falhar:

1. Verificar último backup
ls -la backups/ | tail -5

2. Restaurar do Project 1 (backup) para nova instância
pg_dump $DATABASE_URL_BACKUP > emergency_restore.sql

3. Criar nova instância e restaurar
psql $DATABASE_URL_NEW < emergency_restore.sql

4. Atualizar DNS/configurações
```

### **TESTE DE DISASTER RECOVERY**
```bash
# Teste mensal recomendado
node -e "
const BackupSystem = require('./railway-backup-system.js');
const bs = new BackupSystem();
console.log('🧪 Iniciando teste de disaster recovery...');
bs.verificarSaude();
"
```

---

## 🏥 COMPLIANCE MÉDICO

### **LOGS DE AUDITORIA**
```bash
# O sistema automaticamente registra:
✅ Horário de cada backup
✅ Tamanho dos dados copiados  
✅ Verificações de integridade
✅ Sucessos e falhas
✅ Tempo de execução
```

### **RELATÓRIO MENSAL**
```bash
# Gerar relatório de compliance
node -e "
const fs = require('fs');
const logs = fs.readFileSync('backup.log', 'utf8');
const backups = logs.split('\n').filter(l => l.includes('SUCCESS'));
console.log(\`📊 Backups realizados: \${backups.length}\`);
console.log('📋 Relatório para auditoria LGPD/CFM pronto');
"
```

---

## 💰 CUSTO-BENEFÍCIO

### **CUSTOS ESTIMADOS**
```
Project 1 (Backup): ~$10-15/mês
- PostgreSQL database
- Storage para backups
- Tráfego de sincronização

Total mensal: $10-15
Benefício: Proteção total dos dados médicos
```

### **ROI (Return on Investment)**
```
Custo de perda de dados médicos: INCALCULÁVEL
Custo do backup: $15/mês = $180/ano
Compliance LGPD evitada: Até R$ 50 milhões
Tempo de recovery: < 1 hora vs 24-48 horas
```

---

## 🎛️ CONFIGURAÇÕES DE PROJETO 2 (OPCIONAL)

### **ENVIRONMENT DE DESENVOLVIMENTO**
```bash
# Se quiser configurar Project 2 para testes:

1. Acesse Project 2 no Railway
2. Add Service → PostgreSQL  
3. Copie a URL para DATABASE_URL_DEV
4. Execute scripts de anonimização:

# Dados de teste anonimizados
psql $DATABASE_URL_DEV -c "
UPDATE pacientes SET 
  nome = 'Paciente ' || id,
  cpf = '000.000.000-' || LPAD(id::text, 2, '0'),
  email = 'teste' || id || '@exemplo.com';
"
```

---

## 🔍 TROUBLESHOOTING

### **PROBLEMAS COMUNS**

#### ❌ "Connection refused"
```bash
# Verificar se PostgreSQL foi criado no Project 1
# Aguardar 2-3 minutos após criação
# Verificar se URL está correta
```

#### ❌ "Permission denied"
```bash
# Verificar credenciais na URL
# Testar conexão manual:
psql $DATABASE_URL_BACKUP -c "SELECT 1;"
```

#### ❌ "Backup file too small"
```bash
# Verificar se produção tem dados
# Verificar espaço em disco
# Verificar permissões de escrita
```

---

## 📞 SUPORTE

### **LOGS E DEBUGGING**
```bash
# Ativar modo verbose
DEBUG=backup* node railway-backup-system.js

# Verificar conectividade
ping maglev.proxy.rlwy.net

# Testar pg_dump manualmente
pg_dump $DATABASE_URL --version
```

### **RECURSOS ADICIONAIS**
- 📚 Railway Docs: https://docs.railway.app/
- 🐘 PostgreSQL Docs: https://www.postgresql.org/docs/
- 🔧 GitHub Issues: Reportar problemas no repositório

---

*Guia criado para Portal Dr. Marcio - Agosto 2025*  
*Sistema de backup com compliance LGPD/CFM*
