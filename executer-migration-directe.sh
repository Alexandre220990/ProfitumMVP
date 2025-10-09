#!/bin/bash

# ============================================================================
# EXÉCUTION DIRECTE - Migration RDV via Supabase REST API
# ============================================================================

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         EXÉCUTION MIGRATION RDV                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Charger les variables d'environnement
if [ ! -f "server/.env" ]; then
  echo -e "${RED}❌ Fichier server/.env non trouvé${NC}"
  exit 1
fi

source server/.env

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Variables SUPABASE manquantes dans .env${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Configuration chargée${NC}"
echo -e "${YELLOW}URL:${NC} $SUPABASE_URL"
echo ""

# Extraire l'ID du projet
PROJECT_ID=$(echo $SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
echo -e "${YELLOW}Project ID:${NC} $PROJECT_ID"
echo ""

echo -e "${YELLOW}⚠️  ATTENTION :${NC} Cette migration va :"
echo "   - Renommer ClientRDV → RDV"
echo "   - Renommer ClientRDV_Produits → RDV_Produits"
echo "   - Ajouter de nouveaux champs"
echo ""
echo -e "${RED}⚠️  Assurez-vous d'avoir créé un BACKUP de votre base de données !${NC}"
echo ""

read -p "Continuer ? (oui/non) : " confirm
if [ "$confirm" != "oui" ]; then
  echo -e "${YELLOW}❌ Migration annulée${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}🚀 Démarrage de la migration...${NC}"
echo ""

# Lire le script SQL
SQL_FILE="server/migrations/20250110_unify_rdv_architecture_FIXED.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo -e "${RED}❌ Fichier SQL non trouvé : $SQL_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Script SQL chargé${NC}"
echo ""

# Méthode recommandée : Instructions pour Dashboard
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}   EXÉCUTION MANUELLE RECOMMANDÉE${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "L'exécution automatique via API REST n'est pas disponible."
echo "Veuillez exécuter le script manuellement via Supabase Dashboard :"
echo ""
echo -e "${GREEN}1.${NC} Aller sur : https://supabase.com/dashboard/project/$PROJECT_ID/sql/new"
echo -e "${GREEN}2.${NC} Ouvrir le fichier : $SQL_FILE"
echo -e "${GREEN}3.${NC} Copier TOUT le contenu du fichier"
echo -e "${GREEN}4.${NC} Coller dans l'éditeur SQL"
echo -e "${GREEN}5.${NC} Cliquer sur 'Run' (en bas à droite)"
echo -e "${GREEN}6.${NC} Attendre ~1-2 minutes"
echo ""
echo -e "${BLUE}Après l'exécution :${NC}"
echo "  - Exécuter : node server/scripts/verifier-migration-rdv.js"
echo "  - Redémarrer : cd server && npm run dev"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Ouvrir le fichier dans l'éditeur par défaut
echo "Voulez-vous ouvrir le fichier SQL maintenant ? (oui/non)"
read -p "> " open_file

if [ "$open_file" = "oui" ]; then
  open "$SQL_FILE" 2>/dev/null || xdg-open "$SQL_FILE" 2>/dev/null || echo "Ouvrir manuellement : $SQL_FILE"
  echo -e "${GREEN}✅ Fichier ouvert${NC}"
fi

echo ""
echo -e "${GREEN}📋 Fichier à exécuter :${NC} $SQL_FILE"
echo -e "${GREEN}🔗 Dashboard SQL Editor :${NC} https://supabase.com/dashboard/project/$PROJECT_ID/sql/new"
echo ""

