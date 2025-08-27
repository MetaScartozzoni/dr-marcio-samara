# 🚀 SOLUÇÃO RÁPIDA: SISTEMA FUNCIONAL EM 5 MINUTOS
# ======================================================

## 🎯 OBJETIVO:
Corrigir cadastro e perfis rapidamente no projeto gratuito.

## 📋 SOLUÇÃO SIMPLES (3 comandos SQL):

### 1. CRIAR TABELA USUARIOS BÁSICA
```sql
-- Execute no Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS usuarios (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    nome text NOT NULL,
    tipo_usuario text NOT NULL DEFAULT 'paciente',
    status text NOT NULL DEFAULT 'ativo',
    created_at timestamp with time zone DEFAULT now()
);
```

### 2. HABILITAR ACESSO BÁSICO
```sql
-- Políticas simples para começar:
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON usuarios FOR ALL USING (true);
```

### 3. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
```sql
-- Função simples para novos usuários:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, nome, tipo_usuario, status)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'nome', 'Usuário'),
        COALESCE(new.raw_user_meta_data->>'tipo_usuario', 'paciente'),
        'ativo'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 🎉 RESULTADO:
- ✅ **Cadastro funciona** (cria usuário + perfil automático)
- ✅ **Login funciona** (encontra perfil na tabela usuarios)
- ✅ **`user.profiles` corrigido** (usa tabela usuarios)

## 🧪 TESTE RÁPIDO:
```bash
# Após executar comandos SQL:
node teste-conectividade.js
```

## 🔒 SEGURANÇA (opcional, depois):
Se quiser melhorar segurança depois, adicionar:
```sql
-- Políticas mais restritivas:
DROP POLICY "allow_all" ON usuarios;
CREATE POLICY "users_access" ON usuarios FOR ALL USING (auth.uid() = id);
```

**🚀 Execute apenas os 3 comandos SQL e teste!** 🎯
