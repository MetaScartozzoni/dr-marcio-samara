#!/bin/bash
# Script de build alternativo para Railway

echo "🔧 Iniciando build do Portal Dr. Marcio..."

# Remove package-lock.json se existir
echo "🗑️ Removendo package-lock.json..."
rm -f package-lock.json

# Limpa cache do npm
echo "🧹 Limpando cache do npm..."
npm cache clean --force

# Instala dependências
echo "📦 Instalando dependências..."
npm install --only=production --no-package-lock --verbose

# Verifica se as dependências principais estão instaladas
echo "✅ Verificando dependências críticas..."

CRITICAL_DEPS=(
    "express"
    "pg" 
    "bcrypt"
    "cors"
    "cookie-parser"
    "@sendgrid/mail"
    "twilio"
)

for dep in "${CRITICAL_DEPS[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
        echo "  ✓ $dep instalado"
    else
        echo "  ✗ $dep FALTANDO - instalando..."
        npm install "$dep" --save
    fi
done

echo "🎉 Build concluído com sucesso!"
echo "📋 Dependências instaladas:"
npm list --depth=0

exit 0
