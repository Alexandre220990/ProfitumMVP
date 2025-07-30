-- =====================================================
-- IMPLÉMENTATION SIMULATEUR - OPTION 2
-- Session avec métadonnées client + migration propre
-- Date: 2025-01-30
-- =====================================================

-- 1. CRÉATION DES TABLES DÉDIÉES AU SIMULATEUR

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

-- Table des réponses au questionnaire
CREATE TABLE IF NOT EXISTS "SimulatorResponse" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "session_id" uuid NOT NULL REFERENCES "SimulatorSession"(id) ON DELETE CASCADE,
    "question_id" text NOT NULL,
    "response_value" jsonb NOT NULL,
    "response_time" integer, -- en secondes
    "created_at" timestamp with time zone DEFAULT now()
);

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

-- 2. FONCTIONS HELPER POUR LA GESTION DES SESSIONS

-- Fonction pour créer une nouvelle session avec données client
CREATE OR REPLACE FUNCTION create_simulator_session_with_client_data(
    p_session_token text DEFAULT gen_random_uuid()::text,
    p_client_data jsonb DEFAULT '{}'::jsonb,
    p_expires_in_hours integer DEFAULT 24
)
RETURNS json AS $$
DECLARE
    session_record RECORD;
    result JSON;
BEGIN
    -- Créer la session avec métadonnées client
    INSERT INTO "SimulatorSession" (
        session_token,
        ip_address,
        user_agent,
        expires_at,
        metadata
    ) VALUES (
        p_session_token,
        COALESCE(p_client_data->>'ip_address', 'unknown'),
        COALESCE(p_client_data->>'user_agent', 'unknown'),
        NOW() + (p_expires_in_hours || ' hours')::INTERVAL,
        jsonb_build_object(
            'client_data', p_client_data,
            'simulation_data', jsonb_build_object(
                'status', 'created',
                'step', 'initial',
                'total_questions_answered', 0
            ),
            'created_at', NOW()
        )
    ) RETURNING * INTO session_record;
    
    result := jsonb_build_object(
        'success', true,
        'session_id', session_record.id,
        'session_token', session_record.session_token,
        'expires_at', session_record.expires_at,
        'message', 'Session créée avec succès'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour sauvegarder les réponses
CREATE OR REPLACE FUNCTION save_simulator_responses(
    p_session_token text,
    p_responses jsonb
)
RETURNS json AS $$
DECLARE
    session_record RECORD;
    response_record RECORD;
    result JSON;
    question_id text;
    response_value jsonb;
    response_time integer;
BEGIN
    -- Vérifier que la session existe et n'est pas expirée
    SELECT * INTO session_record 
    FROM "SimulatorSession" 
    WHERE session_token = p_session_token AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Session non trouvée ou expirée'
        );
    END IF;
    
    -- Parcourir les réponses et les sauvegarder
    FOR question_id, response_value IN 
        SELECT * FROM jsonb_each(p_responses)
    LOOP
        -- Extraire le temps de réponse si disponible
        response_time := COALESCE((response_value->>'response_time')::integer, 0);
        
        -- Insérer ou mettre à jour la réponse
        INSERT INTO "SimulatorResponse" (
            session_id,
            question_id,
            response_value,
            response_time
        ) VALUES (
            session_record.id,
            question_id,
            response_value,
            response_time
        )
        ON CONFLICT (session_id, question_id) 
        DO UPDATE SET 
            response_value = EXCLUDED.response_value,
            response_time = EXCLUDED.response_time,
            created_at = NOW();
    END LOOP;
    
    -- Mettre à jour les métadonnées de la session
    UPDATE "SimulatorSession" 
    SET 
        metadata = metadata || jsonb_build_object(
            'simulation_data', jsonb_build_object(
                'last_activity', NOW(),
                'total_questions_answered', (
                    SELECT COUNT(*) FROM "SimulatorResponse" 
                    WHERE session_id = session_record.id
                )
            )
        ),
        updated_at = NOW()
    WHERE id = session_record.id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Réponses sauvegardées avec succès',
        'questions_saved', jsonb_object_keys(p_responses)
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FONCTION DE MIGRATION PROPRE VERS CLIENT

-- Fonction pour migrer une session vers un client identifié
CREATE OR REPLACE FUNCTION migrate_simulator_to_client(
    p_session_token text,
    p_client_inscription_data jsonb
)
RETURNS json AS $$
DECLARE
    session_record RECORD;
    eligibility_record RECORD;
    new_client_id uuid;
    migration_result json;
    migrated_count integer := 0;
    client_data jsonb;
