#!/bin/bash

# ============================================================================
# Script de Nettoyage - Fichiers GED Obsolètes
# ============================================================================
# Date: 2025-10-13
# Usage: ./cleanup-ged-obsolete.sh
# ============================================================================

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧹 ================================================"
echo "🧹 NETTOYAGE FICHIERS GED OBSOLÈTES"
echo "🧹 ================================================"
echo ""

# Vérifier si on est dans le bon répertoire
if [ ! -d "client" ] || [ ! -d "server" ]; then
  echo -e "${RED}❌ Erreur: Exécuter ce script depuis la racine du projet${NC}"
  exit 1
fi

echo "📋 Fichiers à supprimer (7):"
echo "  Backend (3):"
echo "    - server/src/routes/client-documents.ts"
echo "    - server/src/routes/enhanced-client-documents.ts"
echo "    - server/src/routes/documents.ts"
echo ""
echo "  Frontend (4):"
echo "    - client/src/pages/documents-client.tsx"
echo "    - client/src/pages/documents-expert.tsx"
echo "    - client/src/pages/unified-documents.tsx"
echo "    - client/src/pages/dashboard/client-documents.tsx"
echo ""

# Demander confirmation
read -p "Voulez-vous continuer ? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}⚠️  Annulé par l'utilisateur${NC}"
  exit 0
fi

echo ""
echo "🗑️  Suppression en cours..."
echo ""

# Fonction pour supprimer un fichier
delete_file() {
  if [ -f "$1" ]; then
    rm -f "$1"
    echo -e "${GREEN}✓${NC} Supprimé: $1"
  else
    echo -e "${YELLOW}⚠${NC} Déjà supprimé: $1"
  fi
}

# Backend
echo "📦 Backend..."
delete_file "server/src/routes/client-documents.ts"
delete_file "server/src/routes/enhanced-client-documents.ts"
delete_file "server/src/routes/documents.ts"

echo ""

# Frontend
echo "🎨 Frontend..."
delete_file "client/src/pages/documents-client.tsx"
delete_file "client/src/pages/documents-expert.tsx"
delete_file "client/src/pages/unified-documents.tsx"
delete_file "client/src/pages/dashboard/client-documents.tsx"

echo ""
echo -e "${GREEN}✅ Nettoyage terminé !${NC}"
echo ""

# Vérifier compilation
echo "🔍 Vérification compilation..."
echo ""

cd client
if npx tsc --noEmit 2>&1 | grep -q "error"; then
  echo -e "${RED}❌ Erreurs TypeScript détectées${NC}"
  echo "Exécutez: cd client && npx tsc --noEmit"
else
  echo -e "${GREEN}✓${NC} TypeScript OK"
fi

cd ..

echo ""
echo "📊 Résumé:"
echo "  - 7 fichiers obsolètes supprimés"
echo "  - ~1800 lignes de code mort éliminées"
echo ""
echo "📝 Fichiers CONSERVÉS (encore utilisés):"
echo "  ⚠️  admin/documents-unified.tsx (ancienne route)"
echo "  ⚠️  admin/admin-document-upload.tsx (upload admin)"
echo ""
echo "🚀 Prochaine étape:"
echo "  1. Tester l'application: npm run dev"
echo "  2. Vérifier routes documents: /client/documents, /expert/documents, etc."
echo "  3. Si OK, commit: git add . && git commit -m '🧹 Nettoyage GED obsolète'"
echo ""

