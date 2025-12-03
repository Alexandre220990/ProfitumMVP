-- ============================================================================
-- NETTOYAGE COMPLET DE LA VUE authenticated_users
-- ============================================================================
-- Objectif: Nettoyer les doublons dans les tables source pour que chaque
--           auth_user_id n'apparaisse qu'UNE SEULE FOIS dans authenticated_users
-- ============================================================================
-- Date: 3 décembre 2025
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTIE 1 : ADMINS SPÉCIFIQUES (grandjean.alexandre5 + alainbonin)
-- ============================================================================

-- Ces 2 emails doivent être UNIQUEMENT admin
-- Supprimer de Client et Expert

DELETE FROM "Client" 
WHERE email IN ('grandjean.alexandre5@gmail.com', 'alainbonin@gmail.com');

DELETE FROM "Expert" 
WHERE email IN ('grandjean.alexandre5@gmail.com', 'alainbonin@gmail.com');

DELETE FROM "ApporteurAffaires" 
WHERE email IN ('grandjean.alexandre5@gmail.com', 'alainbonin@gmail.com');

-- Vérifier qu'ils restent dans Admin
SELECT 'VÉRIFICATION ADMINS' as status, id, email, name, role 
FROM "Admin" 
WHERE email IN ('grandjean.alexandre5@gmail.com', 'alainbonin@gmail.com');

-- ============================================================================
-- PARTIE 2 : NETTOYAGE AUTOMATIQUE DES AUTRES DOUBLONS
-- ============================================================================
-- Stratégie: Garder le profil RÉEL (celui qui a des données dans la table métier)
--           Supprimer le profil FANTÔME (créé automatiquement sans données)
-- ============================================================================

-- ========================================
-- 2.1. Identifier les profils Client FANTÔMES
-- ========================================
-- Un client fantôme = dans authenticated_users avec user_type='client'
--                      MAIS PAS dans la vraie table Client

WITH client_in_view AS (
  -- Tous les emails marqués 'client' dans authenticated_users
  SELECT DISTINCT id as auth_user_id, email
  FROM auth.users
  WHERE raw_user_meta_data->>'type' = 'client'
),
client_real AS (
  -- Tous les emails qui existent VRAIMENT dans Client
  SELECT DISTINCT auth_user_id, email
  FROM "Client"
  WHERE auth_user_id IS NOT NULL
),
phantom_clients AS (
  -- Ceux qui sont dans la vue mais pas dans la vraie table
  SELECT v.auth_user_id, v.email
  FROM client_in_view v
  LEFT JOIN client_real r ON v.auth_user_id = r.auth_user_id
  WHERE r.auth_user_id IS NULL
)
SELECT 
  'PHANTOM CLIENT À NETTOYER' as status,
  auth_user_id, 
  email
FROM phantom_clients;

-- ========================================
-- 2.2. Identifier les profils Expert FANTÔMES  
-- ========================================

WITH expert_in_view AS (
  SELECT DISTINCT id as auth_user_id, email
  FROM auth.users
  WHERE raw_user_meta_data->>'type' = 'expert'
),
expert_real AS (
  SELECT DISTINCT auth_user_id, email
  FROM "Expert"
  WHERE auth_user_id IS NOT NULL
),
phantom_experts AS (
  SELECT v.auth_user_id, v.email
  FROM expert_in_view v
  LEFT JOIN expert_real r ON v.auth_user_id = r.auth_user_id
  WHERE r.auth_user_id IS NULL
)
SELECT 
  'PHANTOM EXPERT À NETTOYER' as status,
  auth_user_id, 
  email
FROM phantom_experts;

-- ============================================================================
-- PARTIE 3 : NETTOYAGE MASSIF - Supprimer les doublons
-- ============================================================================
-- Pour chaque email qui a plusieurs user_type dans auth.users,
-- on garde UNIQUEMENT le type qui correspond à une vraie table métier
-- ============================================================================

-- ========================================
-- 3.1. Stratégie de décision par email
-- ========================================

