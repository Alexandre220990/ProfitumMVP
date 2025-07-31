-- =====================================================
-- VÉRIFICATION DES CONTRAINTES TYPE SIMULATIONS
-- Date : 2025-01-05
-- Objectif : Vérifier les valeurs autorisées pour le champ type
-- =====================================================

-- ===== 1. VÉRIFICATION DE LA CONTRAINTE TYPE =====
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'simulations'::regclass 
AND contype = 'c'
AND conname LIKE '%type%';

-- ===== 2. VÉRIFICATION DES VALEURS DE TYPE EXISTANTES =====
SELECT DISTINCT 
    type,
    COUNT(*) as count
FROM simulations 
WHERE type IS NOT NULL
GROUP BY type 
ORDER BY type;

-- ===== 3. VÉRIFICATION DES VALEURS DE STATUT EXISTANTES =====
SELECT DISTINCT 
    status,
    COUNT(*) as count
FROM simulations 
WHERE status IS NOT NULL
GROUP BY status 
ORDER BY status;

-- ===== 4. VÉRIFICATION DE LA STRUCTURE COMPLÈTE =====
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'simulations'
AND column_name IN ('type', 'status')
ORDER BY ordinal_position;

-- ===== 5. RECOMMANDATIONS =====
SELECT 
    'Utiliser une valeur de type existante' as recommandation
UNION ALL
SELECT 
    'Utiliser une valeur de statut existante'
UNION ALL
SELECT 
    'Vérifier les contraintes de vérification avant insertion'; 