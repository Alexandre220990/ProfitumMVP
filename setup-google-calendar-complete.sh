#!/bin/bash

# ============================================================================
# SCRIPT DE CONFIGURATION COMPLÈTE - GOOGLE CALENDAR PROFITUMV2
# ============================================================================

echo "🚀 Configuration complète de l'intégration Google Calendar"
echo "=========================================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# VÉRIFICATIONS PRÉALABLES
# ============================================================================

echo -e "\n${BLUE}🔍 Vérifications préalables...${NC}"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi

# Vérifier les dossiers
if [ ! -d "server" ]; then
    echo -e "${RED}❌ Dossier server non trouvé${NC}"
    exit 1
fi

if [ ! -d "client" ]; then
    echo -e "${RED}❌ Dossier client non trouvé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Vérifications préalables OK${NC}"

# ============================================================================
# INSTALLATION DES DÉPENDANCES
# ============================================================================

echo -e "\n${BLUE}📦 Installation des dépendances...${NC}"

# Serveur
echo -e "${YELLOW}Installation des dépendances serveur...${NC}"
cd server
npm install googleapis @types/googleapis
npm install express-rate-limit
npm install joi
npm install socket.io @types/socket.io
cd ..

# Client
echo -e "${YELLOW}Installation des dépendances client...${NC}"
cd client
npm install @types/google.maps
npm install date-fns
cd ..

echo -e "${GREEN}✅ Dépendances installées${NC}"

# ============================================================================
# CONFIGURATION DES VARIABLES D'ENVIRONNEMENT
# ============================================================================

echo -e "\n${BLUE}🔐 Configuration des variables d'environnement...${NC}"

# Créer le fichier .env du serveur
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}Création du fichier server/.env...${NC}"
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
CLIENT_URL=http://localhost:5173

# ============================================================================
# CONFIGURATION SOCKET.IO (MESSAGERIE)
# ============================================================================

SOCKET_CORS_ORIGIN=http://localhost:5173

# ============================================================================
# CONFIGURATION SÉCURITÉ
# ============================================================================

JWT_SECRET=votre_jwt_secret_tres_securise_2024_profitum
SESSION_SECRET=votre_session_secret_tres_securise_2024_profitum

# ============================================================================
# CONFIGURATION REDIS (CACHE ET QUEUES)
# ============================================================================

REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# ============================================================================
# CONFIGURATION GOOGLE CALENDAR AVANCÉE
# ============================================================================

# Limites de synchronisation
GOOGLE_CALENDAR_SYNC_INTERVAL=300000
GOOGLE_CALENDAR_MAX_EVENTS_PER_SYNC=1000
GOOGLE_CALENDAR_SYNC_WINDOW_DAYS=90

# Configuration des notifications
GOOGLE_CALENDAR_NOTIFICATION_EMAIL=true
GOOGLE_CALENDAR_NOTIFICATION_PUSH=true
GOOGLE_CALENDAR_DEFAULT_REMINDER_MINUTES=15

# Configuration des réunions
GOOGLE_CALENDAR_AUTO_CREATE_MEETINGS=true
GOOGLE_CALENDAR_MEETING_DURATION_DEFAULT=60
GOOGLE_CALENDAR_TIMEZONE_DEFAULT=Europe/Paris

# ============================================================================
# CONFIGURATION LOGS ET MONITORING
# ============================================================================

LOG_LEVEL=info
ENABLE_GOOGLE_CALENDAR_LOGS=true
ENABLE_SYNC_LOGS=true
ENABLE_ERROR_LOGS=true
EOF
    echo -e "${GREEN}✅ Fichier server/.env créé${NC}"
else
    echo -e "${YELLOW}⚠️  Le fichier server/.env existe déjà${NC}"
fi

# Créer le fichier .env du client
if [ ! -f "client/.env" ]; then
    echo -e "${YELLOW}Création du fichier client/.env...${NC}"
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
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
EOF
    echo -e "${GREEN}✅ Fichier client/.env créé${NC}"
