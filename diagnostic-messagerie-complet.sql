-- ============================================================================
-- DIAGNOSTIC COMPLET - MODULE DE MESSAGERIE
-- ============================================================================
-- Date : 25 octobre 2025
-- Objectif : Diagnostiquer les problèmes de création et d'affichage des conversations
-- ============================================================================

\echo '========================================';
\echo '🔍 1. VÉRIFICATION RLS ET POLICIES';
\echo '========================================';

-- Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'typing_indicators', 'message_files')
ORDER BY tablename;

\echo '';
\echo '📋 Policies actives sur conversations:';
SELECT
  policyname,
  cmd as command,
  permissive,
  roles,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'conversations'
ORDER BY policyname;

\echo '';
\echo '========================================';
\echo '🗃️ 2. STRUCTURE TABLE CONVERSATIONS';
\echo '========================================';

SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

\echo '';
\echo '========================================';
\echo '🔗 3. CONTRAINTES ET INDEX';
\echo '========================================';

-- Contraintes CHECK et UNIQUE
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'conversations'::regclass
ORDER BY conname;

\echo '';
\echo '📊 Index sur conversations:';
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'conversations'
ORDER BY indexname;

\echo '';
\echo '========================================';
\echo '⚡ 4. TRIGGERS SUR CONVERSATIONS';
\echo '========================================';

SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'conversations'
ORDER BY trigger_name;

\echo '';
\echo '========================================';
\echo '📈 5. STATISTIQUES CONVERSATIONS';
\echo '========================================';

SELECT 
  COUNT(*) as total_conversations,
  COUNT(DISTINCT type) as nombre_types,
  MIN(created_at) as premiere_conversation,
  MAX(created_at) as derniere_conversation
FROM conversations;

\echo '';
\echo '📊 Répartition par type:';
SELECT 
  type,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived
FROM conversations
GROUP BY type
ORDER BY count DESC;

\echo '';
\echo '========================================';
\echo '👥 6. CONVERSATIONS PAR UTILISATEUR';
\echo '========================================';

-- Conversations de l'apporteur test (10705490-5e3b-49a2-a0db-8e3d5a5af38e)
\echo '';
\echo '📋 Conversations de l''apporteur conseilprofitum@gmail.com:';
SELECT 
  id,
  type,
  title,
  participant_ids,
  status,
  created_at,
  created_by,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count
FROM conversations
WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids)
ORDER BY created_at DESC
LIMIT 10;

\echo '';
\echo '========================================';
\echo '🔍 7. VÉRIFICATION APPORTEUR';
\echo '========================================';

SELECT 
  id,
  first_name,
  last_name,
  email,
  company_name,
  is_active
FROM "ApporteurAffaires"
WHERE email = 'conseilprofitum@gmail.com';

\echo '';
\echo '========================================';
\echo '📝 8. DERNIÈRES CONVERSATIONS CRÉÉES';
\echo '========================================';

SELECT 
  id,
  type,
  title,
  participant_ids,
  status,
  created_at,
  created_by
FROM conversations
ORDER BY created_at DESC
LIMIT 10;

\echo '';
\echo '========================================';
\echo '🚨 9. CONVERSATIONS PROBLÉMATIQUES';
\echo '========================================';

\echo '';
\echo '⚠️ Conversations avec participant_ids vides ou NULL:';
SELECT 
  id,
  type,
  title,
  participant_ids,
  created_at
FROM conversations
WHERE participant_ids IS NULL 
   OR array_length(participant_ids, 1) = 0
   OR '00000000-0000-0000-0000-000000000000' = ANY(participant_ids);

\echo '';
\echo '⚠️ Conversations orphelines (sans messages):';
SELECT 
  c.id,
  c.type,
  c.title,
  c.created_at,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
FROM conversations c
WHERE NOT EXISTS (
  SELECT 1 FROM messages WHERE conversation_id = c.id
)
ORDER BY c.created_at DESC
LIMIT 10;

\echo '';
\echo '========================================';
\echo '✅ 10. TEST INSERTION MANUELLE';
\echo '========================================';

\echo '';
\echo 'Test création conversation:';
INSERT INTO conversations (
  type,
  participant_ids,
  title,
  status,
  created_by
) VALUES (
  'test_diagnostic',
  ARRAY['10705490-5e3b-49a2-a0db-8e3d5a5af38e'::uuid, '9963487e-3f77-44b1-86fa-b390e5d5f493'::uuid],
  'Test Diagnostic Messagerie',
  'active',
  '10705490-5e3b-49a2-a0db-8e3d5a5af38e'::uuid
)
RETURNING id, type, title, participant_ids, created_at;

\echo '';
\echo '🧹 Nettoyage du test:';
DELETE FROM conversations WHERE type = 'test_diagnostic' RETURNING id;

\echo '';
\echo '========================================';
\echo '📊 11. FONCTION create_conversation_direct';
\echo '========================================';

\echo '';
\echo 'Vérifier si la fonction RPC existe:';
SELECT 
  proname as function_name,
  pronargs as num_args,
  prorettype::regtype as return_type,
  prosrc as source_code
FROM pg_proc
WHERE proname = 'create_conversation_direct';

\echo '';
\echo '========================================';
\echo '✅ DIAGNOSTIC TERMINÉ';
\echo '========================================';

