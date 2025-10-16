-- ============================================================================
-- TABLE ADMIN NOTIFICATIONS - VERSION SÉCURISÉE
-- Date: 16 Octobre 2025
-- Exécution par étapes pour éviter les erreurs
-- ============================================================================

-- ÉTAPE 1: Créer la table
CREATE TABLE IF NOT EXISTS "AdminNotification" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Type et contenu
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Statut
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  
  -- Métadonnées
  metadata JSONB,
  
  -- Actions
  action_url TEXT,
  action_label TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin qui a traité
  handled_by UUID,
  handled_at TIMESTAMP WITH TIME ZONE
);

-- ÉTAPE 2: Créer les indexes
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

-- ÉTAPE 3: Créer la vue (après que la table existe)
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

-- ÉTAPE 4: Créer les fonctions helper
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
    AND read_at < NOW() - INTERVAL '30 days';
    
  -- Supprimer les notifications archivées de plus de 90 jours
  DELETE FROM "AdminNotification"
  WHERE 
    status = 'archived' 
    AND archived_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 5: Ajouter des commentaires
COMMENT ON TABLE "AdminNotification" IS 'Notifications pour les administrateurs de la plateforme';
COMMENT ON COLUMN "AdminNotification".type IS 'Type: document_validation, expert_pending, dossier_urgent, etc.';
COMMENT ON COLUMN "AdminNotification".status IS 'Statut: pending, read, archived';
COMMENT ON COLUMN "AdminNotification".priority IS 'Priorité: low, normal, high, urgent';
COMMENT ON COLUMN "AdminNotification".metadata IS 'Données JSON (client_id, dossier_id, etc.)';
COMMENT ON COLUMN "AdminNotification".action_url IS 'URL pour action rapide';
COMMENT ON COLUMN "AdminNotification".action_label IS 'Label du bouton action';

-- ÉTAPE 6: Vérifier que la table a été créée correctement
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'AdminNotification'
  ) THEN
    RAISE NOTICE '✅ Table AdminNotification créée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Erreur: Table AdminNotification non créée';
  END IF;
END $$;

-- ÉTAPE 7: Compter les notifications existantes
SELECT 
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'read' THEN 1 END) as read,
  COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived
FROM "AdminNotification";

