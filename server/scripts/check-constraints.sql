-- =====================================================
-- VÉRIFICATION DES CONTRAINTES DE LA TABLE
-- Date: 2025-01-30
-- =====================================================

-- Vérifier les contraintes de la table SimulatorEligibility
SELECT 
    'Contraintes SimulatorEligibility' as section,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = '"SimulatorEligibility"'::regclass;

-- Vérifier la structure de la table
SELECT 
    'Structure SimulatorEligibility' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'SimulatorEligibility' 
AND table_schema = 'public'
ORDER BY ordinal_position; 