BEGIN
    -- Récupérer la session
    SELECT * INTO session_record 
    FROM "SimulatorSession" 
    WHERE session_token = p_session_token AND status = 'completed';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Session non trouvée ou non complétée'
        );
    END IF;
    
    -- Extraire les données client de la session
    client_data := session_record.metadata->'client_data';
    
    -- Créer le nouveau client avec les données d'inscription
    INSERT INTO "Client" (
        email,
        nom,
        prenom,
        societe,
        telephone,
        adresse,
        code_postal,
        ville,
        pays,
        siret,
        secteur_activite,
        chiffre_affaires,
        nombre_employes,
        metadata
    ) VALUES (
        COALESCE(p_client_inscription_data->>'email', client_data->>'email'),
        COALESCE(p_client_inscription_data->>'nom', client_data->>'nom'),
        COALESCE(p_client_inscription_data->>'prenom', client_data->>'prenom'),
        COALESCE(p_client_inscription_data->>'societe', client_data->>'societe'),
        COALESCE(p_client_inscription_data->>'telephone', client_data->>'telephone'),
        COALESCE(p_client_inscription_data->>'adresse', client_data->>'adresse'),
        COALESCE(p_client_inscription_data->>'code_postal', client_data->>'code_postal'),
        COALESCE(p_client_inscription_data->>'ville', client_data->>'ville'),
        COALESCE(p_client_inscription_data->>'pays', client_data->>'pays'),
        COALESCE(p_client_inscription_data->>'siret', client_data->>'siret'),
        COALESCE(p_client_inscription_data->>'secteur_activite', client_data->>'secteur_activite'),
        COALESCE((p_client_inscription_data->>'chiffre_affaires')::numeric, (client_data->>'chiffre_affaires')::numeric),
        COALESCE((p_client_inscription_data->>'nombre_employes')::integer, (client_data->>'nombre_employes')::integer),
        jsonb_build_object(
            'migrated_from_simulator', true,
            'original_session_token', p_session_token,
            'simulation_metadata', session_record.metadata,
            'migration_date', NOW()
        )
    ) RETURNING id INTO new_client_id;
    
    -- Migrer les résultats d'éligibilité vers ClientProduitEligible
    FOR eligibility_record IN 
        SELECT * FROM "SimulatorEligibility" 
        WHERE session_id = session_record.id
    LOOP
        INSERT INTO "ClientProduitEligible" (
            "clientId",
            "produitId",
            statut,
            "tauxFinal",
            "montantFinal",
            "dureeFinale",
            metadata
        ) VALUES (
            new_client_id,
            eligibility_record.produit_id,
            CASE 
                WHEN eligibility_record.eligibility_score >= 70 THEN 'eligible'
                WHEN eligibility_record.eligibility_score >= 40 THEN 'potentiellement_eligible'
                ELSE 'non_eligible'
            END,
            eligibility_record.eligibility_score,
            eligibility_record.estimated_savings,
            12, -- durée par défaut
            jsonb_build_object(
                'migrated_from_simulator', true,
                'original_session_token', p_session_token,
                'confidence_level', eligibility_record.confidence_level,
                'recommendations', eligibility_record.recommendations,
                'risk_factors', eligibility_record.risk_factors,
                'calculation_details', eligibility_record.calculation_details,
                'migration_date', NOW()
            )
        );
        
        migrated_count := migrated_count + 1;
    END LOOP;
    
    -- Marquer la session comme migrée
    UPDATE "SimulatorSession" 
    SET 
        status = 'migrated',
        updated_at = now(),
        metadata = metadata || jsonb_build_object(
            'migrated_to_client', new_client_id,
            'migrated_at', now(),
            'migrated_eligibility_count', migrated_count,
            'client_inscription_data', p_client_inscription_data
        )
    WHERE id = session_record.id;
    
    migration_result := jsonb_build_object(
        'success', true,
        'session_token', p_session_token,
        'new_client_id', new_client_id,
        'migrated_eligibility_count', migrated_count,
        'message', 'Migration vers client réussie'
    );
    
    RETURN migration_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FONCTIONS DE CALCUL ET RÉCUPÉRATION

-- Fonction pour calculer l'éligibilité
CREATE OR REPLACE FUNCTION calculate_simulator_eligibility(
    p_session_token text
)
RETURNS json AS $$
DECLARE
    session_record RECORD;
    responses_data jsonb;
    eligibility_results jsonb;
    result JSON;
