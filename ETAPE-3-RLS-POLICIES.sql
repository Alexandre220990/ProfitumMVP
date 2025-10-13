-- ============================================================================
-- ÉTAPE 3 : VÉRIFIER LES RLS POLICIES
-- ============================================================================

-- 1️⃣ RLS ClientProcessDocument
SELECT 
  policyname,
  cmd as action,
  CASE 
    WHEN policyname LIKE '%admin%' THEN '👑 Admin'
    WHEN policyname LIKE '%client%' THEN '👤 Client'
    WHEN policyname LIKE '%expert%' THEN '🎓 Expert'
    WHEN policyname LIKE '%apporteur%' THEN '💼 Apporteur'
    ELSE '📋 Autre'
  END as type_utilisateur,
  qual as condition_WHERE
FROM pg_policies
WHERE tablename = 'ClientProcessDocument'
ORDER BY policyname;

-- 2️⃣ RLS GEDDocument
SELECT 
  policyname,
  cmd as action,
  CASE 
    WHEN policyname LIKE '%admin%' THEN '👑 Admin'
    WHEN policyname LIKE '%client%' THEN '👤 Client'
    WHEN policyname LIKE '%expert%' THEN '🎓 Expert'
    WHEN policyname LIKE '%apporteur%' THEN '💼 Apporteur'
    ELSE '📋 Autre'
  END as type_utilisateur,
  qual as condition_WHERE
FROM pg_policies
WHERE tablename = 'GEDDocument'
ORDER BY policyname;

-- 3️⃣ RLS GEDDocumentPermission
SELECT 
  policyname,
  cmd as action
FROM pg_policies
WHERE tablename = 'GEDDocumentPermission'
ORDER BY policyname;

-- 4️⃣ VÉRIFIER RLS ACTIVÉE
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ACTIVÉE'
    ELSE '❌ RLS DÉSACTIVÉE'
  END as rls_status
FROM pg_tables
WHERE tablename IN ('ClientProcessDocument', 'GEDDocument', 'GEDDocumentPermission')
ORDER BY tablename;

