#!/bin/bash

# Script de vérification rapide du serveur
# Usage: ./verifier-serveur.sh [port]

PORT=${1:-3000}

echo "🔍 Vérification du serveur sur le port $PORT..."
echo ""

# Vérifier si un processus Node écoute sur le port
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Un processus écoute sur le port $PORT"
    PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
    echo "   PID: $PID"
    ps -p $PID -o command=
    echo ""
    
    # Tester l'endpoint
    echo "📡 Test de l'endpoint /api/admin/test..."
    RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:$PORT/api/admin/test 2>/dev/null)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Serveur répond correctement (200 OK)"
        echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    elif [ "$HTTP_CODE" = "401" ]; then
        echo "✅ Serveur répond (401 - Auth requise, c'est normal)"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo "❌ Erreur 404 - La route n'existe pas"
        echo "   → Vérifiez que server/src/index.ts monte bien les routes admin"
    else
        echo "⚠️  Code HTTP inattendu: $HTTP_CODE"
        echo "$BODY"
    fi
    
    echo ""
    echo "📡 Test de l'endpoint /api/admin/produits..."
    RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:$PORT/api/admin/produits 2>/dev/null)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Endpoint produits répond (200 OK)"
        PRODUITS_COUNT=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('produits', [])))" 2>/dev/null)
        if [ ! -z "$PRODUITS_COUNT" ]; then
            echo "   $PRODUITS_COUNT produit(s) récupéré(s)"
        fi
    elif [ "$HTTP_CODE" = "401" ]; then
        echo "✅ Endpoint produits protégé (401 - Auth requise)"
        echo "   C'est le comportement attendu"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo "❌ ERREUR 404 - La route /api/admin/produits n'existe pas!"
        echo ""
        echo "🔧 SOLUTIONS:"
        echo "   1. Vérifiez que server/src/routes/admin.ts contient la route"
        echo "   2. Vérifiez que server/src/index.ts monte les routes admin"
        echo "   3. Redémarrez le serveur: npm run dev"
    else
        echo "⚠️  Code HTTP inattendu: $HTTP_CODE"
        echo "$BODY"
    fi
    
else
    echo "❌ Aucun processus n'écoute sur le port $PORT"
    echo ""
    echo "🔧 SOLUTION:"
    echo "   Démarrez le serveur avec: npm run dev"
    echo ""
    echo "   Ou vérifiez les processus Node en cours:"
    echo "   ps aux | grep node"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

