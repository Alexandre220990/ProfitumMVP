-- ============================================================================
-- Migration : Création de la table audit_documents pour les documents du rapport d'audit
-- Date: 2025-01-16
-- ============================================================================
-- 
-- Cette migration crée une table dédiée pour stocker les documents joints
-- au rapport d'audit par l'expert. Chaque document est lié à un dossier
-- (ClientProduitEligible) et peut être consulté par le client et l'admin.
--
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Créer la table audit_documents
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "audit_documents" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_produit_eligible_id UUID NOT NULL REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
    
    -- Informations du document
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER, -- Taille en octets
    file_type TEXT, -- MIME type (ex: application/pdf, image/png)
    
    -- Métadonnées
    description TEXT, -- Description optionnelle du document
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index et contraintes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Créer les index pour les performances
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_documents_client_produit_eligible_id 
    ON "audit_documents"(client_produit_eligible_id);

CREATE INDEX IF NOT EXISTS idx_audit_documents_expert_id 
    ON "audit_documents"(expert_id);

CREATE INDEX IF NOT EXISTS idx_audit_documents_uploaded_at 
    ON "audit_documents"(uploaded_at DESC);

-- ----------------------------------------------------------------------------
-- 3. Ajouter les commentaires
-- ----------------------------------------------------------------------------
COMMENT ON TABLE "audit_documents" IS 'Documents joints au rapport d''audit par l''expert. Visibles par le client et l''admin.';
COMMENT ON COLUMN "audit_documents".client_produit_eligible_id IS 'Référence au dossier (ClientProduitEligible)';
COMMENT ON COLUMN "audit_documents".expert_id IS 'Expert qui a uploadé le document';
COMMENT ON COLUMN "audit_documents".file_url IS 'URL du fichier stocké (Supabase Storage)';
COMMENT ON COLUMN "audit_documents".description IS 'Description optionnelle du document';

-- ----------------------------------------------------------------------------
-- 4. Créer un trigger pour mettre à jour updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_audit_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_audit_documents_updated_at
    BEFORE UPDATE ON "audit_documents"
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_documents_updated_at();

COMMIT;

