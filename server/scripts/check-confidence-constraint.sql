-- =====================================================
-- VÉRIFICATION DE LA CONTRAINTE CONFIDENCE_LEVEL
-- Date: 2025-01-30
-- =====================================================

-- Vérifier la contrainte exacte
SELECT 
    'Contrainte confidence_level' as section,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'SimulatorEligibility_confidence_level_check';

-- Vérifier les valeurs existantes dans la table
SELECT 
    'Valeurs confidence_level existantes' as section,
    confidence_level,
    COUNT(*) as nombre_occurrences
FROM "SimulatorEligibility" 
WHERE confidence_level IS NOT NULL
GROUP BY confidence_level
ORDER BY confidence_level; 