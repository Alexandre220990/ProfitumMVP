-- ============================================================================
-- SCRIPT DE MIGRATION : Ajout des colonnes de validation manquantes
-- Table : ClientProduitEligible
-- Date : 2025-11-03
-- Description : Ajoute les colonnes pour tracker les validations à différentes étapes
-- ============================================================================

-- 1. Ajouter eligibility_validated_at (validation finale d'éligibilité)
ALTER TABLE "ClientProduitEligible" 
ADD COLUMN IF NOT EXISTS "eligibility_validated_at" TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN "ClientProduitEligible"."eligibility_validated_at" IS 
'Date et heure de validation définitive de l''éligibilité par l''admin. NULL = pas encore validé.';

-- 2. Ajouter pre_eligibility_validated_at (validation de pré-éligibilité)
ALTER TABLE "ClientProduitEligible" 
ADD COLUMN IF NOT EXISTS "pre_eligibility_validated_at" TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN "ClientProduitEligible"."pre_eligibility_validated_at" IS 
'Date et heure de validation de la pré-éligibilité (étape avant validation finale). NULL = pas encore validé.';

-- 3. Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS "idx_eligibility_validated_at" 
ON "ClientProduitEligible" ("eligibility_validated_at") 
WHERE "eligibility_validated_at" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_pre_eligibility_validated_at" 
ON "ClientProduitEligible" ("pre_eligibility_validated_at") 
WHERE "pre_eligibility_validated_at" IS NOT NULL;

-- 4. (Optionnel) Remplir rétroactivement pour les dossiers déjà validés
-- Décommentez ces lignes si vous voulez rétroactivement remplir les colonnes

-- Pour pre_eligibility_validated_at (dossiers avec documents uploadés)
-- UPDATE "ClientProduitEligible" 
-- SET "pre_eligibility_validated_at" = "updated_at" 
-- WHERE "statut" IN ('documents_uploaded', 'eligible_confirmed', 'validated', 'in_progress', 'completed') 
-- AND "pre_eligibility_validated_at" IS NULL;

-- Pour eligibility_validated_at (dossiers complètement validés)
-- UPDATE "ClientProduitEligible" 
-- SET "eligibility_validated_at" = "updated_at" 
-- WHERE "statut" IN ('validated', 'in_progress', 'completed') 
-- AND "eligibility_validated_at" IS NULL;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que les colonnes ont bien été ajoutées
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible' 
AND column_name IN ('eligibility_validated_at', 'pre_eligibility_validated_at')
ORDER BY column_name;

-- Compter les dossiers avec/sans dates de validation
SELECT 
    COUNT(*) as total_dossiers,
    COUNT("pre_eligibility_validated_at") as pre_eligibility_valides,
    COUNT("eligibility_validated_at") as eligibility_valides,
    COUNT(*) - COUNT("pre_eligibility_validated_at") as pre_eligibility_non_valides,
    COUNT(*) - COUNT("eligibility_validated_at") as eligibility_non_valides
FROM "ClientProduitEligible";

-- Afficher quelques exemples de dossiers
SELECT 
    id,
    statut,
    pre_eligibility_validated_at,
    eligibility_validated_at,
    created_at,
    updated_at
FROM "ClientProduitEligible"
ORDER BY created_at DESC
LIMIT 5;

