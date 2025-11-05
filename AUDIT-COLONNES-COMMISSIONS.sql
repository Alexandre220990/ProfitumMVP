-- ============================================================================
-- AUDIT DES COLONNES DE COMMISSION/COMPENSATION
-- ============================================================================

-- ============================================================================
-- 1. TABLE Client - Colonnes liées aux commissions
-- ============================================================================
SELECT 
    column_name AS "Colonne Client",
    data_type AS "Type",
    is_nullable AS "Nullable",
    column_default AS "Défaut"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'Client'
AND (
    column_name ILIKE '%commission%'
    OR column_name ILIKE '%compensation%'
    OR column_name ILIKE '%taux%'
    OR column_name ILIKE '%fee%'
)
ORDER BY column_name;

-- ============================================================================
-- 2. TABLE Expert - Colonnes liées aux compensations
-- ============================================================================
SELECT 
    column_name AS "Colonne Expert",
    data_type AS "Type",
    is_nullable AS "Nullable",
    column_default AS "Défaut"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'Expert'
AND (
    column_name ILIKE '%commission%'
    OR column_name ILIKE '%compensation%'
    OR column_name ILIKE '%taux%'
    OR column_name ILIKE '%fee%'
    OR column_name ILIKE '%rate%'
)
ORDER BY column_name;

-- ============================================================================
-- 3. TABLE ApporteurAffaires - Colonnes liées aux commissions
-- ============================================================================
SELECT 
    column_name AS "Colonne Apporteur",
    data_type AS "Type",
    is_nullable AS "Nullable",
    column_default AS "Défaut"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ApporteurAffaires'
AND (
    column_name ILIKE '%commission%'
    OR column_name ILIKE '%compensation%'
    OR column_name ILIKE '%taux%'
    OR column_name ILIKE '%fee%'
)
ORDER BY column_name;

-- ============================================================================
-- 4. TOUTES les tables avec le mot "commission"
-- ============================================================================
SELECT 
    table_name AS "Table",
    column_name AS "Colonne",
    data_type AS "Type"
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
    table_name ILIKE '%commission%'
    OR column_name ILIKE '%commission%'
)
ORDER BY table_name, column_name;

-- ============================================================================
-- 5. TABLE ApporteurCommission (structure complète)
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ApporteurCommission'
ORDER BY ordinal_position;

-- ============================================================================
-- 6. Vérifier les valeurs NULL dans les colonnes de commission
-- ============================================================================

-- Expert - Valeurs de compensation
SELECT 
    compensation,
    COUNT(*) as nombre,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM "Expert"
GROUP BY compensation
ORDER BY COUNT(*) DESC;

-- Apporteur - Valeurs de commission
SELECT 
    'ApporteurAffaires' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN commission_rate IS NULL THEN 1 END) as null_count,
    COUNT(CASE WHEN commission_rate IS NOT NULL THEN 1 END) as non_null_count
FROM "ApporteurAffaires";

-- ============================================================================
-- 7. TABLE Invoice/Facture (si elle existe)
-- ============================================================================
SELECT 
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND (
    table_name ILIKE '%invoice%'
    OR table_name ILIKE '%facture%'
    OR table_name ILIKE '%billing%'
);

-- Structure si existe
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('Invoice', 'Facture', 'invoice', 'facture')
ORDER BY ordinal_position;

-- ============================================================================
-- FIN
-- ============================================================================

