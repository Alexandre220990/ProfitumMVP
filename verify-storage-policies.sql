-- ============================================================================
-- VÉRIFICATION DES POLICIES RLS STORAGE
-- ============================================================================
-- Vérifier que les policies permettent bien l'accès aux buckets
-- ============================================================================

-- 1. Vérifier RLS activé sur storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 2. Lister TOUTES les policies sur storage.objects
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%admin%' THEN '👑 Admin'
    WHEN policyname LIKE '%client%' THEN '👤 Client'
    WHEN policyname LIKE '%expert%' THEN '🎓 Expert'
    WHEN policyname LIKE '%apporteur%' THEN '💼 Apporteur'
    ELSE '❓ Autre'
  END as user_type,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Lecture'
    WHEN cmd = 'INSERT' THEN '📤 Upload'
    WHEN cmd = 'UPDATE' THEN '✏️ Modification'
    WHEN cmd = 'DELETE' THEN '🗑️ Suppression'
    ELSE cmd
  END as action
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY cmd, policyname;

-- 3. Vérifier les policies spécifiques pour client-documents
SELECT 
  policyname,
  cmd,
  qual::text as condition
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (policyname LIKE '%client-documents%' OR qual::text LIKE '%client-documents%')
ORDER BY cmd;

-- 4. Compter les policies par action
SELECT 
  cmd as action,
  COUNT(*) as nb_policies
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
GROUP BY cmd
ORDER BY cmd;

-- ============================================================================
-- DIAGNOSTIC
-- ============================================================================

-- Si vous voyez 0 policies, il faut exécuter SETUP-BUCKETS-POLICIES.sql
-- Si RLS est disabled, l'activer avec: ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SOLUTION SI PAS DE POLICIES
-- ============================================================================

-- Si aucune policy n'existe, créer au minimum celle-ci pour les admins/service role:
-- CREATE POLICY "Service role can access all"
-- ON storage.objects
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

