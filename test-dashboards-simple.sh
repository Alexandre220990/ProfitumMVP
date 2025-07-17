#!/bin/bash

echo "🧪 Test Simple des Nouveaux Dashboards"
echo "====================================="

# Vérifier si le serveur frontend est démarré
echo "🔍 Vérification du serveur frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Serveur frontend accessible"
else
    echo "❌ Serveur frontend non accessible"
    echo "   Démarrez le serveur avec: cd client && npm run dev"
    exit 1
fi

# Test des nouvelles routes
echo ""
echo "📋 Test des nouvelles routes..."

# Test client-assignments
echo "  • Dashboard client-assignments..."
if curl -s http://localhost:3000/dashboard/client-assignments > /dev/null; then
    echo "    ✅ Accessible"
else
    echo "    ❌ Non accessible"
fi

# Test expert-assignments
echo "  • Dashboard expert-assignments..."
if curl -s http://localhost:3000/dashboard/expert-assignments > /dev/null; then
    echo "    ✅ Accessible"
else
    echo "    ❌ Non accessible"
fi

# Test page d'accueil
echo "  • Page d'accueil..."
if curl -s http://localhost:3000/home > /dev/null; then
    echo "    ✅ Accessible"
else
    echo "    ❌ Non accessible"
fi

echo ""
echo "🌐 URLs à tester manuellement:"
echo "  • Client Assignments: http://localhost:3000/dashboard/client-assignments"
echo "  • Expert Assignments: http://localhost:3000/dashboard/expert-assignments"
echo "  • Page d'accueil: http://localhost:3000/home"
echo ""
echo "✅ Test terminé" 