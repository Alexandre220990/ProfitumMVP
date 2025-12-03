-- ============================================================================
-- NETTOYAGE SIMPLE DES DOUBLONS
-- ============================================================================
-- Supprime les profils en double pour garantir 1 email = 1 type
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : VÉRIFICATION AVANT SUPPRESSION
-- ============================================================================

-- Vérifier grandjean.alexandre5@gmail.com
SELECT 'grandjean.alexandre5 - Client' as source, COUNT(*) as count FROM "Client" WHERE email = 'grandjean.alexandre5@gmail.com'
UNION ALL
SELECT 'grandjean.alexandre5 - Expert', COUNT(*) FROM "Expert" WHERE email = 'grandjean.alexandre5@gmail.com'
UNION ALL
SELECT 'grandjean.alexandre5 - ApporteurAffaires', COUNT(*) FROM "ApporteurAffaires" WHERE email = 'grandjean.alexandre5@gmail.com'
UNION ALL
SELECT 'grandjean.alexandre5 - Admin', COUNT(*) FROM "Admin" WHERE email = 'grandjean.alexandre5@gmail.com';

-- Vérifier alainbonin@gmail.com
SELECT 'alainbonin - Client' as source, COUNT(*) as count FROM "Client" WHERE email = 'alainbonin@gmail.com'
UNION ALL
SELECT 'alainbonin - Expert', COUNT(*) FROM "Expert" WHERE email = 'alainbonin@gmail.com'
UNION ALL
SELECT 'alainbonin - ApporteurAffaires', COUNT(*) FROM "ApporteurAffaires" WHERE email = 'alainbonin@gmail.com'
UNION ALL
SELECT 'alainbonin - Admin', COUNT(*) FROM "Admin" WHERE email = 'alainbonin@gmail.com';

-- ============================================================================
-- ÉTAPE 2 : SUPPRESSION DES DOUBLONS - ADMINS UNIQUEMENT
-- ============================================================================

-- Supprimer grandjean.alexandre5@gmail.com de toutes les tables SAUF Admin
DELETE FROM "Client" WHERE email = 'grandjean.alexandre5@gmail.com';
DELETE FROM "Expert" WHERE email = 'grandjean.alexandre5@gmail.com';
DELETE FROM "ApporteurAffaires" WHERE email = 'grandjean.alexandre5@gmail.com';

-- Supprimer alainbonin@gmail.com de toutes les tables SAUF Admin
DELETE FROM "Client" WHERE email = 'alainbonin@gmail.com';
DELETE FROM "Expert" WHERE email = 'alainbonin@gmail.com';
DELETE FROM "ApporteurAffaires" WHERE email = 'alainbonin@gmail.com';

-- ============================================================================
-- ÉTAPE 3 : MISE À JOUR auth.users.raw_user_meta_data
-- ============================================================================

-- Mettre à jour le type 'admin' dans user_metadata pour grandjean.alexandre5
UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{type}',
    '"admin"'::jsonb
  ),
  updated_at = NOW()
WHERE email = 'grandjean.alexandre5@gmail.com';

-- Mettre à jour le type 'admin' dans user_metadata pour alainbonin
UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{type}',
    '"admin"'::jsonb
  ),
  updated_at = NOW()
WHERE email = 'alainbonin@gmail.com';

-- ============================================================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que grandjean.alexandre5 n'est plus que dans Admin
SELECT 'APRÈS NETTOYAGE - grandjean.alexandre5' as status;
SELECT 'Client' as table_name, COUNT(*) as count FROM "Client" WHERE email = 'grandjean.alexandre5@gmail.com'
UNION ALL
SELECT 'Expert', COUNT(*) FROM "Expert" WHERE email = 'grandjean.alexandre5@gmail.com'
UNION ALL
SELECT 'ApporteurAffaires', COUNT(*) FROM "ApporteurAffaires" WHERE email = 'grandjean.alexandre5@gmail.com'
UNION ALL
SELECT 'Admin', COUNT(*) FROM "Admin" WHERE email = 'grandjean.alexandre5@gmail.com';

-- Vérifier que alainbonin n'est plus que dans Admin
SELECT 'APRÈS NETTOYAGE - alainbonin' as status;
SELECT 'Client' as table_name, COUNT(*) as count FROM "Client" WHERE email = 'alainbonin@gmail.com'
UNION ALL
SELECT 'Expert', COUNT(*) FROM "Expert" WHERE email = 'alainbonin@gmail.com'
UNION ALL
SELECT 'ApporteurAffaires', COUNT(*) FROM "ApporteurAffaires" WHERE email = 'alainbonin@gmail.com'
UNION ALL
SELECT 'Admin', COUNT(*) FROM "Admin" WHERE email = 'alainbonin@gmail.com';

-- Vérifier dans authenticated_users (devrait montrer uniquement admin)
SELECT 
  email,
  user_type,
  raw_user_meta_data->>'type' as metadata_type
FROM authenticated_users
WHERE email IN ('grandjean.alexandre5@gmail.com', 'alainbonin@gmail.com')
ORDER BY email, user_type;

-- Résultat attendu : 
-- grandjean.alexandre5@gmail.com | admin | admin
-- alainbonin@gmail.com | admin | admin

COMMIT;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- Ce script nettoie UNIQUEMENT vos 2 admins (grandjean.alexandre5 + alainbonin)
-- Pour les autres doublons, utilisez le script séparé de nettoyage massif
-- ============================================================================

