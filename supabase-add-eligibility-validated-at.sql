-- ============================================================================
-- SCRIPT DE MIGRATION : Ajout de la colonne eligibility_validated_at
-- Table : ClientProduitEligible
-- Date : 2025-11-03
-- Description : Ajoute un champ pour tracker la date de validation d'éligibilité
-- ============================================================================

-- 1. Ajouter la colonne eligibility_validated_at (nullable)
ALTER TABLE "ClientProduitEligible" 
ADD COLUMN IF NOT EXISTS "eligibility_validated_at" TIMESTAMP WITH TIME ZONE;

-- 2. Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN "ClientProduitEligible"."eligibility_validated_at" IS 
'Date et heure de validation définitive de l''éligibilité par l''admin. NULL = pas encore validé.';

-- 3. (Optionnel) Créer un index pour optimiser les requêtes par date de validation
CREATE INDEX IF NOT EXISTS "idx_eligibility_validated_at" 
ON "ClientProduitEligible" ("eligibility_validated_at") 
WHERE "eligibility_validated_at" IS NOT NULL;

-- 4. (Optionnel) Mettre à jour les dossiers déjà validés avec la date de dernière modification
-- Décommentez cette ligne si vous voulez rétroactivement remplir la colonne pour les dossiers validés
-- UPDATE "ClientProduitEligible" 
-- SET "eligibility_validated_at" = "updated_at" 
-- WHERE "statut" IN ('validated', 'in_progress', 'completed') 
-- AND "eligibility_validated_at" IS NULL;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que la colonne a bien été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible' 
AND column_name = 'eligibility_validated_at';

-- Compter les dossiers avec/sans date de validation
SELECT 
    COUNT(*) as total_dossiers,
    COUNT("eligibility_validated_at") as dossiers_valides,
    COUNT(*) - COUNT("eligibility_validated_at") as dossiers_non_valides
FROM "ClientProduitEligible";

