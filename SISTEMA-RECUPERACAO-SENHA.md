# 🔑 SISTEMA DE RECUPERAÇÃO DE SENHA - DOCUMENTAÇÃO COMPLETA

## 📋 Visão Geral

Sistema completo de "Esqueci minha senha" implementado com as melhores práticas de segurança e experiência do usuário, incluindo:

- ✅ Código de 6 dígitos enviado por email
- ✅ Interface moderna e responsiva
- ✅ Logs completos de segurança
- ✅ Rate limiting e proteções anti-abuse
- ✅ Validações robustas
- ✅ Experiência do usuário otimizada

## 🏗️ Arquitetura do Sistema

### Frontend
- **esqueci-senha.html** - Interface do usuário em 3 etapas
- **config-seguro.js** - Configurações de segurança integradas

### Backend
- **sistema-recuperacao-senha.js** - Classe principal do sistema
- **rotas-recuperacao-senha.js** - Endpoints da API
- **database-schema-recuperacao.sql** - Schema do banco de dados

### Integração
- **server.js** - Servidor principal com rotas registradas
- **login.html** - Link "Esqueci minha senha" adicionado

## 🔒 Recursos de Segurança

### 1. **Proteção contra Ataques**
```javascript
// Rate limiting por IP
const limiteRecuperacao = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas por IP
});

// Verificação de existência de email sem revelação
// Sempre retorna "sucesso" para não expor emails válidos
```

### 2. **Validação de Código**
- Código de 6 dígitos numéricos aleatórios
- Validade de 5 minutos (configurável)
- Máximo 3 tentativas por código
- Hash seguro para armazenamento

### 3. **Logs de Auditoria**
```javascript
// Todos os eventos são logados
const eventos = [
    'solicitacao_recuperacao',
    'codigo_enviado', 
    'codigo_verificado',
    'senha_redefinida',
    'tentativa_codigo_invalido',
    'rate_limit_atingido'
];
```

### 4. **Proteção de Dados**
- Emails mascarados nos logs
- Códigos hasheados no banco
- Senhas nunca armazenadas em texto plano
- Limpeza automática de dados expirados

## 🎨 Experiência do Usuário

### Interface de 3 Etapas

#### **Etapa 1: Solicitar Código**
- Campo de email com validação
- Feedback imediato sobre envio
- Proteção contra spam/abuse

#### **Etapa 2: Verificar Código**
- 6 campos individuais para dígitos
- Navegação automática entre campos
- Timer de countdown visual
- Botão para reenviar código
- Suporte a colar código completo

#### **Etapa 3: Nova Senha**
- Validação de força da senha
- Confirmação de senha
- Feedback em tempo real

### Recursos de UX
```javascript
// Navegação automática entre campos
function moveToNext(current, nextId) {
    if (current.value.length === 1 && nextId) {
        current.classList.add('valid');
        document.getElementById(nextId).focus();
    }
}

// Suporte a colar código
document.addEventListener('paste', (e) => {
    const paste = e.clipboardData.getData('text');
    if (paste.length === 6 && /^\d{6}$/.test(paste)) {
        // Preenche automaticamente todos os campos
    }
});
```

## 🛠️ Implementação

### 1. **Instalar Dependências**
```bash
npm install nodemailer express-rate-limit
```

### 2. **Configurar Email**
```bash
# Copiar arquivo de configuração
cp config-email-recuperacao.env .env

# Editar com suas credenciais
# Para Gmail: gere uma "Senha de App"
# Para outros provedores: use credenciais SMTP
```

### 3. **Configurar Banco de Dados**
```sql
-- Executar o schema
mysql -u usuario -p database < database-schema-recuperacao.sql
```

### 4. **Integrar no Servidor**
```javascript
// Já integrado no server.js
const rotasRecuperacao = require('./rotas-recuperacao-senha');
app.use('/api/auth', rotasRecuperacao);
```

## 📧 Configuração de Email

### Gmail/Google Workspace
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=sistema@drmarcio.com
EMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxxxxxxxxxxxxx
```

### Outros Provedores
```env
SMTP_HOST=mail.seudominio.com
SMTP_PORT=587
SMTP_SECURE=true
EMAIL_USER=sistema@seudominio.com
EMAIL_PASS=sua_senha
```

## 🔄 Fluxo Completo

### 1. **Usuário Clica "Esqueci Senha"**
```
login.html → esqueci-senha.html
```

### 2. **Solicita Código**
```javascript
POST /api/auth/solicitar-recuperacao
{
    "email": "usuario@email.com"
}

// Resposta (sempre sucesso por segurança)
{
    "sucesso": true,
    "message": "Se o email estiver cadastrado, você receberá o código."
}
```

### 3. **Sistema Envia Email**
```javascript
// Template HTML rico com código
// Validade: 5 minutos
// Código: 6 dígitos aleatórios
```

### 4. **Usuário Digita Código**
```javascript
POST /api/auth/verificar-codigo-recuperacao
{
    "email": "usuario@email.com",
    "codigo": "123456"
}

// Resposta se válido
{
    "sucesso": true,
    "message": "Código verificado com sucesso.",
    "token": "abc123..."
}
```

### 5. **Define Nova Senha**
```javascript
POST /api/auth/redefinir-senha
{
    "email": "usuario@email.com",
    "novaSenha": "novaSenha123",
    "token": "abc123..."
}

