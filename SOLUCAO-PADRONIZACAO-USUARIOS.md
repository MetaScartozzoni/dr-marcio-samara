# 🔧 Solução para Padronização da Estrutura de Usuários

## 📋 Problema Identificado

Atualmente há uma **confusão arquitetural** no sistema:

### ❌ Situação Atual (Problemática):
- **`usuarios`** - Tabela em português (fora do padrão Supabase)
- **`profiles`** - Referenciada em vários lugares mas pode não existir
- **`user.profiles`** - Sistema tentando acessar propriedade inexistente
- **`auth.user.id`** - Causando confusão com múltiplas tabelas usando FK

### ✅ Solução Proposta (Padrão Supabase):

**Usar apenas uma tabela `profiles` que segue o padrão Supabase:**

```sql
-- Tabela profiles (padrão Supabase)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    nome_completo TEXT NOT NULL,
    telefone TEXT,
    data_nascimento DATE,
    cpf TEXT UNIQUE,
    tipo_usuario user_role NOT NULL DEFAULT 'paciente',
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🛠️ Plano de Migração

### 1. **Criar tabela `profiles` padronizada**
### 2. **Migrar dados da tabela `usuarios`**
### 3. **Atualizar todas as referências no código**
### 4. **Remover tabela `usuarios` antiga**

## 📝 Scripts de Migração

### Script 1: Criar tabela profiles
```sql
-- Criar tabela profiles padronizada
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    nome_completo TEXT NOT NULL,
    telefone TEXT,
    data_nascimento DATE,
    cpf TEXT UNIQUE,
    tipo_usuario TEXT NOT NULL DEFAULT 'paciente',
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_usuario ON profiles(tipo_usuario);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND tipo_usuario = 'admin'
        )
    );
```

### Script 2: Migrar dados
```sql
-- Migrar dados da tabela usuarios para profiles
INSERT INTO public.profiles (
    id, email, nome_completo, telefone, data_nascimento,
    cpf, tipo_usuario, ativo, criado_em, atualizado_em
)
SELECT
    id, email, nome_completo, telefone, data_nascimento,
    cpf, tipo_usuario, ativo, criado_em, atualizado_em
FROM public.usuarios
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Verificar migração
SELECT COUNT(*) as usuarios_migrados FROM public.profiles;
```

### Script 3: Atualizar referências no código
```javascript
// ❌ ANTES (problemático):
const { data: user } = await supabase.auth.getUser();
const profile = user.profiles; // ❌ Não existe!

// ✅ DEPOIS (correto):
const { data: user } = await supabase.auth.getUser();
const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.user.id)
    .single();
```

## 🔄 Código que precisa ser atualizado

### 1. **Hooks e Contextos**
```javascript
// src/hooks/useAuth.js
export const useAuth = () => {
    const getUserProfile = async (userId) => {
        const { data, error } = await supabase
            .from('profiles') // ✅ Correto
            .select('*')
            .eq('id', userId)
            .single();
        return { data, error };
    };
};
```

### 2. **Serviços**
```javascript
// src/services/userService.js
export const getUserProfile = async (userId) => {
    return await supabase
        .from('profiles') // ✅ Correto
        .select('*')
        .eq('id', userId)
        .single();
};
```

### 3. **Componentes**
```javascript
// ❌ ANTES:
const profile = user.profiles;

// ✅ DEPOIS:
const [profile, setProfile] = useState(null);

useEffect(() => {
    const loadProfile = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        setProfile(data);
    };
    loadProfile();
}, [user]);
```

## 🧪 Como Testar

### 1. **Executar migração**
```bash
# 1. Criar tabela profiles
# 2. Migrar dados
# 3. Testar acesso
node test-migration.js
```

### 2. **Verificar tabelas**
```sql
-- Verificar se profiles existe
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Contar registros
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM usuarios;
```

### 3. **Testar aplicação**
```bash
# Testar se o login ainda funciona
# Verificar se os dados do usuário aparecem corretamente
npm start
```

## 📋 Checklist de Migração

- [ ] ✅ **Criar tabela `profiles`**
- [ ] 🔄 **Migrar dados de `usuarios` para `profiles`**
- [ ] 🔄 **Atualizar referências no código frontend**
- [ ] 🔄 **Atualizar referências no código backend**
- [ ] 🔄 **Testar funcionalidades de login/cadastro**
- [ ] 🔄 **Testar funcionalidades de perfil**
- [ ] 🔄 **Remover tabela `usuarios` antiga**
- [ ] 🔄 **Atualizar documentação**

## 🎯 Benefícios da Padronização

1. **Consistência** - Seguir padrões do Supabase
2. **Manutenibilidade** - Código mais claro e organizado
3. **Escalabilidade** - Estrutura preparada para crescimento
4. **Debugging** - Menos confusão entre tabelas
5. **Integração** - Melhor compatibilidade com ferramentas Supabase

## 🚨 Pontos de Atenção

1. **Backup** - Fazer backup antes da migração
2. **Testes** - Testar todas as funcionalidades após migração
3. **Rollback** - Ter plano de rollback se algo der errado
4. **Documentação** - Atualizar toda documentação
5. **Time** - Comunicar mudanças para toda equipe

---

**🎉 Resultado Final:**
- ✅ Uma única tabela `profiles` bem estruturada
- ✅ Código limpo e consistente
- ✅ Sistema seguindo padrões Supabase
- ✅ Menos confusão e mais produtividade
