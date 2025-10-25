-- ============================================================================
-- IDENTIFIER ET SUPPRIMER LA MAUVAISE CONVERSATION ADMIN
-- ============================================================================
-- Date : 25 octobre 2025
-- Objectif : Trouver les 2 conversations admin et supprimer celle sans messages
-- ============================================================================

\echo '========================================';
\echo '🔍 CONVERSATIONS ADMIN POUR APPORTEUR';
\echo '========================================';

-- Identifier les conversations admin pour l'apporteur
SELECT 
  id,
  type,
  title,
  participant_ids,
  created_at,
  last_message_at,
  status,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count,
  (SELECT content FROM messages WHERE conversation_id = conversations.id ORDER BY created_at DESC LIMIT 1) as dernier_message
FROM conversations
WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids)
  AND type = 'admin_support'
ORDER BY created_at DESC;

\echo '';
\echo '========================================';
\echo '🗑️ SUPPRESSION CONVERSATION VIDE';
\echo '========================================';

-- Supprimer la conversation admin SANS messages
DELETE FROM conversations
WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids)
  AND type = 'admin_support'
  AND NOT EXISTS (
    SELECT 1 FROM messages WHERE conversation_id = conversations.id
  )
RETURNING id, title, created_at;

\echo '';
\echo '========================================';
\echo '✅ CONVERSATION ADMIN RESTANTE';
\echo '========================================';

SELECT 
  id,
  title,
  participant_ids,
  created_at,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count
FROM conversations
WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids)
  AND type = 'admin_support';

\echo '';
\echo '✅ Nettoyage terminé';

