-- ============================================================================
-- SCRIPT DE MIGRATION : Peupler documents_sent depuis ClientProcessDocument
-- Date : 2025-11-03
-- Description : Synchronise les documents uploadés de ClientProcessDocument vers documents_sent
-- ============================================================================

-- 1. Peupler documents_sent pour TOUS les dossiers avec des documents
UPDATE "ClientProduitEligible" cpe
SET documents_sent = (
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', cpd.id,
                'url', cpd.storage_path,
                'filename', cpd.filename,
                'document_type', cpd.document_type,
                'status', cpd.status,
                'file_size', cpd.file_size,
                'mime_type', cpd.mime_type,
                'bucket_name', cpd.bucket_name,
                'uploaded_at', cpd.created_at,
                'uploaded_by', cpd.uploaded_by
            )
            ORDER BY cpd.created_at ASC
        ),
        '[]'::jsonb
    )
    FROM "ClientProcessDocument" cpd
    WHERE cpd.client_id = cpe."clientId" 
    AND cpd.produit_id = cpe."produitId"
)
WHERE EXISTS (
    SELECT 1 
    FROM "ClientProcessDocument" cpd
    WHERE cpd.client_id = cpe."clientId" 
    AND cpd.produit_id = cpe."produitId"
);

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- 2. Vérifier le dossier AlexTransport spécifiquement
SELECT 
    id,
    "clientId",
    statut,
    documents_sent,
    jsonb_array_length(documents_sent) as nombre_documents
FROM "ClientProduitEligible"
WHERE id = '57f606c7-00a6-40f0-bb72-ae1831345d99';

-- 3. Compter les dossiers avec/sans documents
SELECT 
    CASE 
        WHEN jsonb_array_length(documents_sent) = 0 THEN 'Aucun document'
        WHEN jsonb_array_length(documents_sent) BETWEEN 1 AND 3 THEN '1-3 documents'
        WHEN jsonb_array_length(documents_sent) BETWEEN 4 AND 10 THEN '4-10 documents'
        ELSE 'Plus de 10 documents'
    END as categorie,
    COUNT(*) as nombre_dossiers
FROM "ClientProduitEligible"
GROUP BY categorie
ORDER BY 
    CASE categorie
        WHEN 'Aucun document' THEN 1
        WHEN '1-3 documents' THEN 2
        WHEN '4-10 documents' THEN 3
        ELSE 4
    END;

-- 4. Voir les dossiers avec documents (les 10 premiers)
SELECT 
    cpe.id,
    c.company_name as client_name,
    p.nom as produit_nom,
    cpe.statut,
    jsonb_array_length(cpe.documents_sent) as nombre_documents,
    cpe.documents_sent
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE jsonb_array_length(cpe.documents_sent) > 0
ORDER BY cpe.created_at DESC
LIMIT 10;

-- 5. Vérifier qu'aucun document n'a été perdu
SELECT 
    'Total documents ClientProcessDocument' as source,
    COUNT(*) as count
FROM "ClientProcessDocument"
UNION ALL
SELECT 
    'Total documents dans documents_sent' as source,
    SUM(jsonb_array_length(documents_sent))::integer as count
FROM "ClientProduitEligible";

-- ============================================================================
-- NOTES
-- ============================================================================

-- Ce script a synchronisé tous les documents de ClientProcessDocument vers documents_sent
-- Pour garder la synchronisation à l'avenir, vous devrez :
-- Option 1 : Créer un trigger PostgreSQL qui met à jour documents_sent automatiquement
-- Option 2 : Créer une fonction API qui synchronise lors de l'upload
-- Option 3 : Exécuter ce script périodiquement

-- Pour créer un trigger automatique (optionnel), décommentez ci-dessous :
/*
CREATE OR REPLACE FUNCTION sync_documents_sent()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "ClientProduitEligible" cpe
    SET documents_sent = (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', cpd.id,
                    'url', cpd.storage_path,
                    'filename', cpd.filename,
                    'document_type', cpd.document_type,
                    'status', cpd.status,
                    'file_size', cpd.file_size,
                    'mime_type', cpd.mime_type,
                    'bucket_name', cpd.bucket_name,
                    'uploaded_at', cpd.created_at,
                    'uploaded_by', cpd.uploaded_by
                )
                ORDER BY cpd.created_at ASC
            ),
            '[]'::jsonb
        )
        FROM "ClientProcessDocument" cpd
        WHERE cpd.client_id = cpe."clientId" 
        AND cpd.produit_id = cpe."produitId"
    )
    WHERE cpe."clientId" = NEW.client_id 
    AND cpe."produitId" = NEW.produit_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_documents_sent
AFTER INSERT OR UPDATE OR DELETE ON "ClientProcessDocument"
FOR EACH ROW
EXECUTE FUNCTION sync_documents_sent();
*/

