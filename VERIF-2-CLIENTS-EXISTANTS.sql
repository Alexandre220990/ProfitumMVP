-- ============================================================================
-- VÉRIFICATION 2 : Clients existants avec apporteur
-- ============================================================================

-- Lister tous les clients avec leur apporteur
SELECT 
  c.id,
  c.company_name,
  c.name,
  c.email,
  c.apporteur_id,
  aa.company_name as apporteur_nom,
  COUNT(cpe.id) as nombre_cpe_existants,
  COUNT(CASE WHEN cpe.expert_id = '2678526c-488f-45a1-818a-f9ce48882d26' THEN 1 END) as cpe_deja_assignes
FROM "Client" c
LEFT JOIN "ApporteurAffaires" aa ON aa.id = c.apporteur_id
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
WHERE c.apporteur_id IS NOT NULL
GROUP BY c.id, c.company_name, c.name, c.email, c.apporteur_id, aa.company_name
ORDER BY c.created_at DESC
LIMIT 10;

-- Compteur total
SELECT 
  COUNT(*) as total_clients_avec_apporteur,
  COUNT(DISTINCT apporteur_id) as nombre_apporteurs
FROM "Client"
WHERE apporteur_id IS NOT NULL;

