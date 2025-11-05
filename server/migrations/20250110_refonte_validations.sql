-- ============================================================================
-- MIGRATION : Refonte des validations Admin et Expert
-- Date: 2025-01-10
-- Objectif: Séparer clairement les validations avec des champs dédiés
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : AJOUTER LES NOUVEAUX CHAMPS
-- ============================================================================

-- Validation Admin
ALTER TABLE "ClientProduitEligible"
  ADD COLUMN IF NOT EXISTS admin_eligibility_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_validated_by UUID REFERENCES "Admin"(id);

-- Validation Expert  
ALTER TABLE "ClientProduitEligible"
  ADD COLUMN IF NOT EXISTS expert_validation_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS expert_validated_at TIMESTAMP WITH TIME ZONE;

-- Note: eligibility_validated_at, pre_eligibility_validated_at, validation_admin_notes existent déjà

-- ============================================================================
-- PARTIE 2 : MIGRER LES DONNÉES EXISTANTES
-- ============================================================================

-- 2.1 Migrer validation ADMIN depuis metadata vers les colonnes dédiées
UPDATE "ClientProduitEligible"
SET 
  admin_eligibility_status = CASE
    WHEN metadata->'eligibility_validation'->>'status' = 'validated' THEN 'validated'
    WHEN metadata->'eligibility_validation'->>'status' = 'rejected' THEN 'rejected'
    ELSE 'pending'
  END,
  eligibility_validated_at = CASE
    WHEN metadata->'eligibility_validation'->>'validated_at' IS NOT NULL 
    THEN (metadata->'eligibility_validation'->>'validated_at')::TIMESTAMP WITH TIME ZONE
    ELSE eligibility_validated_at
  END,
  admin_validated_by = CASE
    WHEN metadata->'eligibility_validation'->>'validated_by' IS NOT NULL 
    THEN (metadata->'eligibility_validation'->>'validated_by')::UUID
    ELSE NULL
  END,
  validation_admin_notes = COALESCE(
    metadata->'eligibility_validation'->>'notes',
    validation_admin_notes
  )
WHERE metadata->'eligibility_validation' IS NOT NULL;

-- 2.2 Migrer validation EXPERT depuis metadata
UPDATE "ClientProduitEligible"
SET 
  expert_validation_status = CASE
    WHEN metadata->>'validation_state' = 'eligibility_validated' THEN 'validated'
    WHEN metadata->>'validation_state' = 'rejected' THEN 'rejected'
    WHEN metadata->>'validation_state' = 'pending_expert_validation' THEN 'pending'
    ELSE 'pending'
  END,
  expert_validated_at = CASE
    WHEN metadata->>'eligible_validated_at' IS NOT NULL 
    THEN (metadata->>'eligible_validated_at')::TIMESTAMP WITH TIME ZONE
    ELSE NULL
  END
WHERE metadata->>'validation_state' IS NOT NULL;

-- 2.3 Mettre à jour admin_eligibility_status basé sur le statut actuel (pour les anciens dossiers)
UPDATE "ClientProduitEligible"
SET admin_eligibility_status = 'validated'
WHERE statut IN ('eligibility_validated', 'documents_uploaded', 'documents_manquants')
  AND admin_eligibility_status = 'pending';

-- ============================================================================
-- PARTIE 3 : NETTOYER LE CHAMP statut
-- ============================================================================

-- Créer une sauvegarde de l'ancien statut dans metadata
UPDATE "ClientProduitEligible"
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{old_statut}',
  to_jsonb(statut)
)
WHERE statut IS NOT NULL;

-- Mapper les anciens statuts vers les nouveaux statuts clarifiés
UPDATE "ClientProduitEligible"
SET statut = CASE
  -- Statuts clairs à conserver
  WHEN statut = 'documents_manquants' THEN 'documents_requested'
  WHEN statut = 'documents_uploaded' AND admin_eligibility_status = 'pending' THEN 'pending_admin_validation'
  WHEN statut = 'documents_uploaded' AND admin_eligibility_status = 'validated' THEN 'admin_validated'
  WHEN statut = 'eligibility_validated' THEN 'admin_validated'
  WHEN statut = 'en_cours' AND expert_id IS NOT NULL THEN 'expert_assigned'
  WHEN statut = 'en_cours' AND expert_id IS NULL THEN 'admin_validated'
  
  -- Statuts ambigus à clarifier
  WHEN statut = 'eligible' AND admin_eligibility_status = 'validated' THEN 'admin_validated'
  WHEN statut = 'eligible' AND admin_eligibility_status = 'pending' AND current_step >= 1 THEN 'pending_admin_validation'
  WHEN statut = 'eligible' THEN 'pending_upload'
  
  -- Par défaut
  ELSE statut
END;

-- ============================================================================
-- PARTIE 4 : NETTOYER LE METADATA (Optionnel - décommenter si souhaité)
-- ============================================================================

