-- ============================================================================
-- SCRIPT DE VÉRIFICATION DE LA STRUCTURE DE LA BASE DE DONNÉES
-- ============================================================================
-- À copier-coller dans Supabase SQL Editor
-- Date : 1er octobre 2025
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFIER LA TABLE ProduitEligible
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'ProduitEligible'
ORDER BY 
    ordinal_position;

-- ============================================================================
-- 2. VÉRIFIER LA TABLE ApporteurAffaires
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'ApporteurAffaires'
ORDER BY 
    ordinal_position;

-- ============================================================================
-- 3. VÉRIFIER LA TABLE ClientProduitEligible
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'ClientProduitEligible'
ORDER BY 
    ordinal_position;

-- ============================================================================
-- 4. VÉRIFIER LA TABLE Client
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'Client'
ORDER BY 
    ordinal_position;

-- ============================================================================
-- 5. VÉRIFIER LES TABLES APPORTEUR EXISTENT
-- ============================================================================

SELECT 
    table_name
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND table_name IN (
        'ApporteurAffaires',
        'Prospect',
        'ExpertNotification',
        'ProspectMeeting',
        'ApporteurCommission',
        'ProspectConversion'
    )
ORDER BY 
    table_name;

-- ============================================================================
-- 6. VÉRIFIER LES INDEX SUR ApporteurAffaires
-- ============================================================================

SELECT 
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename = 'ApporteurAffaires'
ORDER BY 
    indexname;

-- ============================================================================
-- 7. VÉRIFIER LES POLITIQUES RLS SUR ApporteurAffaires
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM 
    pg_policies
WHERE 
    tablename = 'ApporteurAffaires';

-- ============================================================================
-- 8. VÉRIFIER SI ClientProduitEligible A LES BONNES COLONNES
-- ============================================================================

SELECT 
    COUNT(*) as missing_columns
FROM 
    information_schema.columns
WHERE 
    table_name = 'ClientProduitEligible'
    AND column_name IN ('clientId', 'produitId', 'statut', 'montantFinal', 'tauxFinal', 'expert_id')
HAVING 
    COUNT(*) < 6;

-- ============================================================================
-- 9. COMPTER LES DONNÉES EXISTANTES
-- ============================================================================

SELECT 
    'ApporteurAffaires' as table_name,
    COUNT(*) as row_count
FROM 
    "ApporteurAffaires"
UNION ALL
SELECT 
    'Prospect',
    COUNT(*)
FROM 
    "Prospect"
UNION ALL
SELECT 
    'ProduitEligible',
    COUNT(*)
FROM 
    "ProduitEligible"
UNION ALL
SELECT 
    'ClientProduitEligible',
    COUNT(*)
FROM 
    "ClientProduitEligible";

-- ============================================================================
-- 10. VÉRIFIER LES FOREIGN KEYS
-- ============================================================================

SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('ApporteurAffaires', 'Prospect', 'ClientProduitEligible', 'ProduitEligible');

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

