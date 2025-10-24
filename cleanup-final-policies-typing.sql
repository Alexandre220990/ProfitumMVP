-- ============================================================================
-- CLEANUP FINAL - Supprimer policies restantes typing_indicators
-- ============================================================================

-- Supprimer les 2 policies restantes
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators;

-- Vérification : Plus aucune policy
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'typing_indicators', 'message_files');

-- Résultat attendu : 0 lignes (aucune policy)

-- Vérifier état final RLS
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'typing_indicators', 'message_files')
ORDER BY tablename;

-- Résultat attendu : rls_enabled = false pour toutes

