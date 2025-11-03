-- ============================================================================
-- SCRIPT DE MIGRATION : Ajout de la colonne expert_report_status
-- Table : ClientProduitEligible
-- Date : 2025-11-03
-- Description : Ajoute un champ pour tracker le statut du rapport d'expert
-- ============================================================================

-- 1. Ajouter la colonne expert_report_status
ALTER TABLE "ClientProduitEligible" 
ADD COLUMN IF NOT EXISTS "expert_report_status" VARCHAR(50);

-- 2. Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN "ClientProduitEligible"."expert_report_status" IS 
'Statut du rapport d''expert : pending, in_progress, completed, validated, rejected. NULL = pas de rapport demandé.';

-- 3. Créer un index pour optimiser les requêtes par statut de rapport
CREATE INDEX IF NOT EXISTS "idx_expert_report_status" 
ON "ClientProduitEligible" ("expert_report_status") 
WHERE "expert_report_status" IS NOT NULL;

-- 4. (Optionnel) Définir une contrainte CHECK pour limiter les valeurs possibles
-- Décommentez cette ligne si vous voulez restreindre les valeurs autorisées
-- ALTER TABLE "ClientProduitEligible"
-- ADD CONSTRAINT "check_expert_report_status" 
-- CHECK ("expert_report_status" IS NULL OR "expert_report_status" IN (
--   'pending', 'in_progress', 'completed', 'validated', 'rejected'
-- ));

-- 5. (Optionnel) Mettre à jour les dossiers avec un expert assigné
-- Décommentez cette ligne si vous voulez initialiser le statut pour les dossiers existants
-- UPDATE "ClientProduitEligible" 
-- SET "expert_report_status" = 'pending' 
-- WHERE "expert_id" IS NOT NULL 
-- AND "expert_report_status" IS NULL;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que la colonne a bien été ajoutée
SELECT column_name, data_type, is_nullable, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible' 
AND column_name = 'expert_report_status';

-- Compter les dossiers par statut de rapport
SELECT 
    COUNT(*) as total_dossiers,
    COUNT("expert_report_status") as avec_statut_rapport,
    COUNT(*) - COUNT("expert_report_status") as sans_statut_rapport
FROM "ClientProduitEligible";

-- Distribution des statuts de rapport
SELECT 
    "expert_report_status",
    COUNT(*) as nombre_dossiers
FROM "ClientProduitEligible"
GROUP BY "expert_report_status"
ORDER BY nombre_dossiers DESC;

-- Dossiers avec expert mais sans statut de rapport
SELECT 
    COUNT(*) as dossiers_avec_expert_sans_statut
FROM "ClientProduitEligible"
WHERE "expert_id" IS NOT NULL 
AND "expert_report_status" IS NULL;

