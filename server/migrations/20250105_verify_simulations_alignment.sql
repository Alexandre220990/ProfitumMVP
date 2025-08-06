-- ============================================================================
-- VÉRIFICATION ALIGNEMENT TABLE SIMULATIONS
-- ============================================================================

-- 1. Structure de la table simulations
SELECT 
    'STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'simulations'
ORDER BY ordinal_position;

-- 2. Contraintes de la table simulations
SELECT 
    'CONSTRAINTS' as check_type,
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'simulations'
ORDER BY tc.constraint_name;

-- 3. Données d'exemple dans simulations
SELECT 
    'SAMPLE_DATA' as check_type,
    id,
    client_id,
    type,
    status,
    created_at,
    updated_at
FROM simulations 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Vérifier les valeurs uniques pour les colonnes importantes
SELECT 
    'UNIQUE_VALUES' as check_type,
    'type' as column_name,
    type as value,
    COUNT(*) as count
FROM simulations 
GROUP BY type

UNION ALL

SELECT 
    'UNIQUE_VALUES' as check_type,
    'status' as column_name,
    status as value,
    COUNT(*) as count
FROM simulations 
GROUP BY status

ORDER BY column_name, count DESC; 