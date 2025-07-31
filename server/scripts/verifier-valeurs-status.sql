-- =====================================================
-- VÉRIFICATION DES VALEURS DE STATUT AUTORISÉES
-- Date : 2025-01-05
-- Objectif : Identifier les valeurs de statut valides pour simulations
-- =====================================================

-- ===== 1. VÉRIFICATION DES VALEURS DE STATUT EXISTANTES =====
SELECT 
    'Valeurs de statut existantes' as info,
    status,
    COUNT(*) as count
FROM simulations 
GROUP BY status 
ORDER BY status;

-- ===== 2. VÉRIFICATION DES TYPES DE SIMULATION =====
SELECT 
    'Types de simulation existants' as info,
    type,
    COUNT(*) as count
FROM simulations 
GROUP BY type 
ORDER BY type;

-- ===== 3. VÉRIFICATION DE LA CONTRAINTE DE VÉRIFICATION =====
SELECT 
    'Contrainte de vérification' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'simulations'::regclass 
AND contype = 'c'
AND conname = 'simulations_unified_status_check';

-- ===== 4. VÉRIFICATION DES DONNÉES RÉCENTES =====
SELECT 
    'Données récentes' as info,
    id,
    status,
    type,
    created_at
FROM simulations 
ORDER BY created_at DESC 
LIMIT 5;

-- ===== 5. VÉRIFICATION DES COLONNES OBLIGATOIRES =====
SELECT 
    'Colonnes obligatoires' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'simulations'
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- ===== 6. RECOMMANDATIONS POUR LE TEST =====
SELECT 
    'Recommandations pour le test' as info,
    'Utiliser une valeur de statut existante' as recommandation
UNION ALL
SELECT 
    'Recommandations pour le test',
    'Vérifier que toutes les colonnes obligatoires sont remplies'
UNION ALL
SELECT 
    'Recommandations pour le test',
    'Utiliser un session_token unique'
UNION ALL
SELECT 
    'Recommandations pour le test',
    'S''assurer que client_id existe dans la table Client'; 