# Supabase API Integration Guide

Este guia explica como usar a nova API do Supabase e os hooks customizados criados para facilitar a comunicação entre o frontend React e o banco de dados Supabase.

## 📁 Arquivos Criados

### 1. `src/services/supabaseApi.js`
Classe principal `SupabaseApiService` com métodos para:
- **Autenticação**: `signIn()`, `signUp()`, `signOut()`, `resetPassword()`, `updatePassword()`
- **OTP/Email**: `sendVerificationCode()`, `verifyOtpCode()`
- **Perfis de Usuário**: `getUserProfile()`, `updateUserProfile()`, `createUserProfile()`
- **Gerenciamento de Usuários**: `getAllUsers()`, `updateUserStatus()`, `deleteUser()`
- **Consultas**: `getConsultas()`, `createConsulta()`, `updateConsulta()`, `deleteConsulta()`
- **Utilitários**: `getCurrentUser()`, `getSession()`, `handleError()`

### 2. `src/hooks/useSupabase.js`
Hooks customizados React:
- **`useAuth()`**: Gerenciamento completo de autenticação
- **`useUsers()`**: Gerenciamento de usuários (admins)
- **`useConsultas()`**: CRUD de consultas médicas
- **`useAsyncOperation()`**: Hook genérico para operações assíncronas

### 3. `src/components/AuthExample.jsx`
Componente de exemplo mostrando como usar autenticação com OTP

### 4. `src/components/ConsultasExample.jsx`
Componente de exemplo mostrando como gerenciar consultas

## 🚀 Como Usar

### 1. Importar os Hooks

```javascript
import { useAuth, useConsultas, useUsers } from '../hooks/useSupabase';
```

### 2. Usar o Hook de Autenticação

```javascript
const MyComponent = () => {
  const {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    isAuthenticated
  } = useAuth();

  const handleLogin = async (email, password) => {
    try {
      const result = await signIn(email, password);
      if (result.needsOtp) {
        // Mostrar campo para OTP
        console.log('Código enviado para o email');
      } else {
        console.log('Login realizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro no login:', error.message);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h2>Bem-vindo, {user.profile?.nome}!</h2>
          <p>Email: {user.email}</p>
          <p>Tipo: {user.profile?.tipo_usuario}</p>

          {hasRole('admin') && (
            <div>Você tem permissões de administrador!</div>
          )}

          <button onClick={signOut}>Sair</button>
        </div>
      ) : (
        <button onClick={() => handleLogin('email@example.com', 'password')}>
          Entrar
        </button>
      )}
    </div>
  );
};
```

### 3. Usar o Hook de Consultas

```javascript
const ConsultasComponent = () => {
  const { user } = useAuth();
  const {
    consultas,
    loading,
    fetchConsultas,
    createConsulta
  } = useConsultas();

  useEffect(() => {
    if (user) {
      fetchConsultas(); // Carrega todas as consultas
    }
  }, [user, fetchConsultas]);

  const handleCreateConsulta = async () => {
    try {
      await createConsulta({
        paciente_nome: 'João Silva',
        paciente_email: 'joao@example.com',
        data_consulta: '2024-01-15T10:00:00Z',
        horario: '10:00',
        tipo_consulta: 'consulta',
        status: 'agendada'
      });
      console.log('Consulta criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar consulta:', error.message);
    }
  };

  return (
    <div>
      <button onClick={handleCreateConsulta}>
        Criar Nova Consulta
      </button>

      {loading ? (
        <div>Carregando consultas...</div>
      ) : (
        <ul>
          {consultas.map(consulta => (
            <li key={consulta.id}>
              {consulta.paciente_nome} - {consulta.data_consulta}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### 4. Usar o Hook de Usuários (Admin)

```javascript
const UsersManagement = () => {
  const { users, loading, fetchUsers, updateUserStatus } = useUsers();

  useEffect(() => {
    fetchUsers(); // Carrega todos os usuários
  }, [fetchUsers]);

  const handleUpdateStatus = async (userId, status) => {
    try {
      await updateUserStatus(userId, status);
      console.log('Status atualizado!');
    } catch (error) {
      console.error('Erro:', error.message);
    }
  };

  return (
    <div>
      {loading ? (
        <div>Carregando usuários...</div>
      ) : (
        <ul>
          {users.map(user => (
            <li key={user.id}>
              {user.profile?.nome} - {user.profile?.tipo_usuario}
              <button onClick={() => handleUpdateStatus(user.id, 'ativo')}>
                Ativar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente
Certifique-se de que seu arquivo `.env` contém:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Configuração do Supabase
O `SupabaseApiService` já está configurado para usar essas variáveis automaticamente.

### 3. Tabelas do Banco de Dados
As seguintes tabelas devem existir no Supabase:
- `usuarios` (para perfis de usuário)
- `consultas` (para agendamentos)
- `auth.users` (tabela padrão do Supabase)

## 📋 Funcionalidades Implementadas

### ✅ Autenticação Completa
- Login com email/senha
- Cadastro de novos usuários
- Verificação OTP por email
- Recuperação de senha
- Logout seguro
- Controle de sessão

### ✅ Gerenciamento de Perfis
- Criação automática de perfis
- Atualização de dados do usuário
- Controle de permissões por tipo de usuário
- Validação de dados

### ✅ Sistema de Consultas
- CRUD completo de consultas
- Filtros por usuário/paciente
- Controle de status
- Validações de data/horário

### ✅ Tratamento de Erros
- Captura e formatação de erros
- Logging detalhado
- Estados de loading
- Mensagens de erro amigáveis

### ✅ Segurança
- Row Level Security (RLS) habilitado
- Validação de permissões
- Sanitização de dados
- Controle de sessão

## 🔄 Próximos Passos

1. **Integrar com Componentes Existentes**: Substitua as chamadas diretas do Supabase pelos novos hooks
2. **Testar Funcionalidades**: Use os componentes de exemplo para testar cada funcionalidade
3. **Personalizar**: Adapte os hooks e métodos conforme suas necessidades específicas
4. **Otimizar**: Implemente cache e paginação para grandes volumes de dados

## 🐛 Solução de Problemas

### Erro: "Tabela 'usuarios' não existe"
- Execute o script SQL para criar a tabela `usuarios`
- Verifique as permissões RLS

### Erro: "OTP não enviado"
- Verifique a configuração de email no Supabase
- Confirme que o email é válido

### Erro: "Usuário não autorizado"
- Verifique as políticas RLS
- Confirme o tipo de usuário no perfil

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Documentação oficial do Supabase
- Console de desenvolvedor do Supabase
- Logs de erro no navegador

---

**Nota**: Esta implementação fornece uma base sólida para comunicação frontend-backend. Personalize conforme as necessidades específicas do seu projeto médico.
