# 🚀 Guia Completo: Sistema OTP com Edge Functions

## 📋 Visão Geral

Este guia demonstra como implementar um sistema robusto de verificação OTP (One-Time Password) usando **Edge Functions do Supabase**, que oferece melhor performance, segurança e controle sobre a lógica de verificação.

## 🏗️ Arquitetura do Sistema

### 📁 Arquivos Criados

1. **`supabase/functions/verificar-codigo-otp/index.ts`** - Edge Function para verificar códigos
2. **`supabase/functions/gerar-codigo-otp/index.ts`** - Edge Function para gerar códigos
3. **`src/services/otpService.js`** - Serviço frontend para usar as Edge Functions
4. **`src/hooks/useOTP.js`** - Hook personalizado para gerenciar OTP
5. **`src/components/SolicitarCodigoOTP_Edge.jsx`** - Componente para solicitar códigos
6. **`src/components/VerificarCodigoOTP_Edge.jsx`** - Componente para verificar códigos
7. **`src/components/OTPFlow_Edge.jsx`** - Fluxo completo de OTP

## 🚀 Como Implementar

### 1. **Configurar Edge Functions no Supabase**

#### Passo 1: Criar Edge Functions
As Edge Functions já estão criadas nos arquivos acima. Para implantá-las:

```bash
# No terminal do seu projeto
supabase functions deploy verificar-codigo-otp
supabase functions deploy gerar-codigo-otp
```

#### Passo 2: Verificar URLs das Functions
As Edge Functions estarão disponíveis em:
- `https://seu-projeto.supabase.co/functions/v1/verificar-codigo-otp`
- `https://seu-projeto.supabase.co/functions/v1/gerar-codigo-otp`

### 2. **Usar no Frontend**

#### Importar e usar o componente completo:

```javascript
import OTPFlow_Edge from './src/components/OTPFlow_Edge';

function App() {
  const handleSuccess = (result) => {
    console.log('OTP verificado com sucesso!', result);
    // Redirecionar para dashboard ou executar ação desejada
  };

  const handleCancel = () => {
    console.log('OTP cancelado pelo usuário');
  };

  return (
    <OTPFlow_Edge
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
```

#### Ou usar componentes individuais:

```javascript
import { useState } from 'react';
import SolicitarCodigoOTP_Edge from './src/components/SolicitarCodigoOTP_Edge';
import VerificarCodigoOTP_Edge from './src/components/VerificarCodigoOTP_Edge';

function CustomOTPFlow() {
  const [step, setStep] = useState('solicitar');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('login');

  return (
    <div>
      {step === 'solicitar' ? (
        <SolicitarCodigoOTP_Edge
          onCodeSent={(email, tipo) => {
            setEmail(email);
            setTipo(tipo);
            setStep('verificar');
          }}
        />
      ) : (
        <VerificarCodigoOTP_Edge
          email={email}
          tipo={tipo}
          onSuccess={(result) => {
            console.log('Sucesso!', result);
          }}
          onBack={() => setStep('solicitar')}
        />
      )}
    </div>
  );
}
```

### 3. **Usar o Hook Diretamente**

```javascript
import { useOTP } from './src/hooks/useOTP';

function CustomComponent() {
  const {
    loading,
    error,
    success,
    solicitarCodigo,
    verificarCodigo
  } = useOTP();

  const handleSolicitar = async () => {
    try {
      await solicitarCodigo('user@example.com', 'login', true, true);
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const handleVerificar = async () => {
    try {
      await verificarCodigo('user@example.com', '123456', 'login', true);
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  return (
    <div>
      <button onClick={handleSolicitar} disabled={loading}>
        Solicitar Código
      </button>
      <button onClick={handleVerificar} disabled={loading}>
        Verificar Código
      </button>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {success && <p style={{color: 'green'}}>{success}</p>}
    </div>
  );
}
```

## 🔧 Funcionalidades Avançadas

### **Modos de Operação**

#### 1. **Edge Function Pura** (Recomendado)
```javascript
// Usa apenas Edge Functions - mais rápido e seguro
await solicitarCodigo(email, tipo, criarUsuario, true);
await verificarCodigo(email, codigo, tipo, true);
```

#### 2. **Modo Híbrido** (Fallback Automático)
```javascript
// Tenta Edge Function primeiro, depois API padrão se falhar
await solicitarCodigoHibrido(email, tipo, criarUsuario);
await verificarCodigoHibrido(email, codigo, tipo);
```

#### 3. **API Padrão do Supabase** (Compatibilidade)
```javascript
// Usa apenas a API padrão do Supabase
await solicitarCodigoPadrao(email, tipo);
await verificarCodigoPadrao(email, codigo, tipo);
```

### **Tipos de Código Suportados**

- **`login`** - Para autenticação/login
- **`recuperacao`** - Para recuperação de senha
- **`confirmacao`** - Para confirmação de email

### **Validações Implementadas**

#### No Backend (Edge Functions):
- ✅ Validação de formato de email
- ✅ Validação de código (6 dígitos numéricos)
- ✅ Validação de tipo de operação
- ✅ Tratamento de erros específicos
- ✅ CORS configurado

