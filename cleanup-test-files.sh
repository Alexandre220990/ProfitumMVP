#!/bin/bash

echo "🧹 Nettoyage des fichiers de test temporaires..."

# Supprimer les fichiers de test créés pendant cette session
rm -f test-expert-dashboard-api.cjs
rm -f test-complete-system.cjs
rm -f check-expert-table-name.cjs
rm -f fix-supabase-relations.cjs

# Garder les fichiers de diagnostic importants
echo "✅ Fichiers de test temporaires supprimés"
echo "📁 Fichiers de diagnostic conservés:"
echo "   - check-dashboard-data.cjs"
echo "   - check-expert-assignment-table.cjs"
echo "   - check-expert-assignments-data.cjs"
echo "   - check-rls-policies.cjs"
echo "   - fix-dashboard-relations.cjs"
echo "   - fix-expert-assignments.cjs"

echo "🎉 Nettoyage terminé !" 