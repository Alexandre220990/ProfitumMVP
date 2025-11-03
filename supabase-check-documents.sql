-- ============================================================================
-- VÉRIFICATION DES DOCUMENTS UPLOADÉS
-- Date : 2025-11-03
-- Description : Vérifier les documents uploadés par les clients
-- ============================================================================

-- 1. Vérifier les colonnes liées aux documents dans ClientProduitEligible
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible' 
AND column_name LIKE '%document%'
ORDER BY column_name;

-- 2. Vérifier le dossier spécifique (AlexTransport)
SELECT 
    id,
    "clientId",
    statut,
    documents_sent,
    jsonb_array_length(documents_sent::jsonb) as nombre_documents,
    created_at,
    updated_at
FROM "ClientProduitEligible"
WHERE id = '57f606c7-00a6-40f0-bb72-ae1831345d99';

-- 3. Vérifier tous les dossiers avec documents
SELECT 
    id,
    statut,
    CASE 
        WHEN documents_sent IS NULL THEN 'NULL'
        WHEN documents_sent::text = '[]' THEN 'Array vide'
        WHEN documents_sent::text = '' THEN 'String vide'
        ELSE 'Contient données'
    END as etat_documents,
    LENGTH(documents_sent::text) as taille_donnees,
    created_at
FROM "ClientProduitEligible"
ORDER BY created_at DESC
LIMIT 10;

-- 4. Compter les dossiers par état de documents
SELECT 
    CASE 
        WHEN documents_sent IS NULL THEN 'NULL'
        WHEN documents_sent::text = '[]' THEN 'Array vide'
        WHEN documents_sent::text = '' THEN 'String vide'
        ELSE 'Contient données'
    END as etat_documents,
    COUNT(*) as nombre_dossiers
FROM "ClientProduitEligible"
GROUP BY etat_documents
ORDER BY nombre_dossiers DESC;

-- 5. Si documents_sent n'existe pas, vérifier les autres tables
SELECT table_name, column_name
FROM information_schema.columns 
WHERE column_name LIKE '%document%'
AND table_schema = 'public'
ORDER BY table_name, column_name;

-- 6. Vérifier s'il existe une table séparée pour les documents
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%document%' OR table_name LIKE '%file%' OR table_name LIKE '%upload%')
ORDER BY table_name;

