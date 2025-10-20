-- ============================================================================
-- NETTOYAGE DES CLIENTS TEMPORAIRES
-- ============================================================================

-- Compter les clients temporaires
SELECT 
  'Clients temporaires à supprimer' as type,
  COUNT(*) as nombre
FROM "Client"
WHERE email LIKE 'temp_%@profitum.temp';

-- Compter les documents liés
SELECT 
  'Documents liés aux clients temporaires' as type,
  COUNT(*) as nombre
FROM "ClientProcessDocument" cpd
INNER JOIN "Client" c ON cpd.client_id = c.id
WHERE c.email LIKE 'temp_%@profitum.temp';

-- ATTENTION: Décommentez les lignes ci-dessous UNIQUEMENT si vous voulez supprimer

-- Option 1: Supprimer les documents liés d'abord
/*
DELETE FROM "ClientProcessDocument"
WHERE client_id IN (
  SELECT id FROM "Client"
  WHERE email LIKE 'temp_%@profitum.temp'
);
*/

-- Option 2: Supprimer les clients temporaires
-- Note: Cela échouera s'il y a des contraintes FK sans CASCADE
/*
DELETE FROM "Client"
WHERE email LIKE 'temp_%@profitum.temp';
*/

-- Alternative: Désactiver plutôt que supprimer
/*
UPDATE "Client"
SET 
  is_active = false,
  company_name = 'Client Temporaire (Désactivé)'
WHERE email LIKE 'temp_%@profitum.temp';
*/

SELECT 'Script de nettoyage prêt. Décommentez les sections pour exécuter.' as info;

