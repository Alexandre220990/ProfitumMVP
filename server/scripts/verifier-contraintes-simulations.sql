-- =====================================================
-- VÉRIFICATION DES CONTRAINTES SIMULATIONS
-- Date : 2025-01-05
-- Objectif : Vérifier les contraintes et valeurs autorisées
-- =====================================================

-- ===== 1. VÉRIFICATION DES CONTRAINTES DE VÉRIFICATION =====
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'simulations'::regclass 
AND contype = 'c';

-- ===== 2. VÉRIFICATION DES VALEURS DE STATUT EXISTANTES =====
SELECT DISTINCT 
    status,
    COUNT(*) as count
FROM simulations 
GROUP BY status 
ORDER BY status;

-- ===== 3. VÉRIFICATION DES TYPES DE SIMULATION =====
SELECT DISTINCT 
    type,
    COUNT(*) as count
FROM simulations 
GROUP BY type 
ORDER BY type;

-- ===== 4. VÉRIFICATION DE LA STRUCTURE COMPLÈTE =====
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'simulations'
ORDER BY ordinal_position;

-- ===== 5. VÉRIFICATION DES CONTRAINTES DE CLÉS =====
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'simulations'
AND tc.table_schema = 'public'; 