# Use Node.js oficial
FROM node:18-alpine

# Define diretório de trabalho
WORKDIR /app

# Copia package files
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production

# Copia código da aplicação
COPY . .

# Expõe a porta
EXPOSE 3000

# Define usuário não-root para segurança
USER node

# Comando para iniciar a aplicação
CMD ["npm", "start"]
