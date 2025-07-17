#!/bin/bash

# =====================================================
# Test rapide du simulateur (serveurs déjà démarrés)
# =====================================================

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info "🧪 Test rapide du simulateur d'éligibilité"
log_info "   (Serveurs supposés déjà démarrés)"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    log_error "Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Test 1: Vérifier que le backend est accessible
log_info "🔍 Test 1: Vérification du backend..."

if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    log_success "Backend accessible"
else
    log_error "Backend non accessible sur http://localhost:5001"
    log_info "Démarrez d'abord le backend avec: cd server && npm run dev"
    exit 1
fi

# Test 2: Vérifier que le frontend est accessible
log_info "🔍 Test 2: Vérification du frontend..."

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    log_success "Frontend accessible"
else
    log_warning "Frontend non accessible sur http://localhost:3000"
    log_info "Démarrez le frontend avec: cd client && npm run dev"
fi

# Test 3: Tester les routes du simulateur
log_info "🔍 Test 3: Test des routes du simulateur..."

# Test de la route des questions
if curl -s http://localhost:5001/api/simulator/questions > /dev/null 2>&1; then
    log_success "Route /api/simulator/questions accessible"
else
    log_error "Route /api/simulator/questions non accessible"
fi

# Test de création de session
SESSION_RESPONSE=$(curl -s -X POST http://localhost:5001/api/simulator/session \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null)

if echo "$SESSION_RESPONSE" | grep -q "session_token"; then
    log_success "Création de session réussie"
    SESSION_TOKEN=$(echo "$SESSION_RESPONSE" | grep -o '"session_token":"[^"]*"' | cut -d'"' -f4)
    log_info "Token de session: ${SESSION_TOKEN:0:20}..."
else
    log_error "Création de session échouée"
    log_info "Réponse: $SESSION_RESPONSE"
fi

# Test 4: Exécuter le test complet si Node.js est disponible
if command -v node > /dev/null 2>&1; then
    log_info "🔍 Test 4: Test complet avec Node.js..."
    
    if [ -f "test-simulator-fixed.js" ]; then
        node test-simulator-fixed.js
        if [ $? -eq 0 ]; then
            log_success "Tests Node.js réussis"
        else
            log_warning "Certains tests Node.js ont échoué"
        fi
    else
        log_warning "Script de test Node.js non trouvé"
    fi
else
    log_warning "Node.js non disponible, tests manuels uniquement"
fi

# Test 5: Test manuel de l'interface web
log_info "🔍 Test 5: Test de l'interface web..."

if command -v curl > /dev/null 2>&1; then
    # Tester l'accès à la page du simulateur
    if curl -s http://localhost:3000/simulateur-eligibilite > /dev/null 2>&1; then
        log_success "Page simulateur accessible"
    else
        log_warning "Page simulateur non accessible (peut être normal si SPA)"
    fi
fi

# Résumé
echo ""
log_success "🎉 Test rapide terminé !"
echo ""
echo "🌐 URLs à tester manuellement:"
echo "  • Simulateur: http://localhost:3000/simulateur-eligibilite"
echo "  • API Questions: http://localhost:5001/api/simulator/questions"
echo "  • Health Check: http://localhost:5001/api/health"
echo ""
echo "📊 Tests disponibles:"
echo "  • Test complet: node test-simulator-fixed.js"
echo "  • Test manuel: curl http://localhost:5001/api/simulator/questions"
echo ""
echo "🔧 Si des erreurs persistent:"
echo "  1. Vérifiez que les serveurs sont démarrés"
echo "  2. Exécutez: ./fix-and-start-simulator.sh"
echo "  3. Consultez les logs: tail -f server.log" 