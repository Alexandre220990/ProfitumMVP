-- ============================================================================
-- ÉTAPE 3 : VÉRIFIER MAPPING AUTH <-> APPORTEUR
-- ============================================================================

-- 1. Vérifier l'apporteur dans la table métier
SELECT 
  id as apporteur_id,
  email,
  first_name,
  last_name,
  auth_id,
  is_active,
  created_at
FROM "ApporteurAffaires"
WHERE email = 'conseilprofitum@gmail.com'
   OR id = '10705490-5e3b-49a2-a0db-8e3d5a5af38e';

-- 2. Vérifier si l'apporteur a un auth.users
-- (chercher dans auth.users via email)
SELECT 
  id as auth_user_id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'conseilprofitum@gmail.com';

-- 3. Vérifier les participant_ids des conversations existantes
SELECT 
  id,
  type,
  title,
  participant_ids,
  created_at
FROM conversations
ORDER BY created_at DESC
LIMIT 5;

-- 4. Chercher si l'apporteur est dans des participant_ids
SELECT 
  id,
  type,
  title,
  participant_ids,
  created_at
FROM conversations
WHERE participant_ids @> ARRAY['10705490-5e3b-49a2-a0db-8e3d5a5af38e']
   OR participant_ids::text LIKE '%10705490-5e3b-49a2-a0db-8e3d5a5af38e%';

-- 5. Vérifier la fonction auth.uid() actuelle
-- Note : Ceci retournera l'ID de l'utilisateur actuellement connecté
-- Si vous êtes connecté en tant qu'apporteur, ça devrait retourner son auth_id
SELECT auth.uid() as current_auth_uid;

-- 6. Vérifier authenticated_users (si cette table/vue existe)
SELECT 
  id,
  email,
  user_type,
  database_id
FROM authenticated_users
WHERE email = 'conseilprofitum@gmail.com'
   OR id = '10705490-5e3b-49a2-a0db-8e3d5a5af38e'
LIMIT 5;

-- Si erreur "table n'existe pas", ignorer cette section

