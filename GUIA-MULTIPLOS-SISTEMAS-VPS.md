# 🚀 Configuração Multi-Sistema em VPS

## 📁 **ESTRUTURA DO SERVIDOR:**

```
/var/www/
├── portal-medico/          # Sistema Principal
│   ├── frontend/
│   ├── backend/
│   └── database/
│
├── sistema-financeiro/     # Sistema 2
│   ├── frontend/
│   ├── backend/
│   └── database/
│
├── dashboard-admin/        # Sistema 3
│   ├── frontend/
│   ├── backend/
│   └── database/
│
└── shared/                 # Recursos Compartilhados
    ├── ssl/
    ├── backups/
    └── logs/
```

## ⚙️ **CONFIGURAÇÃO NGINX (Proxy Reverso):**

```nginx
# /etc/nginx/sites-available/multi-sistemas

# Sistema 1: Portal Médico
server {
    listen 80;
    server_name portal.drmarkio.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Sistema 2: Financeiro
server {
    listen 80;
    server_name financeiro.drmarkio.com;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Sistema 3: Admin
server {
    listen 80;
    server_name admin.drmarkio.com;
    
    location / {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔄 **GERENCIAMENTO COM PM2:**

```bash
# Iniciar todos os sistemas
pm2 start ecosystem.config.js

# Configuração PM2
module.exports = {
  apps: [
    {
      name: 'portal-medico',
      script: '/var/www/portal-medico/server.js',
      env: { PORT: 3001, NODE_ENV: 'production' }
    },
    {
      name: 'sistema-financeiro',
      script: '/var/www/sistema-financeiro/server.js',
      env: { PORT: 3002, NODE_ENV: 'production' }
    },
    {
      name: 'dashboard-admin',
      script: '/var/www/dashboard-admin/server.js',
      env: { PORT: 3003, NODE_ENV: 'production' }
    }
  ]
};
```

## 💾 **BANCOS DE DADOS SEPARADOS:**

```sql
-- PostgreSQL
CREATE DATABASE portal_medico_db;
CREATE DATABASE sistema_financeiro_db;
CREATE DATABASE dashboard_admin_db;

-- Usuários específicos por sistema
CREATE USER portal_user WITH PASSWORD 'senha_segura_1';
CREATE USER financeiro_user WITH PASSWORD 'senha_segura_2';
CREATE USER admin_user WITH PASSWORD 'senha_segura_3';

-- Permissões
GRANT ALL PRIVILEGES ON DATABASE portal_medico_db TO portal_user;
GRANT ALL PRIVILEGES ON DATABASE sistema_financeiro_db TO financeiro_user;
GRANT ALL PRIVILEGES ON DATABASE dashboard_admin_db TO admin_user;
```

## 📊 **VANTAGENS MÚLTIPLOS SISTEMAS:**

### **🔒 Isolamento:**
- Cada sistema independente
- Falha em um não afeta outros
- Atualizações separadas

### **⚖️ Balanceamento:**
- Recursos dedicados por sistema
- Monitoramento individual
- Logs separados

### **🔧 Facilidade:**
- Deploy independente
- Backups por sistema
- Configurações específicas

## 💰 **CUSTOS REAIS:**

### **VPS Básico ($10/mês):**
- **CPU**: 1 vCore
- **RAM**: 1GB
- **Armazena**: 2-3 sistemas pequenos

### **VPS Médio ($20/mês):**
- **CPU**: 2 vCores  
- **RAM**: 2GB
- **Armazena**: 5-8 sistemas

### **VPS Grande ($40/mês):**
- **CPU**: 4 vCores
- **RAM**: 4GB
- **Armazena**: 10+ sistemas

## 🚀 **EXEMPLOS DE SISTEMAS QUE VOCÊ PODE TER:**

### **Sistema 1: Portal Médico**
- Agendamentos
- Prontuários
- Telemedicina
- Financeiro

### **Sistema 2: E-commerce**
- Loja virtual
- Produtos médicos
- Pagamentos
- Estoque

### **Sistema 3: CRM**
- Leads
- Marketing
- Campanhas
- Analytics

### **Sistema 4: Blog/Site**
- WordPress
- Artigos
- SEO
- Newsletter

## ⚡ **MONITORAMENTO:**

```bash
# Ver todos os sistemas
pm2 status

# Logs em tempo real
pm2 logs

# Restart sistema específico
pm2 restart portal-medico

# Métricas
pm2 monit
```

## 🔧 **COMANDOS ÚTEIS:**

```bash
# Verificar portas em uso
netstat -tulpn | grep :3000

# Ver uso de recursos
htop

# Espaço em disco
df -h

# Logs do nginx
tail -f /var/log/nginx/access.log
```

## 📈 **ESCALABILIDADE:**

### **Horizontal (Mais Servidores):**
- Load balancer
- Múltiplos VPS
- CDN

### **Vertical (Mais Recursos):**
- Upgrade CPU/RAM
- SSD maior
- Mais bandwidth

## 🎯 **RECOMENDAÇÃO PARA VOCÊ:**

**Começar com 1 VPS de $10-20/mês:**
1. Portal Médico (principal)
2. Sistema de backup
3. Site institucional
4. API gateway

**Depois expandir conforme necessidade!**
