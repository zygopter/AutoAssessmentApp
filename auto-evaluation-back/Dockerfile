FROM node:18-alpine

WORKDIR /app

# Copier package.json + installer
COPY package.json package-lock.json* ./
# Use npm install to tolerate missing lockfile (local repo lockfile deleted)
RUN npm install --production

# Copier le code
COPY . .

# Charger les variables .env
ENV NODE_ENV=production

# Exposer le port
EXPOSE 5000

# Lancer le serveur
CMD ["node", "server.js"]
