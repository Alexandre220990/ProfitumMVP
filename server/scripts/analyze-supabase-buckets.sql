-- ============================================================================
-- SCRIPT D'ANALYSE DES BUCKETS SUPABASE ET RÈGLES ASSOCIÉES
-- ============================================================================

-- 1. ANALYSE DES BUCKETS EXISTANTS
SELECT 
    'BUCKET_ANALYSIS' as analysis_type,
    name as bucket_name,
    public as is_public,
    file_size_limit as file_size_limit_bytes,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets
ORDER BY name;

-- 2. ANALYSE DES POLITIQUES RLS SUR LES BUCKETS
SELECT 
    'BUCKET_POLICIES' as analysis_type,
    schemaname,
    tablename as bucket_name,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN (
    SELECT name FROM storage.buckets
)
ORDER BY tablename, policyname;

-- 3. ANALYSE DES FICHIERS PAR BUCKET
SELECT 
    'FILES_BY_BUCKET' as analysis_type,
    bucket_id,
    COUNT(*) as total_files,
    SUM(metadata->>'size')::bigint as total_size_bytes,
    MIN(created_at) as oldest_file,
    MAX(created_at) as newest_file,
    COUNT(CASE WHEN updated_at > created_at THEN 1 END) as modified_files
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

-- 4. ANALYSE DÉTAILLÉE DES FICHIERS DANS CHAQUE BUCKET
SELECT 
    'DETAILED_FILES' as analysis_type,
    bucket_id,
    name as file_name,
    metadata->>'size' as file_size_bytes,
    metadata->>'mimetype' as mime_type,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at > created_at THEN 'modified'
        ELSE 'original'
    END as file_status
FROM storage.objects
ORDER BY bucket_id, created_at DESC;

-- 5. ANALYSE DES TYPES MIME PAR BUCKET
SELECT 
    'MIME_TYPES_BY_BUCKET' as analysis_type,
    bucket_id,
    metadata->>'mimetype' as mime_type,
    COUNT(*) as file_count,
    SUM(metadata->>'size')::bigint as total_size_bytes
FROM storage.objects
GROUP BY bucket_id, metadata->>'mimetype'
ORDER BY bucket_id, file_count DESC;

-- 6. ANALYSE DES TAILLES DE FICHIERS PAR BUCKET
SELECT 
    'FILE_SIZES_BY_BUCKET' as analysis_type,
    bucket_id,
    COUNT(*) as total_files,
    ROUND(AVG((metadata->>'size')::bigint), 2) as avg_size_bytes,
    MIN((metadata->>'size')::bigint) as min_size_bytes,
    MAX((metadata->>'size')::bigint) as max_size_bytes,
    SUM((metadata->>'size')::bigint) as total_size_bytes
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

-- 7. VÉRIFICATION DES BUCKETS MANQUANTS POUR LES SECTIONS
SELECT 
    'MISSING_BUCKETS' as analysis_type,
    'formation' as required_bucket,
    CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'formation') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'MISSING_BUCKETS' as analysis_type,
    'factures' as required_bucket,
    CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'factures') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'MISSING_BUCKETS' as analysis_type,
    'guides' as required_bucket,
    CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'guides') 
         THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 8. ANALYSE DES PERMISSIONS UTILISATEUR SUR LES BUCKETS
SELECT 
    'USER_PERMISSIONS' as analysis_type,
    bucket_id,
    owner,
    created_at,
    updated_at
FROM storage.objects
GROUP BY bucket_id, owner, created_at, updated_at
ORDER BY bucket_id, created_at DESC;

-- 9. ANALYSE DES BUCKETS VIDE
SELECT 
    'EMPTY_BUCKETS' as analysis_type,
    b.name as bucket_name,
    b.public as is_public,
    CASE WHEN o.bucket_id IS NULL THEN 'EMPTY' ELSE 'HAS_FILES' END as status
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.name = o.bucket_id
GROUP BY b.name, b.public, o.bucket_id
HAVING o.bucket_id IS NULL
ORDER BY b.name;

-- 10. ANALYSE DES BUCKETS AVEC FICHIERS
SELECT 
    'BUCKETS_WITH_FILES' as analysis_type,
    b.name as bucket_name,
    b.public as is_public,
    COUNT(o.id) as file_count,
    SUM((o.metadata->>'size')::bigint) as total_size_bytes
FROM storage.buckets b
INNER JOIN storage.objects o ON b.name = o.bucket_id
GROUP BY b.name, b.public
ORDER BY file_count DESC;

-- 11. RECOMMANDATIONS POUR LES BUCKETS
SELECT 
    'RECOMMENDATIONS' as analysis_type,
    bucket_name,
    recommendation
FROM (
    VALUES 
        ('formation', 'Bucket pour documents de formation - vérifier les politiques RLS'),
        ('factures', 'Bucket pour factures - s''assurer qu''il est privé'),
        ('guides', 'Bucket pour guides utilisateur - peut être public en lecture'),
        ('client-documents', 'Bucket pour documents clients - strictement privé'),
        ('expert-documents', 'Bucket pour documents experts - privé par expert'),
        ('admin-documents', 'Bucket pour documents admin - accès restreint')
    ) AS recs(bucket_name, recommendation)
ORDER BY bucket_name;

-- 12. ANALYSE DES POLITIQUES RLS MANQUANTES
SELECT 
    'MISSING_RLS_POLICIES' as analysis_type,
    b.name as bucket_name,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = b.name) 
        THEN 'NO_POLICIES'
        WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = b.name AND cmd = 'SELECT') 
        THEN 'NO_READ_POLICY'
        WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = b.name AND cmd = 'INSERT') 
        THEN 'NO_INSERT_POLICY'
        WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = b.name AND cmd = 'UPDATE') 
        THEN 'NO_UPDATE_POLICY'
        WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = b.name AND cmd = 'DELETE') 
        THEN 'NO_DELETE_POLICY'
        ELSE 'POLICIES_OK'
    END as policy_status
FROM storage.buckets b
ORDER BY b.name;

-- 13. RÉSUMÉ GLOBAL
SELECT 
    'GLOBAL_SUMMARY' as analysis_type,
    COUNT(DISTINCT b.name) as total_buckets,
    COUNT(DISTINCT o.bucket_id) as buckets_with_files,
    COUNT(DISTINCT o.id) as total_files,
    SUM((o.metadata->>'size')::bigint) as total_storage_bytes,
    ROUND(SUM((o.metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_storage_mb,
    COUNT(DISTINCT p.tablename) as buckets_with_policies
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.name = o.bucket_id
LEFT JOIN pg_policies p ON b.name = p.tablename;