// Resposta
{
    "sucesso": true,
    "message": "Senha redefinida com sucesso."
}
```

### 6. **Redirecionamento**
```javascript
// Usuário é redirecionado para login
window.location.href = `/login.html?email=${email}`;
```

## 📊 Monitoramento e Logs

### Logs de Segurança
```javascript
// Exemplo de log
{
    "timestamp": "2025-08-01T14:30:00.000Z",
    "evento": "codigo_verificado",
    "email": "us***@email.com", // mascarado
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "detalhes": {
        "tentativa": 1,
        "metodo": "recuperacao_codigo"
    }
}
```

### Relatórios Disponíveis
```sql
-- Relatório diário
SELECT * FROM vw_relatorio_recuperacao 
WHERE data >= CURDATE() - INTERVAL 7 DAY;

-- Monitoramento de segurança
SELECT * FROM vw_monitoramento_seguranca;

-- Executar limpeza manual
CALL LimparDadosAntigos();
```

## 🚨 Alertas de Segurança

### Indicadores de Atividade Suspeita
- Mais de 5 solicitações do mesmo IP em 15 minutos
- Mais de 3 códigos inválidos para o mesmo email
- Múltiplos emails diferentes do mesmo IP
- Tentativas fora do horário comercial (configurável)

### Logs Críticos
- `rate_limit_atingido` - IP bloqueado temporariamente
- `tentativa_codigo_invalido` - Múltiplas tentativas inválidas
- `erro_envio_email` - Problemas na infraestrutura

## 🧪 Testes

### Teste Manual
1. Acesse `/login.html`
2. Clique "🔑 Esqueci a senha?"
3. Digite um email válido
4. Verifique o email recebido
5. Digite o código de 6 dígitos
6. Defina nova senha
7. Teste login com nova senha

### Teste de Segurança
1. Tente 6 solicitações rápidas (deve bloquear)
2. Digite código inválido 4 vezes (deve bloquear)
3. Aguarde expiração do código (5 minutos)
4. Teste com email inexistente (deve fingir sucesso)

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- 📱 Dispositivos móveis
- 💻 Tablets
- 🖥️ Desktops
- ⌚ Smartwatches (básico)

## 🔧 Configurações Avançadas

### Personalização de Tempo
```javascript
// No sistema-recuperacao-senha.js
this.validadeMinutos = process.env.RECUPERACAO_VALIDADE_MINUTOS || 5;
this.maxTentativas = process.env.RECUPERACAO_MAX_TENTATIVAS || 3;
```

### Template de Email Customizado
```javascript
// Método gerarTemplateEmail() pode ser personalizado
// Suporte a logos, cores da marca, etc.
```

### Integração com SMS (Futuro)
```javascript
// Sistema preparado para adicionar SMS como alternativa
// Basta implementar método enviarCodigoSMS()
```

## 🚀 Deploy

### Variáveis de Ambiente Necessárias
```env
# Essenciais
EMAIL_USER=sistema@drmarcio.com
EMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
SALT_SISTEMA=seu_salt_unico_aqui

# Opcionais
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
RECUPERACAO_VALIDADE_MINUTOS=5
```

### Verificação Pós-Deploy
1. ✅ Logs de sistema funcionando
2. ✅ Email sendo enviado corretamente  
3. ✅ Rate limiting ativo
4. ✅ Banco de dados configurado
5. ✅ Interface responsiva

## 📞 Suporte

### Problemas Comuns

**Email não está sendo enviado:**
- Verifique credenciais SMTP
- Confirme que "Senhas de App" está habilitado (Gmail)
- Verifique logs do servidor

**Código sempre inválido:**
- Verificar timezone do servidor
- Confirmar hash da senha no banco
- Verificar logs de validação

**Interface não carrega:**
- Confirmar que `config-seguro.js` existe
- Verificar console do navegador
- Testar em modo privado/incógnito

### Logs Úteis
```bash
# Logs do sistema
tail -f logs/recuperacao-*.log

# Logs do servidor
tail -f logs/server.log

# Logs de email
tail -f logs/email.log
```

## 🔄 Manutenção

### Limpeza Automática
- Códigos expirados: removidos a cada 10 minutos
- Logs antigos: removidos após 90 dias
- Rate limiting: resetado a cada 24 horas

### Backup de Dados
```sql
-- Backup dos logs importantes
SELECT * FROM logs_recuperacao_senha 
WHERE data_criacao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
INTO OUTFILE 'backup_recuperacao.csv';
```

---

## ✅ Sistema Pronto para Produção

O sistema de recuperação de senha está **completamente implementado** e segue todas as melhores práticas de:

- 🔒 **Segurança** - Rate limiting, logs, validações
- 🎨 **UX/UI** - Interface moderna e intuitiva  
- 📱 **Responsividade** - Funciona em todos os dispositivos
- 🛡️ **Auditoria** - Logs completos para compliance
- ⚡ **Performance** - Otimizado e escalável
- 🔧 **Manutenção** - Limpeza automática e monitoramento

**O sistema está pronto para uso em produção!** 🚀
