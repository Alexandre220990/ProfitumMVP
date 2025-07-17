#!/bin/bash

# =====================================================
# Script de démarrage du simulateur corrigé
# =====================================================

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de logging
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

log_info "🚀 Démarrage du simulateur d'éligibilité corrigé"

# Étape 1: Vérifier les dépendances
log_info "📦 Vérification des dépendances..."

if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "npm n'est pas installé"
    exit 1
fi

log_success "Dépendances vérifiées"

# Étape 2: Installer les dépendances si nécessaire
log_info "📦 Installation des dépendances..."

if [ ! -d "node_modules" ]; then
    npm install
    log_success "Dépendances installées"
else
    log_info "Dépendances déjà installées"
fi

# Étape 3: Vérifier les variables d'environnement
log_info "🔧 Vérification des variables d'environnement..."

if [ ! -f ".env" ]; then
    log_warning "Fichier .env non trouvé, création d'un exemple..."
    cat > .env << EOF
# Configuration Supabase
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Configuration API
API_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000

# Configuration serveur
PORT=5001
NODE_ENV=development
EOF
    log_warning "Veuillez configurer le fichier .env avec vos vraies valeurs"
    exit 1
fi

log_success "Variables d'environnement vérifiées"

# Étape 4: Corriger la base de données
log_info "🗄️ Correction de la base de données..."

cd server

# Exécuter le script de correction
if [ -f "scripts/fix-simulator-complete.js" ]; then
    log_info "Exécution du script de correction..."
    node scripts/fix-simulator-complete.js
    log_success "Base de données corrigée"
else
    log_warning "Script de correction non trouvé, création des tables manuellement..."
    
    # Créer les tables manuellement
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    async function createTables() {
        console.log('Création des tables...');
        
        // Créer TemporarySession
        const { error: sessionError } = await supabase.rpc('exec_sql', {
            sql: \`
                CREATE TABLE IF NOT EXISTS \"public\".\"TemporarySession\" (
                    \"id\" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                    \"session_token\" text NOT NULL UNIQUE,
                    \"ip_address\" text,
                    \"user_agent\" text,
                    \"completed\" boolean DEFAULT false,
                    \"abandoned\" boolean DEFAULT false,
                    \"abandon_reason\" text,
                    \"abandoned_at\" timestamp with time zone,
                    \"migrated_to_account\" boolean DEFAULT false,
                    \"migrated_at\" timestamp with time zone,
                    \"client_id\" uuid,
                    \"last_activity\" timestamp with time zone DEFAULT now(),
                    \"created_at\" timestamp with time zone DEFAULT now(),
                    \"updated_at\" timestamp with time zone DEFAULT now()
                );
            \`
        });
        
        if (sessionError) console.log('Session table:', sessionError.message);
        
        // Créer TemporaryResponse
        const { error: responseError } = await supabase.rpc('exec_sql', {
            sql: \`
                CREATE TABLE IF NOT EXISTS \"public\".\"TemporaryResponse\" (
                    \"id\" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                    \"session_id\" uuid NOT NULL,
                    \"question_id\" uuid NOT NULL,
                    \"response_value\" jsonb NOT NULL,
                    \"created_at\" timestamp with time zone DEFAULT now()
                );
            \`
        });
        
        if (responseError) console.log('Response table:', responseError.message);
        
        // Créer TemporaryEligibility
        const { error: eligibilityError } = await supabase.rpc('exec_sql', {
            sql: \`
                CREATE TABLE IF NOT EXISTS \"public\".\"TemporaryEligibility\" (
                    \"id\" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                    \"session_id\" uuid NOT NULL,
                    \"produit_id\" text NOT NULL,
                    \"eligibility_score\" integer NOT NULL CHECK (eligibility_score >= 0 AND eligibility_score <= 100),
                    \"estimated_savings\" numeric(10,2) DEFAULT 0,
                    \"confidence_level\" text CHECK (confidence_level IN ('low', 'medium', 'high')),
                    \"recommendations\" jsonb DEFAULT '[]'::jsonb,
                    \"created_at\" timestamp with time zone DEFAULT now()
                );
            \`
        });
        
        if (eligibilityError) console.log('Eligibility table:', eligibilityError.message);
        
        console.log('Tables créées');
    }
    
    createTables().catch(console.error);
    "
fi

cd ..

# Étape 5: Démarrer le serveur backend
log_info "🚀 Démarrage du serveur backend..."

cd server
npm run dev &
BACKEND_PID=$!
cd ..

log_success "Serveur backend démarré (PID: $BACKEND_PID)"

# Attendre que le serveur soit prêt
log_info "⏳ Attente du démarrage du serveur backend..."
sleep 10

# Étape 6: Tester le serveur backend
log_info "🧪 Test du serveur backend..."

if curl -s http://localhost:5001/api/health > /dev/null; then
    log_success "Serveur backend opérationnel"
else
    log_error "Serveur backend non accessible"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Étape 7: Démarrer le frontend
log_info "🌐 Démarrage du frontend..."

cd client
npm run dev &
FRONTEND_PID=$!
cd ..

log_success "Frontend démarré (PID: $FRONTEND_PID)"

# Attendre que le frontend soit prêt
log_info "⏳ Attente du démarrage du frontend..."
sleep 5

# Étape 8: Tester le frontend
log_info "🧪 Test du frontend..."

if curl -s -I http://localhost:3000 | head -1 | grep -q "200"; then
    log_success "Frontend opérationnel"
else
    log_warning "Frontend non accessible (peut prendre plus de temps)"
fi

# Étape 9: Afficher les URLs
echo ""
log_success "🎉 Simulateur d'éligibilité démarré avec succès !"
echo ""
echo "🌐 URLs disponibles:"
echo "  • Frontend: http://localhost:3000"
echo "  • Simulateur: http://localhost:5000/simulateur-eligibilite"
echo "  • Backend API: http://localhost:5001"
echo ""
echo "📊 Tests disponibles:"
echo "  • Test API: curl http://localhost:5001/api/health"
echo "  • Test simulateur: curl http://localhost:5001/api/simulator/questions"
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
    
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT

# Attendre indéfiniment
wait 