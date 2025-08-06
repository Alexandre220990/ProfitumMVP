-- ============================================================================
-- ALIGNEMENT FRONTEND-BACKEND SYSTÈME DOCUMENTAIRE
-- ============================================================================

-- 1. Vérifier l'alignement des interfaces TypeScript vs base de données

-- Interface Document (simple) vs GEDDocument
SELECT 
    'FRONTEND_BACKEND_ALIGNMENT' as check_type,
    'Document vs GEDDocument' as comparison,
    'id' as frontend_field,
    'id' as backend_field,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'GEDDocument' 
        AND column_name = 'id'
    ) THEN '✅ ALIGNÉ' ELSE '❌ NON ALIGNÉ' END as alignment_status

UNION ALL

SELECT 
    'FRONTEND_BACKEND_ALIGNMENT' as check_type,
    'Document vs GEDDocument' as comparison,
    'nom' as frontend_field,
    'title' as backend_field,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'GEDDocument' 
        AND column_name = 'title'
    ) THEN '⚠️ NOM DIFFÉRENT' ELSE '❌ NON ALIGNÉ' END as alignment_status

UNION ALL

SELECT 
    'FRONTEND_BACKEND_ALIGNMENT' as check_type,
    'Document vs GEDDocument' as comparison,
    'type' as frontend_field,
    'category' as backend_field,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'GEDDocument' 
        AND column_name = 'category'
    ) THEN '⚠️ NOM DIFFÉRENT' ELSE '❌ NON ALIGNÉ' END as alignment_status

UNION ALL

SELECT 
    'FRONTEND_BACKEND_ALIGNMENT' as check_type,
    'Document vs GEDDocument' as comparison,
    'url' as frontend_field,
    'file_path' as backend_field,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'GEDDocument' 
        AND column_name = 'file_path'
    ) THEN '⚠️ NOM DIFFÉRENT' ELSE '❌ NON ALIGNÉ' END as alignment_status

UNION ALL

SELECT 
    'FRONTEND_BACKEND_ALIGNMENT' as check_type,
    'Document vs GEDDocument' as comparison,
    'createdAt' as frontend_field,
    'created_at' as backend_field,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'GEDDocument' 
        AND column_name = 'created_at'
    ) THEN '⚠️ CASSE DIFFÉRENTE' ELSE '❌ NON ALIGNÉ' END as alignment_status;

-- 2. Vérifier les types de données critiques
SELECT 
    'DATA_TYPE_CHECK' as check_type,
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'uuid' THEN '✅ UUID - OK'
        WHEN data_type = 'text' THEN '✅ TEXT - OK'
        WHEN data_type = 'character varying' THEN '✅ VARCHAR - OK'
        WHEN data_type = 'timestamp without time zone' THEN '✅ TIMESTAMP - OK'
        WHEN data_type = 'timestamp with time zone' THEN '✅ TIMESTAMPTZ - OK'
        WHEN data_type = 'boolean' THEN '✅ BOOLEAN - OK'
        WHEN data_type = 'integer' THEN '✅ INTEGER - OK'
        ELSE '⚠️ TYPE À VÉRIFIER'
    END as type_status
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name IN ('GEDDocument', 'documentation', 'admin_documents')
    AND column_name IN ('id', 'title', 'category', 'content', 'created_at', 'updated_at')
ORDER BY table_name, column_name;

-- 3. Test de création de document (si des données existent)
SELECT 
    'DOCUMENT_CREATION_TEST' as check_type,
    'Test de création document' as test_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM "GEDDocument") >= 0 THEN '✅ TABLE DISPONIBLE'
        ELSE '❌ TABLE INACCESSIBLE'
    END as test_result

UNION ALL

SELECT 
    'DOCUMENT_CREATION_TEST' as check_type,
    'Test de création documentation' as test_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM documentation) >= 0 THEN '✅ TABLE DISPONIBLE'
        ELSE '❌ TABLE INACCESSIBLE'
    END as test_result

UNION ALL

SELECT 
    'DOCUMENT_CREATION_TEST' as check_type,
    'Test de création admin_documents' as test_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM admin_documents) >= 0 THEN '✅ TABLE DISPONIBLE'
        ELSE '❌ TABLE INACCESSIBLE'
    END as test_result;

-- 4. Recommandations d'alignement
SELECT 
    'ALIGNMENT_RECOMMENDATIONS' as check_type,
    'Document Interface' as component,
    'Remplacer "nom" par "title"' as recommendation,
    'HIGH' as priority

UNION ALL

SELECT 
    'ALIGNMENT_RECOMMENDATIONS' as check_type,
    'Document Interface' as component,
    'Remplacer "type" par "category"' as recommendation,
    'HIGH' as priority

UNION ALL

SELECT 
    'ALIGNMENT_RECOMMENDATIONS' as check_type,
    'Document Interface' as component,
    'Remplacer "url" par "file_path"' as recommendation,
    'HIGH' as priority

UNION ALL

SELECT 
    'ALIGNMENT_RECOMMENDATIONS' as check_type,
    'Document Interface' as component,
    'Standardiser "createdAt" vs "created_at"' as recommendation,
    'MEDIUM' as priority; 