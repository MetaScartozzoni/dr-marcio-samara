#!/bin/bash
# Script de inicialização do banco de dados no Railway

echo "🚀 Iniciando configuração do banco de dados..."

# Verificar se a DATABASE_URL existe
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não encontrada. Adicione o PostgreSQL addon no Railway."
    exit 1
fi

echo "✅ DATABASE_URL encontrada!"

# Executar schema do banco
echo "📊 Criando schema do banco de dados..."

# Conectar ao PostgreSQL e executar o schema
psql $DATABASE_URL -f database-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema do banco criado com sucesso!"
else
    echo "⚠️ Erro ao criar schema. Será criado automaticamente na primeira execução."
fi

echo "🎉 Configuração concluída!"
