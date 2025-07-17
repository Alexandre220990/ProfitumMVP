#!/bin/bash

# 🚀 Script de correction et test du simulateur d'éligibilité
# ===========================================================

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables
BACKEND_PID=""
FRONTEND_PID=""
PROJECT_DIR="/Users/alex/Desktop/FinancialTracker"

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

log_step() {
    echo -e "${CYAN}🔧 $1${NC}"
}

log_test() {
    echo -e "${MAGENTA}🧪 $1${NC}"
}

# Fonction pour vérifier si un port est utilisé
check_port() {
    lsof -i :$1 >/dev/null 2>&1
}

# Fonction pour arrêter un processus sur un port
kill_port() {
    if check_port $1; then
        log_warning "Arrêt du processus sur le port $1..."
        lsof -ti :$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Fonction pour nettoyer les processus
cleanup() {
    log_info "Nettoyage des processus..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    kill_port 5001
    kill_port 3000
    kill_port 5173
}

# Trap pour nettoyer à la sortie
trap cleanup EXIT

# Fonction pour démarrer le backend
start_backend() {
    log_step "Démarrage du serveur backend..."
    
    cd "$PROJECT_DIR/server"
    
    # Vérifier que les dépendances sont installées
    if [ ! -d "node_modules" ]; then
        log_warning "Installation des dépendances backend..."
        npm install
    fi
    
    # Démarrer le serveur en arrière-plan
    npm run dev &
    BACKEND_PID=$!
    
    # Attendre que le serveur soit prêt
    log_info "Attente du démarrage du serveur backend..."
    for i in {1..30}; do
        if check_port 5001; then
            log_success "Serveur backend démarré sur le port 5001"
            return 0
        fi
        sleep 1
    done
    
    log_error "Le serveur backend n'a pas démarré dans les temps"
    return 1
}

# Fonction pour démarrer le frontend
start_frontend() {
    log_step "Démarrage du serveur frontend..."
    
    cd "$PROJECT_DIR/client"
    
    # Vérifier que les dépendances sont installées
    if [ ! -d "node_modules" ]; then
        log_warning "Installation des dépendances frontend..."
        npm install
    fi
    
    # Démarrer le serveur en arrière-plan
    npm run dev &
    FRONTEND_PID=$!
    
    # Attendre que le serveur soit prêt
    log_info "Attente du démarrage du serveur frontend..."
    for i in {1..30}; do
        if check_port 3000; then
            log_success "Serveur frontend démarré sur le port 3000"
            return 0
        fi
        sleep 1
    done
    
    log_error "Le serveur frontend n'a pas démarré dans les temps"
    return 1
}

# Fonction pour tester les routes du simulateur
test_simulator_routes() {
    log_test "Test des routes du simulateur..."
    
    cd "$PROJECT_DIR"
    
    # Test de création de session
    log_info "Test 1: Création de session"
    SESSION_RESPONSE=$(curl -s -X POST http://localhost:5001/api/simulator/session \
        -H "Content-Type: application/json" \
        -d '{"ip_address": "127.0.0.1", "user_agent": "Test-Script"}')
    
    if echo "$SESSION_RESPONSE" | grep -q "session_token"; then
        log_success "✅ Création de session réussie"
        SESSION_TOKEN=$(echo "$SESSION_RESPONSE" | grep -o '"session_token":"[^"]*"' | cut -d'"' -f4)
        SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    else
        log_error "❌ Échec de création de session"
        echo "Réponse: $SESSION_RESPONSE"
        return 1
    fi
    
    # Test de récupération des questions
    log_info "Test 2: Récupération des questions"
    QUESTIONS_RESPONSE=$(curl -s http://localhost:5001/api/simulator/questions)
    
    if echo "$QUESTIONS_RESPONSE" | grep -q "question_text"; then
        QUESTION_COUNT=$(echo "$QUESTIONS_RESPONSE" | grep -o '"question_text"' | wc -l)
        log_success "✅ $QUESTION_COUNT questions récupérées"
    else
        log_error "❌ Échec de récupération des questions"
        echo "Réponse: $QUESTIONS_RESPONSE"
        return 1
    fi
    
    # Test d'envoi de réponses
    log_info "Test 3: Envoi de réponses de test"
    
    # Extraire la première question pour le test
    FIRST_QUESTION_ID=$(echo "$QUESTIONS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$FIRST_QUESTION_ID" ]; then
        RESPONSE_RESPONSE=$(curl -s -X POST http://localhost:5001/api/simulator/response \
            -H "Content-Type: application/json" \
            -d "{\"session_id\": \"$SESSION_ID\", \"question_id\": \"$FIRST_QUESTION_ID\", \"response_value\": \"Transport / Logistique\"}")
        
        if [ $? -eq 0 ]; then
            log_success "✅ Réponse envoyée avec succès"
        else
            log_warning "⚠️  Échec d'envoi de réponse"
        fi
    else
        log_warning "⚠️  Impossible d'extraire l'ID de la première question"
    fi
    
    # Test de calcul d'éligibilité
    log_info "Test 4: Calcul d'éligibilité"
    ELIGIBILITY_RESPONSE=$(curl -s -X POST http://localhost:5001/api/simulator/calculate-eligibility \
        -H "Content-Type: application/json" \
        -d "{\"session_id\": \"$SESSION_ID\"}")
    
    if echo "$ELIGIBILITY_RESPONSE" | grep -q "produit_id"; then
        PRODUCT_COUNT=$(echo "$ELIGIBILITY_RESPONSE" | grep -o '"produit_id"' | wc -l)
        log_success "✅ Calcul d'éligibilité réussi ($PRODUCT_COUNT produits analysés)"
        
        # Afficher les résultats
        echo "$ELIGIBILITY_RESPONSE" | jq '.' 2>/dev/null || echo "$ELIGIBILITY_RESPONSE"
    else
        log_warning "⚠️  Calcul d'éligibilité échoué ou aucun résultat"
        echo "Réponse: $ELIGIBILITY_RESPONSE"
    fi
    
    return 0
}

# Fonction pour tester l'interface web
test_web_interface() {
    log_test "Test de l'interface web..."
    
    # Attendre que le frontend soit prêt
    sleep 5
    
    # Test d'accès à la page simulateur
    log_info "Test d'accès à la page simulateur..."
    
    if curl -s -f http://localhost:3000/simulateur-eligibilite >/dev/null; then
        log_success "✅ Page simulateur accessible"
    else
        log_error "❌ Page simulateur inaccessible"
        return 1
    fi
    
    # Test d'accès à la page d'accueil
    log_info "Test d'accès à la page d'accueil..."
    
    if curl -s -f http://localhost:3000/ >/dev/null; then
        log_success "✅ Page d'accueil accessible"
    else
        log_error "❌ Page d'accueil inaccessible"
        return 1
    fi
    
    return 0
}

# Fonction pour afficher les URLs
show_urls() {
    log_info "🌐 URLs disponibles:"
    echo -e "${CYAN}   Frontend:${NC} http://localhost:3000"
    echo -e "${CYAN}   Simulateur:${NC} http://localhost:3000/simulateur-eligibilite"
    echo -e "${CYAN}   API Backend:${NC} http://localhost:5001"
    echo -e "${CYAN}   API Simulateur:${NC} http://localhost:5001/api/simulator"
    echo ""
}

# Fonction principale
main() {
    log_info "🚀 Démarrage du script de correction et test du simulateur"
    log_info "=========================================================="
    
    # Vérifier que nous sommes dans le bon répertoire
    if [ ! -f "$PROJECT_DIR/package.json" ]; then
        log_error "Répertoire de projet invalide: $PROJECT_DIR"
        exit 1
    fi
    
    cd "$PROJECT_DIR"
    
    # Nettoyer les processus existants
    cleanup
    
    # Démarrer le backend
    if ! start_backend; then
        log_error "Impossible de démarrer le backend"
        exit 1
    fi
    
    # Démarrer le frontend
    if ! start_frontend; then
        log_error "Impossible de démarrer le frontend"
        exit 1
    fi
    
    # Attendre un peu pour que tout soit prêt
    sleep 3
    
    # Tester les routes du simulateur
    if test_simulator_routes; then
        log_success "🎉 Tous les tests API réussis !"
    else
        log_warning "⚠️  Certains tests API ont échoué"
    fi
    
    # Tester l'interface web
    if test_web_interface; then
        log_success "🎉 Interface web accessible !"
    else
        log_warning "⚠️  Problèmes avec l'interface web"
    fi
    
    # Afficher les URLs
    show_urls
    
    # Instructions pour l'utilisateur
    log_info "📋 Instructions:"
    echo -e "${YELLOW}   1. Ouvrez votre navigateur sur:${NC} http://localhost:3000/simulateur-eligibilite"
    echo -e "${YELLOW}   2. Testez le questionnaire complet${NC}"
    echo -e "${YELLOW}   3. Vérifiez que les résultats s'affichent correctement${NC}"
    echo -e "${YELLOW}   4. Appuyez sur Ctrl+C pour arrêter les serveurs${NC}"
    echo ""
    
    # Attendre que l'utilisateur arrête
    log_info "⏳ Serveurs en cours d'exécution. Appuyez sur Ctrl+C pour arrêter..."
    
    # Garder les serveurs en vie
    wait
}

# Exécution du script principal
main "$@" 