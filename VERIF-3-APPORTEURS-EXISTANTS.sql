-- ============================================================================
-- VÉRIFICATION 3 : Apporteurs existants
-- ============================================================================

-- Lister tous les apporteurs avec leurs clients
SELECT 
  aa.id,
  aa.company_name,
  aa.email,
  aa.phone,
  aa.status,
  COUNT(c.id) as nombre_clients,
  COUNT(CASE WHEN c.status = 'prospect' THEN 1 END) as prospects,
  COUNT(CASE WHEN c.status = 'client' THEN 1 END) as clients
FROM "ApporteurAffaires" aa
LEFT JOIN "Client" c ON c.apporteur_id = aa.id
GROUP BY aa.id, aa.company_name, aa.email, aa.phone, aa.status
ORDER BY aa.created_at DESC
LIMIT 10;

-- Compteur total
SELECT 
  COUNT(*) as total_apporteurs,
  COUNT(CASE WHEN status = 'actif' THEN 1 END) as apporteurs_actifs
FROM "ApporteurAffaires";

-- Vérifier si l'expert existe
SELECT 
  id,
  email,
  first_name,
  last_name,
  type,
  status
FROM "ApporteurAffaires"
WHERE id = '2678526c-488f-45a1-818a-f9ce48882d26';
