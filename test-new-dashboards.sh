#!/bin/bash

echo "🚀 Démarrage des serveurs et test des nouveaux dashboards"
echo "========================================================"

# Fonction pour vérifier si un port est utilisé
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Fonction pour démarrer le serveur backend
start_backend() {
    echo "🔧 Démarrage du serveur backend..."
    cd server
    if [ ! -d "node_modules" ]; then
        echo "📦 Installation des dépendances backend..."
        npm install
    fi
    
    # Démarrer le serveur backend en arrière-plan
    npm run dev &
    BACKEND_PID=$!
    echo "✅ Serveur backend démarré (PID: $BACKEND_PID)"
    cd ..
}

# Fonction pour démarrer le serveur frontend
start_frontend() {
    echo "🎨 Démarrage du serveur frontend..."
    cd client
    if [ ! -d "node_modules" ]; then
        echo "📦 Installation des dépendances frontend..."
        npm install
    fi
    
    # Démarrer le serveur frontend en arrière-plan
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ Serveur frontend démarré (PID: $FRONTEND_PID)"
    cd ..
}

# Fonction pour tester les nouveaux dashboards
test_dashboards() {
    echo ""
    echo "🧪 Test des nouveaux dashboards"
    echo "==============================="
    
    # Attendre que les serveurs soient prêts
    echo "⏳ Attente du démarrage des serveurs..."
    sleep 10
    
    # Test du dashboard client-assignments
    echo ""
    echo "📋 Test du dashboard client-assignments..."
    if curl -s http://localhost:3000/dashboard/client-assignments > /dev/null; then
        echo "✅ Dashboard client-assignments accessible"
        echo "   URL: http://localhost:3000/dashboard/client-assignments"
    else
        echo "❌ Dashboard client-assignments non accessible"
    fi
    
    # Test du dashboard expert-assignments
    echo ""
    echo "📋 Test du dashboard expert-assignments..."
    if curl -s http://localhost:3000/dashboard/expert-assignments > /dev/null; then
        echo "✅ Dashboard expert-assignments accessible"
        echo "   URL: http://localhost:3000/dashboard/expert-assignments"
    else
        echo "❌ Dashboard expert-assignments non accessible"
    fi
    
    # Test de la page d'accueil
    echo ""
    echo "📋 Test de la page d'accueil..."
    if curl -s http://localhost:3000/home > /dev/null; then
        echo "✅ Page d'accueil accessible"
        echo "   URL: http://localhost:3000/home"
    else
        echo "❌ Page d'accueil non accessible"
    fi
}

# Fonction pour afficher les URLs
show_urls() {
    echo ""
    echo "🌐 URLs disponibles"
    echo "=================="
    echo "Frontend: http://localhost:3000"
    echo "Backend:  http://localhost:5000"
    echo ""
    echo "📊 Nouveaux dashboards:"
    echo "  • Client Assignments: http://localhost:3000/dashboard/client-assignments"
    echo "  • Expert Assignments: http://localhost:3000/dashboard/expert-assignments"
    echo ""
    echo "🏠 Pages principales:"
    echo "  • Accueil: http://localhost:3000/home"
    echo "  • Simulateur: http://localhost:3000/simulateur-eligibilite"
    echo ""
    echo "🔧 Pour arrêter les serveurs: Ctrl+C"
}

# Fonction de nettoyage
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Serveur backend arrêté"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Serveur frontend arrêté"
    fi
    exit 0
}

# Capturer Ctrl+C pour arrêter proprement
trap cleanup SIGINT

# Vérifier les ports
echo "🔍 Vérification des ports..."
if check_port 3000; then
    echo "⚠️  Le port 3000 est déjà utilisé"
    read -p "Voulez-vous continuer ? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if check_port 5000; then
    echo "⚠️  Le port 5000 est déjà utilisé"
    read -p "Voulez-vous continuer ? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Démarrer les serveurs
start_backend
start_frontend

# Tester les dashboards
test_dashboards

# Afficher les URLs
show_urls

# Attendre indéfiniment
echo ""
echo "🔄 Serveurs en cours d'exécution. Appuyez sur Ctrl+C pour arrêter."
while true; do
    sleep 1
done 