#### No Frontend:
- ✅ Máscara de entrada (apenas números)
- ✅ Validação de comprimento (6 dígitos)
- ✅ Countdown para reenvio
- ✅ Estados de loading
- ✅ Mensagens de erro e sucesso

## 🎨 Personalização

### **Estilos Customizados**

```javascript
// Exemplo de personalização
const customStyles = {
  container: {
    maxWidth: '500px',
    backgroundColor: '#f8f9fa',
    borderRadius: '15px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  },
  button: {
    backgroundColor: '#ff6b6b',
    border: 'none',
    borderRadius: '25px',
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: '600'
  }
};

// Passe os estilos via props ou modifique os componentes
```

### **Callbacks Customizados**

```javascript
<OTPFlow_Edge
  onSuccess={(result) => {
    // Executar ação customizada
    console.log('Usuário verificado:', result.user);
    // Redirecionar
    navigate('/dashboard');
    // Salvar no contexto
    setUser(result.user);
  }}
  onCancel={() => {
    // Ação de cancelamento
    navigate('/login');
  }}
/>
```

## 🔍 Debugging e Monitoramento

### **Logs das Edge Functions**

```bash
# Ver logs das Edge Functions
supabase functions logs verificar-codigo-otp
supabase functions logs gerar-codigo-otp
```

### **Teste Manual das Edge Functions**

```javascript
// Testar gerar código
fetch('https://seu-projeto.supabase.co/functions/v1/gerar-codigo-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`
  },
  body: JSON.stringify({
    email: 'teste@example.com',
    tipo: 'login',
    criarUsuario: true
  })
});

// Testar verificar código
fetch('https://seu-projeto.supabase.co/functions/v1/verificar-codigo-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`
  },
  body: JSON.stringify({
    email: 'teste@example.com',
    codigo: '123456',
    tipo: 'login'
  })
});
```

### **Monitoramento de Performance**

```javascript
// Adicionar métricas de performance
const startTime = Date.now();
const result = await verificarCodigo(email, codigo, tipo);
console.log(`⏱️ Verificação levou: ${Date.now() - startTime}ms`);
```

## 🛡️ Segurança

### **Medidas Implementadas:**

- ✅ **Validação rigorosa de entrada**
- ✅ **Rate limiting** (via countdown)
- ✅ **Logs de segurança**
- ✅ **Timeouts apropriados**
- ✅ **CORS configurado**
- ✅ **Tratamento de erros sem exposição**

### **Recomendações Adicionais:**

1. **Implementar rate limiting no Supabase**
2. **Adicionar CAPTCHA para prevenir abuso**
3. **Monitorar tentativas falhadas**
4. **Implementar bloqueio temporário após múltiplas falhas**

## 🚨 Solução de Problemas

### **Erro: "Edge Function não encontrada"**
```bash
# Verificar se as functions estão implantadas
supabase functions list

# Reimplantar se necessário
supabase functions deploy verificar-codigo-otp
```

### **Erro: "CORS error"**
- Verificar se o CORS está configurado nas Edge Functions
- Adicionar domínio à lista de origens permitidas no Supabase

### **Erro: "Código expirado"**
- Aumentar o tempo de expiração na configuração do Supabase
- Implementar renovação automática de códigos

### **Erro: "Email não encontrado"**
- Verificar se o usuário existe no banco
- Usar o modo híbrido para criar usuários automaticamente

## 📊 Comparação: Edge Functions vs API Padrão

| Aspecto | Edge Functions | API Padrão |
|---------|----------------|------------|
| **Performance** | 🚀 Mais rápida | 🐌 Mais lenta |
| **Segurança** | 🔒 Maior controle | ⚠️ Menos controle |
| **Personalização** | 🎨 Totalmente customizável | 📋 Limitada |
| **Escalabilidade** | 📈 Melhor | 📊 Boa |
| **Manutenção** | 🔧 Mais complexa | ⚙️ Simples |
| **Custo** | 💰 Mesmo | 💰 Mesmo |

## 🎯 Casos de Uso

### **Cenários Recomendados para Edge Functions:**

- ✅ **Alta frequência de uso**
- ✅ **Lógica complexa de validação**
- ✅ **Integração com sistemas externos**
- ✅ **Processamento customizado**
- ✅ **Aplicações críticas de segurança**

### **Cenários para API Padrão:**

- ✅ **Prototipagem rápida**
- ✅ **Aplicações simples**
- ✅ **Equipes pequenas**
- ✅ **Orçamento limitado**

## 🚀 Próximos Passos

1. **Teste o sistema** com os componentes fornecidos
2. **Personalize os estilos** conforme seu design
3. **Implemente nas suas rotas** de autenticação
4. **Monitore o desempenho** e otimize se necessário
5. **Adicione funcionalidades extras** conforme sua necessidade

---

**🎉 Parabéns!** Você agora tem um sistema completo e profissional de verificação OTP usando Edge Functions do Supabase!

**Dúvidas?** Consulte a documentação do Supabase ou os logs das Edge Functions para debugging.
