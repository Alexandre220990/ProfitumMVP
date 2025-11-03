-- ============================================================================
-- VÉRIFICATION DES DOCUMENTS POUR UN DOSSIER SPÉCIFIQUE
-- Date : 2025-11-03
-- Dossier : 57f606c7-00a6-40f0-bb72-ae1831345d99 (AlexTransport)
-- ============================================================================

-- 1. Récupérer les infos du dossier
SELECT 
    cpe.id as dossier_id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    c.company_name as client_name,
    p.nom as produit_nom
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE cpe.id = '57f606c7-00a6-40f0-bb72-ae1831345d99';

-- 2. Chercher les documents par client_id ET produit_id
SELECT 
    cpd.*,
    cpe.id as dossier_id
FROM "ClientProcessDocument" cpd
INNER JOIN "ClientProduitEligible" cpe 
    ON cpd.client_id = cpe."clientId" 
    AND cpd.produit_id = cpe."produitId"
WHERE cpe.id = '57f606c7-00a6-40f0-bb72-ae1831345d99'
ORDER BY cpd.created_at DESC;

-- 3. Compter les documents pour ce dossier
SELECT 
    COUNT(*) as nombre_documents
FROM "ClientProcessDocument" cpd
INNER JOIN "ClientProduitEligible" cpe 
    ON cpd.client_id = cpe."clientId" 
    AND cpd.produit_id = cpe."produitId"
WHERE cpe.id = '57f606c7-00a6-40f0-bb72-ae1831345d99';

-- 4. Vérifier s'il y a une colonne pour lier directement (client_produit_id, process_id, etc.)
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'ClientProcessDocument'
AND (
    column_name LIKE '%process%' 
    OR column_name LIKE '%dossier%'
    OR column_name LIKE '%client_produit%'
)
ORDER BY column_name;

-- 5. Si aucune colonne de liaison, chercher juste par client_id pour ce dossier
SELECT 
    cpd.*
FROM "ClientProcessDocument" cpd
WHERE cpd.client_id = (
    SELECT "clientId" FROM "ClientProduitEligible" 
    WHERE id = '57f606c7-00a6-40f0-bb72-ae1831345d99'
)
ORDER BY cpd.created_at DESC;

-- 6. Vérifier tous les documents récents de tous les clients
SELECT 
    cpd.id,
    cpd.filename,
    cpd.document_type,
    cpd.status,
    cpd.created_at,
    c.company_name as client_name,
    p.nom as produit_nom
FROM "ClientProcessDocument" cpd
LEFT JOIN "Client" c ON c.id = cpd.client_id
LEFT JOIN "ProduitEligible" p ON p.id = cpd.produit_id
ORDER BY cpd.created_at DESC
LIMIT 20;

