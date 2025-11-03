-- ============================================================================
-- CORRECTIF : Mettre à jour la timeline avec le bon nombre de documents
-- Date : 2025-11-03
-- Description : Corriger les événements timeline qui affichent "0 documents uploadés"
-- ============================================================================

-- 1. Vérifier la structure de la table timeline
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name IN ('timeline', 'dossier_timeline', 'DossierTimeline')
ORDER BY table_name, ordinal_position;

-- 2. Trouver les événements de documents pour AlexTransport
SELECT *
FROM dossier_timeline
WHERE dossier_id = '57f606c7-00a6-40f0-bb72-ae1831345d99'
AND type = 'document'
ORDER BY created_at DESC;

-- 3. Mettre à jour la description avec le bon nombre de documents
UPDATE dossier_timeline
SET description = CONCAT(
    (
        SELECT jsonb_array_length(documents_sent)::text
        FROM "ClientProduitEligible"
        WHERE id = dossier_timeline.dossier_id
    ),
    ' documents uploadés'
)
WHERE type = 'document'
AND dossier_id = '57f606c7-00a6-40f0-bb72-ae1831345d99'
AND (description LIKE '%0 documents uploadés%' OR description LIKE '%documents uploadés%');

-- 4. Vérification : voir l'événement corrigé
SELECT 
    id,
    dossier_id,
    type,
    title,
    description,
    created_at
FROM dossier_timeline
WHERE dossier_id = '57f606c7-00a6-40f0-bb72-ae1831345d99'
AND type = 'document'
ORDER BY created_at DESC;

-- 5. (Optionnel) Corriger TOUS les dossiers avec documents
/*
UPDATE dossier_timeline dt
SET description = CONCAT(
    (
        SELECT COALESCE(jsonb_array_length(documents_sent), 0)::text
        FROM "ClientProduitEligible" cpe
        WHERE cpe.id = dt.dossier_id
    ),
    ' documents uploadés'
)
WHERE type = 'document'
AND description LIKE '%documents uploadés%';
*/

