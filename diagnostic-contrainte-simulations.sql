-- ============================================================================
-- DIAGNOSTIC CONTRAINTE simulations_unified_type_check
-- ============================================================================

-- 1. Voir la définition de la contrainte
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'simulations'::regclass 
AND conname = 'simulations_unified_type_check';

-- 2. Voir toutes les contraintes CHECK sur simulations
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'simulations'::regclass 
AND contype = 'c';

-- 3. Structure complète de la table simulations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'simulations'
ORDER BY ordinal_position;

-- 4. Valeurs de type existantes
SELECT DISTINCT 
    type,
    COUNT(*) as count
FROM simulations 
GROUP BY type;

