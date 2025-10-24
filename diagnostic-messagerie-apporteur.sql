-- ============================================================================
-- DIAGNOSTIC COMPLET MESSAGERIE APPORTEUR
-- ============================================================================
-- Diagnostique pourquoi :
-- 1. Erreur 401 sur table Conversation
-- 2. Aucun admin dans les contacts
-- ============================================================================

-- 1. VÉRIFIER TABLE ADMIN
-- ============================================================================
-- Combien d'admins existent ?
SELECT 
  'Nombre d\'admins' as info,
  COUNT(*) as count
FROM "Admin";

-- Liste des admins
SELECT 
  id,
  first_name,
  last_name,
  email,
  created_at,
  is_active
FROM "Admin"
ORDER BY created_at DESC;

-- 2. VÉRIFIER APPORTEUR CONNECTÉ
-- ============================================================================
-- Vérifier l'apporteur conseilprofitum@gmail.com
SELECT 
  id,
  first_name,
  last_name,
  email,
  company_name,
  is_active,
  created_at
FROM "ApporteurAffaires"
WHERE email = 'conseilprofitum@gmail.com'
  OR id = '10705490-5e3b-49a2-a0db-8e3d5a5af38e';

-- 3. VÉRIFIER RLS POLICIES TABLE CONVERSATION
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'Conversation'
ORDER BY policyname;

-- 4. VÉRIFIER STRUCTURE TABLE CONVERSATION
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Conversation'
ORDER BY ordinal_position;

-- 5. TESTER ACCÈS CONVERSATION EN TANT QU'APPORTEUR
-- ============================================================================
-- Simuler l'accès avec l'ID apporteur
-- Note : Ceci ne fonctionne qu'avec la vraie session auth.uid()
SELECT 
  id,
  title,
  type,
  participant_ids,
  created_at
FROM "Conversation"
WHERE participant_ids @> ARRAY['10705490-5e3b-49a2-a0db-8e3d5a5af38e']
LIMIT 5;

-- 6. VÉRIFIER SI DES CONVERSATIONS EXISTENT
-- ============================================================================
SELECT 
  COUNT(*) as total_conversations,
  COUNT(CASE WHEN participant_ids @> ARRAY['10705490-5e3b-49a2-a0db-8e3d5a5af38e'] THEN 1 END) as conversations_apporteur
FROM "Conversation";

-- 7. VÉRIFIER ConversationParticipant
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'ConversationParticipant'
ORDER BY policyname;

-- 8. VÉRIFIER Message
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'Message'
ORDER BY policyname;

-- 9. RECOMMANDATIONS
-- ============================================================================

-- Si table Admin est vide, créer un admin de test :
/*
INSERT INTO "Admin" (id, first_name, last_name, email, password, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'Support',
  'Profitum',
  'admin@profitum.app',
  'temp_password', -- À changer
  true,
  NOW()
);
*/

-- Si policies manquantes pour Conversation, les créer :
/*
-- Policy SELECT pour apporteurs
CREATE POLICY IF NOT EXISTS "Apporteurs can view their conversations"
ON "Conversation"
FOR SELECT
TO authenticated
USING (
  participant_ids @> ARRAY[auth.uid()::text]
);

-- Policy INSERT pour apporteurs
CREATE POLICY IF NOT EXISTS "Apporteurs can create conversations"
ON "Conversation"
FOR INSERT
TO authenticated
WITH CHECK (
  participant_ids @> ARRAY[auth.uid()::text]
);

-- Policy UPDATE pour apporteurs
CREATE POLICY IF NOT EXISTS "Apporteurs can update their conversations"
ON "Conversation"
FOR UPDATE
TO authenticated
USING (participant_ids @> ARRAY[auth.uid()::text])
WITH CHECK (participant_ids @> ARRAY[auth.uid()::text]);
*/

-- ============================================================================
-- FIN DU DIAGNOSTIC
-- ============================================================================
-- INSTRUCTIONS :
-- 1. Exécuter ce script dans Supabase SQL Editor
-- 2. Partager TOUS les résultats
-- 3. On corrigera en fonction des résultats
-- ============================================================================

