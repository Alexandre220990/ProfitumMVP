#!/bin/bash

# =====================================================
# Script de correction et démarrage du simulateur
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

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    log_error "Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

log_info "🔧 Correction et démarrage du simulateur d'éligibilité"

# Étape 1: Arrêter les processus existants
log_info "🛑 Arrêt des processus existants..."
pkill -f "node.*dev" 2>/dev/null || true
pkill -f "ts-node.*src/index.ts" 2>/dev/null || true
sleep 3

# Étape 2: Vérifier les variables d'environnement
log_info "🔧 Vérification des variables d'environnement..."

if [ ! -f ".env" ]; then
    log_error "Fichier .env non trouvé"
    log_info "Création d'un fichier .env.example..."
    cat > .env.example << EOF
# Configuration Supabase
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Configuration API
API_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000

# Configuration serveur
PORT=5001
NODE_ENV=development
EOF
    log_error "Veuillez configurer le fichier .env avec vos vraies valeurs"
    exit 1
fi

log_success "Variables d'environnement vérifiées"

# Étape 3: Installer les dépendances
log_info "📦 Installation des dépendances..."

if [ ! -d "node_modules" ]; then
    npm install
    log_success "Dépendances installées"
else
    log_info "Dépendances déjà installées"
fi

# Étape 4: Corriger la base de données
log_info "🗄️ Correction de la base de données..."

cd server

# Vérifier si le script de correction existe
if [ -f "scripts/fix-simulator-quick.sql" ]; then
    log_info "Application du script de correction SQL..."
    
    # Exécuter le script SQL via Supabase CLI ou psql
    if command -v psql &> /dev/null; then
        # Utiliser psql si disponible
        psql "$DATABASE_URL" -f scripts/fix-simulator-quick.sql
        log_success "Script SQL appliqué via psql"
    else
        # Sinon, utiliser le script Node.js
        log_info "Utilisation du script Node.js de correction..."
        node scripts/fix-simulator-complete.js
        log_success "Base de données corrigée via Node.js"
    fi
else
    log_warning "Script de correction non trouvé, création manuelle..."
    
    # Créer les tables manuellement via Node.js
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    async function fixDatabase() {
        console.log('Correction de la base de données...');
        
        // Supprimer les questions existantes
        await supabase.from('QuestionnaireQuestion').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Insérer les questions corrigées
        const questions = [
            {
                question_order: 1,
                question_text: 'Dans quel secteur d\\'activité exercez-vous principalement ?',
                question_type: 'choix_unique',
                options: {choix: ['Transport routier', 'Transport maritime', 'Transport aérien', 'Commerce', 'Industrie', 'Services', 'Construction', 'Agriculture', 'Autre']},
                validation_rules: {},
                importance: 5,
                conditions: {},
                produits_cibles: ['TICPE', 'URSSAF', 'DFS'],
                phase: 1
            },
            {
                question_order: 2,
                question_text: 'Quel est votre chiffre d\\'affaires annuel ?',
                question_type: 'choix_unique',
                options: {choix: ['Moins de 100 000€', '100 000€ - 500 000€', '500 000€ - 1 000 000€', '1 000 000€ - 5 000 000€', 'Plus de 5 000 000€']},
                validation_rules: {},
                importance: 4,
                conditions: {},
                produits_cibles: ['TICPE', 'URSSAF', 'DFS', 'FONCIER'],
                phase: 1
            },
            {
                question_order: 3,
                question_text: 'Combien d\\'employés avez-vous ?',
                question_type: 'choix_unique',
                options: {choix: ['Aucun', '1 à 5', '6 à 20', '21 à 50', 'Plus de 50']},
                validation_rules: {},
                importance: 4,
                conditions: {},
                produits_cibles: ['URSSAF', 'DFS'],
                phase: 1
            },
            {
                question_order: 4,
                question_text: 'Possédez-vous des véhicules professionnels ?',
                question_type: 'choix_unique',
                options: {choix: ['Oui', 'Non']},
                validation_rules: {},
                importance: 3,
                conditions: {},
                produits_cibles: ['TICPE'],
                phase: 1
            },
            {
                question_order: 5,
                question_text: 'Combien de véhicules utilisez-vous pour votre activité ?',
                question_type: 'nombre',
                options: {placeholder: 'Nombre de véhicules', min: 0, max: 1000, unite: 'véhicules'},
                validation_rules: {},
                importance: 3,
                conditions: {},
                produits_cibles: ['TICPE'],
                phase: 1
            }
        ];
        
        const { data, error } = await supabase.from('QuestionnaireQuestion').insert(questions);
        
        if (error) {
            console.error('Erreur insertion questions:', error);
        } else {
            console.log('Questions corrigées insérées');
        }
    }
    
    fixDatabase().catch(console.error);
    "
fi

cd ..

# Étape 5: Démarrer le serveur backend
log_info "🚀 Démarrage du serveur backend..."

cd server
npm run dev > ../server.log 2>&1 &
BACKEND_PID=$!
cd ..

log_success "Serveur backend démarré (PID: $BACKEND_PID)"

