-- ============================================================================
-- VÉRIFICATION 2B : Clients SANS apporteur
-- ============================================================================

-- Lister tous les clients SANS apporteur
SELECT 
  c.id,
  c.company_name,
  c.name,
  c.email,
  c.status,
  c.created_at,
  COUNT(cpe.id) as nombre_cpe_existants,
  COUNT(CASE WHEN cpe.expert_id = '2678526c-488f-45a1-818a-f9ce48882d26' THEN 1 END) as cpe_deja_assignes
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
WHERE c.apporteur_id IS NULL
GROUP BY c.id, c.company_name, c.name, c.email, c.status, c.created_at
ORDER BY c.created_at DESC
LIMIT 15;

-- Compteur total
SELECT 
  COUNT(*) as total_clients_sans_apporteur,
  COUNT(CASE WHEN status = 'prospect' THEN 1 END) as prospects,
  COUNT(CASE WHEN status = 'client' THEN 1 END) as clients
FROM "Client"
WHERE apporteur_id IS NULL;

-- Recherche spécifique grandjean.laporte@gmail.com
SELECT 
  id,
  company_name,
  name,
  email,
  status,
  apporteur_id,
  created_at
FROM "Client"
WHERE email ILIKE '%grandjean.laporte%' OR email ILIKE '%laporte%';

