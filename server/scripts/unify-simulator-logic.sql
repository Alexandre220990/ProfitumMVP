-- =====================================================
-- UNIFORMISATION DE LA LOGIQUE DU SIMULATEUR
-- Date: 2025-01-30
-- Objectif: Migrer vers TemporarySimulationSession + ClientProduitEligible
-- =====================================================

-- ÉTAPE 1: CRÉER LES FONCTIONS HELPER POUR LA GESTION DES SESSIONS

-- Fonction pour créer une nouvelle session de simulation
CREATE OR REPLACE FUNCTION create_simulation_session(
    p_session_id UUID DEFAULT gen_random_uuid(),
    p_expires_in_hours INTEGER DEFAULT 24
)
RETURNS JSON AS $$
DECLARE
    session_record RECORD;
    result JSON;
BEGIN
    -- Créer la session temporaire
    INSERT INTO "TemporarySimulationSession" (
        sessionId,
        simulationData,
        expiresAt,
        metadata
    ) VALUES (
        p_session_id,
        '{"status": "created", "step": "initial"}'::jsonb,
        NOW() + (p_expires_in_hours || ' hours')::INTERVAL,
        jsonb_build_object(
            'created_at', NOW(),
            'ip_address', 'unknown',
            'user_agent', 'unknown'
        )
    ) RETURNING * INTO session_record;
    
    result := jsonb_build_object(
        'success', true,
        'session_id', session_record.sessionId,
        'expires_at', session_record.expiresAt,
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

-- Fonction pour sauvegarder les réponses d'une session
CREATE OR REPLACE FUNCTION save_simulation_responses(
    p_session_id UUID,
    p_responses JSONB
)
RETURNS JSON AS $$
DECLARE
    session_record RECORD;
    result JSON;
BEGIN
    -- Vérifier que la session existe et n'est pas expirée
    SELECT * INTO session_record 
    FROM "TemporarySimulationSession" 
    WHERE sessionId = p_session_id AND expiresAt > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Session non trouvée ou expirée'
        );
    END IF;
    
    -- Mettre à jour les données de simulation
    UPDATE "TemporarySimulationSession" 
    SET 
        simulationData = simulationData || p_responses,
        updated_at = NOW(),
        metadata = metadata || jsonb_build_object('last_activity', NOW())
    WHERE sessionId = p_session_id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Réponses sauvegardées avec succès'
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

-- Fonction pour calculer l'éligibilité et sauvegarder les résultats
CREATE OR REPLACE FUNCTION calculate_and_save_eligibility(
    p_session_id UUID
)
RETURNS JSON AS $$
DECLARE
    session_record RECORD;
    responses_data JSONB;
    eligibility_results JSONB;
    result JSON;
