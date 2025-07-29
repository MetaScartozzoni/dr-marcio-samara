# Use Node.js oficial com base estável
FROM node:18-alpine

# Instala dependências do sistema e cria usuário
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de configuração
COPY package*.json ./

# Instala dependências como root
RUN npm ci --only=production && npm cache clean --force

# Copia código da aplicação
COPY --chown=nextjs:nodejs . .

# Muda para usuário não-root
USER nextjs

# Expõe a porta
EXPOSE 3000

# Define variável de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Usa dumb-init para gerenciamento de processos
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["npm", "start"]
