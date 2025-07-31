#!/bin/bash

# 🧪 Script de Test UX Simulateur Rapide
# ======================================

set -e

echo "🚀 Test UX simulateur rapide..."

# Configuration
TEST_FILE="tests/schemas/simulateur-ux-complet.spec.ts"

# Lancer le test en mode headless (sans interface)
echo "🎯 Lancement du test en mode headless..."
npx playwright test $TEST_FILE \
    --project=firefox \
    --timeout=60000 \
    --reporter=list \
    --workers=1

echo "✅ Test UX rapide terminé !" 