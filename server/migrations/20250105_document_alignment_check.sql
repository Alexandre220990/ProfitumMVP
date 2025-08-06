-- ============================================================================
-- VÉRIFICATION ALIGNEMENT FRONTEND-BACKEND SYSTÈME DOCUMENTAIRE
-- ============================================================================

-- 1. Analyser la structure de GEDDocument (table principale)
SELECT 
    'GED_DOCUMENT_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'GEDDocument'
ORDER BY ordinal_position;

-- 2. Analyser la structure de documentation (table principale)
SELECT 
    'DOCUMENTATION_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'documentation'
ORDER BY ordinal_position;

-- 3. Analyser la structure de admin_documents
SELECT 
    'ADMIN_DOCUMENTS_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'admin_documents'
ORDER BY ordinal_position;

-- 4. Vérifier les données existantes
SELECT 
    'DOCUMENT_DATA' as check_type,
    'GEDDocument' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(DISTINCT created_by) as unique_creators,
    COUNT(DISTINCT is_active) as unique_active_states
FROM "GEDDocument"

UNION ALL

SELECT 
    'DOCUMENT_DATA' as check_type,
    'documentation' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT category_id) as unique_categories,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT is_favorite) as unique_favorite_states
FROM documentation

UNION ALL

SELECT 
    'DOCUMENT_DATA' as check_type,
    'admin_documents' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(DISTINCT author) as unique_authors,
    COUNT(DISTINCT status) as unique_statuses
FROM admin_documents;

-- 5. Vérifier les contraintes de clés étrangères
SELECT 
    'DOCUMENT_FOREIGN_KEYS' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('GEDDocument', 'documentation', 'admin_documents', 'DocumentActivity')
ORDER BY tc.table_name, kcu.column_name;

-- 6. Vérifier les valeurs uniques pour les colonnes importantes
SELECT 
    'GED_UNIQUE_VALUES' as check_type,
    'GEDDocument_category' as column_name,
    category as value,
    COUNT(*) as count
FROM "GEDDocument" 
GROUP BY category

UNION ALL

SELECT 
    'GED_UNIQUE_VALUES' as check_type,
    'GEDDocument_is_active' as column_name,
    is_active::text as value,
    COUNT(*) as count
FROM "GEDDocument" 
GROUP BY is_active

UNION ALL

SELECT 
    'DOC_UNIQUE_VALUES' as check_type,
    'documentation_is_favorite' as column_name,
    is_favorite::text as value,
    COUNT(*) as count
FROM documentation 
GROUP BY is_favorite

UNION ALL

SELECT 
    'ADMIN_UNIQUE_VALUES' as check_type,
    'admin_documents_status' as column_name,
    status as value,
    COUNT(*) as count
FROM admin_documents 
GROUP BY status

UNION ALL

SELECT 
    'ADMIN_UNIQUE_VALUES' as check_type,
    'admin_documents_category' as column_name,
    category as value,
    COUNT(*) as count
FROM admin_documents 
GROUP BY category

ORDER BY column_name, count DESC; 