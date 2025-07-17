-- =====================================================
-- VÉRIFICATION DE LA CONTRAINTE PHASE
-- Date: 2025-01-07
-- =====================================================

-- 1. Voir les contraintes sur la table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.QuestionnaireQuestion'::regclass;

-- 2. Voir la définition de la colonne phase
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'QuestionnaireQuestion' 
AND column_name = 'phase';

-- 3. Voir quelques valeurs existantes de phase
SELECT DISTINCT phase FROM "public"."QuestionnaireQuestion" ORDER BY phase; 