-- ============================================================================
-- DIAGNOSTIC COMPLET : Table conversations
-- ============================================================================
-- Date : 24 octobre 2025
-- Objectif : Identifier pourquoi la création de conversation retourne NULL
-- ============================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📋 1. STRUCTURE DE LA TABLE conversations'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔑 2. CONTRAINTES PRIMARY KEY ET FOREIGN KEY'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'conversations'::regclass
ORDER BY contype, conname;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '⚡ 3. INDEX (dont UNIQUE)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'conversations'
ORDER BY indexname;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔐 4. RLS (Row Level Security) - ACTIF ?'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'conversations';

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🛡️ 5. POLITIQUES RLS (si actives)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'conversations'
ORDER BY policyname;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '⚙️ 6. TRIGGERS SUR conversations'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'conversations'
ORDER BY trigger_name;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 7. STATISTIQUES : Nombre de conversations par statut'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  type,
  status,
  COUNT(*) as count
FROM conversations
GROUP BY type, status
ORDER BY type, status;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔍 8. TEST INSERTION SIMPLE (simulation)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

\echo 'Test : Tentative d''insertion avec données minimales...'
\echo ''

BEGIN;

-- Tentative d'insertion
INSERT INTO conversations (
  type,
  participant_ids,
  title,
  status,
  created_by
) VALUES (
  'expert_client',
  ARRAY['00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid],
  'Test Conversation',
  'active',
  '00000000-0000-0000-0000-000000000001'::uuid
)
RETURNING 
  id, 
  type, 
  participant_ids, 
  title, 
  created_at;

-- Annuler l'insertion (test uniquement)
ROLLBACK;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🎯 9. VÉRIFICATION : participant_ids contient-il des valeurs NULL/vides ?'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  id,
  title,
  participant_ids,
  array_length(participant_ids, 1) as nb_participants,
  created_at
FROM conversations
WHERE 
  participant_ids IS NULL 
  OR array_length(participant_ids, 1) < 2
  OR '' = ANY(participant_ids::text[])
ORDER BY created_at DESC
LIMIT 10;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ DIAGNOSTIC TERMINÉ'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

