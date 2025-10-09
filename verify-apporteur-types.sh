#!/bin/bash

# Script de vérification de la standardisation des types utilisateurs
# Vérifie que 'apporteur' est utilisé au lieu de 'apporteur_affaires'

echo "🔍 Vérification de la standardisation des types utilisateurs..."
echo "=================================================="
echo ""

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_ISSUES=0
ALLOWED_OCCURRENCES=0
PROBLEMATIC_OCCURRENCES=0

# Fichiers à exclure (où apporteur_affaires est encore toléré)
EXCLUDED_FILES=(
    "server/src/routes/auth.ts"              # Rétrocompatibilité login
    "server/src/middleware/auth-enhanced.ts" # Normalisation des anciens tokens
    "STANDARDISATION-TYPES-UTILISATEURS.md"  # Documentation
    "verify-apporteur-types.sh"              # Ce script
)

echo "${BLUE}📁 Recherche de 'apporteur_affaires' dans le code...${NC}"
echo ""

# Rechercher toutes les occurrences
RESULTS=$(grep -rn "apporteur_affaires" server/src --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null)

if [ -z "$RESULTS" ]; then
    echo "${GREEN}✅ Aucune occurrence de 'apporteur_affaires' trouvée !${NC}"
    echo "${GREEN}   Tous les types sont correctement standardisés.${NC}"
    exit 0
fi

# Analyser les résultats
while IFS= read -r line; do
    FILE=$(echo "$line" | cut -d: -f1)
    LINE_NUM=$(echo "$line" | cut -d: -f2)
    CONTENT=$(echo "$line" | cut -d: -f3-)
    
    # Vérifier si le fichier est dans la liste d'exclusion
    IS_EXCLUDED=false
    for EXCLUDED_FILE in "${EXCLUDED_FILES[@]}"; do
        if [[ "$FILE" == *"$EXCLUDED_FILE"* ]]; then
            IS_EXCLUDED=true
            break
        fi
    done
    
    if [ "$IS_EXCLUDED" = true ]; then
        echo "${YELLOW}⚠️  $FILE:$LINE_NUM${NC}"
        echo "    ${YELLOW}(Occurrence autorisée pour rétrocompatibilité)${NC}"
        echo "    $CONTENT"
        echo ""
        ((ALLOWED_OCCURRENCES++))
    else
        echo "${RED}❌ $FILE:$LINE_NUM${NC}"
        echo "    ${RED}(Occurrence problématique - à corriger)${NC}"
        echo "    $CONTENT"
        echo ""
        ((PROBLEMATIC_OCCURRENCES++))
    fi
    
    ((TOTAL_ISSUES++))
done <<< "$RESULTS"

echo "=================================================="
echo ""
echo "${BLUE}📊 Résumé :${NC}"
echo "   Total d'occurrences trouvées : $TOTAL_ISSUES"
echo "   ${YELLOW}Occurrences autorisées (rétrocompatibilité) : $ALLOWED_OCCURRENCES${NC}"
echo "   ${RED}Occurrences problématiques : $PROBLEMATIC_OCCURRENCES${NC}"
echo ""

if [ $PROBLEMATIC_OCCURRENCES -eq 0 ]; then
    echo "${GREEN}✅ Succès ! Toutes les occurrences sont soit corrigées, soit autorisées.${NC}"
    echo ""
    echo "${BLUE}ℹ️  Note : Les occurrences autorisées sont pour :${NC}"
    echo "   - Rétrocompatibilité des anciens tokens JWT"
    echo "   - Acceptation du paramètre en entrée (converti en 'apporteur')"
    echo ""
    exit 0
else
    echo "${RED}❌ Échec ! Il reste des occurrences problématiques à corriger.${NC}"
    echo ""
    echo "${BLUE}💡 Conseils :${NC}"
    echo "   1. Remplacer 'apporteur_affaires' par 'apporteur' dans les fichiers listés"
    echo "   2. Vérifier les types TypeScript"
    echo "   3. Relancer ce script pour vérifier"
    echo ""
    exit 1
fi

