-- ============================================================================
-- ANALYSE DU SYSTÈME DOCUMENTAIRE
-- ============================================================================

-- 1. Identifier toutes les tables liées aux documents
SELECT 
    'DOCUMENT_TABLES' as check_type,
    table_name,
    CASE 
        WHEN table_name ILIKE '%document%' THEN 'TABLE_DOCUMENT'
        WHEN table_name ILIKE '%file%' THEN 'TABLE_FICHIER'
        WHEN table_name ILIKE '%ged%' THEN 'TABLE_GED'
        ELSE 'TABLE_AUTRE'
    END as table_category
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND (table_name ILIKE '%document%' 
         OR table_name ILIKE '%file%' 
         OR table_name ILIKE '%ged%'
         OR table_name ILIKE '%upload%')
ORDER BY table_name;

-- 2. Analyser la structure des tables documentaires principales
SELECT 
    'DOCUMENT_STRUCTURE' as check_type,
    'Document' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'Document'
ORDER BY ordinal_position;

-- 3. Analyser DocumentFile si elle existe
SELECT 
    'DOCUMENT_FILE_STRUCTURE' as check_type,
    'DocumentFile' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'DocumentFile'
ORDER BY ordinal_position;

-- 4. Analyser GEDDocument si elle existe
SELECT 
    'GED_STRUCTURE' as check_type,
    'GEDDocument' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'GEDDocument'
ORDER BY ordinal_position;

-- 5. Vérifier les données existantes
SELECT 
    'DOCUMENT_DATA' as check_type,
    'Document' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT "clientId") as unique_clients,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(DISTINCT status) as unique_statuses
FROM "Document"

UNION ALL

SELECT 
    'DOCUMENT_DATA' as check_type,
    'DocumentFile' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT client_id) as unique_clients,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(DISTINCT status) as unique_statuses
FROM "DocumentFile"

UNION ALL

SELECT 
    'DOCUMENT_DATA' as check_type,
    'GEDDocument' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT client_id) as unique_clients,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(DISTINCT status) as unique_statuses
FROM "GEDDocument";

-- 6. Vérifier les contraintes de clés étrangères
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
    AND tc.table_name IN ('Document', 'DocumentFile', 'GEDDocument')
ORDER BY tc.table_name, kcu.column_name;

-- 7. Vérifier les valeurs uniques pour les colonnes importantes
SELECT 
    'DOCUMENT_UNIQUE_VALUES' as check_type,
    'Document_status' as column_name,
    status as value,
    COUNT(*) as count
FROM "Document" 
GROUP BY status

UNION ALL

SELECT 
    'DOCUMENT_UNIQUE_VALUES' as check_type,
    'Document_category' as column_name,
    category as value,
    COUNT(*) as count
FROM "Document" 
GROUP BY category

UNION ALL

SELECT 
    'DOCUMENT_UNIQUE_VALUES' as check_type,
    'DocumentFile_status' as column_name,
    status as value,
    COUNT(*) as count
FROM "DocumentFile" 
GROUP BY status

ORDER BY column_name, count DESC; 