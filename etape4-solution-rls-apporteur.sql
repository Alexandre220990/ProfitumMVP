-- ============================================================================
-- ÉTAPE 4 : SOLUTION RLS POUR APPORTEURS (JWT CUSTOM)
-- ============================================================================
-- Problème : auth.uid() retourne NULL car JWT custom
-- Solution : Utiliser les claims JWT via request.jwt.claim()
-- ============================================================================

-- 1. CRÉER FONCTION HELPER POUR RÉCUPÉRER L'ID DE L'UTILISATEUR
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  -- Essayer d'abord auth.uid() (standard)
  SELECT COALESCE(
    auth.uid(),
    -- Sinon, récupérer depuis les claims JWT custom
    (current_setting('request.jwt.claims', true)::json->>'database_id')::uuid,
    -- Ou depuis l'ID standard
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
  );
$$;

-- 2. TESTER LA FONCTION
-- ============================================================================
-- Ceci devrait retourner votre ID si vous êtes connecté
SELECT auth.get_current_user_id() as user_id;

-- 3. RECRÉER LES POLICIES POUR conversations
-- ============================================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

-- Créer nouvelles policies avec la fonction helper
CREATE POLICY "Users can view their conversations"
ON conversations
FOR SELECT
TO authenticated
USING (
  auth.get_current_user_id() = ANY (participant_ids)
);

CREATE POLICY "Users can create conversations"
ON conversations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.get_current_user_id() = ANY (participant_ids)
);

CREATE POLICY "Users can update their conversations"
ON conversations
FOR UPDATE
TO authenticated
USING (
  auth.get_current_user_id() = ANY (participant_ids)
)
WITH CHECK (
  auth.get_current_user_id() = ANY (participant_ids)
);

-- Policy DELETE (optionnel)
CREATE POLICY "Users can delete their conversations"
ON conversations
FOR DELETE
TO authenticated
USING (
  auth.get_current_user_id() = ANY (participant_ids)
);

-- 4. RECRÉER LES POLICIES POUR messages
-- ============================================================================

-- Supprimer anciennes
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Créer nouvelles policies
CREATE POLICY "Users can view messages in their conversations"
ON messages
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE auth.get_current_user_id() = ANY (participant_ids)
  )
);

CREATE POLICY "Users can send messages to their conversations"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE auth.get_current_user_id() = ANY (participant_ids)
  )
  AND sender_id = auth.get_current_user_id()
);

CREATE POLICY "Users can update their own messages"
ON messages
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.get_current_user_id()
);

-- Policy DELETE
CREATE POLICY "Users can delete their own messages"
ON messages
FOR DELETE
TO authenticated
USING (
  sender_id = auth.get_current_user_id()
);

-- 5. VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que les policies sont bien créées
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages')
ORDER BY tablename, cmd, policyname;

-- Tester l'accès (si vous êtes connecté en tant qu'apporteur)
SELECT 
  id,
  type,
  title,
  participant_ids,
  created_at
FROM conversations
WHERE auth.get_current_user_id() = ANY (participant_ids);

-- ============================================================================
-- FIN DE L'ÉTAPE 4
-- ============================================================================
-- APRÈS EXÉCUTION :
-- 1. Recharger la page https://www.profitum.app/apporteur/messaging
-- 2. L'erreur 401 devrait disparaître
-- 3. Les conversations devraient se charger
-- ============================================================================

