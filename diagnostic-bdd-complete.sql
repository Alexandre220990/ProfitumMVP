-- ============================================================================
-- DIAGNOSTIC COMPLET DE LA BASE DE DONNÉES
-- ============================================================================

-- 1. Toutes les tables liées aux simulations
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND columns.table_name = tables.table_name) as nb_colonnes
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND (LOWER(table_name) LIKE '%simul%' 
    OR LOWER(table_name) LIKE '%reponse%'
    OR LOWER(table_name) LIKE '%answer%'
    OR LOWER(table_name) LIKE '%question%')
ORDER BY table_name;

-- 2. Structure de chaque table simulation
-- SimulationProcessed
SELECT 'SimulationProcessed' as table_name, column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'SimulationProcessed'
ORDER BY ordinal_position;

-- simulationhistory  
SELECT 'simulationhistory' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'simulationhistory'
ORDER BY ordinal_position;

-- TICPESimulationResults
SELECT 'TICPESimulationResults' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'TICPESimulationResults'
ORDER BY ordinal_position;

-- Question
SELECT 'Question' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'Question'
ORDER BY ordinal_position;

-- QuestionnaireQuestion
SELECT 'QuestionnaireQuestion' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'QuestionnaireQuestion'
ORDER BY ordinal_position;

-- 3. Vérifier le contenu récent de chaque table

-- simulations
SELECT 'simulations - CONTENT' as info,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'en_cours' THEN 1 END) as en_cours,
  COUNT(CASE WHEN answers IS NOT NULL AND answers != '{}'::jsonb THEN 1 END) as with_answers,
  COUNT(CASE WHEN results IS NOT NULL AND results != '{}'::jsonb THEN 1 END) as with_results
FROM simulations;

-- SimulationProcessed
SELECT 'SimulationProcessed - CONTENT' as info, COUNT(*) as total
FROM "SimulationProcessed";

-- simulationhistory
SELECT 'simulationhistory - CONTENT' as info, COUNT(*) as total
FROM simulationhistory;

-- 4. Voir les 3 dernières simulations avec détails complets
SELECT 
  id,
  client_id,
  session_token,
  status,
  type,
  jsonb_pretty(answers) as answers_detail,
  jsonb_pretty(results) as results_detail,
  created_at,
  updated_at
FROM simulations
WHERE client_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- 5. Vérifier les ClientProduitEligible récents
SELECT 
  COUNT(*) as total_cpe,
  COUNT(CASE WHEN statut = 'eligible' THEN 1 END) as eligible_count,
  COUNT(CASE WHEN statut = 'non_eligible' THEN 1 END) as non_eligible_count,
  COUNT(CASE WHEN "montantFinal" IS NOT NULL AND "montantFinal" > 0 THEN 1 END) as with_montant,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM "ClientProduitEligible";

-- 6. Voir tous les ClientProduitEligible (si peu)
SELECT 
  cpe.id,
  cpe."clientId",
  cpe."simulationId",
  p.nom as produit,
  cpe.statut,
  cpe."montantFinal",
  cpe.created_at
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" p ON p.id = cpe."produitId"
ORDER BY cpe.created_at DESC
LIMIT 20;

