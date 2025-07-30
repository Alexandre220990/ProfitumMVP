-- =====================================================
-- APPLICATION DE LA MIGRATION DU SIMULATEUR
-- Date: 2025-01-30
-- =====================================================

-- Vérifier si les tables existent déjà
DO $$
DECLARE
    table_exists boolean;
BEGIN
    -- Vérifier SimulatorSession
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'SimulatorSession'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Création de la table SimulatorSession...';
        
        -- Table principale des sessions de simulation
        CREATE TABLE IF NOT EXISTS "SimulatorSession" (
            "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            "session_token" text UNIQUE NOT NULL,
            "ip_address" text,
            "user_agent" text,
            "status" text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'migrated')),
            "current_step" integer DEFAULT 1,
            "total_steps" integer DEFAULT 10,
            "started_at" timestamp with time zone DEFAULT now(),
            "completed_at" timestamp with time zone,
            "expires_at" timestamp with time zone DEFAULT (now() + interval '24 hours'),
            "metadata" jsonb DEFAULT '{}'::jsonb,
            "created_at" timestamp with time zone DEFAULT now(),
            "updated_at" timestamp with time zone DEFAULT now()
        );
        
        RAISE NOTICE 'Table SimulatorSession créée avec succès';
    ELSE
        RAISE NOTICE 'Table SimulatorSession existe déjà';
    END IF;
    
    -- Vérifier SimulatorResponse
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'SimulatorResponse'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Création de la table SimulatorResponse...';
        
        -- Table des réponses au questionnaire
        CREATE TABLE IF NOT EXISTS "SimulatorResponse" (
            "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            "session_id" uuid NOT NULL REFERENCES "SimulatorSession"(id) ON DELETE CASCADE,
            "question_id" text NOT NULL,
            "response_value" jsonb NOT NULL,
            "response_time" integer, -- en secondes
            "created_at" timestamp with time zone DEFAULT now()
        );
        
        RAISE NOTICE 'Table SimulatorResponse créée avec succès';
    ELSE
        RAISE NOTICE 'Table SimulatorResponse existe déjà';
    END IF;
    
    -- Vérifier SimulatorEligibility
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'SimulatorEligibility'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Création de la table SimulatorEligibility...';
        
        -- Table des résultats d'éligibilité
        CREATE TABLE IF NOT EXISTS "SimulatorEligibility" (
            "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            "session_id" uuid NOT NULL REFERENCES "SimulatorSession"(id) ON DELETE CASCADE,
            "produit_id" text NOT NULL,
            "eligibility_score" integer NOT NULL CHECK (eligibility_score >= 0 AND eligibility_score <= 100),
            "estimated_savings" numeric(10,2) DEFAULT 0,
            "confidence_level" text CHECK (confidence_level IN ('low', 'medium', 'high')),
            "calculation_details" jsonb DEFAULT '{}'::jsonb,
            "recommendations" text[] DEFAULT '{}',
            "risk_factors" text[] DEFAULT '{}',
            "created_at" timestamp with time zone DEFAULT now()
        );
        
        RAISE NOTICE 'Table SimulatorEligibility créée avec succès';
    ELSE
        RAISE NOTICE 'Table SimulatorEligibility existe déjà';
    END IF;
    
    -- Vérifier SimulatorAnalytics
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'SimulatorAnalytics'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Création de la table SimulatorAnalytics...';
        
        -- Table pour les analytics du simulateur
        CREATE TABLE IF NOT EXISTS "SimulatorAnalytics" (
            "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            "session_token" text NOT NULL,
            "event_type" text NOT NULL,
            "event_data" jsonb,
            "timestamp" timestamp with time zone DEFAULT now(),
            "ip_address" text,
            "user_agent" text
        );
        
        RAISE NOTICE 'Table SimulatorAnalytics créée avec succès';
    ELSE
        RAISE NOTICE 'Table SimulatorAnalytics existe déjà';
    END IF;
END $$;

-- Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS "idx_simulator_session_token" ON "SimulatorSession" ("session_token");
CREATE INDEX IF NOT EXISTS "idx_simulator_session_status" ON "SimulatorSession" ("status");
CREATE INDEX IF NOT EXISTS "idx_simulator_session_expires" ON "SimulatorSession" ("expires_at");
CREATE INDEX IF NOT EXISTS "idx_simulator_session_created" ON "SimulatorSession" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_simulator_response_session" ON "SimulatorResponse" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_simulator_response_question" ON "SimulatorResponse" ("question_id");

CREATE INDEX IF NOT EXISTS "idx_simulator_eligibility_session" ON "SimulatorEligibility" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_simulator_eligibility_produit" ON "SimulatorEligibility" ("produit_id");

CREATE INDEX IF NOT EXISTS "idx_simulator_analytics_session" ON "SimulatorAnalytics" ("session_token");
CREATE INDEX IF NOT EXISTS "idx_simulator_analytics_event" ON "SimulatorAnalytics" ("event_type");
CREATE INDEX IF NOT EXISTS "idx_simulator_analytics_timestamp" ON "SimulatorAnalytics" ("timestamp");

-- Vérifier le statut final
SELECT 
    'Statut final des tables' as section,
    table_name,
    'CRÉÉE' as status
FROM information_schema.tables 
WHERE table_name IN ('SimulatorSession', 'SimulatorResponse', 'SimulatorEligibility', 'SimulatorAnalytics')
ORDER BY table_name; 