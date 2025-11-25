-- ============================================================================
-- SCRIPT SQL : SUPPRIMER LES COLONNES category ET type DE LA TABLE RDV
-- ============================================================================
-- Objectif : Rendre category et type optionnels/nullables dans la table RDV
-- Date : 25 Novembre 2025
-- ============================================================================

BEGIN;

-- 1️⃣ VÉRIFIER LA STRUCTURE ACTUELLE
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'RDV'
  AND column_name IN ('category', 'type')
ORDER BY ordinal_position;

-- 2️⃣ SUPPRIMER LES CONTRAINTES CHECK SI ELLES EXISTENT
-- ============================================================================
-- Supprimer la contrainte CHECK sur category si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%category%' 
        AND table_name = 'RDV'
    ) THEN
        ALTER TABLE "RDV" DROP CONSTRAINT IF EXISTS rdv_category_check;
    END IF;
END $$;

-- Supprimer la contrainte CHECK sur type si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%type%' 
        AND table_name = 'RDV'
    ) THEN
        ALTER TABLE "RDV" DROP CONSTRAINT IF EXISTS rdv_type_check;
    END IF;
END $$;

-- 3️⃣ RENDRE LES COLONNES NULLABLES
-- ============================================================================
-- Rendre category nullable (si elle ne l'est pas déjà)
ALTER TABLE "RDV" 
  ALTER COLUMN category DROP NOT NULL;

-- Note : La colonne 'type' n'existe probablement pas dans RDV
-- (elle est dans metadata.event_type). On vérifie d'abord :
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'RDV' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE "RDV" ALTER COLUMN type DROP NOT NULL;
    END IF;
END $$;

-- 4️⃣ METTRE À JOUR LES VALEURS NULL EXISTANTES (optionnel)
-- ============================================================================
-- Si des valeurs NULL existent, on peut les laisser telles quelles
-- ou les remplacer par une valeur par défaut si nécessaire

-- 5️⃣ VÉRIFIER LA STRUCTURE FINALE
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'RDV'
  AND column_name IN ('category', 'type')
ORDER BY ordinal_position;

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
-- - La colonne 'category' devient nullable
-- - La colonne 'type' n'existe probablement pas dans RDV (utilisée dans metadata)
-- - Les contraintes CHECK sont supprimées pour permettre toute valeur
-- - Les valeurs existantes ne sont pas modifiées

