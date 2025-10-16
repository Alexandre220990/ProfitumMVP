-- ============================================================================
-- NETTOYAGE CLIENTS TEMPORAIRES - PROFITUM
-- ============================================================================
-- Date: 16 octobre 2025
-- Objectif: Supprimer les clients de test/temporaires
-- Sécurité: Vérifications avant suppression

-- ============================================================================
-- ÉTAPE 1 : IDENTIFIER LES CLIENTS TEMPORAIRES
-- ============================================================================

\echo '🔍 CLIENTS TEMPORAIRES IDENTIFIÉS:'
SELECT 
  id,
  email,
  first_name,
  last_name,
  company_name,
  created_at
FROM "Client"
WHERE 
  -- Emails temporaires
  email LIKE '%@profitum.temp%'
  OR email LIKE 'temp_%@%'
  OR company_name LIKE '%Temporaire%'
  OR (first_name = 'Client' AND last_name = 'Temporaire')
ORDER BY created_at DESC;

-- ============================================================================
-- ÉTAPE 2 : VÉRIFIER DÉPENDANCES (IMPORTANT !)
-- ============================================================================

\echo ''
\echo '⚠️ VÉRIFICATION DÉPENDANCES - ClientProduitEligible:'
SELECT 
  c.id as client_id,
  c.email as client_email,
  c.company_name,
  COUNT(cpe.id) as nb_dossiers
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
WHERE 
  c.email LIKE '%@profitum.temp%'
  OR c.email LIKE 'temp_%@%'
  OR c.company_name LIKE '%Temporaire%'
GROUP BY c.id, c.email, c.company_name
HAVING COUNT(cpe.id) > 0;

\echo ''
\echo '⚠️ VÉRIFICATION DÉPENDANCES - Autres tables:'
-- Vérifier s'il y a d'autres relations
SELECT 
  'ClientProduitEligible' as table_name,
  COUNT(*) as records_affected
FROM "ClientProduitEligible"
WHERE "clientId" IN (
  SELECT id FROM "Client"
  WHERE email LIKE '%@profitum.temp%'
     OR email LIKE 'temp_%@%'
     OR company_name LIKE '%Temporaire%'
);

-- ============================================================================
-- ÉTAPE 3 : SUPPRESSION SÉCURISÉE (CASCADE)
-- ============================================================================

-- Option A : Supprimer AVEC les dossiers associés (CASCADE)
/*
\echo ''
\echo '🗑️ SUPPRESSION AVEC CASCADE (dossiers inclus):'

-- Supprimer d'abord les dépendances manuellement
DELETE FROM "ClientProduitEligible"
WHERE "clientId" IN (
  SELECT id FROM "Client"
  WHERE email LIKE '%@profitum.temp%'
     OR email LIKE 'temp_%@%'
     OR company_name LIKE '%Temporaire%'
);

-- Puis supprimer les clients
DELETE FROM "Client"
WHERE 
  email LIKE '%@profitum.temp%'
  OR email LIKE 'temp_%@%'
  OR company_name LIKE '%Temporaire%';

\echo '✅ Clients temporaires supprimés avec leurs dossiers'
*/

-- Option B : Supprimer SEULEMENT clients sans dossiers (SAFE)
\echo ''
\echo '🗑️ SUPPRESSION SÉCURISÉE (seulement clients sans dossiers):'

DELETE FROM "Client"
WHERE 
  (email LIKE '%@profitum.temp%'
   OR email LIKE 'temp_%@%'
   OR company_name LIKE '%Temporaire%')
  AND id NOT IN (
    SELECT DISTINCT "clientId" 
    FROM "ClientProduitEligible"
    WHERE "clientId" IS NOT NULL
  );

-- ============================================================================
-- ÉTAPE 4 : VÉRIFICATION POST-SUPPRESSION
-- ============================================================================

\echo ''
\echo '✅ VÉRIFICATION - Clients restants:'
SELECT 
  COUNT(*) as total_clients,
  COUNT(CASE WHEN email LIKE '%@profitum.temp%' THEN 1 END) as clients_temp_restants
FROM "Client";

\echo ''
\echo '📋 Liste finale des clients:'
SELECT 
  id,
  email,
  first_name,
  last_name,
  company_name,
  created_at
FROM "Client"
ORDER BY created_at DESC;

-- ============================================================================
-- ÉTAPE 5 : NETTOYAGE AUTH (Supabase)
-- ============================================================================

\echo ''
\echo '⚠️ NOTE IMPORTANTE:'
\echo 'Les comptes Supabase Auth doivent être supprimés manuellement depuis:'
\echo '1. Dashboard Supabase → Authentication → Users'
\echo '2. Ou via API Supabase Admin'
\echo ''
\echo 'Comptes à supprimer:'
SELECT 
  email,
  auth_user_id
FROM "Client"
WHERE 
  email LIKE '%@profitum.temp%'
  OR email LIKE 'temp_%@%';

-- ============================================================================
-- ROLLBACK (SI ERREUR)
-- ============================================================================

/*
-- Les clients temporaires ne peuvent pas être restaurés
-- Mais s'ils ont été supprimés par erreur, vérifier les backups Supabase
*/

