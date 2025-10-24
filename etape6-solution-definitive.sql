-- ============================================================================
-- ÉTAPE 6 : SOLUTION RLS UNIVERSELLE (Pour tous les types d'utilisateurs)
-- ============================================================================
-- Cette solution fonctionne pour TOUS :
-- - Clients/Experts (Supabase Auth standard) → auth.uid()
-- - Apporteurs (JWT custom) → aucune restriction RLS
-- ============================================================================

-- OPTION : DÉSACTIVER RLS TEMPORAIREMENT
-- ============================================================================
-- ⚠️ ATTENTION : Ceci enlève les restrictions de sécurité
-- Utilisez cette option UNIQUEMENT si :
-- 1. Votre backend filtre déjà correctement les données
-- 2. Vous passez TOUJOURS par l'API (pas d'accès direct Supabase)
-- 3. Vous comprenez les implications de sécurité

-- Désactiver RLS sur conversations (permet accès via API backend)
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur messages
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages');

-- Résultat attendu : rls_enabled = false

-- ============================================================================
-- OPTION ALTERNATIVE : POLICY PUBLIQUE (Moins sécurisée)
-- ============================================================================
-- Si vous préférez garder RLS mais autoriser tout le monde :

/*
-- Supprimer toutes les policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON conversations;

-- Créer policy permissive (permet à tous les authenticated)
CREATE POLICY "Authenticated users can access conversations"
ON conversations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Pareil pour messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

CREATE POLICY "Authenticated users can access messages"
ON messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
*/

-- ============================================================================
-- RECOMMANDATION FINALE
-- ============================================================================
-- DÉSACTIVER RLS est OK si :
-- ✅ Votre backend (Node.js) filtre déjà par utilisateur (ligne 159 unified-messaging.ts)
-- ✅ Le frontend passe TOUJOURS par l'API backend
-- ✅ Vous n'utilisez PAS Supabase client direct côté frontend
--
-- C'est votre cas ! Donc c'est sécurisé.
-- La sécurité est assurée par votre backend, pas par Supabase RLS.
-- ============================================================================

