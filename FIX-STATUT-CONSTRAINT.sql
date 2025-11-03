-- ============================================================================
-- FIX : Mise à jour contrainte CHECK pour les nouveaux statuts workflow
-- ============================================================================
-- Date : 3 novembre 2024
-- Problème : Contrainte CHECK trop restrictive, empêche l'utilisation des 
--            nouveaux statuts du workflow (documents_uploaded, etc.)
-- ============================================================================

-- 1. Supprimer les anciennes contraintes CHECK
ALTER TABLE "ClientProduitEligible" 
DROP CONSTRAINT IF EXISTS "ClientProduitEligible_statut_check";

ALTER TABLE "ClientProduitEligible" 
DROP CONSTRAINT IF EXISTS "client_produit_eligible_statut_check";

-- 2. Créer la nouvelle contrainte CHECK avec TOUS les statuts du workflow
ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "ClientProduitEligible_statut_check" 
CHECK (statut = ANY (ARRAY[
  -- Statuts originaux
  'eligible'::text,
  'ineligible'::text,
  'non_eligible'::text,
  'en_cours'::text,
  'termine'::text,
  'annule'::text,
  -- Nouveaux statuts workflow (6 étapes)
  'documents_uploaded'::text,
  'eligibility_validated'::text,
  'eligibility_refused'::text,
  'expert_pending_acceptance'::text,
  'documents_complementaires_requis'::text,
  'documents_complementaires_soumis'::text,
  'audit_in_progress'::text,
  'audit_completed'::text,
  'audit_rejected_by_client'::text,
  'validated'::text,
  'demande_envoyee'::text,
  'demande_preparation'::text
]));

-- 3. Vérifier la nouvelle contrainte
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'ClientProduitEligible' 
AND contype = 'c'
AND conname LIKE '%statut%';

-- 4. Tester avec un UPDATE (à commenter après test)
-- UPDATE "ClientProduitEligible" 
-- SET statut = 'documents_uploaded' 
-- WHERE id = '57f606c7-00a6-40f0-bb72-ae1831345d99';

COMMIT;

