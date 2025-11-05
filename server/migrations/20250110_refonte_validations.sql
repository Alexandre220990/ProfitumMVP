-- ============================================================================
-- MIGRATION : Refonte des validations Admin et Expert
-- Date: 2025-01-10
-- Objectif: Séparer clairement les validations avec des champs dédiés
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : SUPPRIMER LA CONTRAINTE CHECK SUR statut (si elle existe)
-- ============================================================================

-- Identifier et supprimer la contrainte CHECK qui bloque les nouveaux statuts
DO $$ 
BEGIN
    -- Vérifier si la contrainte existe
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = '"ClientProduitEligible"'::regclass 
        AND conname LIKE '%statut%check%'
    ) THEN
        -- Supprimer la contrainte
        ALTER TABLE "ClientProduitEligible" DROP CONSTRAINT IF EXISTS "ClientProduitEligible_statut_check";
        RAISE NOTICE 'Contrainte CHECK sur statut supprimée';
    END IF;
END $$;

-- ============================================================================
-- PARTIE 2 : AJOUTER LES NOUVEAUX CHAMPS
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
-- PARTIE 3 : MIGRER LES DONNÉES EXISTANTES
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
-- PARTIE 4 : NETTOYER LE CHAMP statut
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
-- Basé sur l'audit : 58 'eligible', 4 'en_cours', 2 'eligibility_validated', 1 'documents_manquants', 1 'documents_uploaded'
UPDATE "ClientProduitEligible"
SET statut = CASE
  -- 1. Documents manquants (1 dossier) → Expert a demandé des docs
  WHEN statut = 'documents_manquants' THEN 'documents_requested'
  
  -- 2. Documents uploaded (1 dossier) → Dépend de la validation admin
  WHEN statut = 'documents_uploaded' AND admin_eligibility_status = 'validated' THEN 'admin_validated'
  WHEN statut = 'documents_uploaded' AND admin_eligibility_status = 'pending' THEN 'pending_admin_validation'
  
  -- 3. Eligibility validated (2 dossiers) → Admin a validé, sélection expert en cours
  WHEN statut = 'eligibility_validated' AND expert_id IS NOT NULL THEN 'expert_assigned'
  WHEN statut = 'eligibility_validated' AND expert_pending_id IS NOT NULL THEN 'expert_pending_acceptance'
  WHEN statut = 'eligibility_validated' THEN 'admin_validated'
  
  -- 4. En cours (4 dossiers) → Dépend de l'expert assigné
  WHEN statut = 'en_cours' AND expert_id IS NOT NULL AND current_step >= 3 THEN 'expert_assigned'
  WHEN statut = 'en_cours' AND expert_id IS NOT NULL THEN 'expert_assigned'
  WHEN statut = 'en_cours' THEN 'admin_validated'
  
  -- 5. Eligible (58 dossiers - 88%) → La majorité, dépend de current_step
  WHEN statut = 'eligible' AND admin_eligibility_status = 'validated' AND expert_id IS NOT NULL THEN 'expert_assigned'
  WHEN statut = 'eligible' AND admin_eligibility_status = 'validated' THEN 'admin_validated'
  WHEN statut = 'eligible' AND current_step >= 1 THEN 'pending_admin_validation'
  WHEN statut = 'eligible' AND current_step = 0 THEN 'pending_upload'
  WHEN statut = 'eligible' THEN 'pending_admin_validation' -- Par défaut pour 'eligible'
  
  -- Par défaut : garder tel quel
  ELSE statut
END;

-- ============================================================================
-- PARTIE 5 : RECRÉER UNE CONTRAINTE CHECK ÉLARGIE (Optionnel)
-- ============================================================================

-- Créer une nouvelle contrainte CHECK avec tous les statuts autorisés
ALTER TABLE "ClientProduitEligible"
  ADD CONSTRAINT "ClientProduitEligible_statut_check_v2" CHECK (
    statut IN (
      -- Phase 1 : Upload et validation admin
      'pending_upload',
      'pending_admin_validation',
      'admin_validated',
      'admin_rejected',
      
      -- Phase 2 : Sélection expert
      'expert_selection',
      'expert_pending_acceptance',
      'expert_assigned',
      
      -- Phase 3 : Validation expert + docs
      'pending_expert_validation',
      'documents_requested',
      'documents_pending',
      'documents_completes',
      
      -- Phase 4+ : Suite workflow
      'audit_en_cours',
      'validation_finale',
      'demande_remboursement',
      'completed',
      'cancelled',
      
      -- Anciens statuts (compatibilité temporaire - de la contrainte originale)
      'opportunité',
      'eligible',
      'en_cours',
      'eligibility_validated',
      'eligibility_rejected',
      'documents_manquants',
      'documents_uploaded',
      'expert_assigned',
      'audit_en_cours',
      'audit_termine',
      'audit_rejected_by_client',
      'validated',
      'termine',
      'annule',
      'rejete'
    )
  );

-- ============================================================================
-- PARTIE 6 : NETTOYER LE METADATA (Optionnel - décommenter si souhaité)
-- ============================================================================

-- Supprimer les clés devenues redondantes (ATTENTION : à faire après vérification)
-- UPDATE "ClientProduitEligible"
-- SET metadata = metadata - 'eligibility_validation' - 'validation_state' - 'eligible_validated_at'
-- WHERE metadata IS NOT NULL;

-- ============================================================================
-- PARTIE 7 : CRÉER LES INDEX
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
-- PARTIE 8 : AJOUTER LES COMMENTAIRES
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
-- PARTIE 9 : VÉRIFICATIONS POST-MIGRATION
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
  current_step,
  TO_CHAR(eligibility_validated_at, 'YYYY-MM-DD') as date_admin,
  TO_CHAR(expert_validated_at, 'YYYY-MM-DD') as date_expert
FROM "ClientProduitEligible"
ORDER BY updated_at DESC
LIMIT 10;

-- Vérifier les 4 dossiers critiques identifiés dans l'audit
SELECT 
  id,
  metadata->'old_statut' as ancien_statut,
  statut as nouveau_statut,
  admin_eligibility_status,
  expert_validation_status,
  current_step,
  TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI') as derniere_maj
FROM "ClientProduitEligible"
WHERE id IN (
  'ffddb8df-4182-4447-8a43-3944bb85d976', -- documents_manquants
  '57f606c7-00a6-40f0-bb72-ae1831345d99', -- documents_uploaded
  'ba8e69b4-2837-42b1-8163-01f8612ff1c0', -- eligibility_validated
  '4f14164f-d6ca-4d82-bf43-cd4953c88f2d'  -- eligibility_validated
)
ORDER BY updated_at DESC;

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

