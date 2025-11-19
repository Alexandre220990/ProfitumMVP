-- =====================================================
-- CORRECTION RAPIDE SIMULATEUR + GESTION EMAIL VISITEUR
-- Date: 2025-01-31
-- Description: 
--   1. Correction rapide de l'erreur 500 du simulateur
--   2. Utilisation de l'email réel du visiteur pour les clients temporaires
--   3. Champs optionnels (name, company_name) laissés NULL jusqu'à l'inscription
-- =====================================================

-- SUPPRIMER TOUT EN CASCADE
DROP TRIGGER IF EXISTS cleanup_expired_data_trigger ON simulations CASCADE;
DROP TRIGGER IF EXISTS trigger_cleanup_expired_data ON simulations CASCADE;
DROP TRIGGER IF EXISTS trigger_cleanup_expired_data ON "Client" CASCADE;
DROP FUNCTION IF EXISTS trigger_cleanup_expired_data() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;

-- CORRIGER LA FONCTION RPC
CREATE OR REPLACE FUNCTION create_simulation_with_temporary_client(
    p_session_token TEXT,
    p_client_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON AS $$
DECLARE
    v_client_id UUID;
    v_simulation_id UUID;
    v_result JSON;
BEGIN
    -- Créer le client temporaire
    -- ✅ Utiliser l'email réel s'il est fourni, sinon générer un email temporaire
    -- ✅ Les champs name, company_name, phone_number sont laissés NULL jusqu'à l'inscription finale
    INSERT INTO "Client" (
        id,
        email,
        password,
        name,
        company_name,
        phone_number,
        type,
        statut,
        "expires_at",
        "temp_password",
        "dateCreation",
        "derniereConnexion",
        created_at,
        updated_at,
        metadata
    ) VALUES (
        gen_random_uuid(),
        -- Utiliser l'email réel s'il est fourni et valide, sinon générer un email temporaire
        CASE 
            WHEN p_client_data->>'email' IS NOT NULL 
                 AND p_client_data->>'email' != '' 
                 AND (p_client_data->>'email')::text NOT LIKE '%@profitum.temp%'
            THEN (p_client_data->>'email')::text
            ELSE 'temp_' || extract(epoch from now())::text || '_' || encode(gen_random_bytes(4), 'hex') || '@profitum.temp'
        END,
        crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
        -- ✅ NULL au lieu de valeurs par défaut - sera rempli à l'inscription
        NULL,
        NULL,
        NULL,
        'temporaire',
        'actif',
        NOW() + INTERVAL '24 hours',
        encode(gen_random_bytes(32), 'hex'),
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object(
            'session_token', p_session_token,
            'source', 'simulator_temporary',
            'client_data', p_client_data,
            'has_real_email', CASE 
                WHEN p_client_data->>'email' IS NOT NULL 
                     AND p_client_data->>'email' != '' 
                     AND (p_client_data->>'email')::text NOT LIKE '%@profitum.temp%'
                THEN true 
                ELSE false 
            END,
            'created_at_simulator_start', NOW()
        )
    ) RETURNING id INTO v_client_id;
    
    -- Créer la simulation liée au client temporaire
    INSERT INTO simulations (
        client_id,
        session_token,
        status,
        type,
        metadata,
        expires_at
    ) VALUES (
        v_client_id,
        p_session_token,
        'en_cours',
        'temporaire',
        jsonb_build_object(
            'client_data', p_client_data,
            'created_via', 'temporary_client_creation'
        ),
        NOW() + INTERVAL '24 hours'
    ) RETURNING id INTO v_simulation_id;
    
    v_result := jsonb_build_object(
        'success', true,
        'client_id', v_client_id,
        'simulation_id', v_simulation_id,
        'session_token', p_session_token,
        'expires_at', NOW() + INTERVAL '24 hours'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 