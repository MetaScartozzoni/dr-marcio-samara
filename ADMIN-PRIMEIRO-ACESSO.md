# 🔐 Acesso Inicial de Administrador - Portal Dr. Marcio

## 👨‍💼 **CONFIGURAÇÃO INICIAL DO ADMIN**

O sistema cria automaticamente um administrador padrão na primeira inicialização.

> ⚠️ **SEGURANÇA**: As credenciais padrão devem ser alteradas imediatamente após o primeiro acesso!

---

## 🚪 **Como Fazer o Primeiro Login**

### **1. Acesse a página de login:**
```
URL: https://portal-dr-marcio.railway.app/login.html
ou localmente: http://localhost:3000/login.html
```

### **2. Use as credenciais padrão:**
> 🔒 **Para obter as credenciais padrão, entre em contato com o desenvolvedor ou verifique a documentação interna segura.**

### **3. Você será redirecionado para:**
- **Dashboard Admin**: `/admin.html`
- **Gerenciar Autorizações**: `/admin-autorizacoes.html`

---

## 🔧 **O Que Fazer Após o Primeiro Login**

### **1. Alterar Senha Padrão**
```javascript
// OBRIGATÓRIO: No dashboard admin, vá em "Configurações de Conta"
// Altere a senha padrão para uma senha segura
// Use pelo menos 12 caracteres com números, letras e símbolos
```

### **2. Configurar Email Administrativo**
```env
# No arquivo .env, configure:
ADMIN_EMAIL=seu-email@clinica.com.br
SENDGRID_FROM_EMAIL=contato@clinica.com.br
```

### **3. Criar Novos Administradores**
```
1. Vá para /admin-autorizacoes.html
2. Cadastre novos funcionários como "admin"
3. Aprove as solicitações
4. Configure permissões específicas
```

---

## 🛡️ **Níveis de Acesso Após Login**

| Tipo de Usuário | Dashboard | Permissões |
|------------------|-----------|------------|
| **Admin** | `/admin.html` | ✅ Tudo (gestão completa, aprovar funcionários) |
| **Funcionário** | `/dashboard-funcionario.html` | 📋 Agendamentos, prontuários, caderno digital |
| **Médico** | `/dashboard-medico.html` | 🩺 Prontuários, prescrições, laudos |
| **Paciente** | `/dashboard.html` | 👤 Agendamentos próprios, histórico |

---

## 🔄 **Fluxo de Autorização de Funcionários**

Como **admin logado**, você pode:

### **1. Visualizar Solicitações Pendentes**
```
Acesse: /admin-autorizacoes.html
Veja: Lista de funcionários aguardando aprovação
```

### **2. Aprovar/Rejeitar Funcionários**
```
✅ Aprovar → Funcionário recebe email e pode acessar o sistema
❌ Rejeitar → Funcionário é notificado da recusa
⏸️ Suspender → Bloquear acesso temporariamente
🔄 Reativar → Restaurar acesso suspenso
```

### **3. Gerenciar Equipe**
```
📊 Painel Admin → Ver todos os funcionários
👥 Quadro de Funcionários → Status e permissões
📋 Relatórios → Logs de atividade
```

---

## 🆘 **Problemas Comuns e Soluções**

### **❌ "Usuário não encontrado"**
```bash
# Verificar se admin existe no banco
# O sistema cria automaticamente na inicialização
```

### **❌ "Senha incorreta"**
```bash
# Verificar com o desenvolvedor as credenciais atuais
# Verificar se não há espaços extras no email/senha
```

### **❌ "Acesso negado"**
```bash
# Verificar se está usando o email de admin correto
# Verificar se tipo de usuário é 'admin'
```

### **❌ Página não carrega**
```bash
# Verificar se o servidor está rodando
# Verificar conexão com banco de dados Railway
```

---

## 🔧 **Comandos de Manutenção**

### **Verificar Status do Admin**
```bash
# Ver se admin existe no banco
node -e "console.log('Admin configurado automaticamente na inicialização')"
```

### **Resetar Senha do Admin**
```bash
# ATENÇÃO: Operação sensível - apenas para emergências
# Conectar ao PostgreSQL Railway via console seguro
# Gerar novo hash de senha e atualizar no banco
```

### **Criar Admin Adicional**
```sql
-- Operação via console administrativo seguro
-- Gerar hash de senha segura antes da inserção
-- INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES (...)
```

---

## 📞 **Suporte**

### **Sistema funcionando mas admin não consegue logar:**
1. ✅ Verificar credenciais exatas
2. ✅ Limpar cache do navegador  
3. ✅ Verificar console do navegador para erros
4. ✅ Testar em aba anônima

### **Sistema não inicializa:**
1. ✅ Verificar se Railway PostgreSQL está ativo
2. ✅ Verificar variáveis de ambiente
3. ✅ Verificar logs do Railway dashboard

---

**🎯 RESUMO: Entre em contato com o desenvolvedor para obter as credenciais de primeiro acesso seguras!**

*Última atualização: 30 de Julho de 2025*
