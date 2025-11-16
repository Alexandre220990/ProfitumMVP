-- ============================================================================
-- Script : Assigner des cabinets aux experts existants
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Créer des cabinets pour les experts qui n'en ont pas encore
--           et leur assigner le cabinet_id
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : Vérifications
-- ============================================================================

-- Compter les experts sans cabinet (tous statuts)
SELECT 
  'Experts sans cabinet (tous statuts)' AS description,
  COUNT(*) AS total
FROM "Expert"
WHERE cabinet_id IS NULL;

-- Compter par statut d'approbation
SELECT 
  approval_status,
  COUNT(*) AS total
FROM "Expert"
WHERE cabinet_id IS NULL
GROUP BY approval_status;

-- ============================================================================
-- ÉTAPE 2 : Créer des cabinets pour tous les experts sans cabinet
-- ============================================================================

-- Pour chaque expert sans cabinet, créer un cabinet (tous statuts d'approbation)
INSERT INTO "Cabinet" (
  name,
  status,
  owner_expert_id,
  created_at
)
SELECT 
  e.company_name AS name,
  'active' AS status,
  e.id AS owner_expert_id,
  COALESCE(e.created_at, NOW()) AS created_at
FROM "Expert" e
WHERE e.cabinet_id IS NULL
  AND e.company_name IS NOT NULL
  AND e.company_name != ''
  AND NOT EXISTS (
    -- Vérifier qu'un cabinet n'existe pas déjà pour cet expert
    SELECT 1 
    FROM "Cabinet" c
    WHERE c.owner_expert_id = e.id
  )
RETURNING id, name, owner_expert_id;

-- ============================================================================
-- ÉTAPE 3 : Assigner les cabinets créés aux experts
-- ============================================================================

-- Mettre à jour Expert.cabinet_id pour les experts qui ont maintenant un cabinet (tous statuts)
UPDATE "Expert" e
SET cabinet_id = c.id
FROM "Cabinet" c
WHERE c.owner_expert_id = e.id
  AND e.cabinet_id IS NULL;

-- ============================================================================
-- ÉTAPE 4 : Vérifications
-- ============================================================================

-- Afficher les cabinets créés
SELECT 
  c.id AS cabinet_id,
  c.name AS cabinet_name,
  e.id AS expert_id,
  e.name AS expert_name,
  e.email AS expert_email
FROM "Cabinet" c
INNER JOIN "Expert" e ON e.id = c.owner_expert_id
WHERE c.owner_expert_id IS NOT NULL
ORDER BY c.name;

-- Compter les experts avec cabinet après migration (tous statuts)
SELECT 
  'Experts avec cabinet après migration (tous statuts)' AS description,
  COUNT(*) AS total
FROM "Expert"
WHERE cabinet_id IS NOT NULL;

-- Détail par statut d'approbation
SELECT 
  approval_status,
  COUNT(*) AS total_avec_cabinet
FROM "Expert"
WHERE cabinet_id IS NOT NULL
GROUP BY approval_status;

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Ce script :
-- 1. Crée un cabinet pour chaque expert qui n'en a pas (TOUS les statuts d'approbation)
-- 2. Le nom du cabinet est basé sur company_name (uniquement)
-- 3. Assigne le cabinet_id à l'expert
-- 4. Le cabinet est créé avec status='active' et owner_expert_id pointant vers l'expert
-- 5. Seuls les experts avec company_name non vide seront traités
-- 
-- Après ce script, exécutez migrate-experts-to-owners.sql pour créer les CabinetMember
-- ============================================================================

