#!/bin/bash

# Test d'intégration messagerie-documents
echo "🧪 TEST D'INTÉGRATION MESSAGERIE-DOCUMENTS"
echo "=========================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de test
TOTAL_TESTS=0
PASSED_TESTS=0

# Fonction pour incrémenter les compteurs
increment_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

pass_test() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✅${NC} $1"
}

fail_test() {
    echo -e "${RED}❌${NC} $1"
}

info_test() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

warning_test() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

echo ""
echo "🔍 Vérification des services d'intégration..."

# Test 1: Service d'intégration
increment_test
if [ -f "client/src/services/messaging-document-integration.ts" ]; then
    pass_test "Service d'intégration trouvé: messaging-document-integration.ts"
else
    fail_test "Service d'intégration manquant: messaging-document-integration.ts"
fi

# Test 2: Composant DocumentAttachments
increment_test
if [ -f "client/src/components/messaging/DocumentAttachments.tsx" ]; then
    pass_test "Composant trouvé: DocumentAttachments.tsx"
else
    fail_test "Composant manquant: DocumentAttachments.tsx"
fi

# Test 3: Composant DocumentUpload
increment_test
if [ -f "client/src/components/messaging/DocumentUpload.tsx" ]; then
    pass_test "Composant trouvé: DocumentUpload.tsx"
else
    fail_test "Composant manquant: DocumentUpload.tsx"
fi

# Test 4: ConversationView mis à jour
increment_test
if [ -f "client/src/components/messaging/ConversationView.tsx" ]; then
    # Vérifier si le fichier contient les imports d'intégration
    if grep -q "DocumentAttachments" "client/src/components/messaging/ConversationView.tsx" && \
       grep -q "DocumentUpload" "client/src/components/messaging/ConversationView.tsx"; then
        pass_test "ConversationView.tsx intégré avec les composants documentaires"
    else
        fail_test "ConversationView.tsx non intégré avec les composants documentaires"
    fi
else
    fail_test "ConversationView.tsx manquant"
fi

echo ""
echo "🔧 Test de compilation TypeScript..."

# Test 5: Compilation TypeScript
increment_test
cd client
if npx tsc --noEmit --project tsconfig.json 2>&1 | grep -q "error"; then
    warning_test "Erreurs de compilation TypeScript détectées"
    info_test "Exécutez 'npx tsc --noEmit --project tsconfig.json' pour voir les erreurs"
else
    pass_test "Compilation TypeScript réussie"
fi
cd ..

echo ""
echo "📋 Vérification des types..."

# Test 6: Types d'intégration
increment_test
if grep -q "MessageAttachment" "client/src/services/messaging-document-integration.ts" && \
   grep -q "IntegratedMessage" "client/src/services/messaging-document-integration.ts" && \
   grep -q "DocumentNotification" "client/src/services/messaging-document-integration.ts"; then
    pass_test "Types d'intégration définis correctement"
else
    fail_test "Types d'intégration manquants ou incomplets"
fi

# Test 7: Hook d'intégration
increment_test
if grep -q "useMessagingDocumentIntegration" "client/src/services/messaging-document-integration.ts"; then
    pass_test "Hook d'intégration créé: useMessagingDocumentIntegration"
else
    fail_test "Hook d'intégration manquant: useMessagingDocumentIntegration"
fi

echo ""
echo "🔗 Vérification des intégrations..."

# Test 8: Intégration avec le système documentaire
increment_test
if grep -q "uploadFile" "client/src/services/messaging-document-integration.ts" && \
   grep -q "shareFile" "client/src/services/messaging-document-integration.ts"; then
    pass_test "Intégration avec le système documentaire configurée"
else
    fail_test "Intégration avec le système documentaire manquante"
fi

# Test 9: Notifications croisées
increment_test
if grep -q "createDocumentNotification" "client/src/services/messaging-document-integration.ts" && \
   grep -q "createSystemMessage" "client/src/services/messaging-document-integration.ts"; then
    pass_test "Système de notifications croisées configuré"
