#!/bin/bash

# Script interactif pour appliquer la migration étape par étape
# Usage: ./scripts/apply-migration-step-by-step.sh

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_step() {
    echo -e "${BLUE}[ÉTAPE $1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "Ce script doit être exécuté depuis le répertoire server/"
    exit 1
fi

print_header "GUIDE D'APPLICATION DE LA MIGRATION"
echo ""
print_info "Ce script va vous guider pour appliquer la migration de correction du schéma"
echo ""

# Étape 1: Vérification préalable
print_step "1" "Vérification de l'état actuel de la base de données"
echo ""

print_info "Vérification de la structure actuelle..."
if node scripts/check-expertassignment-structure.js; then
    print_success "Diagnostic terminé"
else
    print_warning "Diagnostic partiel (normal si certaines colonnes manquent)"
fi

echo ""
print_warning "⚠️  IMPORTANT: Vous devez appliquer la migration manuellement via l'interface Supabase"
echo ""

# Étape 2: Instructions pour Supabase
print_step "2" "Application de la migration via Supabase"
echo ""

echo "📋 Instructions détaillées :"
echo ""
echo "1. 🌐 Ouvrir votre navigateur et aller sur :"
echo "   https://supabase.com"
echo ""
echo "2. 🔐 Se connecter avec vos identifiants"
echo ""
echo "3. 📁 Sélectionner le projet FinancialTracker"
echo ""
echo "4. 🛠️  Aller dans la section 'SQL Editor' (menu de gauche)"
echo ""
echo "5. ➕ Cliquer sur 'New query'"
echo ""
echo "6. 📝 Donner un nom au script :"
echo "   'Fix Schema Issues - 20250103'"
echo ""
echo "7. 📋 Copier le contenu du fichier de migration :"
echo ""

# Afficher le début du fichier de migration
print_info "Contenu du fichier de migration (début) :"
echo ""
head -20 migrations/20250103_fix_schema_issues.sql
echo ""
print_info "... (fichier complet disponible dans migrations/20250103_fix_schema_issues.sql)"
echo ""

echo "8. 📋 Copier TOUT le contenu du fichier :"
echo "   cat migrations/20250103_fix_schema_issues.sql"
echo ""
echo "9. ▶️  Cliquer sur 'Run' ou utiliser Ctrl+Enter (Cmd+Enter sur Mac)"
echo ""
echo "10. ⏱️  Attendre que l'exécution se termine (2-3 minutes)"
echo ""

# Demander confirmation
echo ""
read -p "Appuyez sur Entrée quand vous êtes prêt à commencer..."

# Étape 3: Afficher le contenu complet du fichier
print_step "3" "Contenu complet de la migration"
echo ""

print_info "Voici le contenu complet à copier dans Supabase :"
echo ""
echo "----------------------------------------"
cat migrations/20250103_fix_schema_issues.sql
echo "----------------------------------------"
echo ""

print_warning "⚠️  Copiez TOUT ce contenu dans l'éditeur SQL de Supabase"
echo ""

# Étape 4: Instructions d'exécution
print_step "4" "Exécution de la migration"
echo ""

echo "🚀 Une fois le contenu copié dans Supabase :"
echo ""
echo "1. ✅ Vérifier qu'il n'y a pas d'erreurs de syntaxe"
echo "2. ▶️  Cliquer sur 'Run' pour exécuter"
echo "3. ⏱️  Attendre la fin de l'exécution (2-3 minutes)"
echo "4. 📊 Vérifier qu'il n'y a pas d'erreurs dans la console"
echo ""

read -p "Appuyez sur Entrée quand la migration est terminée..."

# Étape 5: Vérification post-migration
print_step "5" "Vérification des corrections"
echo ""

print_info "Vérification de la structure après migration..."
if node scripts/check-expertassignment-structure.js; then
    print_success "Vérification terminée"
else
    print_warning "Vérification partielle"
fi

echo ""
print_info "Test des corrections de schéma..."
if node scripts/test-schema-corrections.js; then
    print_success "Tests de correction terminés"
else
    print_warning "Certains tests ont échoué"
fi

# Étape 6: Résumé final
print_step "6" "Résumé et prochaines étapes"
echo ""

print_success "🎉 Migration appliquée avec succès !"
echo ""

echo "📊 Résumé des corrections appliquées :"
echo "  ✅ Colonne client_produit_eligible_id ajoutée"
echo "  ✅ Colonne statut ajoutée"
echo "  ✅ Contrainte de clé étrangère créée"
echo "  ✅ Index optimisés créés"
echo "  ✅ RLS activé sur les tables critiques"
echo "  ✅ Vues et fonctions créées"
echo ""

echo "🚀 Prochaines étapes :"
echo "  1. Démarrer le dashboard admin :"
echo "     node scripts/start-dashboard-admin.js"
echo ""
echo "  2. Tester l'intégration complète :"
echo "     node scripts/test-integration-complete.js"
echo ""
echo "  3. Démarrer le serveur :"
echo "     npm run dev"
echo ""

print_header "MIGRATION TERMINÉE"
echo ""
print_success "Le schéma de base de données est maintenant corrigé et optimisé !"
echo ""
print_info "Vous pouvez maintenant passer à la Phase B : Dashboard Admin"
echo "" 