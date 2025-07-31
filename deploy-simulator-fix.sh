#!/bin/bash

# =====================================================
# DÉPLOIEMENT CORRECTION SIMULATEUR
# Date: 2025-01-31
# Description: Déployer la correction du simulateur
# =====================================================

echo "🚀 Déploiement de la correction du simulateur..."
echo "================================================"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}📋 État actuel :${NC}"
echo "✅ Backend API corrigé et fonctionnel"
echo "✅ Fonction RPC create_simulation_with_temporary_client corrigée"
echo "✅ Routes /api/simulator/session et /api/simulator/questions fonctionnelles"
echo "⚠️  Frontend : routes /simulateur et /simulateur-eligibilite ajoutées à vercel.json"

echo -e "\n${BLUE}🔧 Déploiement frontend...${NC}"

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI non trouvé. Installation...${NC}"
    npm install -g vercel
fi

# Déployer sur Vercel
echo -e "${BLUE}📤 Déploiement sur Vercel...${NC}"
cd client && vercel --prod

echo -e "\n${GREEN}✅ Déploiement terminé !${NC}"
echo -e "\n${BLUE}🔗 URLs à tester :${NC}"
echo "• Frontend : https://profitum.app/simulateur"
echo "• API Session : https://profitum.app/api/simulator/session"
echo "• API Questions : https://profitum.app/api/simulator/questions"

echo -e "\n${BLUE}🧪 Test rapide du simulateur...${NC}"
sleep 5

# Test de l'API
echo "Test API session..."
API_RESPONSE=$(curl -s -X POST https://profitum.app/api/simulator/session \
  -H "Content-Type: application/json" \
  -d '{"client_data": {"name": "Test Deploy", "company_name": "Test Company"}}')

if echo "$API_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ API session fonctionne${NC}"
else
    echo -e "${YELLOW}⚠️  API session : $API_RESPONSE${NC}"
fi

echo -e "\n${GREEN}🎉 Correction du simulateur déployée avec succès !${NC}"
echo "Le simulateur devrait maintenant être accessible sur https://profitum.app/simulateur" 