-- ============================================================================
-- NETTOYAGE : Supprimer les conversations en double
-- ============================================================================
-- Date : 25 octobre 2025
-- Objectif : Garder seulement 1 conversation par paire de participants
-- ============================================================================

\echo '========================================';
\echo '🧹 NETTOYAGE CONVERSATIONS DOUBLONS';
\echo '========================================';

-- 1. Identifier les doublons
\echo '';
\echo '🔍 Conversations en double (même participant_ids):';
SELECT 
  participant_ids,
  type,
  COUNT(*) as count,
  MIN(created_at) as premiere,
  MAX(created_at) as derniere,
  array_agg(id ORDER BY created_at) as conversation_ids
FROM conversations
WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids)
GROUP BY participant_ids, type
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 2. Garder seulement la DERNIÈRE conversation de chaque doublon
\echo '';
\echo '🗑️ Suppression des anciennes conversations dupliquées...';

WITH doublons AS (
  SELECT 
    id,
    participant_ids,
    type,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY participant_ids, type 
      ORDER BY created_at DESC
    ) as rn
  FROM conversations
  WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids)
)
DELETE FROM conversations
WHERE id IN (
  SELECT id 
  FROM doublons 
  WHERE rn > 1  -- Garder seulement la plus récente (rn=1)
)
RETURNING id, title, type, created_at;

-- 3. Vérifier le résultat
\echo '';
\echo '✅ Conversations restantes après nettoyage:';
SELECT 
  id,
  type,
  title,
  participant_ids,
  created_at,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count
FROM conversations
WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids)
ORDER BY created_at DESC;

-- 4. Statistiques finales
\echo '';
\echo '📊 Statistiques après nettoyage:';
SELECT 
  COUNT(*) as total_conversations,
  COUNT(DISTINCT participant_ids) as paires_uniques,
  SUM((SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id)) as total_messages
FROM conversations
WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids);

\echo '';
\echo '========================================';
\echo '✅ NETTOYAGE TERMINÉ';
\echo '========================================';