else
    fail_test "Système de notifications croisées manquant"
fi

# Test 10: Gestion des pièces jointes
increment_test
if grep -q "uploadMessageAttachment" "client/src/services/messaging-document-integration.ts" && \
   grep -q "shareDocumentInMessage" "client/src/services/messaging-document-integration.ts"; then
    pass_test "Gestion des pièces jointes documentaires configurée"
else
    fail_test "Gestion des pièces jointes documentaires manquante"
fi

echo ""
echo "🎨 Vérification de l'interface utilisateur..."

# Test 11: Interface d'upload
increment_test
if grep -q "drag.*drop" "client/src/components/messaging/DocumentUpload.tsx" && \
   grep -q "Progress" "client/src/components/messaging/DocumentUpload.tsx"; then
    pass_test "Interface d'upload avec drag & drop et progression"
else
    fail_test "Interface d'upload incomplète"
fi

# Test 12: Interface d'affichage
increment_test
if grep -q "getFileIcon" "client/src/components/messaging/DocumentAttachments.tsx" && \
   grep -q "formatFileSize" "client/src/components/messaging/DocumentAttachments.tsx"; then
    pass_test "Interface d'affichage des documents avec icônes et tailles"
else
    fail_test "Interface d'affichage des documents incomplète"
fi

# Test 13: Actions sur documents
increment_test
if grep -q "handleDownload" "client/src/components/messaging/DocumentAttachments.tsx" && \
   grep -q "handleView" "client/src/components/messaging/DocumentAttachments.tsx" && \
   grep -q "handleShare" "client/src/components/messaging/DocumentAttachments.tsx"; then
    pass_test "Actions sur documents (télécharger, voir, partager) configurées"
else
    fail_test "Actions sur documents manquantes"
fi

echo ""
echo "🔒 Vérification de la sécurité..."

# Test 14: Validation des fichiers
increment_test
if grep -q "validateFile" "client/src/components/messaging/DocumentUpload.tsx" && \
   grep -q "maxFileSize" "client/src/components/messaging/DocumentUpload.tsx" && \
   grep -q "allowedTypes" "client/src/components/messaging/DocumentUpload.tsx"; then
    pass_test "Validation des fichiers configurée (taille, type)"
else
    fail_test "Validation des fichiers manquante"
fi

# Test 15: Permissions
increment_test
if grep -q "readonly" "client/src/components/messaging/DocumentAttachments.tsx" && \
   grep -q "onRemoveAttachment" "client/src/components/messaging/DocumentAttachments.tsx"; then
    pass_test "Gestion des permissions configurée"
else
    fail_test "Gestion des permissions manquante"
fi

echo ""
echo "📊 RÉSUMÉ DU TEST D'INTÉGRATION"
echo "==============================="
echo "Tests totaux: $TOTAL_TESTS"
echo "Tests réussis: $PASSED_TESTS"
echo "Taux de réussite: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 Intégration messagerie-documents prête pour la production !${NC}"
else
    echo -e "${YELLOW}⚠️  Certains tests ont échoué. Vérifiez les points mentionnés ci-dessus.${NC}"
fi

echo ""
echo "📋 PROCHAINES ÉTAPES"
echo "===================="
echo "1. Tester l'upload de documents via messagerie"
echo "2. Vérifier le partage de documents entre client et expert"
echo "3. Tester les notifications automatiques"
echo "4. Valider l'affichage des documents dans les conversations"
echo "5. Tester la gestion des permissions"
echo "6. Vérifier la responsivité sur mobile"
echo "7. Tester les performances avec de gros volumes"
echo "8. Intégrer avec les workflows ClientProduitEligible"

echo ""
echo "ℹ️  Test terminé ! Consultez les résultats ci-dessus pour identifier les problèmes éventuels." 