WITH email_analysis AS (
  SELECT 
    email,
    COUNT(DISTINCT (raw_user_meta_data->>'type')) as nb_types,
    BOOL_OR(CASE WHEN (raw_user_meta_data->>'type') = 'client' THEN EXISTS(
      SELECT 1 FROM "Client" c WHERE c.auth_user_id = auth.users.id
    ) ELSE false END) as has_real_client,
    BOOL_OR(CASE WHEN (raw_user_meta_data->>'type') = 'expert' THEN EXISTS(
      SELECT 1 FROM "Expert" e WHERE e.auth_user_id = auth.users.id
    ) ELSE false END) as has_real_expert,
    BOOL_OR(CASE WHEN (raw_user_meta_data->>'type') = 'admin' THEN EXISTS(
      SELECT 1 FROM "Admin" a WHERE a.auth_user_id = auth.users.id
    ) ELSE false END) as has_real_admin,
    BOOL_OR(CASE WHEN (raw_user_meta_data->>'type') = 'apporteur' THEN EXISTS(
      SELECT 1 FROM "ApporteurAffaires" ap WHERE ap.auth_user_id = auth.users.id
    ) ELSE false END) as has_real_apporteur,
    MAX(id) as auth_user_id
  FROM auth.users
  GROUP BY email
  HAVING COUNT(DISTINCT (raw_user_meta_data->>'type')) > 1
)
SELECT 
  email,
  nb_types,
  CASE 
    WHEN has_real_admin THEN 'admin'
    WHEN has_real_expert THEN 'expert'
    WHEN has_real_apporteur THEN 'apporteur'
    WHEN has_real_client THEN 'client'
    ELSE 'AUCUN'
  END as type_a_garder,
  has_real_client,
  has_real_expert,
  has_real_admin,
  has_real_apporteur
FROM email_analysis
ORDER BY email;

-- ============================================================================
-- PARTIE 4 : MISE À JOUR DE auth.users.raw_user_meta_data
-- ============================================================================
-- Pour chaque compte, on met le SEUL type qui correspond à la vraie table
-- ============================================================================

-- ⚠️ ATTENTION : Cette partie modifie directement auth.users
-- Décommenter après vérification manuelle

/*
-- Mettre à jour les metadata pour refléter le vrai type
UPDATE auth.users au
SET 
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{type}',
    to_jsonb(
      CASE 
        WHEN EXISTS(SELECT 1 FROM "Admin" WHERE auth_user_id = au.id) THEN 'admin'
        WHEN EXISTS(SELECT 1 FROM "Expert" WHERE auth_user_id = au.id) THEN 'expert'
        WHEN EXISTS(SELECT 1 FROM "ApporteurAffaires" WHERE auth_user_id = au.id) THEN 'apporteur'
        WHEN EXISTS(SELECT 1 FROM "Client" WHERE auth_user_id = au.id) THEN 'client'
        ELSE 'unknown'
      END
    )
  ),
  updated_at = NOW()
WHERE 
  -- Seulement si le type dans metadata ne correspond pas à la réalité
  COALESCE(raw_user_meta_data->>'type', 'unknown') != (
    CASE 
      WHEN EXISTS(SELECT 1 FROM "Admin" WHERE auth_user_id = au.id) THEN 'admin'
      WHEN EXISTS(SELECT 1 FROM "Expert" WHERE auth_user_id = au.id) THEN 'expert'
      WHEN EXISTS(SELECT 1 FROM "ApporteurAffaires" WHERE auth_user_id = au.id) THEN 'apporteur'
      WHEN EXISTS(SELECT 1 FROM "Client" WHERE auth_user_id = au.id) THEN 'client'
      ELSE 'unknown'
    END
  );
*/

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Compter les occurrences par email dans authenticated_users
-- Après nettoyage, chaque email devrait apparaître 1 seule fois

SELECT 
  email,
  COUNT(*) as nb_occurrences,
  STRING_AGG(DISTINCT user_type, ', ') as types
FROM authenticated_users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY nb_occurrences DESC;

-- Résultat attendu : AUCUNE ligne (tous les doublons nettoyés)

COMMIT;

-- ============================================================================
-- INSTRUCTIONS D'EXÉCUTION
-- ============================================================================
--
-- 1. Exécuter PARTIE 1 pour nettoyer les 2 admins spécifiques
-- 2. Vérifier le résultat
-- 3. Exécuter PARTIE 2 pour identifier les autres doublons
-- 4. Décommenter PARTIE 4 pour mettre à jour auth.users.raw_user_meta_data
-- 5. Exécuter la VÉRIFICATION FINALE
--
-- ============================================================================

