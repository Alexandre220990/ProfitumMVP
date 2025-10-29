-- ============================================================================
-- NETTOYAGE : Suppression des clients temporaires
-- ============================================================================

-- ÉTAPE 1 : Compter avant suppression
SELECT 
  COUNT(*) as total_clients_temp,
  COUNT(CASE WHEN apporteur_id IS NULL THEN 1 END) as sans_apporteur
FROM "Client"
WHERE email LIKE '%@profitum.temp';

-- ÉTAPE 2 : Supprimer les CPE liés aux clients temporaires
DELETE FROM "ClientProduitEligible"
WHERE "clientId" IN (
  SELECT id FROM "Client" WHERE email LIKE '%@profitum.temp'
);

-- ÉTAPE 3 : Supprimer les clients temporaires
DELETE FROM "Client"
WHERE email LIKE '%@profitum.temp';

-- ÉTAPE 4 : Vérification après suppression
SELECT 
  COUNT(*) as total_clients_restants,
  COUNT(CASE WHEN apporteur_id IS NULL THEN 1 END) as sans_apporteur,
  COUNT(CASE WHEN apporteur_id IS NOT NULL THEN 1 END) as avec_apporteur
FROM "Client";

