-- ============================================================================
-- ANALYSE DU SCHÉMA RÉEL DE LA BASE DE DONNÉES
-- ============================================================================

-- 1. Lister toutes les tables liées aux documents
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

-- 2. Analyser la structure de GEDDocument
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

-- 3. Analyser la structure de DocumentActivity
SELECT 
    'DOCUMENT_ACTIVITY_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'DocumentActivity'
ORDER BY ordinal_position;

-- 4. Vérifier les tables Client, Expert, Admin
SELECT 
    'USER_TABLES_STRUCTURE' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('Client', 'Expert', 'Admin')
ORDER BY table_name, ordinal_position;

-- 5. Vérifier les données existantes dans GEDDocument
SELECT 
    'GED_DOCUMENT_DATA' as check_type,
    COUNT(*) as total_documents,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(DISTINCT created_by) as unique_creators,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_documents
FROM "GEDDocument"
WHERE is_active = true;

-- 6. Vérifier les données existantes dans DocumentActivity
SELECT 
    'DOCUMENT_ACTIVITY_DATA' as check_type,
    COUNT(*) as total_activities,
    COUNT(DISTINCT activity_type) as unique_activity_types
FROM "DocumentActivity";

-- 7. Vérifier les politiques RLS existantes
SELECT 
    'EXISTING_RLS_POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('GEDDocument', 'DocumentActivity', 'Client', 'Expert', 'Admin')
ORDER BY tablename, policyname;
