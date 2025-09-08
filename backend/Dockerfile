# Etapa 1: build
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

# Etapa 2: produção
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app /app
EXPOSE 3000

CMD ["node", "server.js"]
