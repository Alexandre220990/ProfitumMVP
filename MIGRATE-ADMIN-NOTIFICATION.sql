-- ============================================================================
-- MIGRATION ADMIN NOTIFICATION - Ajouter colonnes manquantes
-- Date: 16 Octobre 2025
-- ============================================================================

-- ÉTAPE 1: Vérifier la structure actuelle
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'AdminNotification'
ORDER BY ordinal_position;

-- ÉTAPE 2: Ajouter les colonnes manquantes (si elles n'existent pas)

-- Ajouter action_url si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AdminNotification' 
    AND column_name = 'action_url'
  ) THEN
    ALTER TABLE "AdminNotification" ADD COLUMN action_url TEXT;
    RAISE NOTICE '✅ Colonne action_url ajoutée';
  ELSE
    RAISE NOTICE '⚠️ Colonne action_url existe déjà';
  END IF;
END $$;

-- Ajouter action_label si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AdminNotification' 
    AND column_name = 'action_label'
  ) THEN
    ALTER TABLE "AdminNotification" ADD COLUMN action_label TEXT;
    RAISE NOTICE '✅ Colonne action_label ajoutée';
  ELSE
    RAISE NOTICE '⚠️ Colonne action_label existe déjà';
  END IF;
END $$;

-- Ajouter archived_at si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AdminNotification' 
    AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE "AdminNotification" ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Colonne archived_at ajoutée';
  ELSE
    RAISE NOTICE '⚠️ Colonne archived_at existe déjà';
  END IF;
END $$;

-- Ajouter handled_by si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AdminNotification' 
    AND column_name = 'handled_by'
  ) THEN
    ALTER TABLE "AdminNotification" ADD COLUMN handled_by UUID;
    RAISE NOTICE '✅ Colonne handled_by ajoutée';
  ELSE
    RAISE NOTICE '⚠️ Colonne handled_by existe déjà';
  END IF;
END $$;

-- Ajouter handled_at si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AdminNotification' 
    AND column_name = 'handled_at'
  ) THEN
    ALTER TABLE "AdminNotification" ADD COLUMN handled_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Colonne handled_at ajoutée';
  ELSE
    RAISE NOTICE '⚠️ Colonne handled_at existe déjà';
  END IF;
END $$;

-- ÉTAPE 3: Recréer la vue avec les bonnes colonnes
DROP VIEW IF EXISTS "AdminNotificationActive";

CREATE OR REPLACE VIEW "AdminNotificationActive" AS
SELECT 
  id,
  type,
  title,
  message,
  status,
  priority,
  metadata,
  action_url,
  action_label,
  created_at,
  updated_at,
  read_at,
  archived_at,
  handled_by,
  handled_at,
  CASE 
    WHEN priority = 'urgent' THEN 1
    WHEN priority = 'high' THEN 2
    WHEN priority = 'normal' THEN 3
    ELSE 4
  END as priority_order
FROM "AdminNotification"
WHERE status != 'archived'
ORDER BY priority_order ASC, created_at DESC;

-- ÉTAPE 4: Vérifier la structure finale
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'AdminNotification'
ORDER BY ordinal_position;

-- ÉTAPE 5: Afficher un résumé
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns 
  WHERE table_name = 'AdminNotification';
  
  RAISE NOTICE '✅ Table AdminNotification a % colonnes', col_count;
END $$;

