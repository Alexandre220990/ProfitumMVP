-- ============================================================================
-- Script SQL : Initialiser les produits des cabinets à partir des experts
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Pour chaque cabinet, créer des entrées CabinetProduitEligible
--           basées sur les produits des experts du cabinet
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : Vérifications préalables
-- ============================================================================

-- Vérifier que les tables existent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'CabinetProduitEligible'
  ) THEN
    RAISE EXCEPTION 'La table CabinetProduitEligible n''existe pas';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ExpertProduitEligible'
  ) THEN
    RAISE EXCEPTION 'La table ExpertProduitEligible n''existe pas';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2 : Analyser les produits des experts par cabinet
-- ============================================================================

-- Voir quels produits sont utilisés par les experts de chaque cabinet
SELECT 
  e.cabinet_id,
  c.name AS cabinet_name,
  epe.produit_id,
  pe.nom AS produit_nom,
  COUNT(DISTINCT epe.expert_id) AS nombre_experts_avec_produit,
  AVG(epe."client_fee_percentage") AS moyenne_client_fee,
  MIN(epe."client_fee_percentage") AS min_client_fee,
  MAX(epe."client_fee_percentage") AS max_client_fee
FROM "Expert" e
JOIN "Cabinet" c ON c.id = e.cabinet_id
JOIN "ExpertProduitEligible" epe ON epe.expert_id = e.id
JOIN "ProduitEligible" pe ON pe.id = epe.produit_id
WHERE e.cabinet_id IS NOT NULL
  AND epe.statut = 'actif'
GROUP BY e.cabinet_id, c.name, epe.produit_id, pe.nom
ORDER BY c.name, pe.nom;

-- ============================================================================
-- ÉTAPE 3 : Créer les CabinetProduitEligible à partir des ExpertProduitEligible
-- ============================================================================

-- Pour chaque cabinet, créer un CabinetProduitEligible pour chaque produit
-- utilisé par au moins un expert du cabinet
-- Utiliser la moyenne des client_fee_percentage des experts comme commission_rate initiale
INSERT INTO "CabinetProduitEligible" (
  cabinet_id,
  produit_eligible_id,
  commission_rate,
  fee_amount,
  fee_mode,
  is_active,
  created_at,
  updated_at
)
SELECT 
  cabinet_id,
  produit_id AS produit_eligible_id,
  -- Utiliser la moyenne des client_fee_percentage des experts comme commission_rate
  -- Note: commission_rate est NUMERIC(5,2) donc stocke des pourcentages (ex: 30.00 pour 30%)
  -- client_fee_percentage est NUMERIC(5,4) donc stocke des décimales (ex: 0.30 pour 30%)
  -- On convertit donc en multipliant par 100
  COALESCE(
    AVG(client_fee_percentage) * 100,
    30.00 -- 30% par défaut (en pourcentage, pas en décimal)
  ) AS commission_rate,
  0 AS fee_amount, -- À définir selon les besoins
  'percent' AS fee_mode,
  true AS is_active,
  NOW() AS created_at,
  NOW() AS updated_at
FROM (
  SELECT DISTINCT
    e.cabinet_id,
    epe.produit_id,
    epe."client_fee_percentage"
  FROM "Expert" e
  JOIN "ExpertProduitEligible" epe ON epe.expert_id = e.id
  WHERE e.cabinet_id IS NOT NULL
    AND epe.statut = 'actif'
) AS expert_produits
GROUP BY cabinet_id, produit_id
-- Ne créer que si le produit n'existe pas déjà pour ce cabinet
ON CONFLICT (cabinet_id, produit_eligible_id) DO NOTHING;

-- ============================================================================
-- ÉTAPE 4 : Vérifications post-insertion
-- ============================================================================

-- Vérifier le nombre de produits créés par cabinet
SELECT 
  c.id AS cabinet_id,
  c.name AS cabinet_name,
  COUNT(cpe.id) AS nombre_produits_cabinet,
  STRING_AGG(pe.nom, ', ' ORDER BY pe.nom) AS produits_liste
FROM "Cabinet" c
LEFT JOIN "CabinetProduitEligible" cpe ON cpe.cabinet_id = c.id AND cpe.is_active = true
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe.produit_eligible_id
GROUP BY c.id, c.name
ORDER BY c.name;

-- Détail des produits avec leurs commissions
SELECT 
  c.id AS cabinet_id,
  c.name AS cabinet_name,
  pe.id AS produit_id,
  pe.nom AS produit_nom,
  cpe.commission_rate AS commission_rate_cabinet,
  cpe.fee_mode AS fee_mode_cabinet,
  cpe.is_active AS produit_actif,
  -- Comparer avec les commissions des experts
  (
    SELECT COUNT(DISTINCT epe.expert_id)
    FROM "ExpertProduitEligible" epe
    JOIN "Expert" e ON e.id = epe.expert_id
    WHERE e.cabinet_id = c.id
      AND epe.produit_id = pe.id
      AND epe.statut = 'actif'
  ) AS nombre_experts_avec_produit,
  (
    SELECT ROUND(AVG(epe."client_fee_percentage")::numeric, 4)
    FROM "ExpertProduitEligible" epe
    JOIN "Expert" e ON e.id = epe.expert_id
    WHERE e.cabinet_id = c.id
      AND epe.produit_id = pe.id
      AND epe.statut = 'actif'
  ) AS moyenne_client_fee_experts
FROM "Cabinet" c
JOIN "CabinetProduitEligible" cpe ON cpe.cabinet_id = c.id
JOIN "ProduitEligible" pe ON pe.id = cpe.produit_eligible_id
WHERE cpe.is_active = true
ORDER BY c.name, pe.nom;

-- ============================================================================
-- ÉTAPE 5 : Statistiques finales
-- ============================================================================

SELECT 
  'Cabinets avec produits' AS description,
  COUNT(DISTINCT cabinet_id)::text AS valeur
FROM "CabinetProduitEligible"
WHERE is_active = true

UNION ALL

SELECT 
  'Total produits dans cabinets' AS description,
  COUNT(*)::text AS valeur
FROM "CabinetProduitEligible"
WHERE is_active = true

UNION ALL

SELECT 
  'Moyenne commission_rate (cabinets)' AS description,
  ROUND(AVG(commission_rate)::numeric, 4)::text AS valeur
FROM "CabinetProduitEligible"
WHERE is_active = true
  AND commission_rate > 0;

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Ce script initialise les produits des cabinets à partir des produits
-- utilisés par les experts de chaque cabinet.
--
-- Logique :
-- 1. Pour chaque cabinet, identifier les produits utilisés par ses experts
-- 2. Créer un CabinetProduitEligible pour chaque produit unique
-- 3. Utiliser la moyenne des client_fee_percentage des experts comme commission_rate initiale
-- 4. Le OWNER pourra ensuite modifier ces commissions via l'interface
--
-- Après exécution, les OWNER pourront :
-- - Voir les produits de leur cabinet
-- - Modifier les commissions (commission_rate)
-- - Ajouter de nouveaux produits
-- - Supprimer des produits
--
-- ============================================================================

