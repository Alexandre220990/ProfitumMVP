-- ============================================================================
-- TEST BACKEND SERVICE ROLE - Vérification accès avec RLS
-- ============================================================================

-- 1. VÉRIFIER QUE RLS EST BIEN ACTIVÉ
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('conversations', 'messages')
AND schemaname = 'public';

-- 2. TESTER ACCÈS AVEC ROLE ACTUEL (sera bloqué si vous n'êtes pas service_role)
SELECT 
  id,
  type,
  title,
  participant_ids,
  created_at
FROM conversations
LIMIT 3;

-- 3. VÉRIFIER CONVERSATIONS DE L'APPORTEUR
-- Note : Ceci utilise l'ID directement (pas auth.uid())
SELECT 
  id,
  type,
  title,
  participant_ids,
  created_at
FROM conversations
WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY (participant_ids)
ORDER BY created_at DESC;

-- 4. SI AUCUN RÉSULTAT, vérifier avec auth_id
SELECT 
  id,
  type,
  title,
  participant_ids,
  created_at
FROM conversations
WHERE '9691bcdf-0bb9-446b-b224-357bf73f44bc' = ANY (participant_ids)
ORDER BY created_at DESC;

-- 5. COMPTER TOUTES LES CONVERSATIONS
SELECT COUNT(*) as total FROM conversations;

-- 6. DÉSACTIVER TEMPORAIREMENT RLS POUR TESTER
-- ⚠️ ATTENTION : Ceci enlève la sécurité temporairement
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 7. TESTER À NOUVEAU
SELECT 
  id,
  type,
  title,
  participant_ids,
  created_at
FROM conversations
LIMIT 5;

-- 8. RÉACTIVER RLS IMMÉDIATEMENT
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

