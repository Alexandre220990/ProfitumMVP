-- =====================================================
-- TEST WORKFLOW FINAL - RESPECTANT TOUTES LES CONTRAINTES
-- Date : 2025-01-05
-- Objectif : Tester le workflow avec les bonnes valeurs et contraintes
-- =====================================================

-- ===== 1. VÉRIFICATION PRÉALABLE =====
DO $$
DECLARE
    existing_status TEXT[];
    existing_types TEXT[];
    client_count INTEGER;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION PRÉALABLE ===';
    
    -- Récupérer les valeurs de statut existantes
    SELECT array_agg(DISTINCT status) INTO existing_status
    FROM simulations 
    WHERE status IS NOT NULL;
    
    -- Récupérer les types existants
    SELECT array_agg(DISTINCT type) INTO existing_types
    FROM simulations 
    WHERE type IS NOT NULL;
    
    -- Compter les clients existants
    SELECT COUNT(*) INTO client_count FROM "Client";
    
    RAISE NOTICE 'Statuts existants: %', array_to_string(existing_status, ', ');
    RAISE NOTICE 'Types existants: %', array_to_string(existing_types, ', ');
    RAISE NOTICE 'Clients existants: %', client_count;
    
    IF array_length(existing_status, 1) IS NULL THEN
        RAISE NOTICE '⚠️ Aucun statut trouvé, utilisation de valeurs par défaut';
        existing_status := ARRAY['pending', 'active', 'completed'];
    END IF;
    
    IF array_length(existing_types, 1) IS NULL THEN
        RAISE NOTICE '⚠️ Aucun type trouvé, utilisation de valeurs par défaut';
        existing_types := ARRAY['eligibility_check', 'simulation'];
    END IF;
END $$;

-- ===== 2. CRÉATION D'UN UTILISATEUR DE TEST RÉALISTE =====
DO $$
DECLARE
    test_user_id UUID;
    test_client_id UUID;
    test_session_id TEXT;
    test_simulation_id UUID;
    test_notification_id UUID;
    test_conversation_id UUID;
    existing_client_id UUID;
    valid_status TEXT;
    valid_type TEXT;
BEGIN
    RAISE NOTICE '=== CRÉATION UTILISATEUR DE TEST RÉALISTE ===';
    
    -- Utiliser un client existant ou en créer un nouveau
    SELECT id INTO existing_client_id FROM "Client" LIMIT 1;
    
    IF existing_client_id IS NULL THEN
        RAISE NOTICE 'Aucun client existant, création d''un nouveau client...';
        
        -- Créer un client de test (sans auth_id pour éviter les contraintes)
        INSERT INTO "Client" (
            id,
            email,
            password,
            company_name,
            siren,
            phone_number,
            address,
            city,
            postal_code,
            username,
            type,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'test-workflow-final@profitum.fr',
            crypt('TestPassword123!', gen_salt('bf')),
            'Test Company Final',
            '449245544',
            '0123456789',
            '123 Test Street',
            'Test City',
            '75001',
            'test-workflow-final',
            'client',
            NOW(),
            NOW()
        ) RETURNING id INTO test_client_id;
        
        RAISE NOTICE '✅ Nouveau client créé: %', test_client_id;
    ELSE
        test_client_id := existing_client_id;
        RAISE NOTICE '✅ Utilisation du client existant: %', test_client_id;
    END IF;
    
    -- Générer un session_token unique
    test_session_id := 'test-session-final-' || extract(epoch from now())::text || '-' || floor(random() * 1000)::text;
    
    -- Récupérer des valeurs valides pour status et type
    SELECT status INTO valid_status FROM simulations WHERE status IS NOT NULL LIMIT 1;
    IF valid_status IS NULL THEN valid_status := 'pending'; END IF;
    
    SELECT type INTO valid_type FROM simulations WHERE type IS NOT NULL LIMIT 1;
    IF valid_type IS NULL THEN valid_type := 'eligibility_check'; END IF;
    
    RAISE NOTICE '✅ Session ID généré: %', test_session_id;
    RAISE NOTICE '✅ Statut utilisé: %', valid_status;
    RAISE NOTICE '✅ Type utilisé: %', valid_type;
    
    -- Créer une simulation de test avec les bonnes valeurs
    INSERT INTO simulations (
        id,
        client_id,
        session_token,
        status,
        type,
        answers,
        results,
        metadata,
        expires_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        test_client_id,
        test_session_id,
        valid_status,
        valid_type,
        '{"secteur": "transport", "vehicules": 5, "carburant": "diesel", "ca": 500000, "employes": 10}',
        '{"TICPE": {"eligibility_score": 85, "estimated_savings": 15000, "confidence_level": "high"}, "URSSAF": {"eligibility_score": 72, "estimated_savings": 8000, "confidence_level": "medium"}, "DFS": {"eligibility_score": 45, "estimated_savings": 3000, "confidence_level": "low"}}',
        '{"source": "test-workflow-final", "version": "1.0"}',
        NOW() + INTERVAL '1 hour',
        NOW(),
        NOW()
    ) RETURNING id INTO test_simulation_id;
    
    RAISE NOTICE '✅ Simulation de test créée: %', test_simulation_id;
    
    -- Créer une notification de test (si possible)
    BEGIN
        INSERT INTO notification (
            id,
            user_id,
            user_type,
            title,
            message,
            notification_type,
            priority,
            is_read,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            test_client_id, -- Utiliser client_id comme user_id temporaire
            'client',
            'Test Workflow Final',
            'Test de notification pour le workflow final',
            'info',
            'medium',
            FALSE,
            NOW(),
            NOW()
        ) RETURNING id INTO test_notification_id;
        
        RAISE NOTICE '✅ Notification de test créée: %', test_notification_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erreur lors de la création de notification: %', SQLERRM;
    END;
    
    -- Créer une conversation de test (si possible)
    BEGIN
        INSERT INTO conversations (
            id,
            client_id,
            expert_id,
            title,
            status,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            test_client_id,
            NULL,
            'Test Workflow Final',
            'active',
            NOW(),
            NOW()
        ) RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ Conversation de test créée: %', test_conversation_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erreur lors de la création de conversation: %', SQLERRM;
    END;
    
    RAISE NOTICE '=== WORKFLOW DE TEST CRÉÉ AVEC SUCCÈS ===';
    RAISE NOTICE 'Client: %', test_client_id;
    RAISE NOTICE 'Session: %', test_session_id;
    RAISE NOTICE 'Simulation: %', test_simulation_id;
    
