# 🚀 GUIA DEFINITIVO: IMPLEMENTAR SISTEMA DE PERFIS FUNCIONAL
# ================================================================

## ✅ DIAGNÓSTICO CONFIRMADO:
- **Conectividade Supabase:** ✅ FUNCIONANDO
- **Tabela usuarios:** ❌ NÃO EXISTE (precisa criar)
- **Tabela profiles:** ⚠️ COM PROBLEMAS (será substituída)
- **Sistema de cadastro:** 🔄 AGUARDANDO TABELAS

## 🎯 SOLUÇÃO: CRIAR TABELA USUARIOS

### 📋 PASSO A PASSO:

#### 1. ACESSAR SUPABASE DASHBOARD
```
🔗 https://supabase.com/dashboard
→ Seu projeto: obohdaxvawmjhxsjgikp
→ Menu lateral: SQL Editor
→ Clique em "New Query"
```

#### 2. EXECUTAR COMANDOS SQL (UM POR VEZ)

```sql
-- ===========================================
-- COMANDO 1: CRIAR TABELA USUARIOS
-- ===========================================
CREATE TABLE IF NOT EXISTS usuarios (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    nome text NOT NULL,
    tipo_usuario text NOT NULL DEFAULT 'paciente'
        CHECK (tipo_usuario IN ('admin', 'medico', 'funcionario', 'paciente')),
    status text NOT NULL DEFAULT 'aguardando_aprovacao'
        CHECK (status IN ('ativo', 'inativo', 'aguardando_aprovacao', 'bloqueado')),
    telefone text,
    data_nascimento date,
    endereco jsonb,
    permissions jsonb DEFAULT '[]'::jsonb,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ===========================================
-- COMANDO 2: CRIAR ÍNDICES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

-- ===========================================
-- COMANDO 3: HABILITAR SEGURANÇA
-- ===========================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- COMANDO 4: CRIAR POLÍTICAS DE SEGURANÇA
-- ===========================================
CREATE POLICY "users_select_own" ON usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON usuarios
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "admins_select_all" ON usuarios
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin')
    );

CREATE POLICY "admins_update_all" ON usuarios
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin')
    );

-- ===========================================
-- COMANDO 5: TRIGGER PARA UPDATED_AT
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- COMANDO 6: FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, nome, tipo_usuario, status)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'tipo_usuario', 'paciente'),
        CASE
            WHEN COALESCE(new.raw_user_meta_data->>'tipo_usuario', 'paciente') = 'admin' THEN 'ativo'
            ELSE 'aguardando_aprovacao'
        END
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- COMANDO 7: TRIGGER PARA EXECUTAR AUTOMATICAMENTE
-- ===========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### 3. VERIFICAR SE FUNCIONOU
```sql
-- Execute este comando para verificar:
SELECT * FROM usuarios LIMIT 5;
```

## 🎉 RESULTADO ESPERADO:

### ✅ DEPOIS DE EXECUTAR OS COMANDOS:
- **Tabela `usuarios`** será criada com todas as colunas necessárias
- **Sistema de perfis** funcionará perfeitamente
- **Cadastro automático** criará perfil quando usuário se registrar
- **Segurança RLS** protegerá os dados
- **`user.profiles` problema** será resolvido

### 🚀 SISTEMA COMPLETO FUNCIONANDO:
```
✅ Cadastro → Cria usuário no auth + perfil na tabela usuarios
✅ Login → Recupera dados do perfil automaticamente
✅ Perfis → user.profiles substituído por solução robusta
✅ Segurança → RLS configurado corretamente
```

## 🧪 TESTAR SISTEMA:

### Após executar comandos SQL, teste com:
```bash
# 1. Teste de conectividade
node teste-conectividade.js

# 2. Teste completo do sistema
node teste-sistema-final.js
```

## 📞 SUPORTE:
- Se der erro em algum comando SQL, copie a mensagem de erro
- Execute um comando por vez para identificar qual falhou
- Verifique no Supabase Dashboard > Table Editor se tabela `usuarios` apareceu

---
**🎯 RESUMO:** Execute os 7 comandos SQL no Supabase Dashboard e o sistema estará 100% funcional!
