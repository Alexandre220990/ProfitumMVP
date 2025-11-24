-- ============================================================================
-- Migration : Alignement des statuts de notifications
-- Objectif  : Harmoniser AdminNotification avec notification (unread au lieu de pending, ajout is_read)
-- Date      : 2025-11-24
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Ajouter la colonne is_read à AdminNotification
-- ----------------------------------------------------------------------------
ALTER TABLE "AdminNotification"
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

-- ----------------------------------------------------------------------------
-- 2. Supprimer l'ancienne contrainte CHECK (si elle existe)
-- ----------------------------------------------------------------------------
ALTER TABLE "AdminNotification"
  DROP CONSTRAINT IF EXISTS "AdminNotification_status_check";

-- ----------------------------------------------------------------------------
-- 3. Migrer les statuts 'pending' vers 'unread' pour cohérence
-- (Doit être fait AVANT de créer la nouvelle contrainte)
-- ----------------------------------------------------------------------------
UPDATE "AdminNotification"
SET status = 'unread'
WHERE status = 'pending';

-- ----------------------------------------------------------------------------
-- 4. Créer la nouvelle contrainte CHECK avec 'unread' au lieu de 'pending'
-- ----------------------------------------------------------------------------
ALTER TABLE "AdminNotification"
  ADD CONSTRAINT "AdminNotification_status_check"
  CHECK (status IN ('unread', 'read', 'archived'));

-- ----------------------------------------------------------------------------
-- 5. Synchroniser is_read avec le statut existant
-- ----------------------------------------------------------------------------
UPDATE "AdminNotification"
SET is_read = TRUE
WHERE status = 'read' AND (is_read IS NULL OR is_read = FALSE);

UPDATE "AdminNotification"
SET is_read = FALSE
WHERE status = 'unread' AND (is_read IS NULL OR is_read = TRUE);

-- ----------------------------------------------------------------------------
-- 6. Mettre à jour la valeur par défaut du statut
-- ----------------------------------------------------------------------------
ALTER TABLE "AdminNotification"
  ALTER COLUMN status SET DEFAULT 'unread';

-- ----------------------------------------------------------------------------
-- 7. Créer un index sur is_read pour les performances
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_admin_notification_is_read 
  ON "AdminNotification"(is_read);

-- ----------------------------------------------------------------------------
-- 8. Mettre à jour les fonctions helper pour utiliser 'unread' au lieu de 'pending'
-- ----------------------------------------------------------------------------

-- Fonction pour marquer comme lu
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "AdminNotification"
  SET 
    status = 'read',
    is_read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer comme non lu
CREATE OR REPLACE FUNCTION mark_notification_unread(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "AdminNotification"
  SET 
    status = 'unread',
    is_read = FALSE,
    read_at = NULL,
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour archiver
CREATE OR REPLACE FUNCTION archive_notification(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "AdminNotification"
  SET 
    status = 'archived',
    archived_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 9. Mettre à jour la vue AdminNotificationActive
-- ----------------------------------------------------------------------------
-- Supprimer la vue existante avant de la recréer
DROP VIEW IF EXISTS "AdminNotificationActive";

-- Recréer la vue avec toutes les colonnes explicites
CREATE VIEW "AdminNotificationActive" AS
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
  is_read,
  CASE 
    WHEN priority = 'urgent' THEN 1
    WHEN priority = 'high' THEN 2
    WHEN priority = 'normal' THEN 3
    ELSE 4
  END as priority_order
FROM "AdminNotification"
WHERE status != 'archived' OR status IS NULL
ORDER BY priority_order ASC, created_at DESC;

-- ----------------------------------------------------------------------------
-- 10. Mettre à jour les commentaires
-- ----------------------------------------------------------------------------
COMMENT ON COLUMN "AdminNotification".status IS 'Statut: unread (non lu), read (lu), archived (archivé)';
COMMENT ON COLUMN "AdminNotification".is_read IS 'Indicateur booléen de lecture (synchronisé avec status)';

COMMIT;

