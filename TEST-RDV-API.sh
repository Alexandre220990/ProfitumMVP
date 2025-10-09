#!/bin/bash

# ============================================================================
# SCRIPT DE TEST - API RDV UNIFIÉE
# ============================================================================
# Usage: ./TEST-RDV-API.sh [TOKEN]
# ============================================================================

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:5001}"
TOKEN="${1:-}"

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Token manquant${NC}"
  echo "Usage: $0 <TOKEN>"
  echo "Exemple: $0 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         TEST API RDV UNIFIÉE                               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}API URL:${NC} $API_URL"
echo -e "${YELLOW}Token:${NC} ${TOKEN:0:20}..."
echo ""

# ============================================================================
# TEST 1 : Récupérer tous les RDV
# ============================================================================
echo -e "${BLUE}📋 TEST 1 : GET /api/rdv${NC}"
echo "----------------------------------------"

response=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/rdv")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✅ Succès (200)${NC}"
  count=$(echo "$body" | jq -r '.count // 0' 2>/dev/null || echo "0")
  echo -e "${GREEN}📊 Nombre de RDV : $count${NC}"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  echo -e "${RED}❌ Échec ($http_code)${NC}"
  echo "$body"
fi

echo ""

# ============================================================================
# TEST 2 : Récupérer les RDV en attente (pour experts)
# ============================================================================
echo -e "${BLUE}📋 TEST 2 : GET /api/rdv/pending/validation${NC}"
echo "----------------------------------------"

response=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/rdv/pending/validation")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 403 ]; then
  if [ "$http_code" -eq 403 ]; then
    echo -e "${YELLOW}⚠️ Accès réservé aux experts (403)${NC}"
  else
    echo -e "${GREEN}✅ Succès (200)${NC}"
    count=$(echo "$body" | jq -r '.count // 0' 2>/dev/null || echo "0")
    echo -e "${GREEN}📊 RDV en attente : $count${NC}"
  fi
else
  echo -e "${RED}❌ Échec ($http_code)${NC}"
  echo "$body"
fi

echo ""

# ============================================================================
# TEST 3 : Créer un RDV de test
# ============================================================================
echo -e "${BLUE}📋 TEST 3 : POST /api/rdv (Créer un RDV)${NC}"
echo "----------------------------------------"

# Date demain à 10h
tomorrow=$(date -v+1d '+%Y-%m-%d' 2>/dev/null || date -d '+1 day' '+%Y-%m-%d')

test_rdv='{
  "title": "RDV Test Migration",
  "description": "Test automatique après migration",
  "scheduled_date": "'$tomorrow'",
  "scheduled_time": "10:00",
  "duration_minutes": 60,
  "meeting_type": "video",
  "notes": "Créé par script de test",
  "priority": 2
}'

response=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$test_rdv" \
  "$API_URL/api/rdv")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" -eq 201 ] || [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✅ RDV créé avec succès ($http_code)${NC}"
  rdv_id=$(echo "$body" | jq -r '.data.id // empty' 2>/dev/null)
  if [ -n "$rdv_id" ]; then
    echo -e "${GREEN}📝 ID du RDV : $rdv_id${NC}"
  fi
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  echo -e "${RED}❌ Échec de création ($http_code)${NC}"
  echo "$body"
fi

echo ""

# ============================================================================
# TEST 4 : Récupérer un RDV spécifique (si créé)
# ============================================================================
if [ -n "$rdv_id" ]; then
  echo -e "${BLUE}📋 TEST 4 : GET /api/rdv/$rdv_id${NC}"
  echo "----------------------------------------"

  response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$API_URL/api/rdv/$rdv_id")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ RDV récupéré (200)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}❌ Échec ($http_code)${NC}"
    echo "$body"
  fi

  echo ""
fi

# ============================================================================
# TEST 5 : Mettre à jour le RDV (si créé)
# ============================================================================
if [ -n "$rdv_id" ]; then
  echo -e "${BLUE}📋 TEST 5 : PUT /api/rdv/$rdv_id (Mise à jour)${NC}"
  echo "----------------------------------------"

  update_data='{
    "notes": "Mis à jour par script de test",
    "priority": 3
  }'

  response=$(curl -s -w "\n%{http_code}" \
    -X PUT \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$update_data" \
    "$API_URL/api/rdv/$rdv_id")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ RDV mis à jour (200)${NC}"
    echo "$body" | jq '.data | {id, title, notes, priority}' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}❌ Échec ($http_code)${NC}"
    echo "$body"
  fi

  echo ""
fi

# ============================================================================
# TEST 6 : Supprimer le RDV de test (nettoyage)
# ============================================================================
if [ -n "$rdv_id" ]; then
  echo -e "${BLUE}📋 TEST 6 : DELETE /api/rdv/$rdv_id (Nettoyage)${NC}"
  echo "----------------------------------------"

  response=$(curl -s -w "\n%{http_code}" \
    -X DELETE \
    -H "Authorization: Bearer $TOKEN" \
    "$API_URL/api/rdv/$rdv_id")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ RDV supprimé (200)${NC}"
  else
    echo -e "${RED}❌ Échec suppression ($http_code)${NC}"
    echo "$body"
  fi

  echo ""
fi

# ============================================================================
# RÉSUMÉ
# ============================================================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  RÉSUMÉ DES TESTS                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Tests terminés !${NC}"
echo ""
echo -e "${YELLOW}Vérifications manuelles recommandées :${NC}"
echo "  1. Se connecter en tant qu'expert → Vérifier agenda"
echo "  2. Se connecter en tant que client → Vérifier calendrier"
echo "  3. Se connecter en tant qu'apporteur → Vérifier RDV créés"
echo ""
echo -e "${BLUE}Pour plus d'informations :${NC}"
echo "  - GUIDE-FINALISATION-ARCHITECTURE-RDV-UNIQUE.md"
echo "  - INSTRUCTIONS-MIGRATION-SQL.md"
echo ""

