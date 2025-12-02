-- ============================================================================
-- Migration : Création du système de statuts individuels pour AdminNotification
-- Objectif  : Permettre à chaque admin d'avoir son propre statut (lu/non-lu/archivé) 
--             pour les notifications partagées
-- Date      : 2025-12-02
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Créer la table AdminNotificationStatus
-- ----------------------------------------------------------------------------
-- Cette table stocke le statut individuel de chaque admin pour chaque notification
CREATE TABLE IF NOT EXISTS "AdminNotificationStatus" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES "AdminNotification"(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un admin ne peut avoir qu'un seul statut par notification
  UNIQUE(notification_id, admin_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_admin_notification_status_notification 
  ON "AdminNotificationStatus"(notification_id);

CREATE INDEX IF NOT EXISTS idx_admin_notification_status_admin 
  ON "AdminNotificationStatus"(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_notification_status_unread 
  ON "AdminNotificationStatus"(admin_id, is_read) 
  WHERE is_read = FALSE;

COMMENT ON TABLE "AdminNotificationStatus" IS 'Statuts individuels de lecture/archivage des notifications admin';
COMMENT ON COLUMN "AdminNotificationStatus".notification_id IS 'Référence à la notification';
COMMENT ON COLUMN "AdminNotificationStatus".admin_id IS 'ID de l''admin (référence à Admin.id)';
COMMENT ON COLUMN "AdminNotificationStatus".is_read IS 'Notification lue par cet admin';
COMMENT ON COLUMN "AdminNotificationStatus".is_archived IS 'Notification archivée par cet admin';

-- ----------------------------------------------------------------------------
-- 2. Créer la vue AdminNotificationWithStatus
-- ----------------------------------------------------------------------------
-- Supprimer la vue existante si elle existe
DROP VIEW IF EXISTS "AdminNotificationWithStatus" CASCADE;

-- Cette vue joint les notifications avec le statut individuel de chaque admin
CREATE VIEW "AdminNotificationWithStatus" AS
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.status AS global_status,
  n.priority,
  n.metadata,
  n.action_url,
  n.action_label,
  n.created_at,
  n.updated_at,
  n.handled_by,
  n.handled_at,
  
  -- Statuts individuels depuis AdminNotificationStatus
  s.admin_id,
  COALESCE(s.is_read, FALSE) AS is_read,
  s.read_at,
  COALESCE(s.is_archived, FALSE) AS is_archived,
  s.archived_at,
  
  -- Calcul du statut individuel (user_status)
  CASE 
    WHEN COALESCE(s.is_archived, FALSE) = TRUE THEN 'archived'
    WHEN COALESCE(s.is_read, FALSE) = TRUE THEN 'read'
    ELSE 'unread'
  END AS user_status,
  
  -- Ordre de priorité pour le tri
  CASE 
    WHEN n.priority = 'urgent' THEN 1
    WHEN n.priority = 'high' THEN 2
    WHEN n.priority = 'normal' THEN 3
    ELSE 4
  END as priority_order
  
FROM "AdminNotification" n
-- Left join car un admin peut ne pas encore avoir de statut pour une notification
-- (auquel cas on considère unread par défaut)
CROSS JOIN "Admin" a
LEFT JOIN "AdminNotificationStatus" s 
  ON s.notification_id = n.id 
  AND s.admin_id = a.id
WHERE n.status != 'replaced' OR n.status IS NULL;

COMMENT ON VIEW "AdminNotificationWithStatus" IS 'Vue joignant AdminNotification avec les statuts individuels par admin';

-- ----------------------------------------------------------------------------
-- 3. Fonction pour initialiser automatiquement le statut lors de la création
-- ----------------------------------------------------------------------------
-- Cette fonction crée automatiquement une entrée dans AdminNotificationStatus
-- pour chaque admin quand une nouvelle notification est créée
CREATE OR REPLACE FUNCTION initialize_admin_notification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une entrée de statut pour chaque admin existant
  INSERT INTO "AdminNotificationStatus" (notification_id, admin_id, is_read, is_archived)
  SELECT NEW.id, a.id, FALSE, FALSE
  FROM "Admin" a
  ON CONFLICT (notification_id, admin_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trg_initialize_admin_notification_status ON "AdminNotification";
CREATE TRIGGER trg_initialize_admin_notification_status
  AFTER INSERT ON "AdminNotification"
  FOR EACH ROW
  EXECUTE FUNCTION initialize_admin_notification_status();

-- ----------------------------------------------------------------------------
-- 4. Migrer les données existantes
-- ----------------------------------------------------------------------------
-- Pour chaque notification existante, créer des entrées dans AdminNotificationStatus
-- basées sur le statut global actuel
INSERT INTO "AdminNotificationStatus" (notification_id, admin_id, is_read, read_at, is_archived, archived_at)
SELECT 
  n.id,
  a.id,
  n.is_read,
  n.read_at,
  (n.status = 'archived'),
  n.archived_at
FROM "AdminNotification" n
CROSS JOIN "Admin" a
ON CONFLICT (notification_id, admin_id) DO UPDATE SET
  is_read = EXCLUDED.is_read,
  read_at = EXCLUDED.read_at,
  is_archived = EXCLUDED.is_archived,
  archived_at = EXCLUDED.archived_at,
  updated_at = NOW();

COMMENT ON TRIGGER trg_initialize_admin_notification_status ON "AdminNotification" IS 'Initialise automatiquement les statuts individuels pour chaque admin';

COMMIT;

-- ============================================================================
-- Fin de la migration
-- ============================================================================

