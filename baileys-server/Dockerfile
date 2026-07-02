FROM node:18-bullseye-slim

# Instalar dependencias del sistema requeridas por Baileys para multimedia (ffmpeg para audio/video)
RUN apt-get update && \
    apt-get install -y ffmpeg libwebp-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar el microservicio
CMD ["npm", "start"]
