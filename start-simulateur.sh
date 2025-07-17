#!/bin/bash

echo "🚀 Démarrage du Simulateur d'Éligibilité Profitum"
echo "=================================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si on est dans le bon répertoire
if [ ! -f "package.json" ] || [ ! -d "server" ] || [ ! -d "client" ]; then
    print_error "Veuillez exécuter ce script depuis la racine du projet FinancialTracker"
    exit 1
fi

print_status "Vérification de l'environnement..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé"
    exit 1
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé"
    exit 1
fi

print_success "Environnement Node.js vérifié"

# Fonction pour nettoyer les processus existants
cleanup_processes() {
    print_status "Nettoyage des processus existants..."
    
    # Tuer les processus sur les ports 5000 et 3000
    pkill -f "node.*5000" 2>/dev/null || true
    pkill -f "node.*3000" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    sleep 2
}

# Fonction pour démarrer le backend
start_backend() {
    print_status "Démarrage du serveur backend..."
    
    cd server
    
    # Vérifier si les dépendances sont installées
    if [ ! -d "node_modules" ]; then
        print_warning "Installation des dépendances backend..."
        npm install
    fi
    
    # Démarrer le backend en arrière-plan
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    
    cd ..
    
    # Attendre que le backend soit prêt
    print_status "Attente du démarrage du backend..."
    for i in {1..30}; do
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            print_success "Backend démarré avec succès (PID: $BACKEND_PID)"
            return 0
        fi
        sleep 1
    done
    
    print_error "Le backend n'a pas démarré dans les temps"
    return 1
}

# Fonction pour démarrer le frontend
start_frontend() {
    print_status "Démarrage du serveur frontend..."
    
    cd client
    
    # Vérifier si les dépendances sont installées
    if [ ! -d "node_modules" ]; then
        print_warning "Installation des dépendances frontend..."
        npm install
    fi
    
    # Démarrer le frontend en arrière-plan
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    cd ..
    
    # Attendre que le frontend soit prêt
    print_status "Attente du démarrage du frontend..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_success "Frontend démarré avec succès (PID: $FRONTEND_PID)"
            return 0
        fi
        sleep 1
    done
    
    print_error "Le frontend n'a pas démarré dans les temps"
    return 1
}

# Fonction pour afficher les URLs
show_urls() {
    echo ""
    echo "🎉 Simulateur d'Éligibilité démarré avec succès !"
    echo "=================================================="
    echo ""
    echo "📱 Frontend (Interface utilisateur):"
    echo "   http://localhost:3000"
    echo ""
    echo "🔧 Backend (API):"
    echo "   http://localhost:5000"
    echo ""
    echo "🧪 Simulateur d'Éligibilité:"
    echo "   http://localhost:3000/simulateur-eligibilite"
    echo ""
    echo "📊 Logs:"
    echo "   Backend:  tail -f backend.log"
    echo "   Frontend: tail -f frontend.log"
    echo ""
    echo "🛑 Pour arrêter les serveurs:"
    echo "   pkill -f 'node.*dev'"
    echo ""
}

# Fonction pour gérer l'arrêt propre
cleanup_on_exit() {
    print_status "Arrêt des serveurs..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    print_success "Serveurs arrêtés"
    exit 0
}

# Capturer Ctrl+C pour un arrêt propre
trap cleanup_on_exit INT

# Script principal
main() {
    cleanup_processes
    
    if start_backend; then
        if start_frontend; then
            show_urls
            
            # Garder le script en vie
            print_status "Serveurs en cours d'exécution. Appuyez sur Ctrl+C pour arrêter."
            while true; do
                sleep 10
            done
        else
            print_error "Échec du démarrage du frontend"
            kill $BACKEND_PID 2>/dev/null || true
            exit 1
        fi
    else
        print_error "Échec du démarrage du backend"
        exit 1
    fi
}

# Lancer le script principal
main 