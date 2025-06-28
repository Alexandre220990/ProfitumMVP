#!/bin/bash

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Redémarrage des serveurs pour FinancialTracker ===${NC}"

# Fonction pour trouver et arrêter les processus existants
stop_existing_servers() {
  echo -e "${BLUE}Arrêt des serveurs existants...${NC}"
  
  # Trouver et tuer les processus Node.js existants
  BACKEND_PIDS=$(ps aux | grep "node.*server" | grep -v grep | awk '{print $2}')
  FRONTEND_PIDS=$(ps aux | grep "node.*client" | grep -v grep | awk '{print $2}')
  
  if [ ! -z "$BACKEND_PIDS" ]; then
    echo -e "${YELLOW}Arrêt des processus backend: $BACKEND_PIDS${NC}"
    kill $BACKEND_PIDS 2>/dev/null
  fi
  
  if [ ! -z "$FRONTEND_PIDS" ]; then
    echo -e "${YELLOW}Arrêt des processus frontend: $FRONTEND_PIDS${NC}"
    kill $FRONTEND_PIDS 2>/dev/null
  fi
  
  # Attendre que les processus se terminent
  sleep 2
  
  # Vérifier s'il reste des processus et les tuer avec force si nécessaire
  REMAINING_PIDS=$(ps aux | grep -E "node.*server|node.*client" | grep -v grep | awk '{print $2}')
  if [ ! -z "$REMAINING_PIDS" ]; then
    echo -e "${RED}Arrêt forcé des processus restants: $REMAINING_PIDS${NC}"
    kill -9 $REMAINING_PIDS 2>/dev/null
  fi
  
  echo -e "${GREEN}Tous les serveurs ont été arrêtés.${NC}"
}

# Fonction pour démarrer le serveur backend
start_backend() {
  echo -e "${BLUE}Démarrage du serveur backend...${NC}"
  cd server
  npm run dev &
  BACKEND_PID=$!
  echo -e "${GREEN}Serveur backend démarré (PID: $BACKEND_PID)${NC}"
  cd ..
}

# Fonction pour démarrer le serveur frontend
start_frontend() {
  echo -e "${BLUE}Démarrage du serveur frontend...${NC}"
  cd client
  npm run dev &
  FRONTEND_PID=$!
  echo -e "${GREEN}Serveur frontend démarré (PID: $FRONTEND_PID)${NC}"
  cd ..
}

# Fonction pour mettre à jour les politiques RLS
update_rls_policies() {
  echo -e "${BLUE}Mise à jour des politiques RLS dans Supabase...${NC}"
  cd server/scripts
  
  # Vérifier si le fichier TypeScript existe et le compiler
  if [ -f "update_rls_policies.ts" ]; then
    echo -e "${YELLOW}Exécution du script TypeScript pour mettre à jour les politiques RLS...${NC}"
    cd ..
    npx ts-node scripts/update_rls_policies.ts
    cd scripts
  fi
  
  echo -e "${YELLOW}Note: Pour appliquer les politiques SQL manuellement, exécutez le fichier rls_policies.sql dans la console SQL de Supabase.${NC}"
  cd ../..
}

# Fonction pour arrêter les serveurs lors de la fermeture du script
cleanup() {
  echo -e "${YELLOW}Arrêt des serveurs...${NC}"
  if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null
  fi
  if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null
  fi
  echo -e "${GREEN}Serveurs arrêtés.${NC}"
  exit 0
}

# Capturer le signal d'interruption (Ctrl+C)
trap cleanup SIGINT

# Arrêter les serveurs existants
stop_existing_servers

# Mettre à jour les politiques RLS
update_rls_policies

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