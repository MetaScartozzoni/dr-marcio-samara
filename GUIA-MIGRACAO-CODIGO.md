# 📋 GUIA DE MIGRAÇÃO: Atualização do Código para Profiles Padronizado

## 🎯 OBJETIVO
Este guia mostra como atualizar seu código para usar a nova estrutura padronizada da tabela `profiles` com nomes em inglês.

## 🔄 ANTES vs DEPOIS

### ❌ CÓDIGO ANTIGO (PROBLEMÁTICO)
```javascript
// ❌ Usando tabela 'usuarios' em português
const { data: userProfile } = await supabase
    .from('usuarios')
    .select('nome_completo, tipo_usuario, telefone')
    .eq('id', userId)
    .single();

// ❌ Acessando campos em português
console.log('Nome:', userProfile.nome_completo);
console.log('Tipo:', userProfile.tipo_usuario);
console.log('Telefone:', userProfile.telefone);
```

### ✅ CÓDIGO NOVO (PADRONIZADO)
```javascript
// ✅ Usando tabela 'profiles' em inglês
const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, role, phone, status, date_of_birth, cpf')
    .eq('id', userId)
    .single();

// ✅ Acessando campos em inglês
console.log('Nome:', profile.full_name);
console.log('Função:', profile.role);
console.log('Telefone:', profile.phone);
console.log('Status:', profile.status);
console.log('Data de nascimento:', profile.date_of_birth);
console.log('CPF:', profile.cpf);
```

## 📁 ESTRUTURA DA NOVA TABELA PROFILES

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único do usuário (chave primária) |
| `email` | TEXT | Email do usuário |
| `full_name` | TEXT | Nome completo |
| `phone` | TEXT | Número de telefone |
| `date_of_birth` | DATE | Data de nascimento |
| `cpf` | TEXT | CPF do usuário |
| `role` | TEXT | Função: 'admin', 'doctor', 'staff', 'patient' |
| `status` | TEXT | Status: 'active', 'inactive', 'pending' |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data da última atualização |

## 🔧 COMPONENTES QUE PRECISAM SER ATUALIZADOS

### 1. **AuthContext** (`src/context/AuthContext.jsx`)
```javascript
// ✅ ATUALIZADO
const loadUserProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles') // ✅ profiles
        .select('full_name, role, phone, status')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Erro ao carregar perfil:', error);
        return null;
    }

    return data;
};
```

### 2. **UserService** (`src/services/userService.js`)
```javascript
// ✅ ATUALIZADO
export const getUserProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles') // ✅ profiles
        .select('full_name, role, phone, status, date_of_birth')
        .eq('id', userId)
        .single();

    if (error) {
        throw new Error(`Erro ao buscar perfil: ${error.message}`);
    }

    return data;
};

export const updateUserProfile = async (userId, updates) => {
    const { data, error } = await supabase
        .from('profiles') // ✅ profiles
        .update({
            full_name: updates.fullName, // ✅ full_name
            phone: updates.phone, // ✅ phone
            date_of_birth: updates.dateOfBirth, // ✅ date_of_birth
            updated_at: new Date() // ✅ updated_at
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        throw new Error(`Erro ao atualizar perfil: ${error.message}`);
    }

    return data;
};
```

### 3. **Hook useProfile** (`src/hooks/useProfile.js`)
```javascript
// ✅ ATUALIZADO
export const useProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadProfile = async (userId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles') // ✅ profiles
                .select('full_name, role, phone, status, date_of_birth, cpf')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data);
            return data;
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates) => {
        if (!profile) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles') // ✅ profiles
                .update({
                    full_name: updates.fullName || profile.full_name,
                    phone: updates.phone || profile.phone,
                    date_of_birth: updates.dateOfBirth || profile.date_of_birth,
                    updated_at: new Date()
                })
                .eq('id', profile.id)
                .select()
                .single();

            if (error) throw error;
            setProfile(data);
            return data;
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        profile,
        loading,
        loadProfile,
        updateProfile,
        isAdmin: profile?.role === 'admin',
        isDoctor: profile?.role === 'doctor',
        isStaff: profile?.role === 'staff',
        isPatient: profile?.role === 'patient',
        isActive: profile?.status === 'active'
    };
};
```

