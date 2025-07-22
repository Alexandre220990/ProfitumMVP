-- ===== VÉRIFICATION COMPLÈTE SYSTÈME GED =====
-- Script pour analyser l'état du système GED et identifier les problèmes
-- Date: 2025-01-03
-- Version: 1.0

-- ===== 1. VÉRIFICATION DES BUCKETS =====

SELECT 
    '=== VÉRIFICATION DES BUCKETS ===' as section,
    '' as detail;

SELECT 
    'Bucket Status' as check_type,
    name as bucket_name,
    CASE 
        WHEN name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquant'
    END as status,
    file_size_limit,
    array_length(allowed_mime_types, 1) as allowed_types_count,
    CASE 
        WHEN name = 'client-documents' AND file_size_limit = 10485760 THEN '✅ Configuré'
        WHEN name = 'expert-documents' AND file_size_limit = 52428800 THEN '✅ Configuré'
        WHEN name = 'admin-documents' AND file_size_limit = 104857600 THEN '✅ Configuré'
        WHEN name = 'chartes-signatures' AND file_size_limit = 10485760 THEN '✅ Configuré'
        WHEN name = 'rapports-audit' AND file_size_limit = 52428800 THEN '✅ Configuré'
        ELSE '⚠️ Configuration incorrecte'
    END as configuration_status
FROM storage.buckets 
WHERE name IN ('client-documents', 'expert-documents', 'admin-documents', 'chartes-signatures', 'rapports-audit')
ORDER BY name;

-- ===== 2. VÉRIFICATION DES POLITIQUES RLS =====

SELECT 
    '=== VÉRIFICATION DES POLITIQUES RLS ===' as section,
    '' as detail;

SELECT 
    'Policy Status' as check_type,
    policyname,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ Configurée'
        ELSE '❌ Manquante'
    END as status,
    cmd as operation,
    CASE 
        WHEN qual LIKE '%client-documents%' THEN 'Client Documents'
        WHEN qual LIKE '%expert-documents%' THEN 'Expert Documents'
        WHEN qual LIKE '%admin-documents%' THEN 'Admin Documents'
        WHEN qual LIKE '%chartes-signatures%' THEN 'Chartes Signatures'
        WHEN qual LIKE '%rapports-audit%' THEN 'Rapports Audit'
        ELSE 'Autre'
    END as bucket_type,
    CASE 
        WHEN cmd = 'SELECT' AND qual LIKE '%auth.uid()%' THEN '✅ Sécurisée'
        WHEN cmd = 'INSERT' AND qual LIKE '%auth.uid()%' THEN '✅ Sécurisée'
        WHEN cmd = 'UPDATE' AND qual LIKE '%auth.uid()%' THEN '✅ Sécurisée'
        WHEN cmd = 'DELETE' AND qual LIKE '%auth.uid()%' THEN '✅ Sécurisée'
        ELSE '⚠️ À vérifier'
    END as security_status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- ===== 3. VÉRIFICATION DES TABLES =====

SELECT 
    '=== VÉRIFICATION DES TABLES ===' as section,
    '' as detail;

SELECT 
    'Table Status' as check_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status,
    CASE 
        WHEN table_name = 'DocumentFile' THEN 'Table principale des fichiers'
        WHEN table_name = 'DocumentActivity' THEN 'Logs d''activité'
        WHEN table_name = 'DocumentShare' THEN 'Partages de documents'
        WHEN table_name = 'ExpertAssignment' THEN 'Assignations expert-client'
        WHEN table_name = 'Admin' THEN 'Table des administrateurs'
        WHEN table_name = 'Client' THEN 'Table des clients'
        WHEN table_name = 'Expert' THEN 'Table des experts'
        ELSE 'Table système'
    END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('DocumentFile', 'DocumentActivity', 'DocumentShare', 'ExpertAssignment', 'Admin', 'Client', 'Expert')
ORDER BY table_name;

-- ===== 4. VÉRIFICATION DES INDEX =====

SELECT 
    '=== VÉRIFICATION DES INDEX ===' as section,
    '' as detail;

SELECT 
    'Index Status' as check_type,
    indexname,
    CASE 
        WHEN indexname IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquant'
    END as status,
    tablename,
    CASE 
        WHEN indexname LIKE 'idx_documentfile_%' THEN 'Index DocumentFile'
        WHEN indexname LIKE 'idx_expertassignment_%' THEN 'Index ExpertAssignment'
        WHEN indexname LIKE 'idx_documentactivity_%' THEN 'Index DocumentActivity'
        WHEN indexname LIKE 'idx_documentshare_%' THEN 'Index DocumentShare'
        ELSE 'Index système'
    END as description
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (indexname LIKE 'idx_documentfile_%' OR indexname LIKE 'idx_expertassignment_%' OR indexname LIKE 'idx_documentactivity_%' OR indexname LIKE 'idx_documentshare_%')
ORDER BY indexname;

