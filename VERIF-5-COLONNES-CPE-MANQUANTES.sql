-- ============================================================================
-- VÉRIFICATION 5 : Colonnes utilisées dans le code vs colonnes réelles
-- ============================================================================

-- Colonnes RÉELLES dans ClientProduitEligible (depuis VERIF-1)
-- id, clientId, produitId, statut, tauxFinal, montantFinal, dureeFinale,
-- created_at, updated_at, simulationId, metadata, notes, priorite,
-- dateEligibilite, current_step, progress, expert_id, charte_signed,
-- charte_signed_at, sessionId, simulation_id, calcul_details

-- COLONNES MANQUANTES UTILISÉES DANS LE CODE :
-- 1. validation_state
-- 2. expert_notes
-- 3. documents_uploaded
-- 4. closing_probability
-- 5. produitEligibleId (le code utilise produitEligibleId mais la table a produitId)

-- Vérifier s'il existe des CPE avec expert_id assigné
SELECT 
  id,
  "clientId",
  "produitId",
  statut,
  expert_id,
  "montantFinal",
  priorite,
  current_step,
  progress,
  created_at
FROM "ClientProduitEligible"
WHERE expert_id IS NOT NULL
LIMIT 10;

-- Compter les CPE par statut
SELECT 
  statut,
  COUNT(*) as nombre,
  COUNT(CASE WHEN expert_id = '2678526c-488f-45a1-818a-f9ce48882d26' THEN 1 END) as assignes_expert
FROM "ClientProduitEligible"
GROUP BY statut;

-- Lister TOUS les CPE existants
SELECT 
  cpe.id,
  cpe."clientId",
  c.company_name as client_nom,
  cpe."produitId",
  cpe.statut,
  cpe.expert_id,
  cpe."montantFinal",
  cpe.priorite,
  cpe.created_at
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
ORDER BY cpe.created_at DESC;