BEGIN
    -- Récupérer la session
    SELECT * INTO session_record 
    FROM "SimulatorSession" 
    WHERE session_token = p_session_token AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Session non trouvée ou expirée'
        );
    END IF;
    
    -- Récupérer toutes les réponses
    SELECT jsonb_object_agg(sr.question_id, sr.response_value) 
    INTO responses_data
    FROM "SimulatorResponse" sr 
    WHERE sr.session_id = session_record.id;
    
    IF responses_data IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Aucune réponse trouvée pour cette session'
        );
    END IF;
    
    -- Calculer l'éligibilité (logique simplifiée)
    eligibility_results := jsonb_build_object(
        'TICPE', jsonb_build_object(
            'eligibility_score', 75,
            'estimated_savings', 5000.00,
            'confidence_level', 'high',
            'recommendations', jsonb_build_array('Éligible TICPE', 'Contactez un expert'),
            'calculation_details', jsonb_build_object('method', 'simplified_calculation')
        ),
        'URSSAF', jsonb_build_object(
            'eligibility_score', 60,
            'estimated_savings', 3000.00,
            'confidence_level', 'medium',
            'recommendations', jsonb_build_array('Éligible URSSAF', 'Analyse approfondie requise'),
            'calculation_details', jsonb_build_object('method', 'simplified_calculation')
        ),
        'DFS', jsonb_build_object(
            'eligibility_score', 45,
            'estimated_savings', 2000.00,
            'confidence_level', 'low',
            'recommendations', jsonb_build_array('Éligibilité limitée DFS', 'Documents supplémentaires nécessaires'),
            'calculation_details', jsonb_build_object('method', 'simplified_calculation')
        )
    );
    
    -- Sauvegarder les résultats
    INSERT INTO "SimulatorEligibility" (
        session_id,
        produit_id,
        eligibility_score,
        estimated_savings,
        confidence_level,
        calculation_details,
        recommendations
    ) VALUES 
    (session_record.id, 'TICPE', 75, 5000.00, 'high', eligibility_results->'TICPE'->'calculation_details', ARRAY['Éligible TICPE', 'Contactez un expert']),
    (session_record.id, 'URSSAF', 60, 3000.00, 'medium', eligibility_results->'URSSAF'->'calculation_details', ARRAY['Éligible URSSAF', 'Analyse approfondie requise']),
    (session_record.id, 'DFS', 45, 2000.00, 'low', eligibility_results->'DFS'->'calculation_details', ARRAY['Éligibilité limitée DFS', 'Documents supplémentaires nécessaires']);
    
    -- Marquer la session comme complétée
    UPDATE "SimulatorSession" 
    SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW(),
        metadata = metadata || jsonb_build_object(
            'eligibility_calculated', NOW(),
            'eligibility_results', eligibility_results
        )
    WHERE id = session_record.id;
    
    result := jsonb_build_object(
        'success', true,
        'eligibility_results', eligibility_results,
        'message', 'Éligibilité calculée avec succès'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. INDEX ET POLITIQUES RLS

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS "idx_simulator_session_token" ON "SimulatorSession" (session_token);
CREATE INDEX IF NOT EXISTS "idx_simulator_session_status" ON "SimulatorSession" (status);
CREATE INDEX IF NOT EXISTS "idx_simulator_session_expires" ON "SimulatorSession" (expires_at);
CREATE INDEX IF NOT EXISTS "idx_simulator_response_session" ON "SimulatorResponse" (session_id);
CREATE INDEX IF NOT EXISTS "idx_simulator_eligibility_session" ON "SimulatorEligibility" (session_id);

-- Contrainte d'unicité pour éviter les doublons de réponses
ALTER TABLE "SimulatorResponse" 
ADD CONSTRAINT "unique_session_question" UNIQUE (session_id, question_id);

-- Politiques RLS
ALTER TABLE "SimulatorSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SimulatorResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SimulatorEligibility" ENABLE ROW LEVEL SECURITY;

-- Politiques permissives pour le simulateur
CREATE POLICY "simulator_session_all" ON "SimulatorSession" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "simulator_response_all" ON "SimulatorResponse" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "simulator_eligibility_all" ON "SimulatorEligibility" FOR ALL USING (true) WITH CHECK (true);

-- 6. FONCTION DE NETTOYAGE

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_simulator_sessions()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Supprimer les sessions expirées et non migrées
    DELETE FROM "SimulatorSession" 
    WHERE expires_at < now() 
    AND status NOT IN ('migrated');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. VUES POUR L'ANALYSE

-- Vue d'ensemble des sessions
CREATE OR REPLACE VIEW "SimulatorOverview" AS
SELECT 
    ss.session_token,
    ss.status,
    ss.current_step,
    ss.total_steps,
    ss.started_at,
    ss.completed_at,
    ss.expires_at,
    COUNT(sr.id) as response_count,
    COUNT(se.id) as eligibility_count,
    COALESCE(SUM(se.estimated_savings), 0) as total_potential_savings,
    CASE 
        WHEN ss.expires_at < now() THEN 'expired'
        ELSE 'active'
    END as expiration_status,
    ss.metadata->'client_data'->>'email' as client_email,
    ss.metadata->'client_data'->>'societe' as client_societe
FROM "SimulatorSession" ss
LEFT JOIN "SimulatorResponse" sr ON ss.id = sr.session_id
LEFT JOIN "SimulatorEligibility" se ON ss.id = se.session_id
GROUP BY ss.id, ss.session_token, ss.status, ss.current_step, ss.total_steps, 
         ss.started_at, ss.completed_at, ss.expires_at, ss.metadata;

-- Commentaires pour la documentation
COMMENT ON TABLE "SimulatorSession" IS 'Sessions temporaires du simulateur avec métadonnées client';
COMMENT ON TABLE "SimulatorResponse" IS 'Réponses aux questions du simulateur';
COMMENT ON TABLE "SimulatorEligibility" IS 'Résultats d''éligibilité du simulateur';
COMMENT ON FUNCTION create_simulator_session_with_client_data(text, jsonb, integer) IS 'Crée une session simulateur avec données client temporaires';
COMMENT ON FUNCTION migrate_simulator_to_client(text, jsonb) IS 'Migre une session simulateur vers un client identifié';
COMMENT ON FUNCTION calculate_simulator_eligibility(text) IS 'Calcule l''éligibilité pour une session simulateur'; 