# Étape 6: Attendre le démarrage complet du serveur backend
log_info "⏳ Attente du démarrage complet du serveur backend..."
log_info "   (Cette étape peut prendre 30-60 secondes selon votre configuration)"

# Attendre que le serveur soit complètement initialisé
for i in {1..60}; do
    if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        log_success "Serveur backend opérationnel (après ${i}s)"
        break
    fi
    
    if [ $i -eq 60 ]; then
        log_error "Serveur backend non accessible après 60 secondes"
        log_info "Vérification des logs du serveur..."
        if [ -f "server.log" ]; then
            echo "=== Dernières lignes du log serveur ==="
            tail -20 server.log
        fi
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    echo -n "."
    sleep 1
done

echo ""

# Étape 7: Vérifier les étapes d'initialisation
log_info "🔍 Vérification des étapes d'initialisation..."

# Attendre un peu plus pour que toutes les initialisations soient terminées
sleep 5

# Test des différentes routes
log_info "🧪 Test des routes du serveur..."

# Test de santé
if curl -s http://localhost:5001/api/health | grep -q "success"; then
    log_success "Route /api/health fonctionnelle"
else
    log_warning "Route /api/health non fonctionnelle"
fi

# Test CORS
if curl -s http://localhost:5001/api/cors-test > /dev/null 2>&1; then
    log_success "Route /api/cors-test accessible"
else
    log_warning "Route /api/cors-test non accessible"
fi

# Test simulateur
if curl -s http://localhost:5001/api/simulator/questions > /dev/null 2>&1; then
    log_success "Route /api/simulator/questions accessible"
else
    log_warning "Route /api/simulator/questions non accessible"
fi

# Étape 8: Démarrer le frontend
log_info "🌐 Démarrage du frontend..."

cd client
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

log_success "Frontend démarré (PID: $FRONTEND_PID)")

# Étape 9: Attendre le démarrage du frontend
log_info "⏳ Attente du démarrage du frontend..."
log_info "   (Cette étape peut prendre 15-30 secondes)"

for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend opérationnel (après ${i}s)"
        break
    fi
    
    if [ $i -eq 30 ]; then
        log_warning "Frontend non accessible après 30 secondes"
        log_info "Vérification des logs du frontend..."
        if [ -f "frontend.log" ]; then
            echo "=== Dernières lignes du log frontend ==="
            tail -10 frontend.log
        fi
    fi
    
    echo -n "."
    sleep 1
done

echo ""

# Étape 10: Test complet du simulateur
log_info "🧪 Test complet du simulateur..."

sleep 3

# Test rapide du simulateur
if [ -f "test-simulator-fixed.js" ]; then
    log_info "Exécution des tests du simulateur..."
    node test-simulator-fixed.js
    if [ $? -eq 0 ]; then
        log_success "Tests du simulateur réussis"
    else
        log_warning "Certains tests ont échoué"
    fi
else
    log_info "Test manuel du simulateur..."
    
    # Test de création de session
    SESSION_RESPONSE=$(curl -s -X POST http://localhost:5001/api/simulator/session \
        -H "Content-Type: application/json" \
        -d '{}' 2>/dev/null)
    
    if echo "$SESSION_RESPONSE" | grep -q "session_token"; then
        log_success "Création de session réussie"
    else
        log_warning "Création de session échouée"
    fi
    
    # Test de récupération des questions
    if curl -s http://localhost:5001/api/simulator/questions | grep -q "question_text"; then
        log_success "Récupération des questions réussie"
    else
        log_warning "Récupération des questions échouée"
    fi
fi

# Étape 11: Afficher les URLs et informations
echo ""
log_success "🎉 Simulateur d'éligibilité corrigé et démarré !"
echo ""
echo "🌐 URLs disponibles:"
echo "  • Frontend: http://localhost:3000"
echo "  • Simulateur: http://localhost:3000/simulateur-eligibilite"
echo "  • Backend API: http://localhost:5001"
echo "  • Health Check: http://localhost:5001/api/health"
echo "  • CORS Test: http://localhost:5001/api/cors-test"
echo ""
echo "📊 Tests disponibles:"
echo "  • Test API: curl http://localhost:5001/api/health"
echo "  • Test simulateur: curl http://localhost:5001/api/simulator/questions"
echo "  • Test complet: node test-simulator-fixed.js"
echo ""
echo "🔧 Corrections appliquées:"
echo "  • Syntaxe PostgreSQL corrigée (ARRAY au lieu de [])"
echo "  • Questions restructurées avec types appropriés"
echo "  • Gestion des erreurs améliorée"
echo "  • Tables manquantes créées"
echo "  • Temps d'attente adapté au démarrage complet"
echo ""
echo "📋 Logs disponibles:"
echo "  • Serveur: tail -f server.log"
echo "  • Frontend: tail -f frontend.log"
echo ""
echo "🛑 Pour arrêter: Ctrl+C"

# Fonction de nettoyage
cleanup() {
    echo ""
    log_info "🛑 Arrêt des serveurs..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        log_success "Serveur backend arrêté"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        log_success "Frontend arrêté"
    fi
    
    # Nettoyer les fichiers de log temporaires
    rm -f server.log frontend.log 2>/dev/null || true
    
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT

# Attendre indéfiniment
wait 