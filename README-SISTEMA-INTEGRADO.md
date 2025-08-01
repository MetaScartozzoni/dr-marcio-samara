# 🏥 Sistema Integrado Dr. Marcio Scartozzoni

## 🎯 Visão Geral

Sistema médico completo com fluxo integrado desde o cadastro do paciente até o prontuário digital, incluindo agendamentos, fichas de atendimento e orçamentos.

## 🔄 Fluxo Integrado

```
👤 Cadastro → 📅 Agendamento → 📝 Ficha → 💰 Orçamento → 📋 Prontuário
```

### 1️⃣ **Cadastro de Pacientes**
- Dados pessoais completos (nome, CPF, telefone, email)
- Endereço e data de nascimento
- Vinculação automática com todos os módulos

### 2️⃣ **Sistema de Agendamentos**
- Agendamento de consultas por paciente
- Tipos de consulta (inicial, retorno, follow-up)
- Status automático (agendado → confirmado → atendido)

### 3️⃣ **Ficha de Atendimento**
- Preenchimento durante a consulta
- Dados clínicos (peso, altura, pressão arterial)
- Queixa principal, história da doença, exame físico
- Hipótese diagnóstica e conduta
- Vinculação automática com agendamento

### 4️⃣ **Geração de Orçamentos**
- Baseado na ficha de atendimento
- Numeração automática (ORC-YYYY-XXX)
- Valores detalhados (procedimento + anestesia + hospital)
- Formas de pagamento e prazo de validade

### 5️⃣ **Prontuário Digital**
- **Receitas**: Prescrições médicas vinculadas à ficha
- **Exames**: Solicitações de exames laboratoriais e imagem
- Geração de PDF para impressão
- Integração com sistema de email

## 🚀 Como Executar

### Desenvolvimento Local
```bash
npm run dev
# ou
npm run integrado
```

### Caderno Digital Isolado
```bash
npm run caderno
```

### Produção
```bash
npm start
```

## 📊 Endpoints Principais

### Pacientes
- `GET /api/pacientes` - Listar pacientes
- `POST /api/pacientes` - Cadastrar paciente
- `GET /api/pacientes/:id` - Dados completos do paciente

### Agendamentos
- `GET /api/agendamentos` - Listar agendamentos
- `POST /api/agendamentos` - Criar agendamento

### Fichas de Atendimento
- `GET /api/fichas` - Listar fichas
- `POST /api/fichas` - Criar ficha

### Orçamentos
- `GET /api/orcamentos` - Listar orçamentos
- `POST /api/orcamentos` - Criar orçamento

### Prontuário
- `GET /api/receitas` - Listar receitas
- `POST /api/receitas` - Criar receita
- `GET /api/exames` - Listar exames
- `POST /api/exames` - Criar solicitação de exame

### Integração
- `GET /api/fluxo/:paciente_id` - Fluxo completo do paciente
- `GET /api/dashboard` - Estatísticas do sistema
- `GET /api/status` - Status da aplicação

## 🌐 URLs de Acesso

- **Sistema Principal**: `http://localhost:3004/`
- **Dashboard**: `http://localhost:3004/dashboard`
- **Caderno Digital**: `http://localhost:3004/caderno-digital`
- **API Status**: `http://localhost:3004/api/status`

## 🛠 Tecnologias

- **Backend**: Node.js + Express.js
- **Frontend**: HTML5 + JavaScript + CSS3
- **PDF**: jsPDF para geração de documentos
- **Database**: PostgreSQL (Railway) + Mock data para desenvolvimento
- **Deploy**: Railway Platform

## 📈 Dados de Exemplo

O sistema inclui dados de exemplo pré-configurados:
- 2 pacientes cadastrados
- 2 agendamentos
- 1 ficha de atendimento completa
- 1 orçamento de R$ 20.000,00
- 1 receita pré-operatória
- 1 solicitação de exames

## 🔐 Variáveis de Ambiente

```env
PORT=3004
NODE_ENV=production
DATABASE_URL=postgresql://... (opcional para desenvolvimento)
```

## 📋 Deploy Railway

1. Conectar repositório ao Railway
2. Configurar variáveis de ambiente
3. Deploy automático via `railway.toml`

## 📝 Logs

O sistema inclui logs detalhados de:
- Todas as requisições HTTP
- Criação de registros
- Integração entre módulos
- Estatísticas em tempo real

---

**Desenvolvido por**: Dr. Marcio Scartozzoni  
**Versão**: 1.0.0  
**Data**: Agosto 2025
