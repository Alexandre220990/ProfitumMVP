-- =====================================================
-- CORRECTION DE LA CONTRAINTE PHASE (CORRIGÉ)
-- Date: 2025-01-07
-- =====================================================

-- 1. Voir toutes les contraintes sur la table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.QuestionnaireQuestion'::regclass;

-- 2. Supprimer la contrainte problématique sur phase
ALTER TABLE "public"."QuestionnaireQuestion" 
DROP CONSTRAINT IF EXISTS "QuestionnaireQuestion_phase_check";

-- 3. Vérifier que la contrainte a été supprimée
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.QuestionnaireQuestion'::regclass;

-- 4. Vérifier la structure actuelle
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'QuestionnaireQuestion'
ORDER BY ordinal_position; 