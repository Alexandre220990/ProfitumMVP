# ============================================================================
# DOCKERFILE RAILWAY - PROFITUM MVP
# ============================================================================

FROM node:18-alpine

# Configuration mémoire pour Railway 8GB
ENV NODE_OPTIONS="--max-old-space-size=6144"

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source (incluant railway-build.sh)
COPY . .

# Rendre le script exécutable et corriger les fins de ligne
RUN chmod +x railway-build.sh && \
    sed -i 's/\r$//' railway-build.sh || true

# Exécuter le build personnalisé
RUN sh railway-build.sh

# Exposer le port
EXPOSE 5001

# Commande de démarrage
CMD ["npm", "start"] 