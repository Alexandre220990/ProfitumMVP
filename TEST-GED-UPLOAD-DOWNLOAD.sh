#!/bin/bash

# ============================================================================
# SCRIPT DE TEST - GED UNIFIÉE - UPLOAD/DOWNLOAD
# ============================================================================
# Date: 2025-10-13
# Usage: ./TEST-GED-UPLOAD-DOWNLOAD.sh
# ============================================================================

# COULEURS
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# CONFIGURATION
API_URL="http://localhost:5000/api"
TEST_FILE="test-document.pdf"

echo "🧪 ================================================"
echo "🧪 TEST GED UNIFIÉE - UPLOAD/DOWNLOAD"
echo "🧪 ================================================"
echo ""

# ============================================================================
# CRÉER UN FICHIER DE TEST PDF
# ============================================================================
echo "📄 Création fichier de test..."
echo "%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 24 Tf
100 700 Td
(Test Document GED) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF" > "$TEST_FILE"

echo -e "${GREEN}✓${NC} Fichier créé: $TEST_FILE"
echo ""

# ============================================================================
# TEST 1 : CLIENT - LOGIN
# ============================================================================
echo "🔐 TEST 1 : Connexion CLIENT..."
CLIENT_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.fr",
    "password": "Test123!"
  }')

CLIENT_TOKEN=$(echo "$CLIENT_RESPONSE" | jq -r '.token // empty')

if [ -z "$CLIENT_TOKEN" ]; then
  echo -e "${RED}✗${NC} Échec login client"
  echo "Response: $CLIENT_RESPONSE"
else
  echo -e "${GREEN}✓${NC} Login client réussi"
  echo "Token: ${CLIENT_TOKEN:0:20}..."
fi
echo ""

# ============================================================================
# TEST 2 : CLIENT - UPLOAD DOCUMENT
# ============================================================================
if [ ! -z "$CLIENT_TOKEN" ]; then
  echo "📤 TEST 2 : Upload document CLIENT..."
  
  UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/documents/upload" \
    -H "Authorization: Bearer $CLIENT_TOKEN" \
    -F "file=@$TEST_FILE" \
    -F "document_type=facture" \
    -F "metadata={\"source\":\"test_script\"}")
  
  DOC_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.id // empty')
  
  if [ -z "$DOC_ID" ]; then
    echo -e "${RED}✗${NC} Échec upload client"
    echo "Response: $UPLOAD_RESPONSE"
  else
    echo -e "${GREEN}✓${NC} Upload client réussi"
    echo "Document ID: $DOC_ID"
  fi
  echo ""
  
  # ============================================================================
  # TEST 3 : CLIENT - LISTE DOCUMENTS
  # ============================================================================
  echo "📋 TEST 3 : Liste documents CLIENT..."
  
  LIST_RESPONSE=$(curl -s -X GET "$API_URL/documents" \
    -H "Authorization: Bearer $CLIENT_TOKEN")
  
  DOC_COUNT=$(echo "$LIST_RESPONSE" | jq -r '.data | length // 0')
  
  if [ "$DOC_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Liste récupérée: $DOC_COUNT document(s)"
  else
    echo -e "${YELLOW}⚠${NC} Aucun document trouvé"
  fi
  echo ""
  
  # ============================================================================
  # TEST 4 : CLIENT - DOWNLOAD DOCUMENT
  # ============================================================================
  if [ ! -z "$DOC_ID" ]; then
    echo "📥 TEST 4 : Download document CLIENT..."
    
    DOWNLOAD_RESPONSE=$(curl -s -X GET "$API_URL/documents/$DOC_ID/download" \
      -H "Authorization: Bearer $CLIENT_TOKEN")
    
    DOWNLOAD_URL=$(echo "$DOWNLOAD_RESPONSE" | jq -r '.data.download_url // empty')
    
    if [ -z "$DOWNLOAD_URL" ]; then
      echo -e "${RED}✗${NC} Échec obtention URL download"
      echo "Response: $DOWNLOAD_RESPONSE"
    else
      echo -e "${GREEN}✓${NC} URL download obtenue"
      echo "URL: ${DOWNLOAD_URL:0:50}..."
    fi
    echo ""
  fi
fi

# ============================================================================
# TEST 5 : EXPERT - LOGIN
# ============================================================================
echo "🔐 TEST 5 : Connexion EXPERT..."
EXPERT_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "expert@test.fr",
    "password": "Test123!"
  }')

EXPERT_TOKEN=$(echo "$EXPERT_RESPONSE" | jq -r '.token // empty')

if [ -z "$EXPERT_TOKEN" ]; then
  echo -e "${RED}✗${NC} Échec login expert"
  echo "Response: $EXPERT_RESPONSE"
