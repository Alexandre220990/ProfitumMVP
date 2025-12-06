-- ============================================================================
-- CORRECTION : Fonction sync_documents_sent avec search_path explicite
-- Date : 2025-01-06
-- Description : Recrée la fonction avec search_path vide et noms de tables explicites
-- ============================================================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.sync_documents_sent() CASCADE;

-- Recréer la fonction avec search_path vide et noms de tables explicites
CREATE OR REPLACE FUNCTION public.sync_documents_sent()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public."ClientProduitEligible" cpe
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
        FROM public."ClientProcessDocument" cpd
        WHERE cpd.client_id = cpe."clientId" 
        AND cpd.produit_id = cpe."produitId"
    )
    WHERE cpe."clientId" = NEW.client_id 
    AND cpe."produitId" = NEW.produit_id;
    
    RETURN NEW;
END;
$$;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_sync_documents_sent ON public."ClientProcessDocument";

CREATE TRIGGER trigger_sync_documents_sent
AFTER INSERT OR UPDATE OR DELETE ON public."ClientProcessDocument"
FOR EACH ROW
EXECUTE FUNCTION public.sync_documents_sent();

-- Commentaire
COMMENT ON FUNCTION public.sync_documents_sent() IS 
'Synchronise les documents de ClientProcessDocument vers documents_sent dans ClientProduitEligible. Utilise search_path vide pour sécurité.';
