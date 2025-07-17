-- =====================================================
-- CRÉATION DES TABLES ANALYTICS POUR LE SIMULATEUR
-- =====================================================

-- Table pour les analytics du simulateur
CREATE TABLE IF NOT EXISTS "public"."SimulatorAnalytics" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "session_token" text NOT NULL,
    "event_type" text NOT NULL,
    "event_data" jsonb,
    "timestamp" timestamp with time zone DEFAULT now(),
    "ip_address" text,
    "user_agent" text
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS "idx_simulator_analytics_session" ON "public"."SimulatorAnalytics" ("session_token");
CREATE INDEX IF NOT EXISTS "idx_simulator_analytics_event" ON "public"."SimulatorAnalytics" ("event_type");
CREATE INDEX IF NOT EXISTS "idx_simulator_analytics_timestamp" ON "public"."SimulatorAnalytics" ("timestamp");

-- Ajout de colonnes à TemporarySession pour le tracking
ALTER TABLE "public"."TemporarySession" 
ADD COLUMN IF NOT EXISTS "completed" boolean DEFAULT false;

ALTER TABLE "public"."TemporarySession" 
ADD COLUMN IF NOT EXISTS "abandoned" boolean DEFAULT false;

ALTER TABLE "public"."TemporarySession" 
ADD COLUMN IF NOT EXISTS "abandon_reason" text;

ALTER TABLE "public"."TemporarySession" 
ADD COLUMN IF NOT EXISTS "abandoned_at" timestamp with time zone;

ALTER TABLE "public"."TemporarySession" 
ADD COLUMN IF NOT EXISTS "migrated_to_account" boolean DEFAULT false;

ALTER TABLE "public"."TemporarySession" 
ADD COLUMN IF NOT EXISTS "migrated_at" timestamp with time zone;

ALTER TABLE "public"."TemporarySession" 
ADD COLUMN IF NOT EXISTS "last_activity" timestamp with time zone DEFAULT now();

-- Ajouter la colonne updated_at si elle n'existe pas
ALTER TABLE "public"."TemporarySession" 
ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- Index pour les sessions
CREATE INDEX IF NOT EXISTS "idx_temporary_session_completed" ON "public"."TemporarySession" ("completed");
CREATE INDEX IF NOT EXISTS "idx_temporary_session_abandoned" ON "public"."TemporarySession" ("abandoned");
CREATE INDEX IF NOT EXISTS "idx_temporary_session_migrated" ON "public"."TemporarySession" ("migrated_to_account");
CREATE INDEX IF NOT EXISTS "idx_temporary_session_last_activity" ON "public"."TemporarySession" ("last_activity");
CREATE INDEX IF NOT EXISTS "idx_temporary_session_updated_at" ON "public"."TemporarySession" ("updated_at");

-- Table pour les relances automatiques
CREATE TABLE IF NOT EXISTS "public"."SimulatorFollowUp" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "session_token" text NOT NULL,
    "email" text,
    "phone" text,
    "follow_up_type" text NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "sent_at" timestamp with time zone,
    "status" text DEFAULT 'pending',
    "eligibility_data" jsonb,
    "created_at" timestamp with time zone DEFAULT now()
);

-- Index pour les relances
CREATE INDEX IF NOT EXISTS "idx_simulator_followup_scheduled" ON "public"."SimulatorFollowUp" ("scheduled_at");
CREATE INDEX IF NOT EXISTS "idx_simulator_followup_status" ON "public"."SimulatorFollowUp" ("status");

-- Fonction pour mettre à jour last_activity et updated_at
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = NOW();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour last_activity automatiquement
DROP TRIGGER IF EXISTS trigger_update_session_activity ON "public"."TemporarySession";
CREATE TRIGGER trigger_update_session_activity
    BEFORE UPDATE ON "public"."TemporarySession"
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();

