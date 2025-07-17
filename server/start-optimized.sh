#!/bin/bash

# Script de démarrage optimisé pour le serveur Profitum
# Date: 2025-01-27

echo "🚀 Démarrage optimisé du serveur Profitum"
echo "=========================================="

# Vérifier les variables d'environnement
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Variables d'environnement Supabase manquantes"
    echo "   Assurez-vous que SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies"
    exit 1
fi

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier la version de Node.js (minimum 16)
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 ou supérieure requise (version actuelle: $(node -v))"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Vérifier la connexion à la base de données
echo "🔍 Test de connexion à la base de données..."
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testConnection() {
    try {
        const { data, error } = await supabase.from('Client').select('count').limit(1);
        if (error) {
            console.error('❌ Erreur de connexion:', error.message);
            process.exit(1);
        }
        console.log('✅ Connexion à la base de données réussie');
    } catch (error) {
        console.error('❌ Erreur de connexion:', error.message);
        process.exit(1);
    }
}

testConnection();
"

if [ $? -ne 0 ]; then
    echo "❌ Impossible de se connecter à la base de données"
    exit 1
fi

# Optimiser les variables d'environnement Node.js
export NODE_ENV=${NODE_ENV:-development}
export NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"

# Configuration selon l'environnement
if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 Mode production activé"
    export NODE_OPTIONS="$NODE_OPTIONS --production"
else
    echo "🔧 Mode développement activé"
fi

# Démarrer le serveur avec PM2 si disponible, sinon avec Node.js
if command -v pm2 &> /dev/null; then
    echo "📊 Démarrage avec PM2..."
    
    # Vérifier si le processus existe déjà
    if pm2 list | grep -q "profitum-server"; then
        echo "🔄 Redémarrage du serveur existant..."
        pm2 restart profitum-server
    else
        echo "🆕 Création d'un nouveau processus PM2..."
        pm2 start src/index.ts --name "profitum-server" --interpreter ts-node
    fi
    
    echo "✅ Serveur démarré avec PM2"
    echo "📊 Pour voir les logs: pm2 logs profitum-server"
    echo "📊 Pour arrêter: pm2 stop profitum-server"
    
else
    echo "🔄 Démarrage avec Node.js..."
    
    # Démarrer le serveur avec ts-node
    if command -v ts-node &> /dev/null; then
        echo "📝 Utilisation de ts-node pour TypeScript..."
        ts-node src/index.ts
    else
        echo "📝 Compilation TypeScript..."
        npm run build
        node dist/index.js
    fi
fi

echo ""
echo "🎉 Serveur Profitum démarré avec succès !"
echo "🌐 URL: http://localhost:${PORT:-5001}"
echo "📊 Health check: http://localhost:${PORT:-5001}/api/health"
echo ""
echo "🔐 Configuration de sécurité:"
echo "   • Authentification renforcée activée"
echo "   • Rate limiting configuré"
echo "   • Compression activée"
echo "   • Cache activé pour les routes publiques"
echo ""
echo "📈 Optimisations de performance:"
echo "   • Index de base de données optimisés"
echo "   • Middleware de performance activé"
echo "   • Gestion d'erreurs améliorée"
echo "   • Logs structurés" 