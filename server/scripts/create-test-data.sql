-- =====================================================
-- CRÉATION DE DONNÉES DE TEST POUR LA MIGRATION
-- Date: 2025-01-30
-- =====================================================

-- 1. Créer une session de simulateur de test
INSERT INTO "SimulatorSession" (
    session_token,
    status,
    created_at,
    updated_at,
    metadata
) VALUES (
    'SESSION_TOKEN_TEST',
    'completed',
    NOW(),
    NOW(),
    jsonb_build_object(
        'test_data', true,
        'description', 'Session de test pour migration'
    )
) ON CONFLICT (session_token) DO NOTHING;

-- 2. Récupérer l'ID de la session créée
DO $$
DECLARE
    v_session_id uuid;
BEGIN
    SELECT id INTO v_session_id 
    FROM "SimulatorSession" 
    WHERE session_token = 'SESSION_TOKEN_TEST';
    
    -- 3. Créer des éligibilités de test avec la structure correcte
    INSERT INTO "SimulatorEligibility" (
        session_id,
        produit_id,
        eligibility_score,
        estimated_savings,
        confidence_level,
        recommendations,
        risk_factors,
        calculation_details,
        created_at
    ) VALUES 
    (
        v_session_id,
        'cee-product', -- ID du produit CEE
        85,
        2500.00,
        'high', -- confidence_level est text
        ARRAY['Installation recommandée', 'Économies importantes'],
        ARRAY['Surface importante', 'Isolation défaillante'],
        jsonb_build_object('method', 'standard_calculation', 'factors', jsonb_build_array('surface', 'isolation')),
        NOW()
    ),
    (
        v_session_id,
        'cir-product', -- ID du produit CIR
        72,
        1800.00,
        'medium', -- confidence_level est text
        ARRAY['Rénovation conseillée', 'Amélioration énergétique'],
        ARRAY['Bâtiment ancien', 'Usage intensif'],
        jsonb_build_object('method', 'cir_calculation', 'factors', jsonb_build_array('batiment', 'usage')),
        NOW()
    );
    
    RAISE NOTICE 'Données de test créées pour la session: %', v_session_id;
END $$;

-- 4. Vérifier les données créées
SELECT 
    'Données de test créées' as section,
    COUNT(*) as total_sessions
FROM "SimulatorSession" 
WHERE session_token = 'SESSION_TOKEN_TEST';

SELECT 
    'Éligibilités créées' as section,
    COUNT(*) as total_eligibilities
FROM "SimulatorEligibility" se
JOIN "SimulatorSession" ss ON se.session_id = ss.id
WHERE ss.session_token = 'SESSION_TOKEN_TEST'; 