-- Fonction pour marquer une session comme complétée
CREATE OR REPLACE FUNCTION mark_session_completed(session_token_param text)
RETURNS void AS $$
BEGIN
    UPDATE "public"."TemporarySession" 
    SET completed = true, 
        updated_at = NOW(),
        last_activity = NOW()
    WHERE session_token = session_token_param;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer automatiquement les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    -- Supprimer les sessions expirées (7 jours) et non converties
    DELETE FROM "public"."TemporarySession" 
    WHERE created_at < NOW() - INTERVAL '7 days' 
    AND (migrated_to_account = false OR migrated_to_account IS NULL);
    
    -- Supprimer les analytics des sessions supprimées
    DELETE FROM "public"."SimulatorAnalytics" 
    WHERE session_token NOT IN (
        SELECT session_token FROM "public"."TemporarySession"
    );
    
    -- Supprimer les éligibilités des sessions supprimées
    DELETE FROM "public"."TemporaryEligibility" 
    WHERE session_id NOT IN (
        SELECT id FROM "public"."TemporarySession"
    );
    
    -- Supprimer les réponses des sessions supprimées
    DELETE FROM "public"."TemporaryResponse" 
    WHERE session_id NOT IN (
        SELECT id FROM "public"."TemporarySession"
    );
END;
$$ LANGUAGE plpgsql;

-- Vue pour les statistiques en temps réel (simplifiée)
CREATE OR REPLACE VIEW "public"."SimulatorStats" AS
SELECT 
    DATE_TRUNC('day', ts.created_at) as date,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN ts.completed = true THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN ts.abandoned = true THEN 1 END) as abandoned_sessions,
    COUNT(CASE WHEN ts.migrated_to_account = true THEN 1 END) as converted_sessions,
    ROUND(
        COUNT(CASE WHEN ts.migrated_to_account = true THEN 1 END)::decimal / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as conversion_rate,
    ROUND(
        COUNT(CASE WHEN ts.abandoned = true THEN 1 END)::decimal / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as abandonment_rate,
    COALESCE(SUM(te.estimated_savings), 0) as total_potential_savings
FROM "public"."TemporarySession" ts
LEFT JOIN "public"."TemporaryEligibility" te ON ts.id = te.session_id
WHERE ts.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', ts.created_at)
ORDER BY date DESC;

-- Vue pour les statistiques par produit
CREATE OR REPLACE VIEW "public"."SimulatorProductStats" AS
SELECT 
    te.produit_id,
    COUNT(*) as total_checks,
    ROUND(AVG(te.eligibility_score), 2) as avg_eligibility,
    COUNT(CASE WHEN te.eligibility_score >= 70 THEN 1 END) as high_eligibility_count,
    COUNT(CASE WHEN te.eligibility_score >= 40 AND te.eligibility_score < 70 THEN 1 END) as medium_eligibility_count,
    COUNT(CASE WHEN te.eligibility_score < 40 THEN 1 END) as low_eligibility_count,
    COALESCE(SUM(te.estimated_savings), 0) as total_potential_savings,
    ROUND(COALESCE(AVG(te.estimated_savings), 0), 2) as avg_potential_savings
FROM "public"."TemporaryEligibility" te
WHERE te.created_at >= NOW() - INTERVAL '30 days'
GROUP BY te.produit_id
ORDER BY total_potential_savings DESC;

-- RLS Policies pour la sécurité
ALTER TABLE "public"."SimulatorAnalytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SimulatorFollowUp" ENABLE ROW LEVEL SECURITY;

-- Policy pour les analytics (admin uniquement)
DROP POLICY IF EXISTS "admin_access_analytics" ON "public"."SimulatorAnalytics";
CREATE POLICY "admin_access_analytics" ON "public"."SimulatorAnalytics"
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Policy pour les relances (admin uniquement)
DROP POLICY IF EXISTS "admin_access_followup" ON "public"."SimulatorFollowUp";
CREATE POLICY "admin_access_followup" ON "public"."SimulatorFollowUp"
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Commentaires pour la documentation
COMMENT ON TABLE "public"."SimulatorAnalytics" IS 'Table pour le tracking des événements du simulateur d''éligibilité';
COMMENT ON TABLE "public"."SimulatorFollowUp" IS 'Table pour les relances automatiques des prospects abandonnés';
COMMENT ON VIEW "public"."SimulatorStats" IS 'Vue pour les statistiques en temps réel du simulateur';
COMMENT ON VIEW "public"."SimulatorProductStats" IS 'Vue pour les statistiques par produit du simulateur'; 