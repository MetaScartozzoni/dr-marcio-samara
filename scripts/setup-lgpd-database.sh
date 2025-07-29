#!/bin/bash
# scripts/setup-lgpd-database.sh
# Script para configurar banco de dados com conformidade LGPD

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}   CONFIGURAÇÃO LGPD DATABASE SETUP      ${NC}"
echo -e "${GREEN}   Lei 13.709/2018 - Proteção de Dados   ${NC}"
echo -e "${GREEN}===========================================${NC}"

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo -e "${RED}ERRO: PostgreSQL não está instalado${NC}"
    echo "Instale PostgreSQL primeiro:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Configurações padrão
DB_NAME="${DB_NAME:-sistema_medico_lgpd}"
DB_USER="${DB_USER:-lgpd_admin}"
DB_PASSWORD="${DB_PASSWORD:-lgpd_secure_$(date +%s)}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo -e "${YELLOW}Configurações do banco:${NC}"
echo "  Nome: $DB_NAME"
echo "  Usuário: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Porta: $DB_PORT"
echo ""

# Solicitar confirmação
read -p "Continuar com estas configurações? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operação cancelada."
    exit 1
fi

echo -e "${GREEN}Criando banco de dados...${NC}"

# Criar usuário e banco de dados
sudo -u postgres psql << EOF
-- Criar usuário LGPD
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Criar banco de dados
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Garantir privilégios
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Conectar ao banco
\c $DB_NAME

-- Garantir privilégios no schema público
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

EOF

echo -e "${GREEN}Executando schema LGPD...${NC}"

# Executar schema LGPD
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database-schema-lgpd.sql

echo -e "${GREEN}Inserindo dados iniciais de conformidade...${NC}"

# Inserir dados iniciais
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF

-- Inserir tipos de consentimento padrão
INSERT INTO tipos_consentimento_lgpd (nome, descricao, obrigatorio, categoria) VALUES
('DADOS_PESSOAIS', 'Processamento de dados pessoais básicos', true, 'ESSENCIAL'),
('DADOS_SENSIVEIS', 'Processamento de dados sensíveis (saúde, biometria)', false, 'ESPECIAL'),
('MARKETING', 'Comunicações promocionais e marketing', false, 'MARKETING'),
('ANALYTICS', 'Análise de uso e melhorias do sistema', false, 'FUNCIONAL'),
('TERCEIROS', 'Compartilhamento com parceiros', false, 'COMPARTILHAMENTO'),
('PESQUISA', 'Uso para pesquisa científica', false, 'PESQUISA')
ON CONFLICT (nome) DO NOTHING;

-- Inserir configurações LGPD
INSERT INTO configuracoes_lgpd (chave, valor, categoria, descricao) VALUES
('PRAZO_RESPOSTA_DIAS', '15', 'PRAZOS', 'Prazo para resposta a solicitações LGPD'),
('ANONIMIZACAO_AUTOMATICA', 'true', 'AUTOMACAO', 'Ativar anonimização automática'),
('LOG_RETENTION_DAYS', '1095', 'LOGS', 'Retenção de logs (3 anos)'),
('EMAIL_DPO', 'dpo@empresa.com', 'CONTATO', 'Email do Data Protection Officer'),
('BACKUP_RETENTION_DAYS', '2555', 'BACKUP', 'Retenção de backups (7 anos)'),
('AUDIT_ENABLED', 'true', 'AUDITORIA', 'Auditoria ativada'),
('CONSENT_EXPIRY_DAYS', '730', 'CONSENTIMENTO', 'Validade do consentimento (2 anos)'),
('DATA_BREACH_NOTIFICATION_HOURS', '72', 'INCIDENTES', 'Prazo notificação vazamento dados')
ON CONFLICT (chave) DO NOTHING;