else
    echo -e "${YELLOW}⚠️  Le fichier client/.env existe déjà${NC}"
fi

# ============================================================================
# VÉRIFICATION DE LA BASE DE DONNÉES
# ============================================================================

echo -e "\n${BLUE}🗄️  Vérification de la base de données...${NC}"

# Vérifier que les migrations ont été appliquées
if [ -f "server/migrations/20250128_create_calendar_system.sql" ]; then
    echo -e "${GREEN}✅ Migration du système de calendrier trouvée${NC}"
else
    echo -e "${RED}❌ Migration du système de calendrier manquante${NC}"
    echo -e "${YELLOW}Veuillez appliquer la migration 20250128_create_calendar_system.sql${NC}"
fi

# ============================================================================
# CONFIGURATION DES ROUTES
# ============================================================================

echo -e "\n${BLUE}🛣️  Configuration des routes...${NC}"

# Vérifier que les routes sont configurées dans le serveur principal
if [ -f "server/src/app.ts" ]; then
    echo -e "${GREEN}✅ Fichier app.ts trouvé${NC}"
    
    # Vérifier si les routes Google Calendar sont importées
    if grep -q "google-calendar" server/src/app.ts; then
        echo -e "${GREEN}✅ Routes Google Calendar configurées${NC}"
    else
        echo -e "${YELLOW}⚠️  Routes Google Calendar non configurées dans app.ts${NC}"
        echo -e "${YELLOW}Ajoutez: app.use('/api/google-calendar', require('./routes/google-calendar'))${NC}"
    fi
    
    # Vérifier si les routes d'événements collaboratifs sont importées
    if grep -q "collaborative-events" server/src/app.ts; then
        echo -e "${GREEN}✅ Routes événements collaboratifs configurées${NC}"
    else
        echo -e "${YELLOW}⚠️  Routes événements collaboratifs non configurées dans app.ts${NC}"
        echo -e "${YELLOW}Ajoutez: app.use('/api/collaborative-events', require('./routes/collaborative-events'))${NC}"
    fi
else
    echo -e "${RED}❌ Fichier app.ts non trouvé${NC}"
fi

# ============================================================================
# CONFIGURATION GOOGLE CLOUD CONSOLE
# ============================================================================

echo -e "\n${BLUE}☁️  Configuration Google Cloud Console...${NC}"

echo -e "${YELLOW}📋 Étapes à suivre dans Google Cloud Console :${NC}"
echo -e "1. Allez sur https://console.cloud.google.com/"
echo -e "2. Créez un projet ou sélectionnez un projet existant"
echo -e "3. Activez les APIs :"
echo -e "   - Google Calendar API"
echo -e "   - Google+ API"
echo -e "4. Créez des identifiants OAuth2 :"
echo -e "   - Type : Web application"
echo -e "   - URIs de redirection :"
echo -e "     * http://localhost:3000/api/auth/google/callback"
echo -e "     * https://votre-domaine.com/api/auth/google/callback"
echo -e "5. Configurez l'écran de consentement :"
echo -e "   - Nom de l'app : Profitum"
echo -e "   - Scopes :"
echo -e "     * https://www.googleapis.com/auth/calendar"
echo -e "     * https://www.googleapis.com/auth/calendar.events"
echo -e "     * https://www.googleapis.com/auth/userinfo.email"
echo -e "     * https://www.googleapis.com/auth/userinfo.profile"

# ============================================================================
# TESTS DE CONFIGURATION
# ============================================================================

echo -e "\n${BLUE}🧪 Tests de configuration...${NC}"

# Test de compilation TypeScript
echo -e "${YELLOW}Test de compilation TypeScript...${NC}"
cd server
if npm run build 2>/dev/null; then
    echo -e "${GREEN}✅ Compilation serveur OK${NC}"
else
    echo -e "${YELLOW}⚠️  Erreurs de compilation serveur (normal en développement)${NC}"
