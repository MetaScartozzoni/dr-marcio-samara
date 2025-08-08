#!/bin/sh
# Railway startup script
set -e

#!/bin/bash
# Script de inicialização robusto para Railway

echo "🚀 Iniciando Portal Dr. Marcio..."

# Verificar se Node.js está disponível
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node --version)
echo "📋 Node.js version: $NODE_VERSION"

# Verificar se o arquivo principal existe
if [ ! -f "server.js" ]; then
    echo "❌ server.js não encontrado!"
    exit 1
fi

# Definir variáveis de ambiente padrão
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}

echo "🔧 Configurações:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"

# Verificar dependências críticas
echo "🔍 Verificando dependências críticas..."

MISSING_DEPS=()

if ! node -e "require('express')" 2>/dev/null; then
    MISSING_DEPS+=("express")
fi

if ! node -e "require('pg')" 2>/dev/null; then
    MISSING_DEPS+=("pg")
fi

if ! node -e "require('cookie-parser')" 2>/dev/null; then
    MISSING_DEPS+=("cookie-parser")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    echo "❌ Dependências faltando: ${MISSING_DEPS[*]}"
    echo "🔧 Tentando instalar..."
    
    for dep in "${MISSING_DEPS[@]}"; do
        echo "   Instalando $dep..."
        npm install "$dep" || echo "   ⚠️ Falha ao instalar $dep"
    done
fi

# Verificar conectividade do banco
echo "🔍 Testando configuração do sistema..."

# Iniciar aplicação
echo "🎯 Iniciando aplicação..."
exec node server.js
echo "📧 SendGrid: ${SENDGRID_API_KEY:0:10}..."
echo "📱 Twilio: ${TWILIO_ACCOUNT_SID:0:10}..."
echo "🔧 Node Environment: $NODE_ENV"
echo "🌐 Port: $PORT"

# Verificar dependências críticas
if [ -z "$SENDGRID_API_KEY" ]; then
  echo "⚠️  SENDGRID_API_KEY não configurado"
fi

# Iniciar aplicação SIMPLIFICADA
exec node server-simple.js