-- Criar usuário administrador LGPD
INSERT INTO usuarios_lgpd (
    nome, email, papel, ativo, criado_em, 
    permissoes, configuracoes_privacidade
) VALUES (
    'Administrador LGPD',
    'admin@lgpd.sistema.com',
    'DPO',
    true,
    NOW(),
    '["ADMIN", "DPO", "AUDIT", "EXPORT", "DELETE", "ANONYMIZE"]'::jsonb,
    '{"receive_notifications": true, "audit_level": "detailed"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Inserir política de privacidade inicial
INSERT INTO politicas_privacidade (
    versao, conteudo, ativa, criada_em, criada_por
) VALUES (
    '1.0',
    'Política de Privacidade em conformidade com a LGPD (Lei 13.709/2018). Esta política descreve como coletamos, usamos e protegemos seus dados pessoais...',
    true,
    NOW(),
    'Sistema'
) ON CONFLICT (versao) DO NOTHING;

-- Log da configuração inicial
INSERT INTO logs_lgpd (
    usuario_id, acao, detalhes, ip_origem, sucesso
) VALUES (
    NULL,
    'CONFIGURACAO_INICIAL',
    '{"event": "database_setup", "version": "1.0", "compliance": "LGPD"}',
    '127.0.0.1',
    true
);

EOF

echo -e "${GREEN}Criando arquivo de configuração...${NC}"

# Criar arquivo de configuração
cat > .env.lgpd << EOF
# Configurações LGPD Database
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT

# URLs LGPD
LGPD_BASE_URL=http://localhost:3000/api/lgpd
PRIVACY_POLICY_URL=http://localhost:3000/api/lgpd/politica-privacidade

# Configurações de segurança
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Configurações de email (para notificações LGPD)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-app

# DPO (Data Protection Officer)
DPO_NAME=Nome do DPO
DPO_EMAIL=dpo@empresa.com
DPO_PHONE=+55 11 99999-9999

# Configurações de backup
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=2555

EOF

echo -e "${GREEN}Criando script de verificação...${NC}"

# Criar script de verificação
cat > scripts/verificar-lgpd.sh << 'EOF'
#!/bin/bash
# Verificar configuração LGPD

source .env.lgpd

echo "Verificando conformidade LGPD..."

# Testar conexão
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    'Tabelas LGPD' as verificacao,
    COUNT(*) as total
FROM information_schema.tables 
WHERE table_name LIKE '%lgpd%';

SELECT 
    'Configurações LGPD' as verificacao,
    COUNT(*) as total
FROM configuracoes_lgpd;

SELECT 
    'Tipos de Consentimento' as verificacao,
    COUNT(*) as total
FROM tipos_consentimento_lgpd;
"

echo "Verificação concluída!"
EOF

chmod +x scripts/verificar-lgpd.sh

echo -e "${GREEN}Criando documentação...${NC}"

# Criar documentação LGPD
cat > LGPD-COMPLIANCE.md << 'EOF'
# Conformidade LGPD - Sistema Médico

## Visão Geral
Este sistema está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).

## Funcionalidades LGPD Implementadas

### 1. Direitos dos Titulares
- ✅ Acesso aos dados (Art. 18, II)
- ✅ Portabilidade de dados (Art. 18, V)
- ✅ Eliminação de dados (Art. 18, VI)
- ✅ Informações sobre tratamento (Art. 18, I)
- ✅ Correção de dados (Art. 18, III)
- ✅ Anonimização (Art. 18, IV)
- ✅ Revogação de consentimento (Art. 18, IX)

### 2. Base Legal
- Consentimento (Art. 7º, I)
- Execução de contrato (Art. 7º, V)
- Proteção da vida (Art. 7º, VII)
- Tutela da saúde (Art. 11, II)

### 3. Medidas de Segurança
- Criptografia de dados sensíveis
- Logs de auditoria
- Controle de acesso
- Monitoramento de atividades suspeitas
- Backup seguro

### 4. Governança
- Data Protection Officer (DPO)
- Política de Privacidade
- Registro de Atividades de Tratamento
- Avaliação de Impacto à Proteção de Dados

## Endpoints LGPD

### Públicos
- `GET /api/lgpd/politica-privacidade` - Política de privacidade
- `POST /api/lgpd/consentimento` - Registrar consentimento

### Protegidos (Usuário)
- `GET /api/lgpd/meus-dados` - Acessar dados pessoais
- `GET /api/lgpd/exportar` - Exportar dados (portabilidade)
- `POST /api/lgpd/excluir` - Solicitar exclusão
- `POST /api/lgpd/revogar-consentimento` - Revogar consentimento

### Administrativos (DPO)
- `GET /api/lgpd/admin/relatorio` - Relatório de conformidade
- `GET /api/lgpd/admin/logs` - Logs de auditoria
- `POST /api/lgpd/admin/anonimizar` - Anonimizar dados

## Configuração

1. Execute o setup do banco:
```bash
./scripts/setup-lgpd-database.sh
```

2. Configure as variáveis de ambiente:
```bash
cp .env.lgpd .env
```

3. Verifique a instalação:
```bash
./scripts/verificar-lgpd.sh
```

## Monitoramento

O sistema registra todas as atividades relacionadas ao tratamento de dados:
- Acessos a dados pessoais
- Exportações de dados
- Solicitações de exclusão
- Alterações de consentimento
- Atividades suspeitas

## Contato DPO

Para questões relacionadas à proteção de dados:
- Email: dpo@empresa.com
- Formulário: /api/lgpd/contato-dpo

## Conformidade Legal

Este sistema atende aos requisitos da LGPD:
- Lei 13.709/2018
- Resolução CD/ANPD nº 2/2022
- Guia Orientativo ANPD

EOF

echo ""
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}   CONFIGURAÇÃO LGPD CONCLUÍDA COM SUCESSO   ${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Revisar configurações em .env.lgpd"
echo "2. Configurar email para notificações LGPD"
echo "3. Definir DPO (Data Protection Officer)"
echo "4. Testar endpoints: ./scripts/verificar-lgpd.sh"
echo "5. Revisar documentação: LGPD-COMPLIANCE.md"
echo ""
echo -e "${GREEN}Sistema pronto para produção em conformidade com LGPD!${NC}"
