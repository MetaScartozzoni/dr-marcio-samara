// =============================================
// EXEMPLOS DE CÓDIGO ATUALIZADO PARA PROFILES
// =============================================

// ❌ ANTES (Código problemático com estrutura antiga):
// =============================================

// 1. Usando user.profiles (que não existe)
const profile = user.profiles; // ❌ ERRO!

// 2. Usando tabela usuarios em português
const { data: userProfile } = await supabase
    .from('usuarios') // ❌ Nome em português
    .select('nome_completo, tipo_usuario, telefone')
    .eq('id', userId)
    .single();

// 3. Nomes de campos em português
console.log('Nome:', userProfile.nome_completo); // ❌
console.log('Tipo:', userProfile.tipo_usuario); // ❌
console.log('Telefone:', userProfile.telefone); // ❌

// ✅ DEPOIS (Código correto com estrutura padronizada):
// =============================================

// 1. Buscar perfil do usuário
const { data: user } = await supabase.auth.getUser();

// 2. Buscar dados do perfil
const { data: profile, error } = await supabase
    .from('profiles') // ✅ Nome em inglês
    .select('full_name, role, phone, status, date_of_birth, cpf')
    .eq('id', user.user.id)
    .single();

if (error) {
    console.error('Erro ao buscar perfil:', error);
    return;
}

// 3. Usar dados padronizados
console.log('Nome completo:', profile.full_name); // ✅
console.log('Função:', profile.role); // ✅
console.log('Telefone:', profile.phone); // ✅
console.log('Status:', profile.status); // ✅
console.log('Data de nascimento:', profile.date_of_birth); // ✅
console.log('CPF:', profile.cpf); // ✅

// =============================================
// EXEMPLOS PRÁTICOS POR COMPONENTE
// =============================================

// 🔐 AUTH CONTEXT (src/context/AuthContext.jsx)
export const AuthContext = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);

    const loadUserProfile = async (userId) => {
        const { data, error } = await supabase
            .from('profiles') // ✅ profiles em inglês
            .select('full_name, role, phone, status')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Erro ao carregar perfil:', error);
            return null;
        }

        return data;
    };

    // ... resto do código
};

// 🔧 USER SERVICE (src/services/userService.js)
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

// 🎯 HOOK PERSONALIZADO (src/hooks/useProfile.js)
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

// 📝 FORMULÁRIO DE PERFIL (src/components/ProfileForm.jsx)
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

    if (loading) return <div>Carregando...</div>;

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Nome Completo:</label>
                <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                />
            </div>

            <div>
                <label>Telefone:</label>
                <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
            </div>

            <div>
                <label>Data de Nascimento:</label>
                <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                />
            </div>

            <div>
                <label>CPF:</label>
                <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                />
            </div>

            <button type="submit">Salvar</button>
        </form>
    );
};

// 🔍 DASHBOARD (src/components/Dashboard.jsx)
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

// 🎯 FILTROS E PERMISSÕES
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

export {
    AuthContext,
    getUserProfile,
    updateUserProfile,
    useProfile,
    ProfileForm,
    Dashboard,
    UserList
};
