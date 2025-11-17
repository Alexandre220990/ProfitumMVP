-- ============================================================================
-- Script SQL : Corriger les commission_rate des cabinets (décimal → pourcentage)
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Les commission_rate ont été stockés en décimal (0.30) alors qu'ils
--           devraient être en pourcentage (30.00) selon le schéma NUMERIC(5,2)
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : Vérifier les valeurs actuelles
-- ============================================================================

SELECT 
  'Valeurs actuelles (avant correction)' AS description,
  COUNT(*) AS total_lignes,
  MIN(commission_rate) AS min_commission,
  MAX(commission_rate) AS max_commission,
  AVG(commission_rate) AS moyenne_commission
FROM "CabinetProduitEligible"
WHERE is_active = true;

-- Afficher quelques exemples
SELECT 
  c.name AS cabinet_name,
  pe.nom AS produit_nom,
  cpe.commission_rate AS commission_actuelle,
  CASE 
    WHEN cpe.commission_rate < 1 THEN cpe.commission_rate * 100
    ELSE cpe.commission_rate
  END AS commission_corrigee
FROM "CabinetProduitEligible" cpe
JOIN "Cabinet" c ON c.id = cpe.cabinet_id
JOIN "ProduitEligible" pe ON pe.id = cpe.produit_eligible_id
WHERE cpe.is_active = true
ORDER BY c.name, pe.nom
LIMIT 10;

-- ============================================================================
-- ÉTAPE 2 : Corriger les commission_rate (multiplier par 100 si < 1)
-- ============================================================================

-- Mettre à jour uniquement les valeurs qui sont en décimal (< 1)
UPDATE "CabinetProduitEligible"
SET commission_rate = commission_rate * 100
WHERE is_active = true
  AND commission_rate < 1
  AND commission_rate > 0;

-- ============================================================================
-- ÉTAPE 3 : Vérifier les valeurs après correction
-- ============================================================================

SELECT 
  'Valeurs après correction' AS description,
  COUNT(*) AS total_lignes,
  MIN(commission_rate) AS min_commission,
  MAX(commission_rate) AS max_commission,
  AVG(commission_rate) AS moyenne_commission
FROM "CabinetProduitEligible"
WHERE is_active = true;

-- Afficher quelques exemples après correction
SELECT 
  c.name AS cabinet_name,
  pe.nom AS produit_nom,
  cpe.commission_rate AS commission_corrigee
FROM "CabinetProduitEligible" cpe
JOIN "Cabinet" c ON c.id = cpe.cabinet_id
JOIN "ProduitEligible" pe ON pe.id = cpe.produit_eligible_id
WHERE cpe.is_active = true
ORDER BY c.name, pe.nom
LIMIT 10;

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Ce script corrige les commission_rate qui ont été stockés en décimal (0.30)
-- pour les convertir en pourcentage (30.00) selon le schéma NUMERIC(5,2).
--
-- Logique :
-- - Si commission_rate < 1, on multiplie par 100
-- - Sinon, on laisse tel quel (déjà en pourcentage)
--
-- ============================================================================

