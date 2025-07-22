-- ===== TEST DE CONFIGURATION GED SUPABASE =====
-- Script pour tester et valider la configuration GED
-- Date: 2025-01-03
-- Version: 1.0

-- ===== 1. VÉRIFICATION DES BUCKETS =====

-- Vérifier que tous les buckets existent
SELECT 
    'Bucket Check' as test_type,
    name as bucket_name,
    CASE 
        WHEN name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquant'
    END as status,
    file_size_limit,
    array_length(allowed_mime_types, 1) as allowed_types_count
FROM storage.buckets 
WHERE name IN ('client-documents', 'expert-documents', 'admin-documents', 'chartes-signatures', 'rapports-audit')
ORDER BY name;

-- ===== 2. VÉRIFICATION DES POLITIQUES =====

-- Vérifier que toutes les politiques RLS sont en place
SELECT 
    'Policy Check' as test_type,
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
    END as bucket_type
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- ===== 3. VÉRIFICATION DES TABLES =====

-- Vérifier que les tables nécessaires existent
SELECT 
    'Table Check' as test_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('DocumentFile', 'DocumentActivity', 'DocumentShare', 'ExpertAssignment', 'Admin', 'Client', 'Expert')
ORDER BY table_name;

-- ===== 4. VÉRIFICATION DES INDEX =====

-- Vérifier que les index de performance existent
SELECT 
    'Index Check' as test_type,
    indexname,
    CASE 
        WHEN indexname IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquant'
    END as status,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_documentfile_%'
ORDER BY indexname;

-- ===== 5. VÉRIFICATION DES FONCTIONS =====

-- Vérifier que les fonctions utilitaires existent
SELECT 
    'Function Check' as test_type,
    proname as function_name,
    CASE 
        WHEN proname IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname IN ('create_client_bucket', 'check_document_access')
ORDER BY proname;

-- ===== 6. TEST DE PERMISSIONS =====

-- Test de permission pour un utilisateur admin fictif
DO $$
DECLARE
    test_admin_id UUID := '00000000-0000-0000-0000-000000000001';
    test_client_id UUID := '00000000-0000-0000-0000-000000000002';
    test_expert_id UUID := '00000000-0000-0000-0000-000000000003';
    has_permission BOOLEAN;
BEGIN
    -- Insérer un admin de test
    INSERT INTO "Admin" (id, email, nom, prenom, created_at, updated_at)
    VALUES (test_admin_id, 'admin-test@example.com', 'Admin', 'Test', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Insérer un client de test
    INSERT INTO "Client" (id, email, nom, prenom, created_at, updated_at)
    VALUES (test_client_id, 'client-test@example.com', 'Client', 'Test', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Insérer un expert de test
    INSERT INTO "Expert" (id, email, nom, prenom, created_at, updated_at)
    VALUES (test_expert_id, 'expert-test@example.com', 'Expert', 'Test', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Tester la fonction de vérification d'accès
    SELECT check_document_access('test/path.pdf', 'client-documents', test_admin_id, 'view') INTO has_permission;
    
    RAISE NOTICE 'Test permission admin: %', has_permission;
    
    -- Nettoyer les données de test
    DELETE FROM "Admin" WHERE id = test_admin_id;
    DELETE FROM "Client" WHERE id = test_client_id;
    DELETE FROM "Expert" WHERE id = test_expert_id;
END $$;

-- ===== 7. RÉSUMÉ DE LA CONFIGURATION =====

-- Afficher un résumé de la configuration
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
    AND indexname LIKE 'idx_documentfile_%'
)
SELECT 
    'Configuration Summary' as summary_type,
    bucket_count.bucket_count as buckets_configured,
    policy_count.policy_count as policies_created,
    table_count.table_count as tables_available,
    index_count.index_count as indexes_created,
    CASE 
        WHEN bucket_count.bucket_count = 5 
        AND policy_count.policy_count >= 20 
        AND table_count.table_count >= 7 
        AND index_count.index_count >= 5
        THEN '✅ Configuration complète'
        ELSE '⚠️ Configuration incomplète'
    END as overall_status
FROM bucket_count, policy_count, table_count, index_count;

-- ===== 8. RECOMMANDATIONS =====

-- Afficher les recommandations selon l'état de la configuration
DO $$
DECLARE
    bucket_count INTEGER;
    policy_count INTEGER;
    table_count INTEGER;
    index_count INTEGER;
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
    AND indexname LIKE 'idx_documentfile_%';
    
    -- Afficher les recommandations
    RAISE NOTICE '=== RECOMMANDATIONS ===';
    
    IF bucket_count < 5 THEN
        RAISE NOTICE '⚠️ Il manque % buckets. Exécutez le script configure-ged-buckets-corrected.sql', 5 - bucket_count;
    END IF;
    
    IF policy_count < 20 THEN
        RAISE NOTICE '⚠️ Il manque des politiques RLS. Vérifiez la configuration des politiques.';
    END IF;
    
    IF table_count < 7 THEN
        RAISE NOTICE '⚠️ Il manque des tables. Vérifiez les migrations de base de données.';
    END IF;
    
    IF index_count < 5 THEN
        RAISE NOTICE '⚠️ Il manque des index de performance. Vérifiez la création des index.';
    END IF;
    
    IF bucket_count = 5 AND policy_count >= 20 AND table_count >= 7 AND index_count >= 5 THEN
        RAISE NOTICE '✅ Configuration GED complète et fonctionnelle!';
        RAISE NOTICE '🎉 Le système est prêt pour les uploads de documents.';
    END IF;
END $$; 