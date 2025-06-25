FROM node:18-alpine

WORKDIR /app

# Copier package.json + installer
COPY package.json package-lock.json* ./
RUN npm ci

# Copier le code
COPY . .

# Build de l’app React
RUN npm run build

# Installer un petit serveur statique
RUN npm install -g serve

# Exposer le port
EXPOSE 3000

# Servir le build
CMD ["serve", "-s", "build", "-l", "3000"]
