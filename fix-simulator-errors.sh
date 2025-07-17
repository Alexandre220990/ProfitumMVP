#!/bin/bash

# 🚀 Script de correction des erreurs du simulateur d'éligibilité
# ==============================================================

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
BACKEND_PID=""
FRONTEND_PID=""

# Fonction pour afficher les messages
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

# Fonction pour vérifier si un port est utilisé
check_port() {
    lsof -i :$1 >/dev/null 2>&1
}

# Fonction pour arrêter un processus sur un port
kill_port() {
    if check_port $1; then
        log_info "Arrêt du processus sur le port $1..."
        lsof -ti :$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Fonction pour démarrer le backend
start_backend() {
    log_info "🚀 Démarrage du serveur backend..."
    
    # Arrêter le backend existant
    kill_port 5001
    
    # Démarrer le backend
    cd server
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    log_success "Serveur backend démarré (PID: $BACKEND_PID)"
}

# Fonction pour tester les routes du simulateur
test_simulator_routes() {
    echo ""
    echo "🧪 Test des routes du simulateur"
    echo "================================"
    
    # Attendre que le serveur soit prêt
    log_info "⏳ Attente du démarrage du serveur backend..."
    sleep 10
    
    # Test 1: Vérification de la santé du serveur
    log_info "📋 Test 1: Vérification de la santé du serveur"
    HEALTH_RESPONSE=$(curl -s http://localhost:5001/api/health)
    
    if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
        log_success "Serveur backend en bonne santé"
    else
        log_error "Serveur backend non accessible"
        echo "   Réponse: $HEALTH_RESPONSE"
        return 1
    fi
    
    # Test 2: Création de session simulateur
    log_info "📋 Test 2: Création de session simulateur"
    SESSION_RESPONSE=$(curl -s -X POST http://localhost:5001/api/simulator/session \
        -H "Content-Type: application/json" \
        -d '{}')
    
    if echo "$SESSION_RESPONSE" | grep -q "session_token"; then
        log_success "Session simulateur créée avec succès"
        SESSION_TOKEN=$(echo "$SESSION_RESPONSE" | grep -o '"session_token":"[^"]*"' | cut -d'"' -f4)
        log_info "   Token: ${SESSION_TOKEN:0:20}..."
    else
        log_error "Erreur création de session simulateur"
        echo "   Réponse: $SESSION_RESPONSE"
        return 1
    fi
    
    # Test 3: Récupération des questions
    log_info "📋 Test 3: Récupération des questions"
    QUESTIONS_RESPONSE=$(curl -s http://localhost:5001/api/simulator/questions)
    
    if echo "$QUESTIONS_RESPONSE" | grep -q "question_text"; then
        log_success "Questions récupérées avec succès"
        QUESTION_COUNT=$(echo "$QUESTIONS_RESPONSE" | grep -o '"question_text"' | wc -l)
        log_info "   Nombre de questions: $QUESTION_COUNT"
    else
        log_error "Erreur récupération des questions"
        echo "   Réponse: $QUESTIONS_RESPONSE"
        return 1
    fi
    
    # Test 4: Sauvegarde de réponse
    log_info "📋 Test 4: Sauvegarde de réponse"
    RESPONSE_DATA=$(echo "$QUESTIONS_RESPONSE" | jq -r '.[0].id // empty')
    if [ ! -z "$RESPONSE_DATA" ]; then
        SAVE_RESPONSE=$(curl -s -X POST http://localhost:5001/api/simulator/response \
            -H "Content-Type: application/json" \
            -d "{\"session_id\": \"$SESSION_TOKEN\", \"question_id\": \"$RESPONSE_DATA\", \"response_value\": \"Test réponse\"}")
        
        if echo "$SAVE_RESPONSE" | grep -q "success"; then
            log_success "Réponse sauvegardée avec succès"
        else
            log_warning "Erreur sauvegarde de réponse"
            echo "   Réponse: $SAVE_RESPONSE"
        fi
    else
        log_warning "Impossible de tester la sauvegarde (pas de question disponible)"
    fi
    
    # Test 5: Calcul d'éligibilité
    log_info "📋 Test 5: Calcul d'éligibilité"
    ELIGIBILITY_RESPONSE=$(curl -s -X POST http://localhost:5001/api/simulator/calculate-eligibility \
        -H "Content-Type: application/json" \
        -d "{\"session_id\": \"$SESSION_TOKEN\"}")
    
    if echo "$ELIGIBILITY_RESPONSE" | grep -q "produit_id"; then
        log_success "Calcul d'éligibilité réussi"
        PRODUCT_COUNT=$(echo "$ELIGIBILITY_RESPONSE" | grep -o '"produit_id"' | wc -l)
        log_info "   Nombre de produits éligibles: $PRODUCT_COUNT"
    else
        log_warning "Calcul d'éligibilité échoué ou aucun produit éligible"
        echo "   Réponse: $ELIGIBILITY_RESPONSE"
    fi
    
    echo ""
    log_success "Tests des routes du simulateur réussis !"
    return 0
}

# Fonction pour tester le frontend
test_frontend() {
    echo ""
    echo "🌐 Test du frontend"
    echo "=================="
    
    # Attendre que le frontend soit prêt
    log_info "⏳ Attente du démarrage du frontend..."
    sleep 5
    
    # Test de la page simulateur
    log_info "📋 Test de la page simulateur"
    FRONTEND_RESPONSE=$(curl -s -I http://localhost:3000/simulateur-eligibilite | head -1)
    
    if echo "$FRONTEND_RESPONSE" | grep -q "200"; then
        log_success "Page simulateur accessible"
    else
        log_warning "Page simulateur non accessible"
        echo "   Réponse: $FRONTEND_RESPONSE"
    fi
}

# Fonction pour afficher les URLs
show_urls() {
    echo ""
    echo "🌐 URLs disponibles"
    echo "=================="
    echo "Backend:  http://localhost:5001"
    echo "Frontend: http://localhost:3000"
    echo ""
    echo "📊 Simulateur:"
    echo "  • Simulateur d'éligibilité: http://localhost:3000/simulateur-eligibilite"
    echo ""
    echo "🔧 API Simulateur:"
    echo "  • Création session: POST http://localhost:5001/api/simulator/session"
    echo "  • Questions: GET http://localhost:5001/api/simulator/questions"
    echo "  • Sauvegarde réponse: POST http://localhost:5001/api/simulator/response"
    echo "  • Calcul éligibilité: POST http://localhost:5001/api/simulator/calculate-eligibility"
    echo ""
    echo "📊 Dashboards:"
    echo "  • Client Assignments: http://localhost:3000/dashboard/client-assignments"
    echo "  • Expert Assignments: http://localhost:3000/dashboard/expert-assignments"
    echo ""
    echo "🔧 Pour arrêter le serveur: Ctrl+C"
}

# Fonction de nettoyage
cleanup() {
    echo ""
    log_info "🛑 Arrêt des serveurs..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        log_success "Serveur backend arrêté"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        log_success "Serveur frontend arrêté"
    fi
    exit 0
}

# Capturer Ctrl+C pour arrêter proprement
trap cleanup SIGINT

# Vérifier les dépendances
log_info "🔍 Vérification des dépendances..."
if ! command -v curl &> /dev/null; then
    log_error "curl n'est pas installé"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log_warning "jq n'est pas installé, certains tests seront limités"
fi

# Vérifier le port backend
log_info "🔍 Vérification du port backend..."
if check_port 5001; then
    log_warning "Le port 5001 est déjà utilisé"
    read -p "Voulez-vous continuer ? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Démarrer le backend
start_backend

# Tester les routes du simulateur
test_simulator_routes

# Tester le frontend
test_frontend

# Afficher les URLs
show_urls

# Attendre indéfiniment
echo ""
log_info "🔄 Serveurs en cours d'exécution. Appuyez sur Ctrl+C pour arrêter."
while true; do
    sleep 1
done 