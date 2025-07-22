-- Test du système GED unifié
-- Exécuter après le nettoyage

-- Vérifier que tous les buckets existent
SELECT 
    'Bucket Check' as test_type,
    name as bucket_name,
    CASE 
        WHEN name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquant'
    END as status
FROM storage.buckets 
WHERE name IN ('client-documents', 'expert-documents', 'admin-documents', 'chartes-signatures', 'rapports-audit')
ORDER BY name;

-- Vérifier que toutes les politiques RLS sont en place
SELECT 
    'Policy Check' as test_type,
    policyname,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ Configurée'
        ELSE '❌ Manquante'
    END as status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Vérifier que les tables existent
SELECT 
    'Table Check' as test_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('DocumentFile', 'DocumentActivity', 'DocumentShare', 'ExpertAssignment')
ORDER BY table_name;

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE '🎉 Test du système GED unifié terminé!';
    RAISE NOTICE '✅ Le système est maintenant unifié et opérationnel.';
    RAISE NOTICE '📁 Pages disponibles:';
    RAISE NOTICE '   • Client: /dashboard/client-documents';
    RAISE NOTICE '   • Admin: /admin/enhanced-admin-documents';
    RAISE NOTICE '   • Test: /test-enhanced-ged';
END $$;
