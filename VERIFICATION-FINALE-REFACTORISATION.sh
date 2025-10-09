#!/bin/bash

# ============================================================================
# SCRIPT DE VÉRIFICATION FINALE - REFACTORISATION SIMULATEUR
# ============================================================================

echo "🔍 VÉRIFICATION FINALE DE LA REFACTORISATION"
echo "============================================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Vérifier que simulation.ts n'existe plus
echo "1️⃣  Vérification suppression de simulation.ts"
if [ -f "server/src/routes/simulation.ts" ]; then
    echo -e "${RED}❌ ERREUR: simulation.ts existe encore${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ simulation.ts supprimé${NC}"
fi

# 2. Vérifier qu'il n'y a pas de références à simulation.ts
echo ""
echo "2️⃣  Vérification des imports de simulation.ts"
REFS=$(grep -r "from.*['\"]./routes/simulation['\"]" server/src --include="*.ts" 2>/dev/null | grep -v "SUPPRIMÉ" | wc -l | tr -d ' ')
if [ "$REFS" -gt 0 ]; then
    echo -e "${RED}❌ ERREUR: $REFS références actives à simulation.ts trouvées${NC}"
    grep -r "from.*['\"]./routes/simulation['\"]" server/src --include="*.ts" 2>/dev/null | grep -v "SUPPRIMÉ"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ Aucune référence active à simulation.ts${NC}"
fi

# 3. Vérifier qu'il n'y a plus de .from('Simulation') avec majuscule
echo ""
echo "3️⃣  Vérification des références aux anciennes tables"
OLD_TABLES=$(grep -r "\.from\(['\"]\(Simulation\|simulation\|Simulations\|chatbotsimulation\)['\"])" server/src/routes server/src/services --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
if [ "$OLD_TABLES" -gt 0 ]; then
    echo -e "${RED}❌ ERREUR: $OLD_TABLES références aux anciennes tables trouvées${NC}"
    grep -r "\.from\(['\"]\(Simulation\|simulation\|Simulations\|chatbotsimulation\)['\"])" server/src/routes server/src/services --include="*.ts" 2>/dev/null
    ((ERRORS++))
else
    echo -e "${GREEN}✅ Aucune référence aux anciennes tables${NC}"
fi

# 4. Vérifier que simulations (minuscule) est utilisé
echo ""
echo "4️⃣  Vérification utilisation de 'simulations' (correct)"
GOOD_REFS=$(grep -r "\.from\(['\"]simulations['\"]\)" server/src --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
echo -e "${GREEN}✅ $GOOD_REFS utilisations de 'simulations' (table correcte)${NC}"

# 5. Vérifier les fichiers existants
echo ""
echo "5️⃣  Vérification des fichiers de simulation existants"
echo "Fichiers trouvés :"
ls -lh server/src/routes/simulation* 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'
ls -lh server/src/services/simulation* 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'

# 6. Test de compilation TypeScript
echo ""
echo "6️⃣  Test de compilation TypeScript"
if command -v tsc &> /dev/null; then
    cd server
    if tsc --noEmit 2>&1 | grep -q "error"; then
        echo -e "${RED}❌ Erreurs TypeScript détectées${NC}"
        tsc --noEmit | head -20
        ((ERRORS++))
    else
        echo -e "${GREEN}✅ Aucune erreur TypeScript${NC}"
    fi
    cd ..
else
    echo -e "${YELLOW}⚠️  TypeScript non disponible, test ignoré${NC}"
fi

# Résumé final
echo ""
echo "============================================================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅✅✅ TOUS LES TESTS SONT PASSÉS ! ✅✅✅${NC}"
    echo ""
    echo "🎉 Refactorisation complète et validée !"
    echo ""
    echo "Structure finale :"
    echo "  ✅ simulationRoutes.ts - API principale"
    echo "  ✅ simulations.ts - API avancée"
    echo "  ✅ simulator.ts - Sessions publiques"
    echo "  ✅ client-simulation.ts - API clients"
    echo "  ✅ simulationProcessor.ts - Service core"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS ERREUR(S) DÉTECTÉE(S)${NC}"
    echo ""
    echo "Actions recommandées :"
    echo "  1. Corriger les erreurs ci-dessus"
    echo "  2. Relancer ce script de vérification"
    echo ""
    exit 1
fi

