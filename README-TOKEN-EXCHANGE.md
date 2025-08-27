# Sistema de Troca de Código por Token

Este documento explica como usar o sistema completo de autenticação OTP com troca segura de código por token implementado neste projeto.

## 📋 Visão Geral

O sistema implementa uma autenticação OTP (One-Time Password) segura que troca códigos de verificação por tokens JWT usando Edge Functions do Supabase, proporcionando maior segurança e escalabilidade.

## 🏗️ Arquitetura

### Componentes Principais

1. **Edge Function** (`supabase/functions/troca-codigo-token/index.ts`)
   - Executa server-side a troca de código por token
   - Valida códigos OTP
   - Gera sessões seguras
   - Implementa rate limiting e segurança

2. **TokenExchangeService** (`src/services/tokenExchangeService.js`)
   - Serviço frontend para comunicação com Edge Function
   - Métodos de fallback (Edge Function → Direto)
   - Gerenciamento de sessão e tokens

3. **Hook useTokenExchange** (`src/hooks/useTokenExchange.js`)
   - Hook React para uso fácil do serviço
   - Gerenciamento de estado (loading, error, success)
   - Funções utilitárias para tokens

4. **Componentes de Exemplo**
   - `TokenExchangeDemo.js`: Demonstração completa
   - `OTPLoginWithTokenExchange.js`: Exemplo de integração

## 🚀 Como Usar

### 1. Configuração Inicial

Certifique-se de que as seguintes dependências estão instaladas:

```bash
npm install @supabase/supabase-js
```

### 2. Configurar Supabase

Configure suas credenciais do Supabase no arquivo de configuração:

```javascript
// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. Deploy da Edge Function

Antes de usar, faça o deploy da Edge Function:

```bash
# No diretório do projeto
supabase functions deploy troca-codigo-token
```

### 4. Usando o Hook

```javascript
import { useTokenExchange } from '../hooks/useTokenExchange';

function MeuComponente() {
  const {
    loading,
    error,
    success,
    trocarCodigoPorToken,
    temSessaoAtiva,
    logout
  } = useTokenExchange();

  const handleLogin = async (email, codigo) => {
    try {
      const result = await trocarCodigoPorToken(email, codigo, 'login');
      console.log('Login bem-sucedido:', result);
    } catch (err) {
      console.error('Erro no login:', err);
    }
  };

  // Seu JSX aqui
}
```

## 📚 API Reference

### useTokenExchange Hook

#### Estados
- `loading`: boolean - Indica se há operação em andamento
- `error`: string - Última mensagem de erro
- `success`: string - Última mensagem de sucesso
- `session`: object - Dados da sessão atual

#### Métodos Principais

##### `trocarCodigoPorToken(email, codigo, tipo, usarEdgeFunction)`
Troca um código OTP por token de autenticação.

**Parâmetros:**
- `email`: string - Email do usuário
- `codigo`: string - Código OTP de 6 dígitos
- `tipo`: string - Tipo de operação ('login', 'signup', 'recovery')
- `usarEdgeFunction`: boolean - Usar Edge Function (recomendado)

**Retorno:** Promise com dados da sessão

##### `trocarCodigoPorTokenHibrido(email, codigo, tipo)`
Método híbrido que tenta Edge Function primeiro, depois fallback.

##### `verificarToken(token)`
Verifica se um token JWT é válido.

##### `renovarToken(refreshToken)`
Renova um token de acesso usando o refresh token.

##### `logout()`
Encerra a sessão atual.

#### Métodos Utilitários

##### `temSessaoAtiva()`
Retorna true se há uma sessão ativa.

##### `tokenExpirado()`
Retorna true se o token atual está expirado.

##### `getAccessToken()`
Retorna o token de acesso atual.

##### `getRefreshToken()`
Retorna o refresh token atual.

##### `limparMensagens()`
Limpa mensagens de erro e sucesso.

## 🔧 Integração com Componentes Existentes

### Exemplo Básico

```javascript
import { useTokenExchange } from '../hooks/useTokenExchange';

function LoginForm() {
  const { trocarCodigoPorToken, loading, error, success } = useTokenExchange();
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await trocarCodigoPorToken(email, codigo, 'login');
      // Redirecionar ou atualizar estado
    } catch (err) {
      // Tratar erro
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="text"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        placeholder="Código OTP"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Verificando...' : 'Entrar'}
      </button>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {success && <p style={{color: 'green'}}>{success}</p>}
    </form>
  );
}
```

### Exemplo Avançado com Gerenciamento de Estado

```javascript
function App() {
  const {
    session,
    temSessaoAtiva,
    tokenExpirado,
    renovarToken,
    logout
  } = useTokenExchange();

  useEffect(() => {
    if (temSessaoAtiva() && tokenExpirado()) {
      renovarToken(session.refresh_token).catch(() => {
        // Token de refresh inválido, redirecionar para login
      });
    }
  }, [session, temSessaoAtiva, tokenExpirado, renovarToken]);

  if (!temSessaoAtiva()) {
    return <LoginForm />;
  }

  return (
    <div>
      <h1>Bem-vindo!</h1>
      <button onClick={logout}>Sair</button>
    </div>
  );
}
```

## 🔒 Segurança

### Medidas Implementadas

1. **Server-side Token Exchange**: Troca de código por token acontece no servidor
2. **Rate Limiting**: Controle de tentativas por IP/usuário
3. **Token Expiration**: Tokens expiram automaticamente
4. **Refresh Tokens**: Sistema de renovação segura
5. **CORS Protection**: Configuração adequada de CORS
6. **Input Validation**: Validação rigorosa de entradas

### Recomendações

- Sempre use HTTPS em produção
- Configure rate limiting adequado
- Monitore logs de segurança
- Implemente monitoramento de tentativas falhadas
- Use secrets seguros para chaves do Supabase

## 🐛 Troubleshooting

### Problemas Comuns

#### "Edge Function não encontrada"
- Verifique se a Edge Function foi deployada
- Confirme o nome da função no código

#### "Token expirado"
- Implemente renovação automática de token
- Verifique configuração de expiração no Supabase

#### "CORS error"
- Configure CORS na Edge Function
- Verifique headers necessários

#### "Código inválido"
- Verifique formato do código (6 dígitos)
- Confirme que o código não expirou

### Debug

Para debug, use os componentes de exemplo:

```javascript
import TokenExchangeDemo from './components/TokenExchangeDemo';

// Renderize para testar todas as funcionalidades
<TokenExchangeDemo />
```

## 📝 Próximos Passos

1. **Deploy**: Faça deploy da Edge Function
2. **Teste**: Use os componentes de exemplo para testar
3. **Integração**: Integre com seus componentes existentes
4. **Monitoramento**: Configure logging e monitoramento
5. **Otimização**: Ajuste configurações conforme necessidade

## 📚 Recursos Adicionais

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [JWT Token Guide](https://jwt.io/introduction/)
- [React Hooks Documentation](https://react.dev/reference/react/hooks)

---

**Nota**: Este sistema foi projetado para ser seguro, escalável e fácil de usar. Para questões específicas ou personalizações, consulte a documentação dos componentes individuais.
