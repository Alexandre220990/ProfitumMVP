-- ============================================================================
-- TEST SIMPLE : Envoyer un message dans une conversation existante
-- ============================================================================
-- Date : 25 octobre 2025
-- Objectif : Tester l'envoi de message dans une conversation pour vérifier le système
-- PRÉREQUIS : Exécuter fix-contrainte-sender-type.sql AVANT ce test
-- ============================================================================

\echo '========================================';
\echo '🧪 TEST ENVOI MESSAGE';
\echo '========================================';

-- 0. Vérifier que la contrainte permet "apporteur"
\echo '';
\echo '🔍 Vérification contrainte sender_type:';
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'messages'::regclass
  AND conname = 'messages_sender_type_check';

\echo '';
\echo '⚠️  Si "apporteur" n''est pas dans la liste, exécutez: \\i fix-contrainte-sender-type.sql';
\echo '';

-- 1. Sélectionner une conversation existante de l'apporteur
\echo '';
\echo '📋 Conversations disponibles pour l''apporteur:';
SELECT 
  id,
  title,
  type,
  participant_ids
FROM conversations
WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids)
ORDER BY created_at DESC
LIMIT 5;

-- 2. Insérer un message de test dans la première conversation
\echo '';
\echo '📤 Insertion d''un message de test...';

INSERT INTO messages (
  conversation_id,
  sender_id,
  sender_type,
  content,
  message_type,
  is_read
)
SELECT 
  id as conversation_id,
  '10705490-5e3b-49a2-a0db-8e3d5a5af38e'::uuid as sender_id,
  'apporteur' as sender_type,
  'Test message envoyé depuis SQL - ' || NOW()::text as content,
  'text' as message_type,
  false as is_read
FROM conversations
WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids)
ORDER BY created_at DESC
LIMIT 1
RETURNING 
  id as message_id,
  conversation_id,
  content,
  created_at;

-- 3. Vérifier que le message a été créé
\echo '';
\echo '✅ Messages dans la conversation:';
SELECT 
  m.id as message_id,
  m.conversation_id,
  m.sender_id,
  m.sender_type,
  m.content,
  m.created_at,
  c.title as conversation_title
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.conversation_id IN (
  SELECT id 
  FROM conversations 
  WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids)
  ORDER BY created_at DESC
  LIMIT 1
)
ORDER BY m.created_at DESC;

-- 4. Mettre à jour last_message_at de la conversation
\echo '';
\echo '🔄 Mise à jour last_message_at...';
UPDATE conversations
SET 
  last_message_at = NOW(),
  updated_at = NOW()
WHERE id IN (
  SELECT id 
  FROM conversations 
  WHERE '10705490-5e3b-49a2-a0db-8e3d5a5af38e' = ANY(participant_ids)
  ORDER BY created_at DESC
  LIMIT 1
)
RETURNING id, title, last_message_at;

\echo '';
\echo '========================================';
\echo '✅ TEST TERMINÉ';
\echo '========================================';
\echo '';
\echo 'Actions à faire maintenant:';
\echo '1. Rafraîchir la page https://www.profitum.app/apporteur/messaging';
\echo '2. Vérifier que le message de test apparaît';
\echo '3. Essayer d''envoyer un nouveau message depuis l''interface';
\echo '';

