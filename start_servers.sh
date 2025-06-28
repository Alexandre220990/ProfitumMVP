#!/bin/bash

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Démarrage des serveurs pour FinancialTracker ===${NC}"

# Vérifier que python3 et npm sont installés
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Python3 n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Vérifier que l'environnement virtuel existe
if [ ! -d "venv_311" ]; then
    echo -e "${YELLOW}L'environnement virtuel venv_311 n'existe pas. Veuillez le créer.${NC}"
    exit 1
fi

# Fonction pour démarrer le serveur backend
start_backend() {
    echo -e "${BLUE}Démarrage du serveur backend Flask...${NC}"
    cd server
    export FLASK_APP=app.py
    export FLASK_DEBUG=1
    ../venv_311/bin/python app.py &
    BACKEND_PID=$!
    echo -e "${GREEN}Serveur backend démarré (PID: $BACKEND_PID)${NC}"
    cd ..
}

# Fonction pour démarrer le serveur frontend
start_frontend() {
    echo -e "${BLUE}Démarrage du serveur frontend React...${NC}"
    cd client
    npm run dev -- --port 3000 --host &
    FRONTEND_PID=$!
    echo -e "${GREEN}Serveur frontend démarré (PID: $FRONTEND_PID)${NC}"
    cd ..
}

# Fonction pour arrêter les serveurs lors de la fermeture du script
cleanup() {
    echo -e "${YELLOW}Arrêt des serveurs...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID
    fi
    echo -e "${GREEN}Serveurs arrêtés.${NC}"
    exit 0
}

# Capturer le signal d'interruption (Ctrl+C)
trap cleanup SIGINT

# Démarrer les serveurs
start_backend
start_frontend

echo -e "${GREEN}Tous les serveurs sont démarrés! Accédez à:${NC}"
echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}Backend: http://localhost:5001${NC}"
echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter les deux serveurs${NC}"

# Garder le script en vie jusqu'à ce qu'il soit interrompu
while true; do
    sleep 1
done 