-- ============================================================================
-- Migration : Assigner le rôle OWNER aux experts existants
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Pour chaque expert ayant un cabinet_id, créer un enregistrement
--           CabinetMember avec le rôle OWNER si aucun n'existe déjà
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : Vérifier que les tables existent
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'Cabinet'
  ) THEN
    RAISE EXCEPTION 'La table Cabinet n''existe pas. Exécutez d''abord create-cabinet-structures-step17.sql';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'CabinetMember'
  ) THEN
    RAISE EXCEPTION 'La table CabinetMember n''existe pas. Exécutez d''abord create-cabinet-structures-step17.sql';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Expert' AND column_name = 'cabinet_id'
  ) THEN
    RAISE EXCEPTION 'La colonne Expert.cabinet_id n''existe pas. Exécutez d''abord create-cabinet-structures-step17.sql';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2 : Vérifier les colonnes de CabinetMember
-- ============================================================================

DO $$
DECLARE
  has_metrics BOOLEAN;
  has_last_refresh_at BOOLEAN;
BEGIN
  -- Vérifier si la colonne metrics existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'CabinetMember' AND column_name = 'metrics'
  ) INTO has_metrics;
  
  -- Vérifier si la colonne last_refresh_at existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'CabinetMember' AND column_name = 'last_refresh_at'
  ) INTO has_last_refresh_at;
  
  RAISE NOTICE 'Colonne metrics existe: %', has_metrics;
  RAISE NOTICE 'Colonne last_refresh_at existe: %', has_last_refresh_at;
END $$;

-- ============================================================================
-- ÉTAPE 3 : Créer les enregistrements CabinetMember pour les experts existants
-- ============================================================================

-- Pour chaque expert ayant un cabinet_id mais pas encore de CabinetMember,
-- créer un enregistrement avec le rôle OWNER
-- Note: On n'insère que les colonnes qui existent, les autres seront NULL par défaut
INSERT INTO "CabinetMember" (
  cabinet_id,
  member_id,
  member_type,
  team_role,
  status,
  manager_member_id,
  permissions,
  products,
  created_at
)
SELECT 
  e.cabinet_id,
  e.id AS member_id,
  'expert' AS member_type,
  'OWNER' AS team_role,
  'active' AS status,
  NULL AS manager_member_id,
  jsonb_build_object('superUser', true) AS permissions,
  '[]'::jsonb AS products,
  COALESCE(e.created_at, NOW()) AS created_at
FROM "Expert" e
WHERE e.cabinet_id IS NOT NULL
  AND e.approval_status = 'approved'  -- Uniquement les experts approuvés
  AND NOT EXISTS (
    -- Vérifier qu'il n'existe pas déjà un CabinetMember pour cet expert dans ce cabinet
    SELECT 1 
    FROM "CabinetMember" cm
    WHERE cm.cabinet_id = e.cabinet_id
      AND cm.member_id = e.id
  );

-- ============================================================================
-- ÉTAPE 4 : Vérifications et statistiques
-- ============================================================================

-- Afficher le nombre d'experts migrés
SELECT 
  'Experts migrés en OWNER' AS description,
  COUNT(*) AS total
FROM "CabinetMember" cm
INNER JOIN "Expert" e ON e.id = cm.member_id
WHERE cm.team_role = 'OWNER'
  AND cm.member_type = 'expert'
  AND e.cabinet_id = cm.cabinet_id;

-- Afficher les cabinets avec leurs owners
SELECT 
  c.id AS cabinet_id,
  c.name AS cabinet_name,
  e.id AS expert_id,
  e.name AS expert_name,
  e.email AS expert_email,
  cm.team_role,
  cm.status
FROM "Cabinet" c
INNER JOIN "CabinetMember" cm ON cm.cabinet_id = c.id
INNER JOIN "Expert" e ON e.id = cm.member_id
WHERE cm.team_role = 'OWNER'
  AND cm.member_type = 'expert'
ORDER BY c.name, e.name;

-- Afficher les experts qui ont un cabinet_id mais pas de CabinetMember (cas d'erreur)
SELECT 
  e.id AS expert_id,
  e.name AS expert_name,
  e.email AS expert_email,
  e.cabinet_id,
  c.name AS cabinet_name
FROM "Expert" e
LEFT JOIN "Cabinet" c ON c.id = e.cabinet_id
WHERE e.cabinet_id IS NOT NULL
  AND e.approval_status = 'approved'
  AND NOT EXISTS (
    SELECT 1 
    FROM "CabinetMember" cm
    WHERE cm.cabinet_id = e.cabinet_id
      AND cm.member_id = e.id
  );

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Ce script est idempotent : il peut être exécuté plusieurs fois sans danger
-- Il ne modifie pas les enregistrements CabinetMember existants
-- Il crée uniquement les enregistrements manquants avec le rôle OWNER
-- ============================================================================

