-- ===== VÉRIFICATION PERMISSIONS ET STRUCTURE BASE DE DONNÉES =====
-- Script pour diagnostiquer les problèmes de permissions RLS
-- Date: 2025-01-03

-- 1. Vérifier les tables existantes et leurs propriétaires
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Vérifier les tables de stockage Supabase
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'storage' 
ORDER BY tablename;

-- 3. Vérifier les buckets de stockage existants
SELECT 
    id,
    name,
    owner,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
ORDER BY name;

-- 4. Vérifier les politiques RLS existantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname IN ('public', 'storage')
ORDER BY tablename, policyname;

-- 5. Vérifier les permissions de l'utilisateur actuel
SELECT 
    current_user,
    session_user,
    current_database();

-- 6. Vérifier les rôles et permissions
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname IN (current_user, 'postgres', 'supabase_admin', 'authenticated', 'anon');

-- 7. Vérifier les tables spécifiques mentionnées dans le script
SELECT 
    'DocumentFile' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'DocumentFile'
    ) as exists
UNION ALL
SELECT 
    'DocumentFilePermission' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'DocumentFilePermission'
    ) as exists
UNION ALL
SELECT 
    'DocumentFileAccessLog' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'DocumentFileAccessLog'
    ) as exists
UNION ALL
SELECT 
    'Client' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Client'
    ) as exists
UNION ALL
SELECT 
    'Expert' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Expert'
    ) as exists;

-- 8. Vérifier les colonnes des tables existantes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('DocumentFile', 'Client', 'Expert')
ORDER BY table_name, ordinal_position;

-- 9. Vérifier les contraintes de clés étrangères
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('DocumentFile', 'DocumentFilePermission', 'DocumentFileAccessLog')
ORDER BY tc.table_name, kcu.column_name; 