# 🔐 Sistema de Senhas Chave - Portal Dr. Marcio

## 📋 Visão Geral

O sistema implementa um controle rigoroso de acesso baseado em **senhas chave** únicas para cada perfil de usuário, garantindo segurança e controle de primeiro acesso.

## 🗝️ Tipos de Senhas Chave

### 1. 👑 Primeiro Admin
- **Senha:** `AdminMestre2025!`
- **Uso:** Único (apenas uma vez)
- **Função:** Configurar o primeiro administrador do sistema
- **Fluxo:** Verificação Email → Cadastro → Criar Senha → Login

### 2. 👨‍💼 Funcionário
- **Senha:** `FuncChave2025@`
- **Renovação:** A cada 90 dias
- **Função:** Autorizar cadastro de funcionários
- **Fluxo:** Verificação Email → Cadastro → Criar Senha → Login

### 3. 👤 Paciente
- **Senha:** `PacienteKey2025#`
- **Renovação:** A cada 90 dias
- **Função:** Autorizar cadastro de pacientes
- **Fluxo:** Verificação Email → Cadastro → Criar Senha → Login

## 🔄 Fluxo Completo do Sistema

### Para Primeiro Admin:
1. **Verificação de Email** (`index.html`)
   - Email admin detectado → redireciona para cadastro
2. **Cadastro** (`cadastro.html`)
   - Requer senha chave: `AdminMestre2025!`
   - Cria conta com status 'ativo'
3. **Criar Senha** (`senha.html`)
   - Define senha pessoal
   - Marca `primeiro_acesso_realizado = true`
4. **Login** (`login.html`)
   - Acesso liberado com senha pessoal

### Para Funcionários/Pacientes:
1. **Verificação de Email** (`index.html`)
   - Verifica estado no banco de dados
2. **Cadastro** (`cadastro.html`)
   - Requer senha chave específica
   - Cria conta com status 'aprovado'
3. **Criar Senha** (`senha.html`)
   - Define senha pessoal
4. **Login** (`login.html`)
   - Acesso liberado com senha pessoal

## 🔒 Controles de Segurança

### Logs de Segurança Automáticos:
- ✅ Tentativa de login com senha chave (ALERTA)
- ✅ Uso de senha chave inválida
- ✅ Cadastros com senha chave
- ✅ Logins bem-sucedidos e falhados
- ✅ Verificações de email

### Renovação Obrigatória (90 dias):
- Admin deve renovar senha a cada 90 dias
- Sistema redireciona automaticamente para renovação
- Bloqueia login após expiração

### Proteções Implementadas:
- 🚫 Não é possível fazer login com senha chave
- 🚫 Senhas chave só funcionam no cadastro
- 🚫 Tentativas inválidas são logadas
- 🚫 Tokens de verificação expiram em 5 minutos

## 📊 Estados do Usuário

### Estados Possíveis:
- `nao_existe` → Precisa se cadastrar
- `primeiro_admin_pendente` → Primeiro admin ainda não configurado
- `renovacao_senha_necessaria` → Senha expirada (90 dias)
- `aguardando_aprovacao` → Aguarda aprovação manual
- `criar_senha` → Pode criar senha pessoal
- `login_disponivel` → Pode fazer login

### Mapeamento de Destinos:
- `index.html` → Verificação de email
- `cadastro.html` → Cadastro com senha chave
- `senha.html` → Criar/alterar senha pessoal
- `recuperar-senha.html` → Renovação de senha
- `login.html` → Login normal
- `aguardando-autorizacao.html` → Aguardar aprovação

## 🛠️ Estrutura Técnica

### Arquivos Principais:
- `config-senhas-chave.js` → Configurações e validações
- `index.html` → Ponto de entrada (verificação)
- `cadastro.html` → Cadastro com senha chave
- `senha.html` → Criação de senha pessoal
- `login.html` → Login com proteções
- `recuperar-senha.html` → Renovação de senha

### Funções Principais:
```javascript
// Validar senha chave
validarSenhaChave(email, senha, tipoUsuario)

// Verificar necessidade de renovação
verificarSeNecessitaRenovacao(dataUltimaRenovacao, email)

// Determinar próxima ação do usuário
determinarEstadoUsuario(usuario)

// Criar log de segurança
criarLogSeguranca(evento, email, detalhes)
```

## 🚨 Cenários de Alerta

### Tentativa de Login com Senha Chave:
```javascript
// ALERTA CRÍTICO: Usuário tentando fazer login com senha chave
Log: {
  evento: "tentativa_login_senha_chave",
  email: "user@example.com",
  tipoSenhaChave: "funcionario_chave",
  timestamp: "2025-08-01T10:30:00Z"
}
```

### Uso de Senha Chave Inválida:
```javascript
// ALERTA: Tentativa de cadastro com senha errada
Log: {
  evento: "tentativa_senha_chave_invalida",
  email: "user@example.com",
  senhaChaveTentativa: "abc***"
}
```

## 📅 Cronograma de Renovação

### Primeiro Admin:
- **Primeiro acesso:** Usa senha chave única
- **Após 90 dias:** Sistema força renovação
- **Renovação:** Via recuperar-senha.html

### Funcionários/Pacientes:
- **Senhas chave renovadas:** A cada 90 dias pelo admin
- **Usuários existentes:** Mantêm senhas pessoais
- **Novos usuários:** Precisam da senha chave atualizada

## 🔧 Configuração e Manutenção

### Para Atualizar Senhas Chave:
1. Editar `config-senhas-chave.js`
2. Atualizar as constantes `SENHAS_CHAVE`
3. Comunicar novas senhas para usuários autorizados

### Para Monitorar Segurança:
1. Verificar logs no console do navegador
2. Implementar backend para salvar logs
3. Configurar alertas para tentativas suspeitas

## ✅ Vantagens do Sistema

1. **Segurança:** Controle total sobre quem pode se cadastrar
2. **Auditoria:** Logs completos de todas as ações
3. **Flexibilidade:** Diferentes senhas para diferentes perfis
4. **Renovação:** Força troca de senhas periodicamente
5. **Primeiro Acesso:** Garante configuração inicial segura

## 🎯 Implementação Completa

O sistema está completamente implementado e integrado em todas as páginas de autenticação, garantindo um fluxo seguro e controlado para todos os tipos de usuários.
