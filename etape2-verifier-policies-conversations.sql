-- ============================================================================
-- ÉTAPE 2 : VÉRIFIER POLICIES RLS SUR conversations/messages
-- ============================================================================

-- 1. Vérifier structure table conversations
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conversations'
ORDER BY ordinal_position;

-- 2. Vérifier RLS activé sur conversations
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'conversations';

-- 3. Voir toutes les policies sur conversations
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  LEFT(qual::text, 100) as using_expression,
  LEFT(with_check::text, 100) as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'conversations'
ORDER BY cmd, policyname;

-- 4. Vérifier structure table messages
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'messages'
ORDER BY ordinal_position;

-- 5. Voir toutes les policies sur messages
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  LEFT(qual::text, 100) as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages'
ORDER BY cmd, policyname;

-- 6. Exemple de conversations existantes
SELECT 
  id,
  created_at,
  updated_at
FROM conversations
LIMIT 3;

-- 7. Vérifier table Admin
SELECT 
  id,
  email,
  created_at
FROM "Admin"
LIMIT 5;

-- Si aucun résultat :
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Admin'
ORDER BY ordinal_position;

