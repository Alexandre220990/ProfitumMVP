-- ============================================================================
-- NETTOYAGE DES DOUBLES PROFILS
-- ============================================================================
-- Date: 3 décembre 2025
-- Objectif: Supprimer les profils en double pour garantir 1 email = 1 type
-- grandjean.alexandre5@gmail.com → Admin uniquement
-- alainbonin@gmail.com → Admin uniquement
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : VÉRIFICATION DES DOUBLONS
-- ============================================================================

-- Rechercher grandjean.alexandre5@gmail.com dans toutes les tables
SELECT 'grandjean.alexandre5@gmail.com - Client' AS source, id, email, created_at 
FROM "Client" 
WHERE email = 'grandjean.alexandre5@gmail.com'
UNION ALL
SELECT 'grandjean.alexandre5@gmail.com - Expert' AS source, id, email, created_at 
FROM "Expert" 
WHERE email = 'grandjean.alexandre5@gmail.com'
UNION ALL
SELECT 'grandjean.alexandre5@gmail.com - ApporteurAffaires' AS source, id, email, created_at 
FROM "ApporteurAffaires" 
WHERE email = 'grandjean.alexandre5@gmail.com'
UNION ALL
SELECT 'grandjean.alexandre5@gmail.com - Admin' AS source, id, email, created_at 
FROM "Admin" 
WHERE email = 'grandjean.alexandre5@gmail.com';

-- Rechercher alainbonin@gmail.com dans toutes les tables
SELECT 'alainbonin@gmail.com - Client' AS source, id, email, created_at 
FROM "Client" 
WHERE email = 'alainbonin@gmail.com'
UNION ALL
SELECT 'alainbonin@gmail.com - Expert' AS source, id, email, created_at 
FROM "Expert" 
WHERE email = 'alainbonin@gmail.com'
UNION ALL
SELECT 'alainbonin@gmail.com - ApporteurAffaires' AS source, id, email, created_at 
FROM "ApporteurAffaires" 
WHERE email = 'alainbonin@gmail.com'
UNION ALL
SELECT 'alainbonin@gmail.com - Admin' AS source, id, email, created_at 
FROM "Admin" 
WHERE email = 'alainbonin@gmail.com';

-- ============================================================================
-- ÉTAPE 2 : SUPPRESSION DES DOUBLONS (GARDER UNIQUEMENT ADMIN)
-- ============================================================================

-- ATTENTION : Cette étape supprime DÉFINITIVEMENT les profils non-admin
-- Décommenter uniquement après vérification de l'étape 1

-- Supprimer grandjean.alexandre5@gmail.com de Client (si existe)
-- DELETE FROM "Client" 
-- WHERE email = 'grandjean.alexandre5@gmail.com';

-- Supprimer grandjean.alexandre5@gmail.com de Expert (si existe)
-- DELETE FROM "Expert" 
-- WHERE email = 'grandjean.alexandre5@gmail.com';

-- Supprimer grandjean.alexandre5@gmail.com de ApporteurAffaires (si existe)
-- DELETE FROM "ApporteurAffaires" 
-- WHERE email = 'grandjean.alexandre5@gmail.com';

-- Supprimer alainbonin@gmail.com de Client (si existe)
-- DELETE FROM "Client" 
-- WHERE email = 'alainbonin@gmail.com';

-- Supprimer alainbonin@gmail.com de Expert (si existe)
-- DELETE FROM "Expert" 
-- WHERE email = 'alainbonin@gmail.com';

-- Supprimer alainbonin@gmail.com de ApporteurAffaires (si existe)
-- DELETE FROM "ApporteurAffaires" 
-- WHERE email = 'alainbonin@gmail.com';

-- ============================================================================
-- ÉTAPE 3 : VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que les admins existent toujours dans Admin
-- SELECT 'VÉRIFICATION FINALE' AS status, id, email, name, role, is_active 
-- FROM "Admin" 
-- WHERE email IN ('grandjean.alexandre5@gmail.com', 'alainbonin@gmail.com');

-- Compter les occurrences de chaque email dans toutes les tables
-- SELECT email, COUNT(*) as occurrences
-- FROM (
--   SELECT email FROM "Client" WHERE email IN ('grandjean.alexandre5@gmail.com', 'alainbonin@gmail.com')
--   UNION ALL
--   SELECT email FROM "Expert" WHERE email IN ('grandjean.alexandre5@gmail.com', 'alainbonin@gmail.com')
--   UNION ALL
--   SELECT email FROM "ApporteurAffaires" WHERE email IN ('grandjean.alexandre5@gmail.com', 'alainbonin@gmail.com')
--   UNION ALL
--   SELECT email FROM "Admin" WHERE email IN ('grandjean.alexandre5@gmail.com', 'alainbonin@gmail.com')
-- ) AS all_emails
-- GROUP BY email;

-- Résultat attendu : 1 occurrence par email (uniquement dans Admin)

COMMIT;

-- ============================================================================
-- INSTRUCTIONS D'EXÉCUTION
-- ============================================================================
--
-- 1. Exécuter d'abord avec uniquement l'ÉTAPE 1 (vérification)
-- 2. Vérifier les résultats
-- 3. Si tout est OK, décommenter l'ÉTAPE 2 et exécuter
-- 4. Décommenter l'ÉTAPE 3 pour vérifier le nettoyage
--
-- ⚠️ SAUVEGARDE RECOMMANDÉE avant suppression !
-- ============================================================================

