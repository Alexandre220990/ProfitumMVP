-- ============================================================================
-- VÉRIFICATION ALIGNEMENT TABLE SIMULATIONPROCESSED
-- ============================================================================

-- 1. Structure de la table SimulationProcessed
SELECT 
    'STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'SimulationProcessed'
ORDER BY ordinal_position;

-- 2. Contraintes de la table SimulationProcessed
SELECT 
    'CONSTRAINTS' as check_type,
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'SimulationProcessed'
ORDER BY tc.constraint_name;

-- 3. Données d'exemple dans SimulationProcessed
SELECT 
    'SAMPLE_DATA' as check_type,
    id,
    clientid,
    type,
    statut,
    createdat,
    updatedat
FROM "SimulationProcessed" 
ORDER BY createdat DESC 
LIMIT 5;

-- 4. Vérifier les valeurs uniques pour les colonnes importantes
SELECT 
    'UNIQUE_VALUES' as check_type,
    'type' as column_name,
    type as value,
    COUNT(*) as count
FROM "SimulationProcessed" 
GROUP BY type

UNION ALL

SELECT 
    'UNIQUE_VALUES' as check_type,
    'statut' as column_name,
    statut as value,
    COUNT(*) as count
FROM "SimulationProcessed" 
GROUP BY statut

ORDER BY column_name, count DESC; 