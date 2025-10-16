-- ============================================================================
-- FONCTIONS ADMIN NOTIFICATION - Version sans cleanup auto
-- Date: 16 Octobre 2025
-- ============================================================================

-- Fonction 1: Marquer comme lu
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void 
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "AdminNotification"
  SET 
    status = 'read',
    read_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$;

-- Fonction 2: Archiver
CREATE OR REPLACE FUNCTION archive_notification(notification_id UUID)
RETURNS void 
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "AdminNotification"
  SET 
    status = 'archived',
    archived_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$;

-- Vérification
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('mark_notification_read', 'archive_notification')
AND routine_schema = 'public';

