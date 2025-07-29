#!/bin/sh
# Railway startup script
set -e

echo "🚀 Iniciando Portal Dr. Marcio..."
echo "📧 SendGrid: ${SENDGRID_API_KEY:0:10}..."
echo "📱 Twilio: ${TWILIO_ACCOUNT_SID:0:10}..."
echo "🔧 Node Environment: $NODE_ENV"
echo "🌐 Port: $PORT"

# Verificar dependências críticas
if [ -z "$SENDGRID_API_KEY" ]; then
  echo "⚠️  SENDGRID_API_KEY não configurado"
fi

# Iniciar aplicação
exec node server.js