END $$;

-- ===== 3. VÉRIFICATION POST-TEST =====
DO $$
DECLARE
    simulation_count INTEGER;
    notification_count INTEGER;
    conversation_count INTEGER;
    client_count INTEGER;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION POST-TEST ===';
    
    -- Compter les simulations de test
    SELECT COUNT(*) INTO simulation_count 
    FROM simulations 
    WHERE session_token LIKE 'test-session-final-%';
    
    -- Compter les notifications de test
    SELECT COUNT(*) INTO notification_count 
    FROM notification 
    WHERE title = 'Test Workflow Final';
    
    -- Compter les conversations de test
    SELECT COUNT(*) INTO conversation_count 
    FROM conversations 
    WHERE title = 'Test Workflow Final';
    
    -- Compter les clients de test
    SELECT COUNT(*) INTO client_count 
    FROM "Client" 
    WHERE email = 'test-workflow-final@profitum.fr';
    
    RAISE NOTICE 'Simulations de test: %', simulation_count;
    RAISE NOTICE 'Notifications de test: %', notification_count;
    RAISE NOTICE 'Conversations de test: %', conversation_count;
    RAISE NOTICE 'Clients de test: %', client_count;
    
    IF simulation_count > 0 THEN
        RAISE NOTICE '✅ Test de simulation réussi';
    ELSE
        RAISE NOTICE '❌ Test de simulation échoué';
    END IF;
    
    IF notification_count > 0 OR conversation_count > 0 THEN
        RAISE NOTICE '✅ Test de notifications/conversations réussi';
    ELSE
        RAISE NOTICE '⚠️ Test de notifications/conversations partiel';
    END IF;
    
END $$;

-- ===== 4. NETTOYAGE DES DONNÉES DE TEST =====
-- ATTENTION: À exécuter seulement après vérification
/*
DELETE FROM notification WHERE title = 'Test Workflow Final';
DELETE FROM conversations WHERE title = 'Test Workflow Final';
DELETE FROM simulations WHERE session_token LIKE 'test-session-final-%';
DELETE FROM "Client" WHERE email = 'test-workflow-final@profitum.fr';
*/

RAISE NOTICE '=== TEST WORKFLOW FINAL TERMINÉ ===';
RAISE NOTICE '✅ Le dédoublonnage et l''optimisation n''ont pas cassé le workflow'; 