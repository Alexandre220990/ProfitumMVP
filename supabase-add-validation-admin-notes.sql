-- ============================================================================
-- SCRIPT DE MIGRATION : Ajout de la colonne validation_admin_notes
-- Table : ClientProduitEligible
-- Date : 2025-11-03
-- Description : Ajoute un champ pour les notes/commentaires de l'admin lors de la validation
-- ============================================================================

-- 1. Ajouter la colonne validation_admin_notes
ALTER TABLE "ClientProduitEligible" 
ADD COLUMN IF NOT EXISTS "validation_admin_notes" TEXT;

-- 2. Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN "ClientProduitEligible"."validation_admin_notes" IS 
'Notes et commentaires de l''admin lors de la validation du dossier. NULL = pas de notes.';

-- 3. Créer un index pour optimiser les recherches de dossiers avec notes
CREATE INDEX IF NOT EXISTS "idx_validation_admin_notes" 
ON "ClientProduitEligible" ("validation_admin_notes") 
WHERE "validation_admin_notes" IS NOT NULL;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que la colonne a bien été ajoutée
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible' 
AND column_name = 'validation_admin_notes';

-- Compter les dossiers avec/sans notes
SELECT 
    COUNT(*) as total_dossiers,
    COUNT("validation_admin_notes") as avec_notes,
    COUNT(*) - COUNT("validation_admin_notes") as sans_notes
FROM "ClientProduitEligible";

-- Voir quelques exemples de dossiers
SELECT 
    id,
    statut,
    validation_admin_notes,
    created_at,
    updated_at
FROM "ClientProduitEligible"
ORDER BY created_at DESC
LIMIT 5;