-- ===== 5. VÉRIFICATION DES FONCTIONS =====

SELECT 
    '=== VÉRIFICATION DES FONCTIONS ===' as section,
    '' as detail;

SELECT 
    'Function Status' as check_type,
    proname as function_name,
    CASE 
        WHEN proname IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status,
    CASE 
        WHEN proname = 'check_document_access' THEN 'Vérification des permissions'
        WHEN proname = 'create_client_bucket' THEN 'Création de bucket client'
        ELSE 'Fonction utilitaire'
    END as description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname IN ('check_document_access', 'create_client_bucket')
ORDER BY proname;

-- ===== 6. VÉRIFICATION DES DONNÉES =====

SELECT 
    '=== VÉRIFICATION DES DONNÉES ===' as section,
    '' as detail;

-- Compter les documents par bucket
SELECT 
    'Document Count' as check_type,
    bucket_name,
    COUNT(*) as document_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Données présentes'
        ELSE '⚠️ Aucun document'
    END as status
FROM "DocumentFile" 
WHERE status != 'deleted'
GROUP BY bucket_name
ORDER BY bucket_name;

-- Compter les assignations expert-client
SELECT 
    'Assignment Count' as check_type,
    'ExpertAssignment' as table_name,
    COUNT(*) as assignment_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Assignations présentes'
        ELSE '⚠️ Aucune assignation'
    END as status
FROM "ExpertAssignment"
WHERE status = 'active';

-- ===== 7. VÉRIFICATION DES PERMISSIONS =====

SELECT 
    '=== VÉRIFICATION DES PERMISSIONS ===' as section,
    '' as detail;

-- Vérifier les permissions sur les tables
SELECT 
    'Table Permissions' as check_type,
    schemaname,
    tablename,
    grantee,
    privilege_type,
    CASE 
        WHEN privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE') THEN '✅ Permissions OK'
        ELSE '⚠️ Permissions à vérifier'
    END as status
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('DocumentFile', 'DocumentActivity', 'DocumentShare', 'ExpertAssignment')
ORDER BY tablename, grantee;

-- ===== 8. TEST DE FONCTIONNALITÉ =====

SELECT 
    '=== TEST DE FONCTIONNALITÉ ===' as section,
    '' as detail;

