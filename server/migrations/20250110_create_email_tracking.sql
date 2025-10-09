-- Migration: Système de tracking email
-- Date: 2025-10-10
-- Description: Tables pour tracker les ouvertures, clics et événements email

-- ============================================================================
-- TABLE: EmailTracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS "EmailTracking" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email_id" UUID NOT NULL UNIQUE,
  "recipient" VARCHAR(255) NOT NULL,
  "subject" TEXT NOT NULL,
  "template_name" VARCHAR(100) NOT NULL,
  "sent_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "delivered_at" TIMESTAMP,
  "opened_at" TIMESTAMP,
  "clicked_at" TIMESTAMP,
  "bounced_at" TIMESTAMP,
  "status" VARCHAR(50) NOT NULL DEFAULT 'sent',
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS "idx_email_tracking_email_id" ON "EmailTracking"("email_id");
CREATE INDEX IF NOT EXISTS "idx_email_tracking_recipient" ON "EmailTracking"("recipient");
CREATE INDEX IF NOT EXISTS "idx_email_tracking_template" ON "EmailTracking"("template_name");
CREATE INDEX IF NOT EXISTS "idx_email_tracking_status" ON "EmailTracking"("status");
CREATE INDEX IF NOT EXISTS "idx_email_tracking_sent_at" ON "EmailTracking"("sent_at");

-- ============================================================================
-- TABLE: EmailEvent
-- ============================================================================
CREATE TABLE IF NOT EXISTS "EmailEvent" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email_id" UUID NOT NULL REFERENCES "EmailTracking"("id") ON DELETE CASCADE,
  "event_type" VARCHAR(50) NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  "user_agent" TEXT,
  "ip_address" VARCHAR(45),
  "link_url" TEXT,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour événements
CREATE INDEX IF NOT EXISTS "idx_email_event_email_id" ON "EmailEvent"("email_id");
CREATE INDEX IF NOT EXISTS "idx_email_event_type" ON "EmailEvent"("event_type");
CREATE INDEX IF NOT EXISTS "idx_email_event_timestamp" ON "EmailEvent"("timestamp");

-- ============================================================================
-- TABLE: EmailQueue (pour Redis-like queue en BDD si besoin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "EmailQueue" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "recipient" VARCHAR(255) NOT NULL,
  "subject" TEXT NOT NULL,
  "html_body" TEXT NOT NULL,
  "text_body" TEXT,
  "template_name" VARCHAR(100),
  "template_data" JSONB DEFAULT '{}'::jsonb,
  "priority" INTEGER DEFAULT 5,
  "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
  "attempts" INTEGER DEFAULT 0,
  "max_attempts" INTEGER DEFAULT 3,
  "scheduled_for" TIMESTAMP,
  "last_attempt_at" TIMESTAMP,
  "error_message" TEXT,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "processed_at" TIMESTAMP
);

-- Index pour queue
CREATE INDEX IF NOT EXISTS "idx_email_queue_status" ON "EmailQueue"("status");
CREATE INDEX IF NOT EXISTS "idx_email_queue_priority" ON "EmailQueue"("priority" DESC);
CREATE INDEX IF NOT EXISTS "idx_email_queue_scheduled" ON "EmailQueue"("scheduled_for");
CREATE INDEX IF NOT EXISTS "idx_email_queue_created" ON "EmailQueue"("created_at");

-- ============================================================================
-- TRIGGER: Mise à jour automatique updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_email_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_tracking_timestamp
  BEFORE UPDATE ON "EmailTracking"
  FOR EACH ROW
  EXECUTE FUNCTION update_email_tracking_timestamp();

CREATE TRIGGER trigger_update_email_queue_timestamp
  BEFORE UPDATE ON "EmailQueue"
  FOR EACH ROW
  EXECUTE FUNCTION update_email_tracking_timestamp();

-- ============================================================================
-- FONCTION: Nettoyer les anciens trackings
-- ============================================================================
CREATE OR REPLACE FUNCTION clean_old_email_trackings(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM "EmailTracking"
    WHERE sent_at < NOW() - (days_to_keep || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VUE: Métriques email en temps réel
-- ============================================================================
CREATE OR REPLACE VIEW "EmailMetrics" AS
SELECT
  template_name,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')) as total_delivered,
  COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')) as total_opened,
  COUNT(*) FILTER (WHERE status = 'clicked') as total_clicked,
  COUNT(*) FILTER (WHERE status = 'bounced') as total_bounced,
  COUNT(*) FILTER (WHERE status = 'failed') as total_failed,
  ROUND(
    (COUNT(*) FILTER (WHERE status IN ('opened', 'clicked'))::DECIMAL / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')), 0)) * 100, 
    2
  ) as open_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'clicked')::DECIMAL / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')), 0)) * 100, 
    2
  ) as click_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'bounced')::DECIMAL / 
    NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as bounce_rate
FROM "EmailTracking"
GROUP BY template_name;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON TABLE "EmailTracking" IS 'Tracking des emails envoyés avec statuts et timestamps';
COMMENT ON TABLE "EmailEvent" IS 'Événements détaillés pour chaque email (ouvertures, clics, etc.)';
COMMENT ON TABLE "EmailQueue" IS 'Queue pour envois différés et retry automatique';
COMMENT ON VIEW "EmailMetrics" IS 'Vue agrégée des métriques email par template';

-- ============================================================================
-- DONNÉES DE TEST (optionnel)
-- ============================================================================
-- Décommenter pour ajouter des données de test
/*
INSERT INTO "EmailTracking" (email_id, recipient, subject, template_name, status)
VALUES 
  (uuid_generate_v4(), 'test1@example.com', 'Test Email 1', 'rdv-confirmation-client', 'opened'),
  (uuid_generate_v4(), 'test2@example.com', 'Test Email 2', 'rdv-notification-expert', 'clicked'),
  (uuid_generate_v4(), 'test3@example.com', 'Test Email 3', 'rdv-alternative-proposee', 'delivered');
*/

-- ============================================================================
-- PERMISSIONS RLS (Row Level Security)
-- ============================================================================
ALTER TABLE "EmailTracking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailQueue" ENABLE ROW LEVEL SECURITY;

-- Policy pour admin uniquement
CREATE POLICY "email_tracking_admin_only" ON "EmailTracking"
  FOR ALL
  USING (auth.jwt() ->> 'user_type' = 'admin');

CREATE POLICY "email_event_admin_only" ON "EmailEvent"
  FOR ALL
  USING (auth.jwt() ->> 'user_type' = 'admin');

CREATE POLICY "email_queue_admin_only" ON "EmailQueue"
  FOR ALL
  USING (auth.jwt() ->> 'user_type' = 'admin');

RAISE NOTICE '✅ Migration tracking email terminée avec succès';

