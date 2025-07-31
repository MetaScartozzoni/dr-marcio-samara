#!/bin/bash

echo "🔧 Configurando PostgreSQL Local para Portal Dr. Marcio"
echo "=============================================="

echo ""
echo "📥 PASSO 1: Instalar PostgreSQL"
echo "- Baixar: https://postgresapp.com/"
echo "- Ou: https://www.postgresql.org/download/macosx/"
echo ""
echo "✅ Depois de instalar, execute:"
echo "   sudo -u postgres createdb portal_dr_marcio_dev"
echo ""

echo "🔑 PASSO 2: Configurar usuário e banco"
echo "Após instalação, execute no terminal PostgreSQL:"
echo ""
echo "CREATE USER portal_user WITH ENCRYPTED PASSWORD '123456';"
echo "CREATE DATABASE portal_dr_marcio_dev OWNER portal_user;"
echo "GRANT ALL PRIVILEGES ON DATABASE portal_dr_marcio_dev TO portal_user;"
echo ""

echo "🔧 PASSO 3: Usar configuração local"
echo "Execute: cp .env.local .env"
echo ""

echo "🚀 PASSO 4: Testar conexão"
echo "Execute: node server-simple.js"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  IMPORTANTE:"
echo "- Ambiente LOCAL = Dados de teste"
echo "- Ambiente RAILWAY = Dados reais de produção"
echo "- NUNCA misture os dois ambientes!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
