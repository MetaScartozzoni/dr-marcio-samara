# 🔐 GUIA: Resolvendo Problemas de Login

## 🚨 **PROBLEMA: "Email e senha incorretos"**

### **Possíveis causas e soluções:**

---

## 🔍 **SOLUÇÃO 1: Verificar Email e Senha**

### **Passos:**
1. **Confirme o email:** Use exatamente o mesmo email do cadastro
2. **Verifique a senha:** 
   - Deve ter pelo menos 8 caracteres
   - Deve conter letras maiúsculas E minúsculas
   - Deve conter números
   - Deve conter caracteres especiais (!@#$%^&*)
3. **Digite novamente:** Copie e cole para evitar erros de digitação

---

## 📧 **SOLUÇÃO 2: Confirmação de Email**

### **Se o Supabase exigir confirmação:**

1. **Verifique seu email** (incluindo spam)
2. **Procure por:** "Confirme seu email" do Supabase
3. **Clique no link** para confirmar
4. **Tente fazer login novamente**

### **Se não recebeu o email:**
- Tente fazer um novo cadastro com outro email
- Ou aguarde alguns minutos e tente novamente

---

## 🔧 **SOLUÇÃO 3: Reset de Senha**

### **Se esqueceu a senha:**
1. Clique em **"Esqueci a senha?"**
2. Digite seu email
3. Verifique seu email para o link de reset
4. Siga as instruções para criar uma nova senha

---

## 🛠️ **SOLUÇÃO 4: Verificar Status da Conta**

### **Testar conexão:**
```bash
node test-supabase.js
```

**Se aparecer erro:** Há problema com a configuração
**Se estiver OK:** Problema é com email/senha

---

## 🎯 **DICAS PARA EVITAR PROBLEMAS:**

### **Ao criar senha:**
- Use pelo menos **8 caracteres**
- Misture **letras maiúsculas e minúsculas**
- Adicione **números**
- Inclua **caracteres especiais** (!@#$%^&*)

### **Exemplos de senhas fortes:**
- `MinhaClinica2024!`
- `DrMarcio@2025`
- `PortalMedico#123`

---

## 🚨 **SE NADA FUNCIONAR:**

### **Opção A: Novo cadastro**
1. Use um **email diferente**
2. Crie uma **senha mais forte**
3. Anote a senha em algum lugar seguro

### **Opção B: Verificar console do navegador**
1. Pressione **F12**
2. Vá para aba **Console**
3. Procure por mensagens de erro
4. Compartilhe os erros comigo

---

## 📱 **TESTE RÁPIDO:**

### **Tente estes passos:**
1. **Acesse:** `http://localhost:3000`
2. **Novo cadastro:** Use email `teste123@example.com`
3. **Senha forte:** `TesteClinica2024!`
4. **Confirme email** (se necessário)
5. **Teste login**

---

## 🎉 **DEPOIS DE RESOLVER:**

### **Próximos passos:**
- ✅ **Login funcionando**
- 🔄 **Personalizar dashboard**
- 📱 **Testar em mobile**
- 🎨 **Melhorar design**

---

## 💡 **PERGUNTA:**

**Você consegue se lembrar:**
- Do email usado no cadastro?
- Se criou uma senha forte?
- Se recebeu algum email de confirmação?

**Qual dessas opções você quer tentar primeiro?** 🤔
