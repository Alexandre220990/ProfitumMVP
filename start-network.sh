#!/bin/bash

# Script pour démarrer l'application en mode réseau local
# Permet à d'autres utilisateurs sur le même WiFi d'accéder à l'application

echo "🚀 Démarrage de l'application en mode réseau local..."

# Obtenir l'adresse IP locale
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "192.168.1.100")
fi

echo "📡 Adresse IP locale détectée: $LOCAL_IP"
echo "🌐 L'application sera accessible sur:"
echo "   Frontend: http://$LOCAL_IP:3000"
echo "   Backend:  http://$LOCAL_IP:5001"
echo ""

# Vérifier que les ports sont disponibles
echo "🔍 Vérification des ports..."

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Le port 3000 est déjà utilisé. Arrêt du processus..."
    lsof -ti:3000 | xargs kill -9
fi

if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Le port 5001 est déjà utilisé. Arrêt du processus..."
    lsof -ti:5001 | xargs kill -9
fi

echo "✅ Ports disponibles"

# Démarrer le backend
echo "🔧 Démarrage du backend..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Attendre que le backend soit prêt
echo "⏳ Attente du démarrage du backend..."
sleep 5

# Démarrer le frontend
echo "🎨 Démarrage du frontend..."
cd client
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Application démarrée avec succès!"
echo ""
echo "📱 Instructions pour l'utilisateur:"
echo "1. Se connecter à votre WiFi"
echo "2. Ouvrir un navigateur"
echo "3. Aller sur: http://$LOCAL_IP:3000"
echo ""
echo "🔐 Informations de connexion:"
echo "   Email: grandjean.alexandre5@gmail.com"
echo "   Mot de passe: test123"
echo ""
echo "🛑 Pour arrêter l'application: Ctrl+C"

# Fonction pour arrêter proprement les processus
cleanup() {
    echo ""
    echo "🛑 Arrêt de l'application..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Application arrêtée"
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT

# Attendre que les processus se terminent
wait 