BEGIN
    -- Récupérer la session et ses données
    SELECT * INTO session_record 
    FROM "TemporarySimulationSession" 
    WHERE sessionId = p_session_id AND expiresAt > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Session non trouvée ou expirée'
        );
    END IF;
    
    -- Extraire les réponses du questionnaire
    responses_data := session_record.simulationData->'responses';
    
    IF responses_data IS NULL OR responses_data = 'null'::jsonb THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Aucune réponse trouvée pour cette session'
        );
    END IF;
    
    -- Calculer l'éligibilité (logique simplifiée pour l'exemple)
    eligibility_results := jsonb_build_object(
        'TICPE', jsonb_build_object(
            'eligibility_score', 75,
            'estimated_savings', 5000.00,
            'confidence_level', 'high',
            'recommendations', jsonb_build_array('Éligible TICPE', 'Contactez un expert')
        ),
        'URSSAF', jsonb_build_object(
            'eligibility_score', 60,
            'estimated_savings', 3000.00,
            'confidence_level', 'medium',
            'recommendations', jsonb_build_array('Éligible URSSAF', 'Analyse approfondie requise')
        ),
        'DFS', jsonb_build_object(
            'eligibility_score', 45,
            'estimated_savings', 2000.00,
            'confidence_level', 'low',
            'recommendations', jsonb_build_array('Éligibilité limitée DFS', 'Documents supplémentaires nécessaires')
        )
    );
    
    -- Sauvegarder les résultats dans ClientProduitEligible
    INSERT INTO "ClientProduitEligible" (
        "sessionId",
        "produitId",
        statut,
        "tauxFinal",
        "montantFinal",
        "dureeFinale",
        metadata
    ) VALUES 
    (p_session_id, 'TICPE', 'eligible', 75, 5000.00, 12, eligibility_results->'TICPE'),
    (p_session_id, 'URSSAF', 'eligible', 60, 3000.00, 12, eligibility_results->'URSSAF'),
    (p_session_id, 'DFS', 'eligible', 45, 2000.00, 12, eligibility_results->'DFS');
    
    -- Mettre à jour la session avec les résultats
    UPDATE "TemporarySimulationSession" 
    SET 
        simulationData = simulationData || jsonb_build_object('eligibility_results', eligibility_results),
        updated_at = NOW(),
        metadata = metadata || jsonb_build_object('calculation_completed', NOW())
    WHERE sessionId = p_session_id;
    
    result := jsonb_build_object(
        'success', true,
        'eligibility_results', eligibility_results,
        'message', 'Éligibilité calculée et sauvegardée avec succès'
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

-- Fonction pour récupérer les résultats d'une session
CREATE OR REPLACE FUNCTION get_simulation_results(
    p_session_id UUID
)
RETURNS JSON AS $$
DECLARE
    session_record RECORD;
    eligibility_records RECORD[];
    result JSON;
BEGIN
    -- Récupérer la session
    SELECT * INTO session_record 
    FROM "TemporarySimulationSession" 
    WHERE sessionId = p_session_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Session non trouvée'
        );
    END IF;
    
    -- Récupérer les résultats d'éligibilité
    SELECT ARRAY_AGG(
        jsonb_build_object(
            'produit_id', "produitId",
            'statut', statut,
            'taux_final', "tauxFinal",
            'montant_final', "montantFinal",
            'duree_finale', "dureeFinale",
            'metadata', metadata
        )
    ) INTO eligibility_records
    FROM "ClientProduitEligible" 
    WHERE "sessionId" = p_session_id;
    
    result := jsonb_build_object(
        'success', true,
        'session_data', session_record.simulationData,
        'eligibility_results', eligibility_records,
        'expires_at', session_record.expiresAt,
        'is_expired', session_record.expiresAt < NOW()
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

-- ÉTAPE 2: UNIFORMISER LES POLITIQUES RLS

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "simulator_session_all" ON "public"."TemporarySession";
DROP POLICY IF EXISTS "simulator_response_all" ON "public"."TemporaryResponse";
DROP POLICY IF EXISTS "simulator_eligibility_all" ON "public"."TemporaryEligibility";
DROP POLICY IF EXISTS "simulator_analytics_all" ON "public"."SimulatorAnalytics";

-- Créer des politiques uniformes pour TemporarySimulationSession
DROP POLICY IF EXISTS "temporary_simulation_session_all" ON "public"."TemporarySimulationSession";
CREATE POLICY "temporary_simulation_session_all" ON "public"."TemporarySimulationSession"
    FOR ALL USING (true) WITH CHECK (true);

-- Créer des politiques uniformes pour ClientProduitEligible avec sessionId
DROP POLICY IF EXISTS "client_produit_eligible_session_all" ON "public"."ClientProduitEligible";
CREATE POLICY "client_produit_eligible_session_all" ON "public"."ClientProduitEligible"
    FOR ALL USING ("sessionId" IS NOT NULL) WITH CHECK ("sessionId" IS NOT NULL);

-- ÉTAPE 3: CRÉER DES INDEX OPTIMISÉS

-- Index pour optimiser les requêtes par session
CREATE INDEX IF NOT EXISTS "idx_temporary_simulation_session_active" 
ON "TemporarySimulationSession" (sessionId) WHERE expiresAt > NOW();

CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_session" 
ON "ClientProduitEligible" ("sessionId") WHERE "sessionId" IS NOT NULL;

-- ÉTAPE 4: NETTOYER LES ANCIENNES TABLES (OPTIONNEL - À EXÉCUTER APRÈS MIGRATION)

-- Commenter ces lignes jusqu'à ce que la migration soit complète
/*
DROP TABLE IF EXISTS "TemporarySession" CASCADE;
DROP TABLE IF EXISTS "TemporaryResponse" CASCADE;
DROP TABLE IF EXISTS "TemporaryEligibility" CASCADE;
DROP TABLE IF EXISTS "SimulatorAnalytics" CASCADE;
*/

-- ÉTAPE 5: CRÉER DES VUES POUR FACILITER L'ANALYSE

-- Vue pour les sessions actives avec leurs résultats
CREATE OR REPLACE VIEW "SimulationSessionsOverview" AS
SELECT 
    tss.sessionId,
    tss.simulationData,
    tss.expiresAt,
    tss.created_at,
    tss.updated_at,
    COUNT(cpe.id) as eligibility_count,
    COALESCE(SUM(cpe."montantFinal"), 0) as total_potential_savings,
    CASE 
        WHEN tss.expiresAt < NOW() THEN 'expired'
        ELSE 'active'
    END as status
FROM "TemporarySimulationSession" tss
LEFT JOIN "ClientProduitEligible" cpe ON tss.sessionId = cpe."sessionId"
GROUP BY tss.sessionId, tss.simulationData, tss.expiresAt, tss.created_at, tss.updated_at;

-- Commentaires pour la documentation
COMMENT ON FUNCTION create_simulation_session(UUID, INTEGER) IS 'Fonction pour créer une nouvelle session de simulation';
COMMENT ON FUNCTION save_simulation_responses(UUID, JSONB) IS 'Fonction pour sauvegarder les réponses d''une session';
COMMENT ON FUNCTION calculate_and_save_eligibility(UUID) IS 'Fonction pour calculer l''éligibilité et sauvegarder les résultats';
COMMENT ON FUNCTION get_simulation_results(UUID) IS 'Fonction pour récupérer les résultats d''une session';
COMMENT ON VIEW "SimulationSessionsOverview" IS 'Vue d''ensemble des sessions de simulation avec leurs résultats'; 