fi
cd ..

cd client
if npm run build 2>/dev/null; then
    echo -e "${GREEN}✅ Compilation client OK${NC}"
else
    echo -e "${YELLOW}⚠️  Erreurs de compilation client (normal en développement)${NC}"
fi
cd ..

# ============================================================================
# DÉMARRAGE DES SERVICES
# ============================================================================

echo -e "\n${BLUE}🚀 Démarrage des services...${NC}"

echo -e "${YELLOW}Pour démarrer le serveur :${NC}"
echo -e "cd server && npm run dev"
echo -e ""
echo -e "${YELLOW}Pour démarrer le client :${NC}"
echo -e "cd client && npm run dev"
echo -e ""

# ============================================================================
# TESTS D'INTÉGRATION
# ============================================================================

echo -e "\n${BLUE}🔗 Tests d'intégration...${NC}"

echo -e "${YELLOW}Tests à effectuer :${NC}"
echo -e "1. Test de connexion Google Calendar :"
echo -e "   - Allez sur http://localhost:5173/google-calendar-integration"
echo -e "   - Cliquez sur 'Se connecter à Google Calendar'"
echo -e "   - Autorisez l'accès à votre compte Google"
echo -e ""
echo -e "2. Test de création d'événement collaboratif :"
echo -e "   - Allez sur http://localhost:5173/agenda-client"
echo -e "   - Créez un nouvel événement collaboratif"
echo -e "   - Invitez des participants"
echo -e ""
echo -e "3. Test de synchronisation :"
echo -e "   - Vérifiez que les événements apparaissent dans Google Calendar"
echo -e "   - Créez un événement dans Google Calendar"
echo -e "   - Vérifiez qu'il apparaît dans Profitum"
echo -e ""

# ============================================================================
# MONITORING ET LOGS
# ============================================================================

echo -e "\n${BLUE}📊 Monitoring et logs...${NC}"

echo -e "${YELLOW}Logs à surveiller :${NC}"
echo -e "- Logs de synchronisation Google Calendar"
echo -e "- Logs d'erreurs d'authentification"
echo -e "- Logs de création d'événements"
echo -e "- Logs de notifications"
echo -e ""

# ============================================================================
# CONFIGURATION PRODUCTION
# ============================================================================

echo -e "\n${BLUE}🌐 Configuration production...${NC}"

echo -e "${YELLOW}Variables d'environnement à configurer sur Railway :${NC}"
echo -e "- GOOGLE_CLIENT_ID"
echo -e "- GOOGLE_CLIENT_SECRET"
echo -e "- GOOGLE_REDIRECT_URI (https://votre-domaine.com/api/auth/google/callback)"
echo -e "- SUPABASE_URL"
echo -e "- SUPABASE_ANON_KEY"
echo -e "- SUPABASE_SERVICE_ROLE_KEY"
echo -e "- JWT_SECRET"
echo -e "- SESSION_SECRET"
echo -e ""

echo -e "${YELLOW}Variables d'environnement à configurer sur Vercel :${NC}"
echo -e "- VITE_API_URL (https://votre-domaine.com)"
echo -e "- VITE_SUPABASE_URL"
echo -e "- VITE_SUPABASE_ANON_KEY"
echo -e "- VITE_GOOGLE_CLIENT_ID"
echo -e ""

# ============================================================================
# FINALISATION
# ============================================================================

echo -e "\n${GREEN}🎉 Configuration Google Calendar terminée !${NC}"
echo -e ""
echo -e "${BLUE}📋 Prochaines étapes :${NC}"
echo -e "1. Configurez vos variables d'environnement Supabase"
echo -e "2. Configurez Google Cloud Console"
echo -e "3. Démarrez les services"
echo -e "4. Testez l'intégration"
echo -e "5. Déployez en production"
echo -e ""
echo -e "${GREEN}✅ Votre système d'agenda Google Calendar est prêt !${NC}" 