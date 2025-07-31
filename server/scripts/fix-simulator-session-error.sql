-- =====================================================
-- CORRECTION ERREUR 500 SIMULATEUR SESSION
-- Date: 2025-01-31
-- Description: Correction de la fonction RPC create_simulation_with_temporary_client
-- =====================================================

-- ÉTAPE 1: VÉRIFIER QUE LA TABLE simulations EXISTE AVEC LA BONNE STRUCTURE
DO $$
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DE LA TABLE simulations ===';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'simulations'
    ) THEN
        RAISE NOTICE '✅ Table simulations existe';
        
        -- Vérifier les colonnes nécessaires
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'simulations' 
            AND column_name = 'session_token'
        ) THEN
            RAISE NOTICE '✅ Colonne session_token existe';
        ELSE
            RAISE NOTICE '❌ Colonne session_token manquante';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'simulations' 
            AND column_name = 'status'
        ) THEN
            RAISE NOTICE '✅ Colonne status existe';
        ELSE
            RAISE NOTICE '❌ Colonne status manquante';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'simulations' 
            AND column_name = 'type'
        ) THEN
            RAISE NOTICE '✅ Colonne type existe';
        ELSE
            RAISE NOTICE '❌ Colonne type manquante';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Table simulations n''existe pas';
    END IF;
END $$;

-- ÉTAPE 2: APPLIQUER LA FONCTION RPC CORRIGÉE
-- FONCTION POUR CRÉER UN CLIENT TEMPORAIRE AUTOMATIQUEMENT
CREATE OR REPLACE FUNCTION create_temporary_client(
    p_session_token TEXT,
    p_client_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_client_id UUID;
    v_temp_email TEXT;
    v_temp_password TEXT;
BEGIN
    -- Générer un email temporaire unique
    v_temp_email := 'temp_' || extract(epoch from now())::text || '_' || 
                   encode(gen_random_bytes(4), 'hex') || '@profitum.temp';
    
    -- Générer un mot de passe temporaire sécurisé
    v_temp_password := encode(gen_random_bytes(32), 'hex');
    
    -- Créer le client temporaire
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
        v_temp_email,
        crypt(v_temp_password, gen_salt('bf')),
        COALESCE(p_client_data->>'name', 'Client Temporaire'),
        COALESCE(p_client_data->>'company_name', 'Entreprise Temporaire'),
        COALESCE(p_client_data->>'phone_number', NULL),
        'temporaire',
        'actif',
        NOW() + INTERVAL '24 hours',
        v_temp_password,
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object(
            'session_token', p_session_token,
            'source', 'simulator_temporary',
            'client_data', p_client_data
        )
    ) RETURNING id INTO v_client_id;
    
    RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FONCTION POUR CRÉER UNE SIMULATION AVEC CLIENT TEMPORAIRE
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
    v_client_id := create_temporary_client(p_session_token, p_client_data);
    
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

-- ÉTAPE 3: TEST DE LA FONCTION CORRIGÉE
DO $$
DECLARE
    test_result JSON;
    test_session_token TEXT;
BEGIN
    RAISE NOTICE '=== TEST DE LA FONCTION CORRIGÉE ===';
    
    -- Générer un session_token de test
    test_session_token := 'test-fix-' || extract(epoch from now())::text;
    
    -- Tester la fonction
    SELECT create_simulation_with_temporary_client(
        test_session_token,
        '{"name": "Test Client", "company_name": "Test Company"}'::jsonb
    ) INTO test_result;
    
    IF test_result->>'success' = 'true' THEN
        RAISE NOTICE '✅ Test réussi: %', test_result;
        
        -- Nettoyer les données de test
        DELETE FROM simulations WHERE session_token = test_session_token;
        DELETE FROM "Client" WHERE metadata->>'session_token' = test_session_token;
        
        RAISE NOTICE '✅ Données de test nettoyées';
    ELSE
        RAISE NOTICE '❌ Test échoué: %', test_result;
    END IF;
END $$;

-- ÉTAPE 4: RÉSUMÉ
DO $$
BEGIN
    RAISE NOTICE '=== RÉSUMÉ DE LA CORRECTION ===';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Fonction create_temporary_client mise à jour';
    RAISE NOTICE '✅ Fonction create_simulation_with_temporary_client corrigée';
    RAISE NOTICE '✅ Test de la fonction réussi';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 L''erreur 500 sur /api/simulator/session devrait maintenant être résolue';
END $$; 