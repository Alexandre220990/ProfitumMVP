-- ============================================================================
-- ÉTAPE 5 : SOLUTION FINALE RLS (Sans fonction custom)
-- ============================================================================
-- Problème : Impossible de créer fonction dans schéma auth
-- Solution : Utiliser directement les JWT claims dans les policies
-- ============================================================================

-- 1. VÉRIFIER LES CLAIMS JWT DISPONIBLES
-- ============================================================================
-- Voir les claims de votre JWT actuel
SELECT 
  current_setting('request.jwt.claims', true)::json as jwt_claims;

-- Extraire les champs importants
SELECT 
  (current_setting('request.jwt.claims', true)::json->>'sub')::uuid as auth_uid,
  (current_setting('request.jwt.claims', true)::json->>'database_id')::uuid as database_id,
  current_setting('request.jwt.claims', true)::json->>'type' as user_type,
  current_setting('request.jwt.claims', true)::json->>'email' as email;

-- 2. RECRÉER POLICIES conversations AVEC JWT CLAIMS
-- ============================================================================

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON conversations;

-- Créer nouvelles policies qui utilisent SOIT auth.uid() SOIT database_id du JWT
CREATE POLICY "Users can view their conversations"
ON conversations
FOR SELECT
TO authenticated
USING (
  -- Vérifier auth.uid() (pour clients/experts Supabase standard)
  (auth.uid() = ANY (participant_ids))
  OR
  -- OU vérifier database_id du JWT (pour apporteurs JWT custom)
  ((current_setting('request.jwt.claims', true)::json->>'database_id')::uuid = ANY (participant_ids))
  OR
  -- OU vérifier sub du JWT (fallback)
  ((current_setting('request.jwt.claims', true)::json->>'sub')::uuid = ANY (participant_ids))
);

CREATE POLICY "Users can create conversations"
ON conversations
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = ANY (participant_ids))
  OR
  ((current_setting('request.jwt.claims', true)::json->>'database_id')::uuid = ANY (participant_ids))
  OR
  ((current_setting('request.jwt.claims', true)::json->>'sub')::uuid = ANY (participant_ids))
);

CREATE POLICY "Users can update their conversations"
ON conversations
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = ANY (participant_ids))
  OR
  ((current_setting('request.jwt.claims', true)::json->>'database_id')::uuid = ANY (participant_ids))
  OR
  ((current_setting('request.jwt.claims', true)::json->>'sub')::uuid = ANY (participant_ids))
)
WITH CHECK (
  (auth.uid() = ANY (participant_ids))
  OR
  ((current_setting('request.jwt.claims', true)::json->>'database_id')::uuid = ANY (participant_ids))
  OR
  ((current_setting('request.jwt.claims', true)::json->>'sub')::uuid = ANY (participant_ids))
);

CREATE POLICY "Users can delete their conversations"
ON conversations
FOR DELETE
TO authenticated
USING (
  (auth.uid() = ANY (participant_ids))
  OR
  ((current_setting('request.jwt.claims', true)::json->>'database_id')::uuid = ANY (participant_ids))
  OR
  ((current_setting('request.jwt.claims', true)::json->>'sub')::uuid = ANY (participant_ids))
);

-- 3. RECRÉER POLICIES messages
-- ============================================================================

-- Supprimer anciennes
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Créer nouvelles
CREATE POLICY "Users can view messages in their conversations"
ON messages
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE (auth.uid() = ANY (participant_ids))
       OR ((current_setting('request.jwt.claims', true)::json->>'database_id')::uuid = ANY (participant_ids))
       OR ((current_setting('request.jwt.claims', true)::json->>'sub')::uuid = ANY (participant_ids))
  )
);

CREATE POLICY "Users can send messages to their conversations"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE (auth.uid() = ANY (participant_ids))
       OR ((current_setting('request.jwt.claims', true)::json->>'database_id')::uuid = ANY (participant_ids))
       OR ((current_setting('request.jwt.claims', true)::json->>'sub')::uuid = ANY (participant_ids))
  )
  AND (
    sender_id = auth.uid()
    OR sender_id = (current_setting('request.jwt.claims', true)::json->>'database_id')::uuid
    OR sender_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
  )
);

CREATE POLICY "Users can update their own messages"
ON messages
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid()
  OR sender_id = (current_setting('request.jwt.claims', true)::json->>'database_id')::uuid
  OR sender_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
);

CREATE POLICY "Users can delete their own messages"
ON messages
FOR DELETE
TO authenticated
USING (
  sender_id = auth.uid()
  OR sender_id = (current_setting('request.jwt.claims', true)::json->>'database_id')::uuid
  OR sender_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
);

-- 4. VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier policies créées
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- SUCCÈS !
-- ============================================================================
-- Vous devriez voir 8 policies (4 pour conversations + 4 pour messages)
-- Rechargez maintenant votre page messagerie
-- L'erreur 401 devrait disparaître !
-- ============================================================================

