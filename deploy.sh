#!/bin/bash

# deploy.sh - Script de deploy automatizado
# Uso: ./deploy.sh [development|production]

set -e

echo "🚀 Iniciando deploy do Sistema de Autenticação"
echo "📅 Data: $(date)"

# Verificar parâmetros
ENVIRONMENT=${1:-development}
echo "🌍 Ambiente: $ENVIRONMENT"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado"
    exit 1
fi

echo "✅ Node.js versão: $(node --version)"

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado"
    exit 1
fi

echo "✅ npm versão: $(npm --version)"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado"
    echo "📝 Criando .env a partir do exemplo..."
    cp .env.example .env
    echo "⚠️  Configure as variáveis de ambiente em .env antes de usar em produção"
fi

# Criar diretório de logs se não existir
mkdir -p logs

# Verificar se o PM2 está instalado para produção
if [ "$ENVIRONMENT" = "production" ]; then
    if ! command -v pm2 &> /dev/null; then
        echo "📦 Instalando PM2 globalmente..."
        npm install -g pm2
    fi
    
    echo "✅ PM2 versão: $(pm2 --version)"
    
    # Parar processos existentes
    echo "🛑 Parando processos existentes..."
    pm2 stop portal-auth 2>/dev/null || echo "Nenhum processo anterior encontrado"
    pm2 delete portal-auth 2>/dev/null || echo "Nenhum processo anterior para deletar"
    
    # Iniciar em produção
    echo "🚀 Iniciando em modo produção..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    echo "📊 Status do PM2:"
    pm2 status
    
else
    # Modo desenvolvimento
    echo "🔧 Iniciando em modo desenvolvimento..."
    echo "Use Ctrl+C para parar o servidor"
    npm run dev
fi

echo ""
echo "✅ Deploy concluído!"
echo "🔗 Acesse: http://localhost:3000"
echo "📋 Health check: http://localhost:3000/api/health"

if [ "$ENVIRONMENT" = "production" ]; then
    echo "📊 Logs: pm2 logs portal-auth"
    echo "🔄 Restart: pm2 restart portal-auth"
    echo "🛑 Stop: pm2 stop portal-auth"
fi
