# 🚨 GUIA: Problema de Senha Fraca no Supabase

## ❌ Problema Identificado
O Supabase está rejeitando senhas com erro: **"Password is known to be weak and easy to guess"**

Isso acontece mesmo com senhas aparentemente fortes como `TestPassword123!@#`.

## 🔍 Causas Possíveis

### 1. **Política de Senha Muito Rigorosa**
- O Supabase tem configurações de segurança muito strict
- Mesmo senhas complexas são rejeitadas
- Pode estar usando dicionários de senhas comuns

### 2. **Configurações de Segurança**
- Minimum password length muito alta
- Requisitos especiais de caracteres
- Bloqueio de padrões comuns

### 3. **Rate Limiting Indireto**
- Mesmo sem rate limit direto, pode haver bloqueio por tentativas

## ✅ Soluções

### **Solução 1: Configurar Política de Senha no Supabase**

#### Passo 1: Acesse o Dashboard
1. Vá para [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto `portal-dr-marcio`

#### Passo 2: Ajustar Configurações de Segurança
1. **Authentication** → **Settings**
2. **Security** → **Password Requirements**
3. Ajuste as configurações:
   - **Minimum password length:** 8 (ao invés de 12+)
   - **Require uppercase:** ✅ Sim
   - **Require lowercase:** ✅ Sim
   - **Require numbers:** ✅ Sim
   - **Require symbols:** Opcional

#### Passo 3: Desabilitar Validações Muito Rigorosas
1. Vá para **Authentication** → **Settings** → **Security**
2. Procure por configurações de validação de senha
3. Desabilite validações muito rigorosas se possível

### **Solução 2: Senhas Recomendadas**

Use estas senhas que geralmente passam:

```
✅ Boas senhas:
- MinhaSenha123!
- Portal2024!@
- Supabase2025#
- Medico2024!*
- Sistema123!@

❌ Evite:
- password123
- 123456789
- qwerty123
- senha123
- admin123
```

### **Solução 3: Verificar Tentativas Anteriores**

#### Passo 1: Limpar Tentativas
```bash
# Pare o servidor
pkill -f "react-scripts start"

# Limpe dados do navegador
# Chrome: Ctrl+Shift+Delete > "Dados do site" > "Cookies e dados do site"
```

#### Passo 2: Teste com Novo Email
1. Use um email completamente novo
2. Use uma das senhas recomendadas acima
3. Teste o registro

### **Solução 4: Verificar Rate Limiting**

#### Passo 1: Acesse os Logs
1. **Supabase Dashboard** → **Authentication** → **Logs**
2. Procure por:
   - "rate limit"
   - "password"
   - "weak"
   - "signup"

#### Passo 2: Verificar Rate Limits
1. **Authentication** → **Rate Limits**
2. Verifique se há bloqueios ativos
3. Ajuste os limites se necessário

## 🔧 Configuração Rápida Recomendada

### **Para Desenvolvimento/Teste:**

#### 1. Configurações de Segurança
```
Minimum password length: 8
Require uppercase: ✅ Sim
Require lowercase: ✅ Sim
Require numbers: ✅ Sim
Require symbols: ❌ Não (tornar opcional)
```

#### 2. Rate Limiting
```
Signup: 10 por hora (aumentar se necessário)
Email: 5 por hora (aumentar se necessário)
```

### **Para Produção:**
```
Minimum password length: 12
Require uppercase: ✅ Sim
Require lowercase: ✅ Sim
Require numbers: ✅ Sim
Require symbols: ✅ Sim
```

## 🚀 Como Testar

### **Passo 1: Aplicar Configurações**
1. Faça as mudanças no dashboard do Supabase
2. Aguarde 2-3 minutos para aplicar

### **Passo 2: Testar Registro**
```bash
# Pare o servidor atual
pkill -f "react-scripts start"

# Reinicie
npm start
```

### **Passo 3: Teste com Senha Recomendada**
1. Acesse `http://localhost:3000`
2. Use email novo: `teste123@example.com`
3. Use senha: `MinhaSenha123!`
4. Complete o registro

## 📊 Monitoramento

### **Verificar se Funcionou:**
1. **Supabase Dashboard** → **Authentication** → **Users**
2. Deve aparecer o novo usuário
3. **Authentication** → **Logs** → Deve mostrar registro bem-sucedido

### **Se Ainda Não Funcionar:**

#### **Opção A: Suporte Supabase**
1. Vá para [supabase.com/support](https://supabase.com/support)
2. Descreva o problema: "Password validation too strict"
3. Peça para ajustar as configurações

#### **Opção B: Configuração Personalizada**
1. Considere usar um provedor de email personalizado
2. Configure SMTP próprio no Supabase
3. Isso dá mais controle sobre validações

## 🎯 Resumo

**Problema Principal:** Política de senha muito rigorosa no Supabase

**Solução Mais Rápida:**
1. Acesse Supabase Dashboard
2. Authentication → Settings → Security
3. Reduza os requisitos de senha
4. Teste com senhas recomendadas

**Tempo Estimado:** 5-10 minutos

---

**Nota:** As configurações do Supabase podem levar alguns minutos para serem aplicadas globalmente.
