-- ============================================================================
-- TABLE ADMIN NOTIFICATIONS
-- Date: 16 Octobre 2025
-- ============================================================================

-- Table pour les notifications admin
CREATE TABLE IF NOT EXISTS "AdminNotification" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Type et contenu
  type TEXT NOT NULL, -- 'document_validation', 'expert_pending', 'dossier_urgent', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Statut
  status TEXT DEFAULT 'pending', -- 'pending', 'read', 'archived'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Métadonnées
  metadata JSONB, -- Données additionnelles (client_id, dossier_id, etc.)
  
  -- Actions
  action_url TEXT, -- URL pour action rapide
  action_label TEXT, -- Label du bouton d'action
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin qui a traité
  handled_by UUID, -- ID de l'admin qui a traité la notification
  handled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_admin_notification_status ON "AdminNotification"(status);
CREATE INDEX IF NOT EXISTS idx_admin_notification_created_at ON "AdminNotification"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notification_priority ON "AdminNotification"(priority);
CREATE INDEX IF NOT EXISTS idx_admin_notification_type ON "AdminNotification"(type);
CREATE INDEX IF NOT EXISTS idx_admin_notification_status_priority ON "AdminNotification"(status, priority);

-- Vue pour notifications actives (non archivées)
CREATE OR REPLACE VIEW "AdminNotificationActive" AS
SELECT 
  *,
  CASE 
    WHEN priority = 'urgent' THEN 1
    WHEN priority = 'high' THEN 2
    WHEN priority = 'normal' THEN 3
    ELSE 4
  END as priority_order
FROM "AdminNotification"
WHERE status != 'archived' AND archived_at IS NULL
ORDER BY priority_order ASC, created_at DESC;

-- Fonction pour marquer comme lu
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

-- Fonction pour nettoyer les vieilles notifications
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

-- Données de test (optionnel)
-- INSERT INTO "AdminNotification" (type, title, message, status, priority, metadata, action_url, action_label)
-- VALUES
--   ('document_validation', 'Validation documents TICPE', 'Le client Profitum SAS a soumis des documents pour validation', 'pending', 'high', '{"client_produit_id": "123", "product_type": "TICPE"}', '/admin/validations', 'Voir'),
--   ('expert_pending', 'Nouvel expert en attente', 'L''expert Jean Dupont attend validation', 'pending', 'normal', '{"expert_id": "456"}', '/admin/experts', 'Valider');

COMMENT ON TABLE "AdminNotification" IS 'Notifications pour les administrateurs de la plateforme';
COMMENT ON COLUMN "AdminNotification".type IS 'Type de notification: document_validation, expert_pending, dossier_urgent, etc.';
COMMENT ON COLUMN "AdminNotification".status IS 'Statut: pending (nouveau), read (lu), archived (archivé)';
COMMENT ON COLUMN "AdminNotification".priority IS 'Priorité: low, normal, high, urgent';
COMMENT ON COLUMN "AdminNotification".metadata IS 'Données additionnelles en JSON (IDs, contexte, etc.)';