-- Test de la fonction check_document_access
DO $$
DECLARE
    test_result BOOLEAN;
    test_admin_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Insérer un admin de test
    INSERT INTO "Admin" (id, email, nom, prenom, created_at, updated_at)
    VALUES (test_admin_id, 'admin-test@example.com', 'Admin', 'Test', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Tester la fonction
    SELECT check_document_access('test/path.pdf', 'admin-documents', test_admin_id, 'view') INTO test_result;
    
    RAISE NOTICE 'Test fonction check_document_access: %', test_result;
    
    -- Nettoyer
    DELETE FROM "Admin" WHERE id = test_admin_id;
END $$;

-- ===== 9. ANALYSE DES PROBLÈMES =====

SELECT 
    '=== ANALYSE DES PROBLÈMES ===' as section,
    '' as detail;

-- Identifier les buckets manquants
SELECT 
    'Missing Buckets' as issue_type,
    bucket_name,
    'Bucket manquant dans la configuration' as description,
    'Exécuter configure-ged-buckets-simple.sql' as solution
FROM (
    SELECT 'client-documents' as bucket_name
    UNION SELECT 'expert-documents'
    UNION SELECT 'admin-documents'
    UNION SELECT 'chartes-signatures'
    UNION SELECT 'rapports-audit'
) AS required_buckets
WHERE bucket_name NOT IN (
    SELECT name FROM storage.buckets
);

-- Identifier les politiques manquantes
SELECT 
    'Missing Policies' as issue_type,
    'RLS policies' as component,
    'Politiques RLS manquantes pour la sécurité' as description,
    'Vérifier la configuration des politiques' as solution
WHERE (
    SELECT COUNT(*) FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
) < 15;

-- Identifier les tables manquantes
SELECT 
    'Missing Tables' as issue_type,
    table_name,
    'Table manquante dans la base de données' as description,
    'Exécuter les migrations de base de données' as solution
FROM (
    SELECT 'DocumentFile' as table_name
    UNION SELECT 'DocumentActivity'
    UNION SELECT 'DocumentShare'
    UNION SELECT 'ExpertAssignment'
) AS required_tables
WHERE table_name NOT IN (
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
);

-- ===== 10. RÉSUMÉ DE LA CONFIGURATION =====

WITH bucket_count AS (
    SELECT COUNT(*) as bucket_count
    FROM storage.buckets 
    WHERE name IN ('client-documents', 'expert-documents', 'admin-documents', 'chartes-signatures', 'rapports-audit')
),
policy_count AS (
    SELECT COUNT(*) as policy_count
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
),
table_count AS (
    SELECT COUNT(*) as table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('DocumentFile', 'DocumentActivity', 'DocumentShare', 'ExpertAssignment', 'Admin', 'Client', 'Expert')
),
index_count AS (
    SELECT COUNT(*) as index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND (indexname LIKE 'idx_documentfile_%' OR indexname LIKE 'idx_expertassignment_%' OR indexname LIKE 'idx_documentactivity_%' OR indexname LIKE 'idx_documentshare_%')
),
function_count AS (
    SELECT COUNT(*) as function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND proname IN ('check_document_access', 'create_client_bucket')
),
document_count AS (
    SELECT COUNT(*) as document_count
    FROM "DocumentFile" 
    WHERE status != 'deleted'
)
SELECT 
    '=== RÉSUMÉ DE LA CONFIGURATION ===' as section,
    '' as detail;

SELECT 
    'Configuration Summary' as summary_type,
    bucket_count.bucket_count as buckets_configured,
    policy_count.policy_count as policies_created,
    table_count.table_count as tables_available,
    index_count.index_count as indexes_created,
    function_count.function_count as functions_available,
    document_count.document_count as documents_stored,
    CASE 
        WHEN bucket_count.bucket_count = 5 
        AND policy_count.policy_count >= 15 
        AND table_count.table_count >= 7 
        AND index_count.index_count >= 5
        AND function_count.function_count >= 1
        THEN '✅ Configuration complète et opérationnelle'
        WHEN bucket_count.bucket_count >= 3 
        AND policy_count.policy_count >= 10 
        AND table_count.table_count >= 5
        THEN '⚠️ Configuration partielle - Fonctionnel avec limitations'
        ELSE '❌ Configuration incomplète - Nécessite des corrections'
    END as overall_status
FROM bucket_count, policy_count, table_count, index_count, function_count, document_count;

-- ===== 11. RECOMMANDATIONS =====

DO $$
DECLARE
    bucket_count INTEGER;
    policy_count INTEGER;
    table_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
    document_count INTEGER;
BEGIN
    -- Compter les éléments
    SELECT COUNT(*) INTO bucket_count
    FROM storage.buckets 
    WHERE name IN ('client-documents', 'expert-documents', 'admin-documents', 'chartes-signatures', 'rapports-audit');
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage';
    
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('DocumentFile', 'DocumentActivity', 'DocumentShare', 'ExpertAssignment', 'Admin', 'Client', 'Expert');
    
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND (indexname LIKE 'idx_documentfile_%' OR indexname LIKE 'idx_expertassignment_%' OR indexname LIKE 'idx_documentactivity_%' OR indexname LIKE 'idx_documentshare_%');
    
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND proname IN ('check_document_access', 'create_client_bucket');
    
    SELECT COUNT(*) INTO document_count
    FROM "DocumentFile" 
    WHERE status != 'deleted';
    
    -- Afficher les recommandations
    RAISE NOTICE '=== RECOMMANDATIONS ===';
    
    IF bucket_count < 5 THEN
        RAISE NOTICE '❌ Il manque % buckets. Exécutez: configure-ged-buckets-simple.sql', 5 - bucket_count;
    END IF;
    
    IF policy_count < 15 THEN
        RAISE NOTICE '❌ Il manque des politiques RLS. Vérifiez la configuration des politiques.';
    END IF;
    
    IF table_count < 7 THEN
        RAISE NOTICE '❌ Il manque des tables. Exécutez les migrations de base de données.';
    END IF;
    
    IF index_count < 5 THEN
        RAISE NOTICE '⚠️ Il manque des index de performance. Vérifiez la création des index.';
    END IF;
    
    IF function_count < 1 THEN
        RAISE NOTICE '❌ Il manque des fonctions utilitaires. Vérifiez la création des fonctions.';
    END IF;
    
    IF bucket_count = 5 AND policy_count >= 15 AND table_count >= 7 AND index_count >= 5 AND function_count >= 1 THEN
        RAISE NOTICE '✅ Configuration GED complète et fonctionnelle!';
        RAISE NOTICE '🎉 Le système est prêt pour les uploads de documents.';
        RAISE NOTICE '📊 % documents déjà stockés dans le système.', document_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== PAGES À VÉRIFIER ===';
    RAISE NOTICE '• Client: /dashboard/client-documents';
    RAISE NOTICE '• Expert: /expert/dashboard';
    RAISE NOTICE '• Admin: /admin/admin-document-upload';
    RAISE NOTICE '• Test: /test-enhanced-ged';
END $$; 