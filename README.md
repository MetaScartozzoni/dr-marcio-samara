# Portal Dr. Marcio - Sistema Médico Completo

🩺 **Sistema médico integrado com gestão de funcionários, agendamentos e comunicação via email**

[![Deployed on Railway](https://railway.app/button.svg)](https://railway.app)
[![Node.js](https://img.shields.io/badge/Node.js-≥18.0.0-green.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://postgresql.org)

---

## 📋 Visão Geral do Sistema

O Portal Dr. Marcio é uma plataforma completa para gestão médica que integra:

- **Sistema de Autenticação de Funcionários** com autorização administrativa
- **Gestão de Agendamentos** com notificações automáticas
- **Prontuários Eletrônicos** e Caderno Digital
- **Sistema de Email** com templates profissionais
- **Dashboard Administrativo** para controle total
- **Integração com Google Sheets** para armazenamento
- **Deploy automatizado** na Railway com PostgreSQL

---

## 🚀 Status Atual do Sistema

### ✅ **PRODUÇÃO ATIVA**
- **URL de Produção**: [https://portal-dr-marcio.railway.app](https://portal-dr-marcio.railway.app)
- **Banco de Dados**: Railway PostgreSQL (ativo)
- **Status**: 100% funcional e operacional
- **Última atualização**: 29/01/2025

### � **Componentes Principais**

| Componente | Status | Descrição |
|------------|--------|-----------|
| ✅ Autenticação | Ativo | Sistema completo de cadastro e autorização |
| ✅ Email Service | Ativo | 353 linhas - confirmações, lembretes, orçamentos |
| ✅ Database | Ativo | PostgreSQL Railway conectado |
| ✅ Deployment | Ativo | Railway com deploy automático |
| ✅ File Structure | Organizado | Backups e estrutura limpa |

---

## 👥 Sistema de Administração e Cadastro

### 🔐 **PRIMEIRO ACESSO ADMINISTRATIVO**

O sistema cria automaticamente um administrador padrão na primeira inicialização.

```
🚪 Login: /login.html
🔒 Credenciais: Disponíveis via canal seguro
⚠️ IMPORTANTE: Altere as credenciais após o primeiro login!
```

### 🔐 **Como Funciona o Sistema de Admin/Cadastro**

O Portal Dr. Marcio possui um **sistema de autorização em 3 níveis**:

#### **1. Cadastro de Funcionário**
```
📝 Funcionário acessa: /cadastro-funcionario.html
   ↓
📧 Preenche dados → Email de verificação enviado
   ↓
🔢 Confirma código → Status: "aguardando_autorização"
   ↓
🔐 Cria senha → Notifica admin
```

#### **2. Autorização Administrativa**
```
👨‍💼 Admin acessa: /admin-autorizacoes.html
   ↓
📋 Visualiza funcionários pendentes
   ↓
✅/❌ Aprova ou Rejeita → Email automático enviado
   ↓
🎯 Status final: "ativo" ou "rejeitado"
```

#### **3. Acesso ao Sistema**
```
🚪 Funcionário autorizado → /login.html
   ↓
📊 Dashboard personalizado por tipo:
   • Funcionário → /dashboard-funcionario.html
   • Admin → /admin.html
   • Médico → /dashboard-medico.html
```

### �️ **Níveis de Acesso**

| Tipo | Permissões | Dashboard |
|------|------------|-----------|
| **Admin** | Gestão completa, autorizar funcionários, relatórios | `/admin.html` |
| **Funcionário** | Agendamentos, prontuários, caderno digital | `/dashboard-funcionario.html` |
| **Médico** | Prontuários, prescrições, laudos, agenda | `/dashboard-medico.html` |
| **Paciente** | Agendamentos próprios, histórico | `/dashboard.html` |

---

## 📧 Sistema de Email Integrado

### 🎯 **Funcionalidades do Email Service**

O sistema possui **EmailService completo** com 4 tipos de notificação:

```javascript
// 1. Confirmação de Agendamento
enviarConfirmacaoAgendamento(dadosAgendamento)
├── Template profissional com dados do agendamento
├── Instruções de comparecimento
└── Dados de contato da clínica

// 2. Lembrete 24h
enviarLembrete24h(dadosAgendamento)
├── Lembrete automático antes da consulta
├── Dados do agendamento
└── Opção de reagendamento

// 3. Orçamento
enviarEmailOrcamento(dadosOrcamento)
├── Detalhamento dos procedimentos
├── Valores e formas de pagamento
└── Instruções para aprovação

// 4. Confirmação de Pagamento
enviarConfirmacaoPagamento(dadosPagamento)
├── Comprovante de pagamento
├── Detalhes da transação
└── Próximos passos
```

### 🔧 **Configuração do Email**

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=contato@drmarcio.com.br
ADMIN_EMAIL=admin@drmarcio.com.br
```

---

## 🗄️ Arquitetura do Banco de Dados

### 📊 **Railway PostgreSQL**

```sql
-- Conexão Ativa
postgresql://postgres:pFYtWUlDjHNTGWJGFUluAUyImYYqBGuf@yamabiko.proxy.rlwy.net:27448/railway

-- Tabelas Principais
├── funcionarios (sistema de auth)
├── agendamentos (gestão de consultas)
├── pacientes (cadastro e histórico)
├── emails_log (rastreamento de envios)
└── configuracoes (parâmetros do sistema)
```

### 🔄 **Integração Google Sheets**

```javascript
// Planilhas Integradas
├── Funcionarios (auth system)
├── Usuario (cadastro geral)
├── Agendamentos (consultas)
├── Pending (autorizações)
└── Logs (auditoria)
```

---

## 🛠️ Instalação e Configuração

### **1. Clone e Dependências**

```bash
# Clonar repositório
git clone <repository-url>
cd Sites.Google

# Instalar dependências
npm install

# Variáveis de ambiente
cp .env.example .env
```

### **2. Configuração do .env**

```env
# Database
DATABASE_URL=postgresql://postgres:pFYtWUlDjHNTGWJGFUluAUyImYYqBGuf@yamabiko.proxy.rlwy.net:27448/railway

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=contato@drmarcio.com.br

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key
GOOGLE_SHEET_ID=your_sheet_id

# Admin
ADMIN_EMAIL=admin@drmarcio.com.br
SITE_URL=https://portal-dr-marcio.railway.app

# Server
PORT=3000
NODE_ENV=production
```

### **3. Executar Sistema**

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Build (se necessário)
npm run build
```

---

## 📁 Estrutura de Arquivos

```
📦 Portal Dr. Marcio/
├── 🔑 auth-system-complete.js (950 linhas - Sistema auth)
├── 📧 src/services/email.service.js (353 linhas - Email completo)
├── 🗄️ src/config/database.js (Railway PostgreSQL)
├── 🖥️ server-simple.js (Servidor principal)
├── 📱 Frontend/
│   ├── cadastro-funcionario.html (Cadastro funcionários)
│   ├── admin-autorizacoes.html (Gestão admin)
│   ├── dashboard.html (Dashboard geral)
│   ├── admin.html (Painel administrativo)
│   └── login.html (Autenticação)
├── 🎨 Styles/
│   ├── style.css (Estilos principais)
│   ├── gestao-style.css (Interface administrativa)
│   └── auth-style.css (Páginas de login)
├── 📄 Docs/
│   ├── README-autenticacao.md (Doc sistema auth)
│   └── README.md (Este arquivo)
└── 🔧 Config/
    ├── package.json (Dependências)
    ├── .env (Variáveis ambiente)
    └── railway.json (Deploy config)
```

---

## 🔧 Como Usar o Sistema

### **👨‍💼 Para Administradores**

1. **Acesse o painel**: `/admin.html`
2. **Gerencie autorizações**: `/admin-autorizacoes.html`
3. **Aprove funcionários** pendentes
4. **Configure sistema** e monitore logs

### **👥 Para Funcionários**

1. **Solicite cadastro**: `/cadastro-funcionario.html`
2. **Verifique email** com código enviado
3. **Crie senha** segura
4. **Aguarde autorização** do admin
5. **Acesse dashboard**: `/dashboard-funcionario.html`

### **🏥 Para Pacientes**

1. **Faça cadastro**: `/cadastro.html`
2. **Agende consulta**: Através do sistema
3. **Receba confirmações** por email
4. **Acesse histórico**: `/dashboard.html`

---

## 🚀 Deploy e Produção

### **Railway Deployment**

```yaml
# railway.json (automático)
build:
  command: npm run build
start:
  command: npm start

# Configuração automática
✅ PostgreSQL database conectado
✅ Variáveis de ambiente configuradas
✅ Deploy automático via GitHub
✅ SSL/HTTPS habilitado
```

### **URLs de Produção**

| Página | URL | Acesso |
|--------|-----|--------|
| 🏠 Home | `/index.html` | Público |
| 👥 Cadastro Funcionário | `/cadastro-funcionario.html` | Público |
| 🔐 Login | `/login.html` | Público |
| 👨‍💼 Admin | `/admin.html` | Admin only |
| 📋 Autorizações | `/admin-autorizacoes.html` | Admin only |
| 📊 Dashboard | `/dashboard.html` | Autenticado |

---

## 📊 Monitoramento e Logs

### **Health Check**

```bash
# Verificar status do sistema
curl https://portal-dr-marcio.railway.app/api/health

# Response esperado:
{
  "status": "OK",
  "database": "connected",
  "email": "configured",
  "timestamp": "2025-01-29T..."
}
```

### **Logs de Sistema**

```javascript
// Logs disponíveis
├── 🔑 auth.log (autenticação)
├── 📧 email.log (envios de email)
├── 🗄️ database.log (operações DB)
└── 🚨 error.log (erros do sistema)
```

---

## 🎯 Próximos Passos

### **Funcionalidades a Implementar**

- [ ] **Dashboard Analytics** com métricas em tempo real
- [ ] **Sistema de Notificações** push para admins
- [ ] **Backup Automático** dos dados críticos
- [ ] **API REST** completa para integração externa
- [ ] **App Mobile** com React Native
- [ ] **Relatórios PDF** automatizados

### **Melhorias de Segurança**

- [ ] **2FA (Two-Factor Auth)** para admins
- [ ] **Rate Limiting** avançado
- [ ] **Audit Log** completo
- [ ] **RBAC (Role-Based Access)** granular

---

## 📞 Suporte e Contato

### **Desenvolvedor**
- **Nome**: Marcio Scartozzoni
- **Email**: marcio@drmarcio.com.br
- **Projeto**: Portal Dr. Marcio v1.0.0

### **Sistema Support**
- **Status Page**: [Railway Dashboard](https://railway.app)
- **Database**: PostgreSQL Railway (99.9% uptime)
- **Email Service**: SendGrid (99.9% deliverability)

---

## 📄 Documentação Adicional

- 📋 [Sistema de Autenticação](./README-autenticacao.md) - Documentação detalhada do auth system
- 🔧 [Configuração de Email](./docs/email-setup.md) - Configuração do SendGrid
- 🗄️ [Database Schema](./docs/database-schema.md) - Estrutura do banco de dados
- 🎨 [UI/UX Guidelines](./docs/ui-guidelines.md) - Padrões de interface

---

**🎉 Sistema 100% funcional e em produção!**

*Última atualização: 29 de Janeiro de 2025*

Basta conectar no Railway e seu portal médico estará funcionando!
