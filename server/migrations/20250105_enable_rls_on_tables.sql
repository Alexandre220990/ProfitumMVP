-- ============================================================================
-- ACTIVATION RLS SUR LES TABLES MANQUANTES
-- ============================================================================

-- 1. Activer RLS sur document_sections
ALTER TABLE public.document_sections ENABLE ROW LEVEL SECURITY;

-- 2. Activer RLS sur DocumentActivity
ALTER TABLE public."DocumentActivity" ENABLE ROW LEVEL SECURITY;

-- 3. Vérifier l'activation RLS
SELECT 
    'RLS_ENABLED_CHECK' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('document_sections', 'GEDDocument', 'DocumentActivity')
ORDER BY tablename;

-- 4. Vérifier que toutes les politiques sont actives
SELECT 
    'POLICIES_STATUS_CHECK' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('document_sections', 'GEDDocument', 'DocumentActivity')
    AND policyname LIKE '%sections%'
ORDER BY tablename, policyname;
