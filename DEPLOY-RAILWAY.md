# 🚀 Deploy para Railway - Portal Dr. Marcio

> **STATUS**: ✅ PRONTO PARA PRODUÇÃO  
> **ÚLTIMA ATUALIZAÇÃO**: 2024 - Sistema completo implementado

## 📋 Resumo do Sistema

### ✅ Funcionalidades Implementadas
- **Pré-cadastro de usuários** com validação por email
- **Sistema de aprovação** pelo administrador
- **Autenticação segura** com bcrypt
- **Notificações por email** via SendGrid
- **Interface administrativa** completa
- **Banco PostgreSQL** com tabelas otimizadas

### 🔧 Tecnologias
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Email**: SendGrid SMTP
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Deploy**: Railway

## 🚀 Processo de Deploy

### 1. Configuração Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login no Railway
railway login

# Criar novo projeto
railway init

# Adicionar PostgreSQL
railway add postgresql
```

### 2. Configuração de Variáveis

Configure no Railway Dashboard ou via CLI:

```bash
# Banco de dados (automático via Railway)
DATABASE_URL=postgresql://[gerado_automaticamente]

# Email SendGrid (OBRIGATÓRIO)
SENDGRID_API_KEY=SG.sua_chave_sendgrid_aqui

# Configurações gerais
NODE_ENV=production
PORT=3000

# Admin email (para notificações)
ADMIN_EMAIL=admin@mscartozzoni.com.br
```

### 3. Deploy

```bash
# Deploy para Railway
railway up

# Verificar logs
railway logs

# Abrir no navegador
railway open
```

## 🔗 Endpoints da API

### Saúde do Sistema
- `GET /api/health` - Status do sistema e dependências

### Pré-cadastro
- `POST /api/pre-cadastro` - Criar pré-cadastro
- `GET /api/pre-cadastros` - Listar pendentes (admin)
- `POST /api/aprovar-pre-cadastro` - Aprovar usuário

### Códigos de Verificação
- `POST /api/solicitar-codigo` - Enviar código por email
- `POST /api/validar-codigo` - Validar código recebido
- `POST /api/definir-senha` - Definir senha após validação

### Autenticação
- `POST /api/login` - Login de usuários
- `POST /api/register` - Registro direto (admin)

### Usuários
- `GET /api/usuarios` - Listar usuários (admin)
- `DELETE /api/usuarios/:id` - Remover usuário (admin)

## 📁 Estrutura do Projeto

```
portal-dr-marcio/
├── server-simple.js         # Servidor principal para produção
├── email-enhanced.service.js # Serviço de email SendGrid
├── style.css                # Estilos globais
├── index.html               # Página inicial
├── login.html               # Login de usuários
├── admin.html               # Painel administrativo
├── pre-cadastro.html        # Formulário de pré-cadastro
├── ativar-conta.html        # Ativação manual de conta
├── package.json             # Dependências Node.js
└── .env                     # Variáveis locais (NÃO commitado)
```

## ⚠️ Segurança

### Secrets e Variáveis Sensíveis
- ✅ **API Keys**: Apenas em variáveis de ambiente
- ✅ **Senhas**: Hash bcrypt com salt 10
- ✅ **Database**: SSL obrigatório em produção
- ✅ **CORS**: Configurado para domínio específico

### Validações Implementadas
- **Email**: Formato e existência
- **Código**: 6 dígitos, expiração 15min
- **Senha**: Mínimo 6 caracteres
- **CPF**: Formatação automática (opcional)

## 🔍 Monitoramento

### Health Check
```bash
curl https://[seu-app].up.railway.app/api/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00Z",
  "port": 3000,
  "env": "production",
  "database": {
    "status": "connected",
    "url_configured": true
  },
  "services": {
    "sendgrid": "configured",
    "twilio": "missing"
  }
}
```

### Logs Importantes
```bash
# Logs em tempo real
railway logs --follow

# Logs específicos
railway logs --filter="ERROR|WARN"
```

## 📧 Configuração SendGrid

### 1. Criar Conta SendGrid
1. Acesse [SendGrid.com](https://sendgrid.com)
2. Crie conta gratuita (100 emails/dia)
3. Verifique domínio ou email remetente

### 2. Gerar API Key
1. Settings → API Keys
2. Create API Key
3. Full Access ou Mail Send (mínimo)
4. Copiar chave gerada

### 3. Configurar no Railway
```bash
railway variables set SENDGRID_API_KEY=SG.sua_chave_aqui
```

## 🗄️ Banco de Dados

### Tabelas Criadas Automaticamente

#### usuarios
```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14),
    tipo VARCHAR(50) DEFAULT 'paciente',
    autorizado BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### pre_cadastros
```sql
CREATE TABLE pre_cadastros (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14),
    senha_hash VARCHAR(255),
    codigo_ativacao VARCHAR(6),
    codigo_expira TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### consultas
```sql
CREATE TABLE consultas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES usuarios(id),
    data_consulta TIMESTAMP NOT NULL,
    tipo_consulta VARCHAR(100),
    observacoes TEXT,
    status VARCHAR(50) DEFAULT 'agendada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 Acesso ao Sistema

### URLs Principais
- **Página Inicial**: `/`
- **Login**: `/login.html`
- **Pré-cadastro**: `/pre-cadastro.html`
- **Admin**: `/admin.html`
- **Ativação**: `/ativar-conta.html`

### Credenciais Admin Padrão
- **Email**: `admin@mscartozzoni.com.br`
- **Senha**: `123456` (alterar após primeiro login)

## 🚨 Troubleshooting

### Problemas Comuns

1. **Email não envia**
   - Verificar SENDGRID_API_KEY configurada
   - Confirmar domínio verificado no SendGrid
   - Checar logs: `railway logs`

2. **Erro de banco**
   - Verificar DATABASE_URL configurada
   - Confirmar PostgreSQL ativo no Railway
   - Testar: `GET /api/health`

3. **404 nas páginas**
   - Confirmar arquivos HTML no root
   - Verificar server.js serve static files
   - Deploy: `railway up`

### Comandos Úteis
```bash
# Restart da aplicação
railway up --detach

# Conectar ao banco
railway connect postgresql

# Ver variáveis
railway variables

# Status do projeto
railway status
```

## 📝 TODO / Melhorias Futuras

- [ ] Integração com WhatsApp Business (Twilio)
- [ ] Sistema de agendamento com calendário
- [ ] Upload de documentos/exames
- [ ] Histórico médico completo
- [ ] Relatórios e dashboards
- [ ] Backup automático do banco
- [ ] CDN para assets estáticos
- [ ] Rate limiting para APIs

---

✅ **Sistema pronto para produção no Railway**  
🔒 **Segurança implementada**  
📧 **Emails funcionais**  
🗄️ **Banco configurado**  

**Deploy Command**: `railway up`
