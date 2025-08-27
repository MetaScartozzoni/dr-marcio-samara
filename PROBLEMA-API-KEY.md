# 🔧 Problema Identificado: Invalid API Key

## 📋 Diagnóstico

Após executar testes completos, foi identificado que:

### ✅ O que está funcionando:
- Conexão básica com Supabase
- Cliente Supabase criado com sucesso
- Variáveis de ambiente carregadas corretamente
- URL do Supabase válida

### ❌ O que não está funcionando:
- Todas as operações de autenticação (signup, signin, OTP)
- Acesso a tabelas do banco de dados
- Edge Functions (se aplicável)

**Erro:** `Invalid API key` (Código: 401)

## 🔍 Possíveis Causas

1. **Chave API Expirada/Revogada**
   - A chave anônima pode ter expirado
   - A chave pode ter sido revogada no painel do Supabase

2. **Configuração do Projeto**
   - Projeto Supabase pode ter sido pausado/desativado
   - Configurações de autenticação podem estar incorretas

3. **Permissões Insuficientes**
   - A chave anônima pode não ter permissões para operações de auth
   - Políticas RLS podem estar bloqueando o acesso

## 🛠️ Soluções

### 1. Verificar Status do Projeto Supabase
```bash
# Acesse: https://supabase.com/dashboard
# Verifique se o projeto está ativo
# Verifique as configurações de autenticação
```

### 2. Regenerar Chave API
```bash
# No painel do Supabase:
# 1. Vá para Settings > API
# 2. Role até "Project API keys"
# 3. Clique em "Regenerate" para a chave anon/public
# 4. Atualize o arquivo .env com a nova chave
```

### 3. Verificar Configurações de Autenticação
```bash
# No painel do Supabase:
# 1. Vá para Authentication > Settings
# 2. Verifique se "Enable email confirmations" está configurado
# 3. Verifique as configurações de SMTP
# 4. Verifique os URLs de redirect
```

### 4. Atualizar .env
```env
REACT_APP_SUPABASE_URL=https://obohdaxvawmjhxsjgikp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=
```

## 🧪 Como Testar a Correção

Após aplicar as correções:

```bash
# Teste básico
node test-supabase-basic.js

# Teste de autenticação
node test-supabase-auth.js

# Teste do sistema OTP
node test-otp-system.js

# Teste do sistema de troca de token
node test-token-exchange.js
```

## 📞 Próximos Passos

1. **Verificar painel do Supabase**
2. **Regenerar chave API se necessário**
3. **Atualizar arquivo .env**
4. **Testar novamente**
5. **Se persistir, verificar configurações do projeto**

## 💡 Dicas Adicionais

- Mantenha as chaves API seguras
- Não commite chaves API no Git
- Use variáveis de ambiente para diferentes ambientes
- Configure RLS policies adequadamente
- Monitore o uso da API no painel do Supabase

---

**Status:** Aguardando correção da chave API no painel do Supabase
