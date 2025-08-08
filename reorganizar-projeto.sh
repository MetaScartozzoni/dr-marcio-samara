#!/bin/bash

# 🚀 SCRIPT DE REORGANIZAÇÃO - PORTAL DR. MARCIO
echo "🏗️ Reorganizando estrutura do projeto..."

# Verificar se está no diretório correto
if [[ ! -f "server.js" ]]; then
    echo "❌ Erro: Execute este script na pasta do projeto (onde está server.js)"
    exit 1
fi

# Criar estrutura de pastas
echo "📁 Criando estrutura de pastas..."
mkdir -p "/c/Users/Dr. Marcio/projetos"

# Verificar se a pasta de destino já existe
if [[ -d "/c/Users/Dr. Marcio/projetos/portal-dr-marcio" ]]; then
    echo "⚠️  Pasta de destino já existe!"
    echo "🗑️  Removendo pasta antiga..."
    rm -rf "/c/Users/Dr. Marcio/projetos/portal-dr-marcio"
fi

echo "📦 Copiando arquivos para nova estrutura..."

# Copiar todo o conteúdo
cp -r . "/c/Users/Dr. Marcio/projetos/portal-dr-marcio/"

echo "✅ Projeto reorganizado com sucesso!"
echo ""
echo "📋 Nova localização:"
echo "   /c/Users/Dr. Marcio/projetos/portal-dr-marcio/"
echo ""
echo "🔧 Próximos passos:"
echo "   1. Feche o VS Code atual"
echo "   2. Navegue para: cd '/c/Users/Dr. Marcio/projetos/portal-dr-marcio'"
echo "   3. Abra VS Code: code ."
echo "   4. Instale Node.js se necessário"
echo ""
echo "🌐 Production continua funcionando normalmente no Railway!"
