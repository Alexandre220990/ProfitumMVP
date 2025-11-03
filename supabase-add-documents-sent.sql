-- ============================================================================
-- SCRIPT DE MIGRATION : Ajout de la colonne documents_sent
-- Table : ClientProduitEligible
-- Date : 2025-11-03
-- Description : Ajoute un champ pour stocker les références aux documents uploadés
-- Note : Les fichiers réels sont dans Supabase Storage, cette colonne stocke les métadonnées
-- ============================================================================

-- 1. Ajouter la colonne documents_sent (JSONB pour stocker un array d'objets)
ALTER TABLE "ClientProduitEligible" 
ADD COLUMN IF NOT EXISTS "documents_sent" JSONB DEFAULT '[]'::jsonb;

-- 2. Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN "ClientProduitEligible"."documents_sent" IS 
'Array JSONB contenant les métadonnées des documents uploadés (références vers Supabase Storage). 
Format: [{"url": "...", "name": "...", "type": "...", "uploadedAt": "..."}]';

-- 3. Créer un index GIN pour optimiser les requêtes sur le JSONB
CREATE INDEX IF NOT EXISTS "idx_documents_sent_gin" 
ON "ClientProduitEligible" USING gin("documents_sent");

-- ============================================================================
-- VÉRIFICATION DE LA TABLE ClientProcessDocument
-- ============================================================================

-- 4. Vérifier la structure de ClientProcessDocument
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ClientProcessDocument'
ORDER BY ordinal_position;

-- 5. Vérifier les documents pour le dossier AlexTransport
SELECT 
    cpd.*
FROM "ClientProcessDocument" cpd
WHERE cpd."processId" = '57f606c7-00a6-40f0-bb72-ae1831345d99'
ORDER BY cpd."uploadedAt" DESC;

-- 6. Compter les documents par dossier
SELECT 
    "processId",
    COUNT(*) as nombre_documents
FROM "ClientProcessDocument"
WHERE "processId" = '57f606c7-00a6-40f0-bb72-ae1831345d99'
GROUP BY "processId";

-- 7. Vérifier tous les documents récents
SELECT 
    cpd."processId",
    cpd."document_type",
    cpd."fileName",
    cpd."uploadedAt",
    cpe."clientId"
FROM "ClientProcessDocument" cpd
LEFT JOIN "ClientProduitEligible" cpe ON cpe.id = cpd."processId"
ORDER BY cpd."uploadedAt" DESC
LIMIT 10;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- 8. Vérifier que la colonne documents_sent a bien été ajoutée
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible' 
AND column_name = 'documents_sent';

-- 9. Vérifier l'état actuel des documents_sent
SELECT 
    id,
    statut,
    documents_sent,
    jsonb_array_length(documents_sent) as nombre_documents_json
FROM "ClientProduitEligible"
ORDER BY created_at DESC
LIMIT 5;