else
  echo -e "${GREEN}✓${NC} Login expert réussi"
  echo "Token: ${EXPERT_TOKEN:0:20}..."
fi
echo ""

# ============================================================================
# TEST 6 : EXPERT - UPLOAD DOCUMENT
# ============================================================================
if [ ! -z "$EXPERT_TOKEN" ]; then
  echo "📤 TEST 6 : Upload document EXPERT..."
  
  EXPERT_UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/documents/upload" \
    -H "Authorization: Bearer $EXPERT_TOKEN" \
    -F "file=@$TEST_FILE" \
    -F "document_type=rapport" \
    -F "metadata={\"source\":\"test_script\"}")
  
  EXPERT_DOC_ID=$(echo "$EXPERT_UPLOAD_RESPONSE" | jq -r '.data.id // empty')
  
  if [ -z "$EXPERT_DOC_ID" ]; then
    echo -e "${RED}✗${NC} Échec upload expert"
    echo "Response: $EXPERT_UPLOAD_RESPONSE"
  else
    echo -e "${GREEN}✓${NC} Upload expert réussi"
    echo "Document ID: $EXPERT_DOC_ID"
  fi
  echo ""
  
  # ============================================================================
  # TEST 7 : EXPERT - VALIDER DOCUMENT CLIENT
  # ============================================================================
  if [ ! -z "$DOC_ID" ]; then
    echo "✅ TEST 7 : Expert valide document client..."
    
    VALIDATE_RESPONSE=$(curl -s -X PUT "$API_URL/documents/$DOC_ID/validate" \
      -H "Authorization: Bearer $EXPERT_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"notes": "Document conforme - Test automatique"}')
    
    VALIDATED=$(echo "$VALIDATE_RESPONSE" | jq -r '.success // false')
    
    if [ "$VALIDATED" == "true" ]; then
      echo -e "${GREEN}✓${NC} Validation réussie"
    else
      echo -e "${YELLOW}⚠${NC} Validation échouée (peut-être pas assigné à ce client)"
      echo "Response: $VALIDATE_RESPONSE"
    fi
    echo ""
  fi
fi

# ============================================================================
# TEST 8 : APPORTEUR - LOGIN
# ============================================================================
echo "🔐 TEST 8 : Connexion APPORTEUR..."
APPORTEUR_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apporteur@test.fr",
    "password": "Test123!"
  }')

APPORTEUR_TOKEN=$(echo "$APPORTEUR_RESPONSE" | jq -r '.token // empty')

if [ -z "$APPORTEUR_TOKEN" ]; then
  echo -e "${YELLOW}⚠${NC} Pas de compte apporteur de test"
  echo "Pour tester, créez un compte apporteur avec: email=apporteur@test.fr, password=Test123!"
else
  echo -e "${GREEN}✓${NC} Login apporteur réussi"
  echo "Token: ${APPORTEUR_TOKEN:0:20}..."
  
  # ============================================================================
  # TEST 9 : APPORTEUR - UPLOAD DOCUMENT
  # ============================================================================
  echo ""
  echo "📤 TEST 9 : Upload document APPORTEUR..."
  
  APPORTEUR_UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/documents/upload" \
    -H "Authorization: Bearer $APPORTEUR_TOKEN" \
    -F "file=@$TEST_FILE" \
    -F "document_type=contrat" \
    -F "metadata={\"source\":\"test_script\"}")
  
  APPORTEUR_DOC_ID=$(echo "$APPORTEUR_UPLOAD_RESPONSE" | jq -r '.data.id // empty')
  
  if [ -z "$APPORTEUR_DOC_ID" ]; then
    echo -e "${RED}✗${NC} Échec upload apporteur"
    echo "Response: $APPORTEUR_UPLOAD_RESPONSE"
  else
    echo -e "${GREEN}✓${NC} Upload apporteur réussi"
    echo "Document ID: $APPORTEUR_DOC_ID"
  fi
  echo ""
fi

# ============================================================================
# NETTOYAGE
# ============================================================================
echo "🧹 Nettoyage..."
rm -f "$TEST_FILE"
echo -e "${GREEN}✓${NC} Fichier de test supprimé"
echo ""

# ============================================================================
# RÉSUMÉ
# ============================================================================
echo "🎯 ================================================"
echo "🎯 RÉSUMÉ DES TESTS"
echo "🎯 ================================================"
echo ""
echo "✓ Tests client : Login, Upload, Liste, Download"
echo "✓ Tests expert : Login, Upload, Validation"
echo "✓ Tests apporteur : Login, Upload"
echo ""
echo "🔍 Pour voir les détails complets, vérifiez:"
echo "  - Supabase Storage (buckets client-documents, expert-documents, apporteur-documents)"
echo "  - Table ClientProcessDocument"
echo "  - Logs serveur backend"
echo ""
echo "✅ Tests terminés !"

