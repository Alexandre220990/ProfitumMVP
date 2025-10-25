-- ============================================================================
-- SUPPRIMER LA CONVERSATION ADMIN VIDE
-- ============================================================================
-- Date : 25 octobre 2025
-- Objectif : Supprimer conversation 6b5745ba (0 messages)
-- Garder : 203a07a5 (6 messages)
-- ============================================================================

\echo '========================================';
\echo '🗑️ SUPPRESSION CONVERSATION ADMIN VIDE';
\echo '========================================';

-- Supprimer la conversation vide (6b5745ba-056d-4031-ad87-43a91c95c122)
DELETE FROM conversations
WHERE id = '6b5745ba-056d-4031-ad87-43a91c95c122'
RETURNING id, title, created_at, 
  (SELECT COUNT(*) FROM messages WHERE conversation_id = '6b5745ba-056d-4031-ad87-43a91c95c122') as message_count;

\echo '';
\echo '========================================';
\echo '✅ CONVERSATION ADMIN RESTANTE';
\echo '========================================';

SELECT 
  id,
  title,
  participant_ids,
  created_at,
  last_message_at,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count,
  (SELECT content FROM messages WHERE conversation_id = conversations.id ORDER BY created_at DESC LIMIT 1) as dernier_message
FROM conversations
WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids)
  AND type = 'admin_support';

\echo '';
\echo '========================================';
\echo '✅ NETTOYAGE TERMINÉ';
\echo '========================================';
\echo '';
\echo 'Résultat attendu : 1 conversation admin avec 6 messages';
\echo '';