### 4. **Formulário de Perfil** (`src/components/ProfileForm.jsx`)
```javascript
// ✅ ATUALIZADO
const ProfileForm = ({ userId }) => {
    const { profile, loading, updateProfile } = useProfile();
    const [formData, setFormData] = useState({
        fullName: '', // ✅ full_name
        phone: '', // ✅ phone
        dateOfBirth: '', // ✅ date_of_birth
        cpf: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                fullName: profile.full_name || '',
                phone: profile.phone || '',
                dateOfBirth: profile.date_of_birth || '',
                cpf: profile.cpf || ''
            });
        }
    }, [profile]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateProfile({
                fullName: formData.fullName,
                phone: formData.phone,
                dateOfBirth: formData.dateOfBirth
            });
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            alert('Erro ao atualizar perfil: ' + error.message);
        }
    };

    // ... resto do JSX
};
```

### 5. **Dashboard** (`src/components/Dashboard.jsx`)
```javascript
// ✅ ATUALIZADO
const Dashboard = () => {
    const { profile } = useProfile();

    if (!profile) return <div>Carregando...</div>;

    return (
        <div>
            <h1>Bem-vindo, {profile.full_name}!</h1> {/* ✅ full_name */}
            <p>Função: {profile.role}</p> {/* ✅ role */}
            <p>Status: {profile.status}</p> {/* ✅ status */}

            {profile.role === 'admin' && (
                <div>🛠️ Painel Administrativo</div>
            )}

            {profile.role === 'doctor' && (
                <div>👨‍⚕️ Painel Médico</div>
            )}

            {profile.role === 'patient' && (
                <div>🏥 Área do Paciente</div>
            )}
        </div>
    );
};
```

## 🔍 FILTROS E PERMISSÕES

### Lista de Usuários com Controle de Acesso
```javascript
// ✅ ATUALIZADO
const UserList = () => {
    const [users, setUsers] = useState([]);
    const { profile } = useProfile();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        let query = supabase
            .from('profiles') // ✅ profiles
            .select('id, full_name, role, status, phone'); // ✅ campos em inglês

        // Filtros baseados na role do usuário logado
        if (profile.role === 'staff' || profile.role === 'doctor') {
            // Staff e médicos só veem pacientes
            query = query.eq('role', 'patient');
        } else if (profile.role !== 'admin') {
            // Outros usuários só veem seu próprio perfil
            query = query.eq('id', profile.id);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Erro ao carregar usuários:', error);
            return;
        }

        setUsers(data);
    };

    return (
        <div>
            <h2>Lista de Usuários</h2>
            {users.map(user => (
                <div key={user.id}>
                    <h3>{user.full_name}</h3> {/* ✅ full_name */}
                    <p>Função: {user.role}</p> {/* ✅ role */}
                    <p>Status: {user.status}</p> {/* ✅ status */}
                    <p>Telefone: {user.phone}</p> {/* ✅ phone */}
                </div>
            ))}
        </div>
    );
};
```

## 📋 CHECKLIST DE MIGRAÇÃO

### ✅ PASSO 1: Executar SQL no Supabase
- [ ] Acesse o Supabase Dashboard
- [ ] Vá para SQL Editor
- [ ] Execute os comandos SQL gerados pelo script `create-profiles-standard.js`

### ✅ PASSO 2: Atualizar Arquivos de Código
- [ ] `src/context/AuthContext.jsx` - Atualizar queries para `profiles`
- [ ] `src/services/userService.js` - Padronizar nomes de campos
- [ ] `src/hooks/useProfile.js` - Usar campos em inglês
- [ ] `src/components/ProfileForm.jsx` - Atualizar form fields
- [ ] `src/components/Dashboard.jsx` - Usar `full_name`, `role`, `status`
- [ ] Todos os outros componentes que acessam dados do usuário

### ✅ PASSO 3: Testar Funcionalidades
- [ ] Login e autenticação
- [ ] Carregamento de perfil
- [ ] Atualização de dados
- [ ] Controle de permissões
- [ ] Sistema de OTP
- [ ] Troca de tokens

### ✅ PASSO 4: Limpeza
- [ ] Remover código antigo relacionado a `usuarios`
- [ ] Atualizar comentários e documentação
- [ ] Testar em produção

## 🚨 PONTOS DE ATENÇÃO

1. **RLS Policies**: Certifique-se de que as políticas RLS estão corretas para a tabela `profiles`
2. **Foreign Keys**: Verifique se há chaves estrangeiras que precisam ser atualizadas
3. **Triggers**: Atualize qualquer trigger que referencie a tabela antiga
4. **Edge Functions**: Atualize funções serverless que acessam dados do usuário
5. **Testes**: Execute todos os testes após a migração

## 📞 SUPORTE
Se encontrar problemas durante a migração, consulte:
- `SOLUCAO-PADRONIZACAO-USUARIOS.md`
- Scripts de teste em `/scripts/`
- Logs de erro no console do navegador
