-- =====================================================
-- CRÉATION DE DONNÉES DE TEST POUR SIMULATION
-- Date: 2025-01-30
-- =====================================================

-- Fonction pour créer des données de simulation de test
CREATE OR REPLACE FUNCTION create_test_simulation_data()
RETURNS JSON AS $$
DECLARE
    session_id uuid;
    session_token text;
    result JSON;
BEGIN
    -- Générer un token de session unique
    session_token := 'test_session_' || extract(epoch from now())::text;
    
    -- 1. Créer une session de simulation de test
    INSERT INTO "SimulatorSession" (
        session_token,
        ip_address,
        user_agent,
        status,
        current_step,
        total_steps,
        started_at,
        completed_at,
        expires_at,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        session_token,
        '127.0.0.1',
        'Test User Agent',
        'completed',
        10,
        10,
        NOW() - INTERVAL '30 minutes',
        NOW() - INTERVAL '5 minutes',
        NOW() + INTERVAL '24 hours',
        jsonb_build_object(
            'client_email', 'wamuchacha@gmail.com',
            'company_name', 'Entreprise Test Wamuchacha',
            'sector', 'Transport',
            'employee_count', 25,
            'annual_revenue', 500000,
            'test_data', true
        ),
        NOW() - INTERVAL '30 minutes',
        NOW() - INTERVAL '5 minutes'
    ) RETURNING id INTO session_id;
    
    -- 2. Créer des réponses au questionnaire
    INSERT INTO "SimulatorResponse" (
        session_id,
        question_id,
        response_value,
        response_time,
        created_at
    ) VALUES 
    (session_id, 'Q001_SECTOR', '"transport"'::jsonb, 5, NOW() - INTERVAL '25 minutes'),
    (session_id, 'Q002_EMPLOYEES', '25'::jsonb, 3, NOW() - INTERVAL '24 minutes'),
    (session_id, 'Q003_REVENUE', '500000'::jsonb, 4, NOW() - INTERVAL '23 minutes'),
    (session_id, 'Q004_VEHICLES', '12'::jsonb, 2, NOW() - INTERVAL '22 minutes'),
    (session_id, 'Q005_FUEL_CONSUMPTION', '15000'::jsonb, 6, NOW() - INTERVAL '21 minutes'),
    (session_id, 'Q006_RESEARCH_ACTIVITIES', 'true'::jsonb, 3, NOW() - INTERVAL '20 minutes'),
    (session_id, 'Q007_SOCIAL_CHARGES', '45000'::jsonb, 4, NOW() - INTERVAL '19 minutes'),
    (session_id, 'Q008_PROPERTY_TAX', '8000'::jsonb, 2, NOW() - INTERVAL '18 minutes'),
    (session_id, 'Q009_CONTACT_EMAIL', '"wamuchacha@gmail.com"'::jsonb, 1, NOW() - INTERVAL '17 minutes'),
    (session_id, 'Q010_CONTACT_PHONE', '"+33123456789"'::jsonb, 1, NOW() - INTERVAL '16 minutes');
    
    -- 3. Créer des résultats d'éligibilité
    INSERT INTO "SimulatorEligibility" (
        session_id,
        produit_id,
        eligibility_score,
        estimated_savings,
        confidence_level,
        calculation_details,
        recommendations,
        risk_factors,
        created_at
    ) VALUES 
    (
        session_id,
        'TICPE',
        85,
        7500.00,
        'high',
        jsonb_build_object(
            'base_amount', 15000,
            'vehicle_coefficient', 0.8,
            'usage_coefficient', 0.9,
            'fuel_rate', 0.65,
            'total_consumption', 15000
        ),
        ARRAY['Éligible TICPE', 'Excellent potentiel de récupération', 'Contactez un expert'],
        ARRAY['Nécessite justificatifs d''usage professionnel'],
        NOW() - INTERVAL '10 minutes'
    ),
    (
        session_id,
        'URSSAF',
        70,
        4500.00,
        'medium',
        jsonb_build_object(
            'social_charges_base', 45000,
            'reduction_rate', 0.1,
            'employee_count', 25
        ),
        ARRAY['Éligible URSSAF', 'Réduction possible sur cotisations', 'Analyse approfondie requise'],
        ARRAY['Dépend de la qualification des emplois'],
        NOW() - INTERVAL '10 minutes'
    ),
    (
        session_id,
        'DFS',
        55,
        3000.00,
        'medium',
        jsonb_build_object(
            'property_tax_base', 8000,
            'reduction_rate', 0.375,
            'property_type', 'commercial'
        ),
        ARRAY['Éligibilité DFS', 'Réduction foncière possible', 'Documents supplémentaires nécessaires'],
        ARRAY['Nécessite justificatifs de propriété'],
        NOW() - INTERVAL '10 minutes'
    );
    
    -- 4. Retourner le résultat
    result := jsonb_build_object(
        'success', true,
        'session_id', session_id,
        'session_token', session_token,
        'eligibility_count', 3,
        'responses_count', 10,
        'message', 'Données de simulation de test créées avec succès'
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

-- Exécuter la fonction pour créer les données de test
SELECT create_test_simulation_data() as test_data_result;

-- Vérifier les données créées
SELECT 
    'TEST_DATA_VERIFICATION' as section,
    (SELECT COUNT(*) FROM "SimulatorSession" WHERE metadata::text LIKE '%wamuchacha%') as sessions_count,
    (SELECT COUNT(*) FROM "SimulatorResponse" sr 
     JOIN "SimulatorSession" ss ON sr.session_id = ss.id 
     WHERE ss.metadata::text LIKE '%wamuchacha%') as responses_count,
    (SELECT COUNT(*) FROM "SimulatorEligibility" se 
     JOIN "SimulatorSession" ss ON se.session_id = ss.id 
     WHERE ss.metadata::text LIKE '%wamuchacha%') as eligibility_count;