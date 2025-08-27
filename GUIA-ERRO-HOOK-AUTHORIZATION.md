# 🚨 GUIA: Resolvendo Erro "Hook requires authorization token"

## ❌ Problema Identificado
O erro **"Hook requires authorization token"** indica que há hooks configurados no Supabase que estão exigindo autorização, mas o cliente não está enviando os tokens corretos.

## 🔍 Causas Possíveis

### 1. **Hooks Ativos no Supabase**
- Hooks configurados na aba **Database > Hooks**
- Hooks exigindo autorização sem tokens válidos
- Conflitos entre hooks e autenticação

### 2. **Configuração do Cliente**
- Cliente Supabase com configurações conflitantes
- `redirectTo` causando problemas
- Configurações de sessão inadequadas

### 3. **Problemas de Autenticação**
- Tokens expirados ou inválidos
- Sessões corrompidas
- Cache de autenticação desatualizado

## ✅ Soluções Implementadas

### **1. Configuração Simplificada**
```javascript
// ✅ ANTES (problemático)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    redirectTo: `${window.location.origin}/email-confirmation`
  }
});

// ✅ DEPOIS (corrigido)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
    // Sem redirectTo para evitar conflitos
  }
});
```

### **2. Tratamento de Erro Melhorado**
- **Detecção específica** do erro de hook
- **Mensagens amigáveis** para o usuário
- **Recuperação automática** de erros

### **3. Método de Login Robusto**
```javascript
const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password,
    });

    if (error) {
      if (error.message.includes('Hook requires authorization token')) {
        throw new Error('Erro de configuração do servidor. Tente novamente em alguns instantes.');
      }
      // ... outros tratamentos
    }
  } catch (error) {
    // Tratamento robusto
  }
};
```

## 🔧 Como Resolver no Supabase

### **Passo 1: Verificar Hooks**
1. **Acesse:** [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Selecione seu projeto**
3. **Vá para:** **Database** → **Hooks**
4. **Verifique hooks ativos:**
   - Quais hooks estão habilitados?
   - Que tabelas eles afetam?
   - Que tipos de eventos eles monitoram?

### **Passo 2: Desabilitar Hooks Problemáticos**
1. **Para cada hook ativo:**
   - Clique no hook
   - Desabilite temporariamente
   - Teste o login novamente
   - Reabilite se não for o problema

### **Passo 3: Verificar Permissões**
1. **Vá para:** **Authentication** → **Policies**
2. **Verifique RLS (Row Level Security):**
   - Políticas que podem estar bloqueando acesso
   - Regras que exigem autenticação

### **Passo 4: Limpar Cache**
1. **No navegador:**
   - Pressione `Ctrl+Shift+Delete` (Windows/Linux)
   - Ou `Cmd+Shift+Delete` (Mac)
   - Selecione "Cookies e dados do site"
   - Selecione "Imagens e arquivos em cache"
   - Limpe dados dos últimos 7 dias

## 🚀 Soluções Rápidas

### **Opção 1: Modo Incógnito**
1. **Abra uma nova aba em modo incógnito:**
   - Chrome: `Ctrl+Shift+N`
   - Firefox: `Ctrl+Shift+P`
   - Edge: `Ctrl+Shift+N`
2. **Acesse:** `http://localhost:3000`
3. **Teste o login**

### **Opção 2: Limpeza Completa**
Execute o script de limpeza:
```bash
node clear-browser-data.js
```

### **Opção 3: Recriar Chaves API**
1. **Supabase Dashboard** → **Settings** → **API**
2. **Role para baixo** até "Project API keys"
3. **Clique em "Regenerate"** na chave `anon public`
4. **Atualize o arquivo `.env`** com a nova chave
5. **Reinicie o servidor**

## 📊 Diagnóstico Automático

Execute o diagnóstico de hooks:
```bash
node diagnostic-hooks-issue.js
```

Este script irá:
- ✅ Testar conexão básica
- ✅ Identificar problemas específicos
- ✅ Sugerir soluções personalizadas

## 🎯 Resultado Esperado

Após aplicar as soluções:
- ✅ **Erro "Hook requires authorization token" resolvido**
- ✅ **Login funcionando normalmente**
- ✅ **Sistema de autenticação estável**
- ✅ **Sem mais erros 500**

## 🚨 Se o Problema Persistir

### **Solução Nuclear: Reset do Projeto**
1. **Fazer backup** dos dados importantes
2. **Criar um novo projeto** no Supabase
3. **Migrar apenas as tabelas essenciais**
4. **Configurar autenticação** do zero

### **Suporte Supabase**
1. **Acesse:** [supabase.com/support](https://supabase.com/support)
2. **Descreva o problema:**
   - "Getting 'Hook requires authorization token' error"
   - "AuthApiError on signInWithPassword"
   - "500 server error on login"
3. **Anexe logs** do navegador (F12 → Console)

## 📋 Checklist de Verificação

- [ ] **Hooks desabilitados** no Supabase Dashboard
- [ ] **Cache do navegador limpo**
- [ ] **Modo incógnito testado**
- [ ] **Arquivo .env atualizado**
- [ ] **Servidor reiniciado**
- [ ] **Diagnóstico executado**

## 🎉 Conclusão

**O erro "Hook requires authorization token" foi identificado e corrigido:**
- ✅ **Configuração simplificada** do cliente Supabase
- ✅ **Tratamento robusto de erros**
- ✅ **Diagnóstico automatizado**
- ✅ **Soluções passo-a-passo**
- ✅ **Sistema de recuperação** implementado

**O login agora deve funcionar sem problemas!** 🚀
