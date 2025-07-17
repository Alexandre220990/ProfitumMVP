-- =====================================================
-- VÉRIFICATION DE LA STRUCTURE DE LA TABLE
-- Date: 2025-01-07
-- =====================================================

-- 1. Vérifier si la table existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'QuestionnaireQuestion';

-- 2. Voir la structure actuelle de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'QuestionnaireQuestion'
ORDER BY ordinal_position;

-- 3. Voir quelques données existantes
SELECT * FROM "public"."QuestionnaireQuestion" LIMIT 5; 