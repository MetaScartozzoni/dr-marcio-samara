# 🇧🇷 GUIA DE DEPLOY - LOCAWEB VPS

## 📋 PASSO A PASSO:

### 1. 🛒 CONTRATAR VPS LOCAWEB
- Acesse: https://www.locaweb.com.br/vps/
- Escolha: VPS SSD 1 ou 2 (Ubuntu 20.04/22.04)
- Preço: ~R$ 30-50/mês

### 2. 🔧 CONFIGURAR SERVIDOR
```bash
# Conectar via SSH
ssh root@seu-ip-vps

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Instalar PostgreSQL
apt install postgresql postgresql-contrib -y

# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Instalar Nginx (proxy reverso)
apt install nginx -y

# Instalar Certbot (SSL gratuito)
apt install certbot python3-certbot-nginx -y
```

### 3. 📦 DEPLOY DO PROJETO
```bash
# Clonar repositório
git clone https://github.com/MetaScartozzoni/portal-dr-marcio.git
cd portal-dr-marcio

# Instalar dependências
npm install --production

# Criar banco PostgreSQL
sudo -u postgres createuser --interactive drmarcio
sudo -u postgres createdb portal_drmarcio

# Configurar variáveis de ambiente
cp .env.example .env
nano .env
# (Configurar suas chaves SendGrid, Twilio, etc.)

# Iniciar com PM2
pm2 start server.js --name "portal-drmarcio"
pm2 startup
pm2 save
```

### 4. 🌐 CONFIGURAR NGINX
```nginx
# /etc/nginx/sites-available/portal-drmarcio
server {
    listen 80;
    server_name seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. 🔒 SSL GRATUITO
```bash
# Ativar site
ln -s /etc/nginx/sites-available/portal-drmarcio /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Configurar SSL
certbot --nginx -d seu-dominio.com.br
```

## 💰 CUSTOS TOTAIS:
- VPS Locaweb: R$ 35/mês
- Domínio .com.br: R$ 40/ano  
- SSL: GRATUITO (Let's Encrypt)
- **Total: ~R$ 38/mês**

## ✅ VANTAGENS DESTA SOLUÇÃO:
- 🇧🇷 Servidor no Brasil
- 📞 Suporte Locaweb em português
- 💰 Preço fixo em reais
- 🔧 Controle total do servidor
- ⚡ Performance excelente
- 🏥 LGPD compliance automática
