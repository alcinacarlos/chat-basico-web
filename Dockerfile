# syntax=docker/dockerfile:1

FROM node:18-alpine

WORKDIR /app

# Instala dependencias primero (mejor caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copia el resto del proyecto
COPY . .

# El servidor lee PORT desde env (por defecto 3000). En Docker usamos 80.
ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "index.js"]
