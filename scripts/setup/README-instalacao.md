# 🚀 INSTALAÇÃO DO SISTEMA DE RECUPERAÇÃO DEFINITIVO

## 📋 Descrição
Script para instalar as tabelas obrigatórias do sistema de recuperação de senha no Railway PostgreSQL.

## ✅ Conformidade
- **LGPD:** Logs mascarados e auditoria completa
- **CFM:** Rastreabilidade médica total
- **Segurança:** Rate limiting e tokens únicos
- **Performance:** Índices otimizados

## 🔧 Como usar

### 1️⃣ Verificar pré-requisitos:
```bash
# Verificar se .env está configurado
cat .env | grep DATABASE_URL

# Instalar dependências se necessário
npm install pg dotenv
```

### 2️⃣ Executar instalação:
```bash
# Método 1: Execução direta
node scripts/setup/instalar-sistema-definitivo.js

# Método 2: Via npm (se configurado)
npm run setup:database
```

### 3️⃣ Verificar instalação:
O script irá criar 4 tabelas:
- `logs_recuperacao_senha` (auditoria)
- `codigos_recuperacao_ativos` (códigos temporários)
- `rate_limit_recuperacao` (proteção)
- `historico_alteracao_senha` (histórico)

## ⚠️ IMPORTANTE
- **Execute apenas UMA vez** por ambiente
- **Backup recomendado** antes da execução
- **Conexão Railway** deve estar funcionando

## 🔍 Troubleshooting

### Erro de conexão:
```bash
# Testar conexão manualmente
psql $DATABASE_URL -c "SELECT NOW();"
```

### Permissões:
Usuário precisa de:
- CREATE TABLE
- CREATE INDEX 
- CREATE FUNCTION

### Railway SSL:
O script já inclui configuração SSL para Railway.

## 📊 Estrutura criada

### Tabelas:
- **logs_recuperacao_senha:** Todos os eventos do sistema
- **codigos_recuperacao_ativos:** Códigos de 6 dígitos ativos
- **rate_limit_recuperacao:** Controle de tentativas
- **historico_alteracao_senha:** Histórico de mudanças

### Índices:
- Performance otimizada para consultas
- Buscas por email, data, IP
- Cleanup automático de códigos expirados

---
**Criado em:** 01/08/2025  
**Versão:** 1.0.0  
**Compatibilidade:** Railway PostgreSQL 16.x
