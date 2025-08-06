-- ============================================================================
-- VÉRIFICATION ALIGNEMENT GLOBAL FRONTEND-BACKEND
-- ============================================================================

-- 1. Vérifier toutes les tables principales et leurs colonnes
SELECT 
    'GLOBAL_TABLES_CHECK' as check_type,
    table_name,
    COUNT(*) as total_columns,
    COUNT(CASE WHEN is_nullable = 'NO' THEN 1 END) as not_null_columns,
    COUNT(CASE WHEN is_nullable = 'YES' THEN 1 END) as nullable_columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN (
        'Client', 'Expert', 'Admin', 'CalendarEvent', 'simulations', 
        'SimulationProcessed', 'ClientProduitEligible', 'GEDDocument',
        'admin_documents', 'documentation', 'Audit', 'Dossier'
    )
GROUP BY table_name
ORDER BY table_name;

-- 2. Vérifier les contraintes de clés étrangères
SELECT 
    'FOREIGN_KEYS_CHECK' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN ccu.table_name IS NULL THEN '❌ ORPHELINE'
        ELSE '✅ VALIDE'
    END as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN (
        'CalendarEvent', 'simulations', 'SimulationProcessed', 
        'ClientProduitEligible', 'GEDDocument', 'Audit', 'Dossier'
    )
ORDER BY tc.table_name, kcu.column_name;

-- 3. Vérifier les contraintes CHECK pour les enums
SELECT 
    'ENUM_CONSTRAINTS_CHECK' as check_type,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause,
    CASE 
        WHEN cc.check_clause LIKE '%ARRAY%' THEN '✅ ENUM VALIDÉ'
        ELSE '⚠️ À VÉRIFIER'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name IN (
        'CalendarEvent', 'GEDDocument', 'simulations', 'SimulationProcessed'
    )
    AND cc.check_clause LIKE '%ARRAY%'
ORDER BY tc.table_name, tc.constraint_name;

-- 4. Vérifier les données existantes par table
SELECT 
    'DATA_EXISTENCE_CHECK' as check_type,
    table_name,
    CASE 
        WHEN table_name = 'Client' THEN (SELECT COUNT(*) FROM "Client")
        WHEN table_name = 'Expert' THEN (SELECT COUNT(*) FROM "Expert")
        WHEN table_name = 'Admin' THEN (SELECT COUNT(*) FROM "Admin")
        WHEN table_name = 'CalendarEvent' THEN (SELECT COUNT(*) FROM "CalendarEvent")
        WHEN table_name = 'simulations' THEN (SELECT COUNT(*) FROM simulations)
        WHEN table_name = 'SimulationProcessed' THEN (SELECT COUNT(*) FROM "SimulationProcessed")
        WHEN table_name = 'ClientProduitEligible' THEN (SELECT COUNT(*) FROM "ClientProduitEligible")
        WHEN table_name = 'GEDDocument' THEN (SELECT COUNT(*) FROM "GEDDocument")
        WHEN table_name = 'admin_documents' THEN (SELECT COUNT(*) FROM admin_documents)
        WHEN table_name = 'Audit' THEN (SELECT COUNT(*) FROM "Audit")
        WHEN table_name = 'Dossier' THEN (SELECT COUNT(*) FROM "Dossier")
        ELSE 0
    END as record_count
FROM (
    SELECT 'Client' as table_name
    UNION ALL SELECT 'Expert'
    UNION ALL SELECT 'Admin'
    UNION ALL SELECT 'CalendarEvent'
    UNION ALL SELECT 'simulations'
    UNION ALL SELECT 'SimulationProcessed'
    UNION ALL SELECT 'ClientProduitEligible'
    UNION ALL SELECT 'GEDDocument'
    UNION ALL SELECT 'admin_documents'
    UNION ALL SELECT 'Audit'
    UNION ALL SELECT 'Dossier'
) as tables
ORDER BY table_name;

-- 5. Vérifier les colonnes problématiques (camelCase vs snake_case)
SELECT 
    'COLUMN_NAMING_CHECK' as check_type,
    table_name,
    column_name,
    CASE 
        WHEN column_name ~ '[A-Z]' AND column_name != UPPER(column_name) THEN '⚠️ CAMELCASE'
        WHEN column_name ~ '_' THEN '✅ SNAKE_CASE'
        WHEN column_name = LOWER(column_name) THEN '✅ LOWERCASE'
        ELSE '❓ AUTRE'
    END as naming_convention
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN (
        'Client', 'Expert', 'Admin', 'CalendarEvent', 'simulations', 
        'SimulationProcessed', 'ClientProduitEligible', 'GEDDocument',
        'admin_documents', 'Audit', 'Dossier'
    )
    AND column_name NOT IN ('id', 'created_at', 'updated_at')
ORDER BY table_name, column_name; 