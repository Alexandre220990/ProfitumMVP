-- ============================================================================
-- VÉRIFICATION 2D : Vrais clients (non temporaires)
-- ============================================================================

-- TOUS LES CLIENTS RÉELS
SELECT 
  c.id,
  c.company_name,
  c.name,
  c.email,
  c.status,
  c.apporteur_id,
  aa.company_name as apporteur_nom,
  c.created_at,
  COUNT(cpe.id) as nombre_cpe_existants,
  COUNT(CASE WHEN cpe.expert_id = '2678526c-488f-45a1-818a-f9ce48882d26' THEN 1 END) as cpe_deja_assignes
FROM "Client" c
LEFT JOIN "ApporteurAffaires" aa ON aa.id = c.apporteur_id
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
WHERE c.email NOT LIKE '%@profitum.temp'
GROUP BY c.id, c.company_name, c.name, c.email, c.status, c.apporteur_id, aa.company_name, c.created_at
ORDER BY c.created_at DESC;

-- COMPTEUR GLOBAL
SELECT 
  COUNT(*) as total_clients_reels,
  COUNT(CASE WHEN apporteur_id IS NOT NULL THEN 1 END) as avec_apporteur,
  COUNT(CASE WHEN apporteur_id IS NULL THEN 1 END) as sans_apporteur,
  COUNT(CASE WHEN status = 'prospect' THEN 1 END) as prospects,
  COUNT(CASE WHEN status = 'client' THEN 1 END) as clients
FROM "Client"
WHERE email NOT LIKE '%@profitum.temp';

-- RECHERCHE SPÉCIFIQUE GRANDJEAN.LAPORTE
SELECT 
  id,
  company_name,
  name,
  email,
  status,
  apporteur_id,
  created_at
FROM "Client"
WHERE email ILIKE '%grandjean.laporte%' OR email ILIKE '%laporte%'
  AND email NOT LIKE '%@profitum.temp';

