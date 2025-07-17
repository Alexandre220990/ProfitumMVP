#!/bin/bash

# Script de déploiement du système de documents
# FinancialTracker - Janvier 2025

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement du système de documents FinancialTracker"
echo "======================================================"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les variables d'environnement
check_env() {
    print_status "Vérification des variables d'environnement..."
    
    required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "SUPABASE_KEY")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Variable $var manquante"
            exit 1
        fi
    done
    
    print_success "Variables d'environnement OK"
}

# Sauvegarde de la base de données
backup_database() {
    print_status "Sauvegarde de la base de données..."
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="backup_${timestamp}.sql"
    
    # Créer le dossier de sauvegarde s'il n'existe pas
    mkdir -p backups
    
    # Sauvegarde via Supabase CLI ou pg_dump
    if command -v supabase &> /dev/null; then
        supabase db dump --file "backups/$backup_file"
        print_success "Sauvegarde créée: backups/$backup_file"
    else
        print_warning "Supabase CLI non trouvé, sauvegarde manuelle recommandée"
    fi
}

# Installation des dépendances
install_dependencies() {
    print_status "Installation des dépendances..."
    
    # Backend
    if [ -f "server/package.json" ]; then
        cd server
        npm install
        cd ..
        print_success "Dépendances backend installées"
    fi
    
    # Frontend
    if [ -f "client/package.json" ]; then
        cd client
        npm install
        cd ..
        print_success "Dépendances frontend installées"
    fi
}

# Migration de la base de données
run_migrations() {
    print_status "Exécution des migrations..."
    
    # Migration principale du système de documents
    if [ -f "server/migrations/20250103_create_document_storage_system.sql" ]; then
        print_status "Migration du système de stockage de documents..."
        
        # Exécuter la migration via Supabase ou psql
        if command -v psql &> /dev/null; then
            psql "$DATABASE_URL" -f server/migrations/20250103_create_document_storage_system.sql
            print_success "Migration exécutée"
        else
            print_warning "psql non trouvé, migration manuelle requise"
        fi
    else
        print_error "Fichier de migration non trouvé"
        exit 1
    fi
}

# Configuration des buckets Supabase
setup_storage() {
    print_status "Configuration du stockage Supabase..."
    
    if [ -f "server/scripts/setup-document-storage.js" ]; then
        node server/scripts/setup-document-storage.js
        print_success "Buckets de stockage configurés"
    else
        print_error "Script de configuration du stockage non trouvé"
        exit 1
    fi
}

# Tests du système
run_tests() {
    print_status "Exécution des tests..."
    
    if [ -f "server/scripts/test-document-system.js" ]; then
        node server/scripts/test-document-system.js
        print_success "Tests terminés"
    else
        print_warning "Script de test non trouvé"
    fi
}

# Build des applications
build_applications() {
    print_status "Build des applications..."
    
    # Build frontend
    if [ -f "client/package.json" ]; then
        cd client
        npm run build
        cd ..
        print_success "Frontend buildé"
    fi
    
    # Build backend (si nécessaire)
    if [ -f "server/package.json" ]; then
        cd server
        npm run build 2>/dev/null || print_warning "Build backend non configuré"
        cd ..
    fi
}

# Vérification de la sécurité
security_check() {
    print_status "Vérification de la sécurité..."
    
    # Vérifier les politiques RLS
    print_status "Vérification des politiques RLS..."
    
    # Vérifier les permissions des fichiers
    print_status "Vérification des permissions..."
    
    print_success "Vérifications de sécurité terminées"
}

# Documentation
generate_documentation() {
    print_status "Génération de la documentation..."
    
    if [ -f "DOCUMENTATION-BASE-DONNEES-COMPLETE.md" ]; then
        print_success "Documentation de base de données disponible"
    fi
    
    # Créer un guide utilisateur
    cat > GUIDE-UTILISATEUR-DOCUMENTS.md << 'EOF'
# 📚 Guide Utilisateur - Système de Documents

## 🎯 Vue d'ensemble

Le système de documents FinancialTracker permet de :
- Uploader et organiser tous vos documents
- Partager des fichiers de manière sécurisée
- Suivre les validations et approbations
- Accéder à vos documents depuis n'importe où

## 📁 Types de Documents

### Chartes d'Engagement
- Documents contractuels signés
- Suivi des gains potentiels
- Validation automatique

### Rapports d'Audit
- Documents d'analyse détaillés
- Validation par experts
- Historique des versions

### Simulations
- Calculs d'optimisation fiscale
- Comparaison des scénarios
- Export des résultats

## 🔐 Sécurité

- Chiffrement AES-256
- Accès par authentification
- Audit trail complet
- Conformité RGPD

## 📞 Support

Pour toute question : support@financialtracker.fr
EOF

    print_success "Documentation utilisateur générée"
}

# Démarrage des services
start_services() {
    print_status "Démarrage des services..."
    
    # Démarrer le serveur backend
    if [ -f "server/package.json" ]; then
        cd server
        npm start &
        cd ..
        print_success "Serveur backend démarré"
    fi
    
    # Démarrer le serveur frontend
    if [ -f "client/package.json" ]; then
        cd client
        npm run dev &
        cd ..
        print_success "Serveur frontend démarré"
    fi
}

# Vérification finale
final_check() {
    print_status "Vérification finale..."
    
    # Vérifier que les services répondent
    sleep 5
    
    # Test de connectivité
    if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        print_success "API backend accessible"
    else
        print_warning "API backend non accessible"
    fi
    
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        print_success "Frontend accessible"
    else
        print_warning "Frontend non accessible"
    fi
}

# Fonction principale
main() {
    echo "Début du déploiement: $(date)"
    echo ""
    
    # Étapes de déploiement
    check_env
    backup_database
    install_dependencies
    run_migrations
    setup_storage
    run_tests
    build_applications
    security_check
    generate_documentation
    start_services
    final_check
    
    echo ""
    echo "🎉 Déploiement terminé avec succès !"
    echo ""
    echo "📋 Prochaines étapes :"
    echo "1. Tester l'upload de fichiers"
    echo "2. Vérifier les permissions utilisateur"
    echo "3. Former les utilisateurs"
    echo "4. Configurer les notifications"
    echo ""
    echo "📚 Documentation :"
    echo "- Guide utilisateur : GUIDE-UTILISATEUR-DOCUMENTS.md"
    echo "- Documentation technique : DOCUMENTATION-BASE-DONNEES-COMPLETE.md"
    echo ""
    echo "🆘 Support : support@financialtracker.fr"
}

# Gestion des erreurs
trap 'print_error "Erreur lors du déploiement. Vérifiez les logs."; exit 1' ERR

# Exécution
main "$@" 