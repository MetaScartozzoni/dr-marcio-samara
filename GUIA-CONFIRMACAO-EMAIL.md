# 🔧 GUIA: Corrigindo Erro de Confirmação de Email no Supabase

## ❌ Problema Identificado
O erro `Hook requires authorization token` indica que há um problema na configuração do Supabase, especificamente relacionado aos hooks de autenticação ou URLs de redirecionamento.

## ✅ Solução: Configuração do Supabase

### Passo 1: Acesse o Dashboard do Supabase
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto `portal-dr-marcio`

### Passo 2: Configurar URLs de Redirecionamento
1. No menu lateral, clique em **Authentication**
2. Clique em **Settings**
3. Na seção **Site URL**, configure:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** Adicione as seguintes URLs:
     ```
     http://localhost:3000/email-confirmation
     http://localhost:3000/login
     http://localhost:3000/dashboard
     ```

### Passo 3: Configurar Templates de Email
1. Ainda em **Authentication > Settings**
2. Clique na aba **Email Templates**
3. Configure o template **Confirm signup**:
   - **Subject:** `Confirme seu email - Portal Dr. Márcio`
   - **Message:** Use o template padrão, mas certifique-se de que o link de confirmação aponta para a URL correta

### Passo 4: Verificar Hooks (se aplicável)
1. Vá para **Database > Hooks**
2. Verifique se há hooks configurados
3. Se houver hooks relacionados à autenticação, certifique-se de que estão configurados corretamente

### Passo 5: Configurações Adicionais de Segurança
1. Em **Authentication > Settings**
2. Na seção **Security**:
   - **Enable email confirmations:** ✅ Ativado
   - **Enable email change confirmations:** ✅ Ativado (opcional)
   - **Minimum password length:** 6

## 🔄 Testando a Correção

### Método 1: Teste Local
1. Pare o servidor React (Ctrl+C)
2. Execute: `npm start`
3. Registre um novo usuário
4. Verifique o email e clique no link de confirmação
5. Deve redirecionar para: `http://localhost:3000/email-confirmation`

### Método 2: Verificar Logs do Supabase
1. No dashboard do Supabase
2. Vá para **Logs > Auth**
3. Procure por erros relacionados ao seu usuário

## 🚨 Se o Problema Persistir

### Opção A: Limpar Sessões
```bash
# Pare o servidor
pkill -f "react-scripts start"

# Limpe o cache do navegador
# Chrome: Ctrl+Shift+Delete > "Dados do site" > "Cookies e dados do site"

# Reinicie o servidor
npm start
```

### Opção B: Verificar Environment Variables
Certifique-se de que seu arquivo `.env` tem as variáveis corretas:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Opção C: Reset do Supabase Client
Se necessário, podemos modificar a configuração do Supabase para incluir mais opções de autenticação.

## 📞 Suporte Adicional

Se após seguir estes passos o problema persistir:

1. **Verifique os logs do navegador** (F12 > Console)
2. **Teste em modo incógnito** para descartar problemas de cache
3. **Forneça mais detalhes** sobre o erro específico

## 🎯 Resultado Esperado

Após a configuração correta:
- ✅ Emails de confirmação são enviados com sucesso
- ✅ Links de confirmação funcionam corretamente
- ✅ Usuários são redirecionados para a página de confirmação
- ✅ Não há mais erros de "Hook requires authorization token"

---

**Nota:** As configurações do Supabase podem levar alguns minutos para serem aplicadas globalmente.
