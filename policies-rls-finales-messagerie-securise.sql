-- ============================================================================
-- POLICIES RLS FINALES - MESSAGERIE ULTRA-SÉCURISÉE
-- ============================================================================
-- Date : 24 octobre 2025
-- Objectif : Bloquer accès direct Supabase, autoriser uniquement via API backend
-- Architecture : Frontend → API Backend (JWT) → Supabase (service_role bypass RLS)
-- ============================================================================

-- 1. ACTIVER RLS SUR LES TABLES
-- ============================================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_files ENABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER TOUTES LES POLICIES EXISTANTES
-- ============================================================================
-- conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can access conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users via backend can access conversations" ON conversations;
DROP POLICY IF EXISTS "Block direct client access" ON conversations;
DROP POLICY IF EXISTS "Apporteurs can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Apporteurs can create conversations" ON conversations;
DROP POLICY IF EXISTS "Apporteurs can update their conversations" ON conversations;

-- messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can access messages" ON messages;
DROP POLICY IF EXISTS "Apporteurs can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Apporteurs can insert messages in their conversations" ON messages;

-- typing_indicators
DROP POLICY IF EXISTS "Users can manage typing indicators" ON typing_indicators;

-- message_files
DROP POLICY IF EXISTS "Users can upload files" ON message_files;

-- 3. CRÉER POLICIES STRICTES - APPROCHE "DENY ALL, ALLOW BACKEND"
-- ============================================================================

-- ============================================================================
-- conversations
-- ============================================================================

-- Policy qui bloque TOUT accès direct (anon + authenticated)
-- Le backend utilise service_role qui bypass automatiquement RLS
CREATE POLICY "Block all direct access to conversations"
ON conversations
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- ============================================================================
-- messages
-- ============================================================================

-- Policy qui bloque TOUT accès direct
-- Le backend utilise service_role qui bypass automatiquement RLS
CREATE POLICY "Block all direct access to messages"
ON messages
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- ============================================================================
-- typing_indicators
-- ============================================================================

-- Policy qui bloque TOUT accès direct
CREATE POLICY "Block all direct access to typing_indicators"
ON typing_indicators
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- ============================================================================
-- message_files
-- ============================================================================

-- Policy qui bloque TOUT accès direct
CREATE POLICY "Block all direct access to message_files"
ON message_files
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 4. VÉRIFICATION DES POLICIES CRÉÉES
-- ============================================================================
SELECT
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'typing_indicators', 'message_files')
ORDER BY tablename, policyname;

-- 5. VÉRIFIER QUE RLS EST BIEN ACTIVÉ
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'typing_indicators', 'message_files');

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- Toutes les tables doivent avoir :
-- - rowsecurity = true (RLS activé)
-- - Policy "Block all direct access..." (USING false, WITH CHECK false)
--
-- CONSÉQUENCES :
-- ✅ Backend avec service_role → Accès complet (bypass RLS)
-- ❌ Frontend avec anon_key → Bloqué (401)
-- ❌ Frontend avec JWT user → Bloqué (401)
-- ✅ Sécurité maximale
--
-- FLUX AUTORISÉ :
-- Frontend → API Backend (vérifie JWT) → Supabase (service_role)
-- ============================================================================

-- 6. TEST DE SÉCURITÉ (OPTIONNEL - À FAIRE DEPUIS LE FRONTEND)
-- ============================================================================
/*
// Depuis la console navigateur :
const { data, error } = await supabase
  .from('conversations')
  .select('*');

// ✅ ATTENDU : error avec code permissions
// ❌ SI data retournée : RLS ne fonctionne pas !
*/

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 1. Le backend DOIT utiliser supabaseAdmin (service_role) pour accéder aux données
-- 2. TOUTES les requêtes frontend doivent passer par l'API backend
-- 3. Cette approche garantit :
--    - Defense in depth (2 couches : API + RLS)
--    - Scalabilité (Supabase auto-scale)
--    - Audit trail (logs API + logs Supabase)
--    - Conformité RGPD (traçabilité complète)
-- 4. Si une faille est découverte dans l'API, RLS bloque toujours l'accès direct
-- ============================================================================

