-- ============================================================================
-- MIGRATION : Ajout statuts workflow facturation
-- Date: 2025-11-05
-- Objectif: Ajouter les nouveaux statuts pour le workflow complet
-- ============================================================================

-- Ajouter les nouveaux statuts au CHECK constraint
-- On drop et recrée la contrainte avec tous les statuts (anciens + nouveaux)

DO $$ 
BEGIN
  -- Supprimer la contrainte existante si elle existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ClientProduitEligible_statut_check'
  ) THEN
    ALTER TABLE "ClientProduitEligible" 
      DROP CONSTRAINT "ClientProduitEligible_statut_check";
    RAISE NOTICE 'Contrainte existante supprimée';
  END IF;

  -- Recréer avec tous les statuts (anciens + nouveaux)
  ALTER TABLE "ClientProduitEligible"
    ADD CONSTRAINT "ClientProduitEligible_statut_check"
    CHECK (statut IN (
      -- Statuts existants
      'opportunité',
      'eligible',
      'en_cours',
      'documents_uploaded',
      'documents_manquants',
      'eligibility_validated',
      'eligibility_rejected',
      'pending_upload',
      'admin_validated',
      'admin_rejected',
      'expert_selection',
      'expert_assigned',
      'expert_accepted',
      'expert_rejected',
      'documents_requested',
      'documents_completes',
      'pending_admin_validation',
      'validated',
      'rejected',
      'audit_completed',
      'audit_rejected_by_client',
      'pending_client_validation',
      -- NOUVEAUX STATUTS WORKFLOW FACTURATION
      'validation_finale',      -- Client a validé l'audit
      'soumis_administration',  -- Expert a soumis le dossier
      'pending_result',         -- En attente résultat administration
      'resultat_obtenu',        -- Expert a saisi le résultat final
      'completed'               -- Dossier finalisé (client a confirmé réception)
    ));

  RAISE NOTICE 'Nouveaux statuts workflow ajoutés avec succès';
END $$;

-- Ajouter des index pour les nouveaux statuts
CREATE INDEX IF NOT EXISTS idx_clientproduit_validation_finale 
  ON "ClientProduitEligible"(statut) 
  WHERE statut = 'validation_finale';

CREATE INDEX IF NOT EXISTS idx_clientproduit_soumis_administration 
  ON "ClientProduitEligible"(statut) 
  WHERE statut = 'soumis_administration';

CREATE INDEX IF NOT EXISTS idx_clientproduit_resultat_obtenu 
  ON "ClientProduitEligible"(statut) 
  WHERE statut = 'resultat_obtenu';

CREATE INDEX IF NOT EXISTS idx_clientproduit_completed 
  ON "ClientProduitEligible"(statut) 
  WHERE statut = 'completed';

-- Ajouter commentaires pour documenter les nouveaux statuts
COMMENT ON COLUMN "ClientProduitEligible".statut IS 
  'Statut du dossier dans le workflow. Nouveaux statuts facturation: validation_finale, soumis_administration, resultat_obtenu, completed';

-- Log de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès';
  RAISE NOTICE '📊 Nouveaux statuts disponibles:';
  RAISE NOTICE '  - validation_finale: Client a validé l''audit';
  RAISE NOTICE '  - soumis_administration: Expert a soumis à l''administration';
  RAISE NOTICE '  - pending_result: En attente résultat';
  RAISE NOTICE '  - resultat_obtenu: Résultat saisi + facture générée';
  RAISE NOTICE '  - completed: Dossier finalisé';
END $$;

