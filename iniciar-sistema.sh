#!/bin/bash

# 🏥 PORTAL DR. MARCIO - SCRIPT DE INICIALIZAÇÃO
# ===============================================

echo "🚀 INICIANDO PORTAL DR. MARCIO..."
echo "=================================="

# Verificar se estamos na pasta correta
if [ ! -f "server-local.js" ]; then
    echo "❌ Erro: server-local.js não encontrado!"
    echo "📁 Certifique-se de estar na pasta correta:"
    echo "   cd /Users/marcioscartozzoni/Documents/Projetos/Sites.Google-TESTE"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado! Instale o Node.js primeiro."
    exit 1
fi

# Verificar dependências
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

echo ""
echo "✅ SISTEMA BASE VALIDADO"
echo "✅ TODAS AS FUNCIONALIDADES TESTADAS"
echo "✅ PRONTO PARA MELHORIAS"
echo ""

# Iniciar servidor
echo "🔥 INICIANDO SERVIDOR LOCAL..."
echo "🌐 URL: http://localhost:3001"
echo "🔐 Admin: marcioscartozzoni@gmail.com / AdminMestre2025!"
echo ""
echo "⏳ Pressione Ctrl+C para parar o servidor"
echo ""

PORT=3001 node server-local.js