-- Supprimer les clés devenues redondantes (ATTENTION : à faire après vérification)
-- UPDATE "ClientProduitEligible"
-- SET metadata = metadata - 'eligibility_validation' - 'validation_state' - 'eligible_validated_at'
-- WHERE metadata IS NOT NULL;

-- ============================================================================
-- PARTIE 5 : CRÉER LES INDEX
-- ============================================================================

-- Index pour les nouveaux champs
CREATE INDEX IF NOT EXISTS idx_cpe_admin_eligibility_status 
  ON "ClientProduitEligible"(admin_eligibility_status);

CREATE INDEX IF NOT EXISTS idx_cpe_expert_validation_status 
  ON "ClientProduitEligible"(expert_validation_status);

CREATE INDEX IF NOT EXISTS idx_cpe_admin_validated_by 
  ON "ClientProduitEligible"(admin_validated_by) 
  WHERE admin_validated_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cpe_expert_validated_at 
  ON "ClientProduitEligible"(expert_validated_at) 
  WHERE expert_validated_at IS NOT NULL;

-- ============================================================================
-- PARTIE 6 : AJOUTER LES COMMENTAIRES
-- ============================================================================

COMMENT ON COLUMN "ClientProduitEligible".admin_eligibility_status IS 
  'Statut validation admin de l''éligibilité (pending/validated/rejected)';

COMMENT ON COLUMN "ClientProduitEligible".admin_validated_by IS 
  'ID de l''admin qui a validé l''éligibilité';

COMMENT ON COLUMN "ClientProduitEligible".expert_validation_status IS 
  'Statut validation expert des documents (pending/validated/rejected/documents_requested)';

COMMENT ON COLUMN "ClientProduitEligible".expert_validated_at IS 
  'Date de validation des documents par l''expert';

COMMENT ON COLUMN "ClientProduitEligible".statut IS 
  'Statut global du dossier - Valeurs: pending_upload, pending_admin_validation, admin_validated, admin_rejected, expert_assigned, documents_requested, documents_completes, audit_en_cours, completed, cancelled';

-- ============================================================================
-- PARTIE 7 : VÉRIFICATIONS POST-MIGRATION
-- ============================================================================

-- Compter les dossiers par statut admin
SELECT 
  admin_eligibility_status,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM "ClientProduitEligible"
GROUP BY admin_eligibility_status
ORDER BY COUNT(*) DESC;

-- Compter les dossiers par statut expert
SELECT 
  expert_validation_status,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM "ClientProduitEligible"
GROUP BY expert_validation_status
ORDER BY COUNT(*) DESC;

-- Vérifier les nouveaux statuts globaux
SELECT 
  statut,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM "ClientProduitEligible"
GROUP BY statut
ORDER BY COUNT(*) DESC;

-- Vérifier que les validations admin sont cohérentes
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN admin_eligibility_status = 'validated' AND eligibility_validated_at IS NOT NULL THEN 1 END) as validated_avec_date,
  COUNT(CASE WHEN admin_eligibility_status = 'validated' AND eligibility_validated_at IS NULL THEN 1 END) as validated_sans_date,
  COUNT(CASE WHEN admin_eligibility_status = 'validated' AND admin_validated_by IS NOT NULL THEN 1 END) as validated_avec_admin
FROM "ClientProduitEligible";

-- Échantillon de dossiers après migration
SELECT 
  id,
  statut as statut_global,
  admin_eligibility_status,
  expert_validation_status,
  CASE WHEN expert_id IS NOT NULL THEN '✓' ELSE '✗' END as expert_assigne,
  TO_CHAR(eligibility_validated_at, 'YYYY-MM-DD') as date_admin,
  TO_CHAR(expert_validated_at, 'YYYY-MM-DD') as date_expert
FROM "ClientProduitEligible"
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================================================
-- ROLLBACK (En cas de problème - NE PAS EXÉCUTER SAUF SI NÉCESSAIRE)
-- ============================================================================
/*
-- Restaurer l'ancien statut depuis metadata
UPDATE "ClientProduitEligible"
SET statut = metadata->>'old_statut'
WHERE metadata->>'old_statut' IS NOT NULL;

-- Supprimer les colonnes ajoutées
ALTER TABLE "ClientProduitEligible"
  DROP COLUMN IF EXISTS admin_eligibility_status,
  DROP COLUMN IF EXISTS admin_validated_by,
  DROP COLUMN IF EXISTS expert_validation_status,
  DROP COLUMN IF EXISTS expert_validated_at;

-- Supprimer les index
DROP INDEX IF EXISTS idx_cpe_admin_eligibility_status;
DROP INDEX IF EXISTS idx_cpe_expert_validation_status;
DROP INDEX IF EXISTS idx_cpe_admin_validated_by;
DROP INDEX IF EXISTS idx_cpe_expert_validated_at;
*/

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

SELECT 
  '✅ Migration terminée avec succès !' as statut,
  NOW() as horodatage;

