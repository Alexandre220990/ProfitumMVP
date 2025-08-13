-- ============================================================================
-- VÉRIFICATION BASE DE DONNÉES POUR UPLOAD DOCUMENTS TICPE
-- ============================================================================

-- 1. Vérifier que la table GEDDocument existe et sa structure
SELECT 
    'GED_DOCUMENT_EXISTS' as check_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'GEDDocument';

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

-- 3. Vérifier les contraintes de GEDDocument
SELECT 
    'GED_DOCUMENT_CONSTRAINTS' as check_type,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'GEDDocument';

-- 4. Vérifier que la table ClientProduitEligible existe
SELECT 
    'CLIENT_PRODUIT_ELIGIBLE_EXISTS' as check_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'ClientProduitEligible';

-- 5. Vérifier le dossier TICPE spécifique
SELECT 
    'TICPE_DOSSIER_CHECK' as check_type,
    id,
    clientId,
    statut,
    current_step,
    progress,
    created_at
FROM "ClientProduitEligible" 
WHERE id = '93374842-cca6-4873-b16e-0ada92e97004';

-- 6. Vérifier les clients existants
SELECT 
    'CLIENTS_EXISTANTS' as check_type,
    id,
    email,
    nom_entreprise,
    created_at
FROM "Client" 
LIMIT 5;

-- 7. Vérifier les buckets Supabase Storage
SELECT 
    'STORAGE_BUCKETS' as check_type,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;

-- 8. Test d'insertion dans GEDDocument (avec rollback)
BEGIN;

-- Test d'insertion
INSERT INTO "GEDDocument" (
    title,
    description,
    content,
    category,
    file_path,
    created_by,
    is_active,
    version
)
SELECT 
    'Test Upload TICPE',
    'Test pour vérifier l''upload de documents',
    'dossier_id:93374842-cca6-4873-b16e-0ada92e97004',
    'eligibilite_ticpe',
    '/test/upload-test.pdf',
    id,
    true,
    1
FROM "Client"
LIMIT 1
RETURNING id, title, category, created_at;

-- Rollback pour ne pas polluer la base
ROLLBACK;

-- 9. Vérifier les permissions RLS sur GEDDocument
SELECT 
    'RLS_POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'GEDDocument';

-- 10. Vérifier les logs d'accès récents
SELECT 
    'ACCESS_LOGS' as check_type,
    COUNT(*) as total_logs,
    COUNT(CASE WHEN success = true THEN 1 END) as successful_logs,
    COUNT(CASE WHEN success = false THEN 1 END) as failed_logs,
    MAX(timestamp) as last_log
FROM access_logs 
WHERE timestamp > NOW() - INTERVAL '1 hour';
