-- ============================================================================
-- CORRECTION : Vue authenticated_users expose auth.users
-- ============================================================================
-- Problème : La vue authenticated_users expose auth.users aux rôles anon/authenticated
-- Solution : Recréer la vue sans exposer directement auth.users
-- ============================================================================
-- Date : 2025-01-28
-- ============================================================================

BEGIN;

-- Supprimer l'ancienne vue si elle existe
DROP VIEW IF EXISTS public.authenticated_users CASCADE;

-- Recréer la vue de manière sécurisée
-- Cette vue ne doit PAS exposer directement auth.users
-- Elle doit utiliser les tables métier (Client, Expert, Admin, ApporteurAffaires)
CREATE OR REPLACE VIEW public.authenticated_users AS
SELECT 
  COALESCE(c.id, e.id, a.id, ap.id) as id,
  COALESCE(c.auth_user_id, e.auth_user_id, a.auth_user_id, ap.auth_user_id) as auth_user_id,
  COALESCE(c.email, e.email, a.email, ap.email) as email,
  CASE 
    WHEN c.id IS NOT NULL THEN 'client'
    WHEN e.id IS NOT NULL THEN 'expert'
    WHEN a.id IS NOT NULL THEN 'admin'
    WHEN ap.id IS NOT NULL THEN 'apporteur'
    ELSE 'unknown'
  END as user_type,
  COALESCE(c.name, e.name, a.name, CONCAT(ap.first_name, ' ', ap.last_name)) as name,
  COALESCE(c.created_at, e.created_at, a.created_at, ap.created_at) as created_at
FROM "Client" c
FULL OUTER JOIN "Expert" e ON c.auth_user_id = e.auth_user_id
FULL OUTER JOIN "Admin" a ON COALESCE(c.auth_user_id, e.auth_user_id) = a.auth_user_id
FULL OUTER JOIN "ApporteurAffaires" ap ON COALESCE(c.auth_user_id, e.auth_user_id, a.auth_user_id) = ap.auth_user_id
WHERE COALESCE(c.auth_user_id, e.auth_user_id, a.auth_user_id, ap.auth_user_id) IS NOT NULL;

-- Commentaire pour documentation
COMMENT ON VIEW public.authenticated_users IS 
'Vue sécurisée des utilisateurs authentifiés. N''expose PAS auth.users directement.';

COMMIT;
