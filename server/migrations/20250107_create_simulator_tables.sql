-- =====================================================
-- CRÉATION DES TABLES DU SIMULATEUR D'ÉLIGIBILITÉ
-- Date: 2025-01-07
-- =====================================================

-- Table pour les sessions temporaires du simulateur
CREATE TABLE IF NOT EXISTS "public"."TemporarySession" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "session_token" text NOT NULL UNIQUE,
    "ip_address" text,
    "user_agent" text,
    "completed" boolean DEFAULT false,
    "abandoned" boolean DEFAULT false,
    "abandon_reason" text,
    "abandoned_at" timestamp with time zone,
    "migrated_to_account" boolean DEFAULT false,
    "migrated_at" timestamp with time zone,
    "client_id" uuid REFERENCES "public"."Client"(id),
    "last_activity" timestamp with time zone DEFAULT now(),
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Table pour les réponses temporaires
CREATE TABLE IF NOT EXISTS "public"."TemporaryResponse" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "session_id" uuid NOT NULL REFERENCES "public"."TemporarySession"(id) ON DELETE CASCADE,
    "question_id" uuid NOT NULL REFERENCES "public"."QuestionnaireQuestion"(id),
    "response_value" jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);

-- Table pour les résultats d'éligibilité temporaires
CREATE TABLE IF NOT EXISTS "public"."TemporaryEligibility" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "session_id" uuid NOT NULL REFERENCES "public"."TemporarySession"(id) ON DELETE CASCADE,
    "produit_id" text NOT NULL,
    "eligibility_score" integer NOT NULL CHECK (eligibility_score >= 0 AND eligibility_score <= 100),
    "estimated_savings" numeric(10,2) DEFAULT 0,
    "confidence_level" text CHECK (confidence_level IN ('low', 'medium', 'high')),
    "recommendations" jsonb DEFAULT '[]'::jsonb,
    "created_at" timestamp with time zone DEFAULT now()
);

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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "idx_temporary_session_token" ON "public"."TemporarySession" ("session_token");
CREATE INDEX IF NOT EXISTS "idx_temporary_session_completed" ON "public"."TemporarySession" ("completed");
CREATE INDEX IF NOT EXISTS "idx_temporary_session_abandoned" ON "public"."TemporarySession" ("abandoned");
CREATE INDEX IF NOT EXISTS "idx_temporary_session_migrated" ON "public"."TemporarySession" ("migrated_to_account");
CREATE INDEX IF NOT EXISTS "idx_temporary_session_last_activity" ON "public"."TemporarySession" ("last_activity");
CREATE INDEX IF NOT EXISTS "idx_temporary_session_updated_at" ON "public"."TemporarySession" ("updated_at");

CREATE INDEX IF NOT EXISTS "idx_temporary_response_session" ON "public"."TemporaryResponse" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_temporary_response_question" ON "public"."TemporaryResponse" ("question_id");

CREATE INDEX IF NOT EXISTS "idx_temporary_eligibility_session" ON "public"."TemporaryEligibility" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_temporary_eligibility_produit" ON "public"."TemporaryEligibility" ("produit_id");

CREATE INDEX IF NOT EXISTS "idx_simulator_analytics_session" ON "public"."SimulatorAnalytics" ("session_token");
CREATE INDEX IF NOT EXISTS "idx_simulator_analytics_event" ON "public"."SimulatorAnalytics" ("event_type");
CREATE INDEX IF NOT EXISTS "idx_simulator_analytics_timestamp" ON "public"."SimulatorAnalytics" ("timestamp");

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

-- Fonction pour nettoyer automatiquement les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    -- Supprimer les sessions expirées (7 jours) et non converties
    DELETE FROM "public"."TemporarySession" 
    WHERE created_at < NOW() - INTERVAL '7 days' 
    AND (migrated_to_account = false OR migrated_to_account IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Politiques RLS pour la sécurité
ALTER TABLE "public"."TemporarySession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TemporaryResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TemporaryEligibility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SimulatorAnalytics" ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre l'insertion de sessions temporaires
CREATE POLICY "Allow temporary session creation" ON "public"."TemporarySession"
    FOR INSERT WITH CHECK (true);

-- Policy pour permettre la lecture des sessions par token
CREATE POLICY "Allow session read by token" ON "public"."TemporarySession"
    FOR SELECT USING (true);

-- Policy pour permettre l'insertion de réponses
CREATE POLICY "Allow temporary response creation" ON "public"."TemporaryResponse"
    FOR INSERT WITH CHECK (true);

-- Policy pour permettre l'insertion d'éligibilité
CREATE POLICY "Allow temporary eligibility creation" ON "public"."TemporaryEligibility"
    FOR INSERT WITH CHECK (true);

-- Policy pour permettre l'insertion d'analytics
CREATE POLICY "Allow simulator analytics creation" ON "public"."SimulatorAnalytics"
    FOR INSERT WITH CHECK (true);

-- Vue pour les statistiques en temps réel
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