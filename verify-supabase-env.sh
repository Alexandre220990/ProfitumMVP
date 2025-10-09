#!/bin/bash

# Script de vérification des variables d'environnement Supabase
# S'assure que tous les fichiers utilisent les bonnes variables

echo "🔍 Vérification des variables d'environnement Supabase..."
echo "=================================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL_ERRORS=0

echo "${BLUE}📁 Recherche des variables d'environnement incorrectes...${NC}"
echo ""

# Liste des variables incorrectes à rechercher
INCORRECT_VARS=(
    "SUPABASE_SERVICE_KEY"
    "SUPABASE_ANON_KEY"
    "process.env.SUPABASE_KEY[^_]"
)

CORRECT_VARS=(
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
)

echo "${YELLOW}❌ Variables INCORRECTES recherchées:${NC}"
for var in "${INCORRECT_VARS[@]}"; do
    echo "   - $var"
done
echo ""

echo "${GREEN}✅ Variables CORRECTES à utiliser:${NC}"
for var in "${CORRECT_VARS[@]}"; do
    echo "   - $var"
done
echo ""

echo "=================================================="
echo ""

# Rechercher les variables incorrectes
for incorrect_var in "${INCORRECT_VARS[@]}"; do
    echo "${BLUE}🔍 Recherche de '$incorrect_var'...${NC}"
    
    # Exclure les fichiers de configuration et de vérification
    RESULTS=$(grep -rn "$incorrect_var" server/src \
        --exclude-dir=node_modules \
        --exclude-dir=dist \
        --exclude="supabase.ts" \
        --exclude="*.md" \
        2>/dev/null)
    
    if [ -n "$RESULTS" ]; then
        echo "${RED}❌ Occurrences trouvées :${NC}"
        echo "$RESULTS" | while IFS= read -r line; do
            FILE=$(echo "$line" | cut -d: -f1)
            LINE_NUM=$(echo "$line" | cut -d: -f2)
            CONTENT=$(echo "$line" | cut -d: -f3-)
            echo "   ${RED}$FILE:$LINE_NUM${NC}"
            echo "   $CONTENT"
            echo ""
            ((TOTAL_ERRORS++))
        done
    else
        echo "${GREEN}   ✓ Aucune occurrence${NC}"
    fi
    echo ""
done

echo "=================================================="
echo ""

if [ $TOTAL_ERRORS -eq 0 ]; then
    echo "${GREEN}✅ Succès ! Toutes les variables d'environnement sont correctes.${NC}"
    echo ""
    echo "${BLUE}📝 Rappel des variables à utiliser :${NC}"
    echo "   - SUPABASE_URL: URL de votre instance Supabase"
    echo "   - SUPABASE_SERVICE_ROLE_KEY: Clé admin (côté serveur)"
    echo ""
    exit 0
else
    echo "${RED}❌ Échec ! $TOTAL_ERRORS fichier(s) avec des variables incorrectes.${NC}"
    echo ""
    echo "${BLUE}💡 Actions à effectuer :${NC}"
    echo "   1. Remplacer les variables incorrectes par les correctes"
    echo "   2. Ajouter validation: if (!supabaseUrl || !supabaseKey) throw Error"
    echo "   3. Relancer ce script pour vérifier"
    echo ""
    exit 1
fi

