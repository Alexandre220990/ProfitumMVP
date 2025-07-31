#!/bin/bash

# 🧪 Script de Test UX Simulateur avec Playwright
# ================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage du test UX simulateur complet..."

# Configuration
TEST_FILE="tests/schemas/simulateur-ux-complet.spec.ts"
SCREENSHOT_DIR="test-results/screenshots"
REPORT_DIR="test-results/reports"

# Créer les dossiers nécessaires
mkdir -p $SCREENSHOT_DIR
mkdir -p $REPORT_DIR

echo "📁 Dossiers de résultats créés"

# Vérifier que Playwright est installé
if ! command -v npx playwright &> /dev/null; then
    echo "❌ Playwright n'est pas installé. Installation en cours..."
    npm install -D @playwright/test
    npx playwright install
fi

echo "✅ Playwright vérifié"

# Nettoyer les anciens résultats
echo "🧹 Nettoyage des anciens résultats..."
rm -rf $SCREENSHOT_DIR/*
rm -rf $REPORT_DIR/*

# Lancer le test avec options détaillées
echo "🎯 Lancement du test UX simulateur..."
echo "📊 Fichier de test: $TEST_FILE"
echo "📸 Screenshots: $SCREENSHOT_DIR"
echo "📋 Rapport: $REPORT_DIR"

# Options de test Playwright
npx playwright test $TEST_FILE \
    --headed \
    --project=firefox \
    --timeout=60000 \
    --reporter=html,list \
    --workers=1 \
    --retries=1

# Vérifier le résultat
if [ $? -eq 0 ]; then
    echo "✅ Test UX simulateur terminé avec succès !"
    echo "📸 Screenshots disponibles dans: $SCREENSHOT_DIR"
    echo "📋 Rapport disponible dans: $REPORT_DIR"
    
    # Ouvrir le rapport HTML si possible
    if command -v open &> /dev/null; then
        open playwright-report/index.html
    elif command -v xdg-open &> /dev/null; then
        xdg-open playwright-report/index.html
    fi
else
    echo "❌ Test UX simulateur a échoué"
    echo "📸 Vérifiez les screenshots dans: $SCREENSHOT_DIR"
    echo "📋 Consultez le rapport dans: $REPORT_DIR"
    exit 1
fi 