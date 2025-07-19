#!/bin/bash

# ============================================================================
# SCRIPT DE CONFIGURATION AUTOMATIQUE - PROFITUMV2
# ============================================================================

echo "🚀 Configuration automatique de l'environnement ProfitumV2"
echo "=========================================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# CONFIGURATION SERVEUR
# ============================================================================

echo -e "\n${BLUE}📁 Configuration du serveur...${NC}"

# Vérifier si le fichier .env existe déjà
if [ -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  Le fichier server/.env existe déjà. Voulez-vous le remplacer ? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Configuration serveur annulée.${NC}"
    else
        echo -e "${GREEN}Remplacement du fichier server/.env...${NC}"
        rm server/.env
    fi
fi

# Créer le fichier .env pour le serveur
if [ ! -f "server/.env" ]; then
    cat > server/.env << EOF
# ============================================================================
# CONFIGURATION GOOGLE CALENDAR - PROFITUMV2
# ============================================================================

# Google OAuth2 - ProfitumV2
GOOGLE_CLIENT_ID=52812479275-iq1blqc657g2f72graej7m2cfp7gorp6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# ============================================================================
# CONFIGURATION SUPABASE
# ============================================================================

SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# ============================================================================
# CONFIGURATION SERVEUR
# ============================================================================

PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# ============================================================================
# CONFIGURATION SOCKET.IO (MESSAGERIE)
# ============================================================================

SOCKET_CORS_ORIGIN=http://localhost:5173

# ============================================================================
# CONFIGURATION SÉCURITÉ
# ============================================================================

JWT_SECRET=votre_jwt_secret_tres_securise
SESSION_SECRET=votre_session_secret_tres_securise
EOF

    echo -e "${GREEN}✅ Fichier server/.env créé avec succès${NC}"
else
    echo -e "${YELLOW}⚠️  Fichier server/.env conservé${NC}"
fi

# ============================================================================
# CONFIGURATION CLIENT
# ============================================================================

echo -e "\n${BLUE}📁 Configuration du client...${NC}"

# Vérifier si le fichier .env existe déjà
if [ -f "client/.env" ]; then
    echo -e "${YELLOW}⚠️  Le fichier client/.env existe déjà. Voulez-vous le remplacer ? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Configuration client annulée.${NC}"
    else
        echo -e "${GREEN}Remplacement du fichier client/.env...${NC}"
        rm client/.env
    fi
fi

# Créer le fichier .env pour le client
if [ ! -f "client/.env" ]; then
    cat > client/.env << EOF
# ============================================================================
# CONFIGURATION CLIENT - PROFITUMV2
# ============================================================================

VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
VITE_SOCKET_URL=http://localhost:3000

# ============================================================================
# CONFIGURATION GOOGLE CALENDAR
# ============================================================================

VITE_GOOGLE_CLIENT_ID=52812479275-iq1blqc657g2f72graej7m2cfp7gorp6.apps.googleusercontent.com
EOF

    echo -e "${GREEN}✅ Fichier client/.env créé avec succès${NC}"
else
    echo -e "${YELLOW}⚠️  Fichier client/.env conservé${NC}"
fi

# ============================================================================
# VÉRIFICATION DES DÉPENDANCES
# ============================================================================

echo -e "\n${BLUE}📦 Vérification des dépendances...${NC}"

# Vérifier les dépendances du serveur
if [ -d "server/node_modules" ]; then
    echo -e "${GREEN}✅ Dépendances serveur installées${NC}"
else
    echo -e "${YELLOW}⚠️  Installation des dépendances serveur...${NC}"
    cd server && npm install && cd ..
fi

# Vérifier les dépendances du client
if [ -d "client/node_modules" ]; then
    echo -e "${GREEN}✅ Dépendances client installées${NC}"
else
    echo -e "${YELLOW}⚠️  Installation des dépendances client...${NC}"
    cd client && npm install && cd ..
fi

# ============================================================================
# RÉSUMÉ DE CONFIGURATION
# ============================================================================

echo -e "\n${GREEN}🎉 Configuration terminée !${NC}"
echo -e "\n${BLUE}📋 Prochaines étapes :${NC}"
echo -e "1. ${YELLOW}Configurer Supabase :${NC}"
echo -e "   - Remplacer 'votre-projet.supabase.co' par votre URL Supabase"
echo -e "   - Remplacer 'votre_anon_key' par votre clé anonyme"
echo -e "   - Remplacer 'votre_service_role_key' par votre clé de service"
echo -e ""
echo -e "2. ${YELLOW}Configurer la sécurité :${NC}"
echo -e "   - Générer des secrets JWT et session sécurisés"
echo -e ""
echo -e "3. ${YELLOW}Démarrer les services :${NC}"
echo -e "   - Serveur : cd server && npm run dev"
echo -e "   - Client : cd client && npm run dev"
echo -e ""
echo -e "4. ${YELLOW}Tester l'intégration :${NC}"
echo -e "   - Google Calendar : http://localhost:5173/google-calendar-integration"
echo -e "   - Messagerie : http://localhost:5173/messagerie"
echo -e ""
echo -e "${GREEN}✅ Configuration Google Cloud ProfitumV2 prête !${NC}" 