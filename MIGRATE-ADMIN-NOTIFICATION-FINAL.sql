-- ============================================================================
-- MIGRATION ADMINNOTIFICATION - Ajout colonnes manquantes
-- Date: 16 Octobre 2025
-- Basé sur la structure actuelle (10 colonnes)
-- ============================================================================

-- AFFICHER LA STRUCTURE ACTUELLE
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'AdminNotification'
ORDER BY ordinal_position;

-- ============================================================================
-- AJOUTER LES 6 COLONNES MANQUANTES
-- ============================================================================

-- 1. action_url (URL pour action rapide)
ALTER TABLE "AdminNotification" 
ADD COLUMN IF NOT EXISTS action_url TEXT;

-- 2. action_label (Label du bouton d'action)
ALTER TABLE "AdminNotification" 
ADD COLUMN IF NOT EXISTS action_label TEXT;

-- 3. read_at (Date de lecture)
ALTER TABLE "AdminNotification" 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 4. archived_at (Date d'archivage)
ALTER TABLE "AdminNotification" 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- 5. handled_by (Admin qui a traité)
ALTER TABLE "AdminNotification" 
ADD COLUMN IF NOT EXISTS handled_by UUID;

-- 6. handled_at (Date de traitement)
ALTER TABLE "AdminNotification" 
ADD COLUMN IF NOT EXISTS handled_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- CRÉER/RECRÉER LES INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_notification_status 
  ON "AdminNotification"(status);

CREATE INDEX IF NOT EXISTS idx_admin_notification_created_at 
  ON "AdminNotification"(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notification_priority 
  ON "AdminNotification"(priority);

CREATE INDEX IF NOT EXISTS idx_admin_notification_type 
  ON "AdminNotification"(type);

CREATE INDEX IF NOT EXISTS idx_admin_notification_status_priority 
  ON "AdminNotification"(status, priority);

-- ============================================================================
-- CRÉER/RECRÉER LA VUE
-- ============================================================================

DROP VIEW IF EXISTS "AdminNotificationActive";

CREATE VIEW "AdminNotificationActive" AS
SELECT 
  id,
  type,
  title,
  message,
  status,
  priority,
  metadata,
  admin_notes,
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

-- ============================================================================
-- CRÉER LES FONCTIONS HELPER
-- ============================================================================

-- Marquer comme lu
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "AdminNotification"
  SET 
    status = 'read',
    read_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Archiver
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

-- Cleanup automatique
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Archiver les notifications lues de plus de 30 jours
  UPDATE "AdminNotification"
  SET 
    status = 'archived',
    archived_at = NOW()
  WHERE 
    status = 'read' 
    AND read_at < NOW() - INTERVAL '30 days'
    AND read_at IS NOT NULL;
    
  -- Supprimer les notifications archivées de plus de 90 jours
  DELETE FROM "AdminNotification"
  WHERE 
    status = 'archived' 
    AND archived_at < NOW() - INTERVAL '90 days'
    AND archived_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Afficher le nombre de colonnes
SELECT 
  COUNT(*) as total_colonnes,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as colonnes
FROM information_schema.columns 
WHERE table_name = 'AdminNotification';

-- Afficher les stats
SELECT 
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'read' THEN 1 END) as read,
  COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived
FROM "AdminNotification";

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ MIGRATION ADMINNOTIFICATION TERMINÉE';
  RAISE NOTICE '✅ Table mise à jour avec succès';
  RAISE NOTICE '✅ Vue AdminNotificationActive créée';
  RAISE NOTICE '✅ 3 fonctions helper créées';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
END $$;

