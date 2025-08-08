# Use Node.js oficial com base estável
FROM node:18-alpine

# Instala dependências do sistema
RUN apk add --no-cache dumb-init

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de configuração
COPY package*.json ./

# Remove package-lock.json se existir para evitar conflitos
RUN rm -f package-lock.json

# Instala dependências sem usar cache
RUN npm install --only=production --no-package-lock

# Limpa cache do npm
RUN npm cache clean --force

# Copia código da aplicação
COPY . .

# Cria usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs

# Ajusta permissões
RUN chown -R nodejs:nodejs /app

# Muda para usuário não-root
USER nodejs

# Expõe a porta
EXPOSE 3000

# Define variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Usa dumb-init para gerenciamento de processos
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["npm", "start"]
