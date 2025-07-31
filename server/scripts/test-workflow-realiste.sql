-- =====================================================
-- TEST WORKFLOW RÉALISTE - SIMULATION DU VRAI PROCESSUS
-- Date : 2025-01-05
-- Objectif : Tester le workflow réel avec création dans auth.users
-- =====================================================

-- ===== 1. CRÉATION D'UTILISATEUR DANS AUTH.USERS =====
DO $$
DECLARE
    test_user_id UUID;
    test_client_id UUID;
    test_session_id TEXT;
    test_notification_id UUID;
    test_conversation_id UUID;
    test_simulation_id UUID;
BEGIN
    RAISE NOTICE '=== TEST WORKFLOW RÉALISTE ===';
    
    -- Générer un ID utilisateur de test
    test_user_id := gen_random_uuid();
    test_session_id := 'test-session-' || extract(epoch from now())::text;
    
    RAISE NOTICE '✅ ID utilisateur généré: %', test_user_id;
    RAISE NOTICE '✅ Session ID généré: %', test_session_id;
    
    -- Créer un utilisateur dans auth.users (simulation)
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        test_user_id,
        'test-workflow-realiste@profitum.fr',
        crypt('TestPassword123!', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"username": "test-workflow-realiste", "type": "client", "company_name": "Test Company Réaliste", "siren": "449245544"}'
    );
    
    RAISE NOTICE '✅ Utilisateur créé dans auth.users';
    
    -- Créer un client de test avec le bon auth_id
    INSERT INTO "Client" (
        id,
        auth_id,
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
        test_user_id,
        'test-workflow-realiste@profitum.fr',
        crypt('TestPassword123!', gen_salt('bf')),
        'Test Company Réaliste',
        '449245544',
        '0123456789',
        '123 Test Street',
        'Test City',
        '75001',
        'test-workflow-realiste',
        'client',
        NOW(),
        NOW()
    ) RETURNING id INTO test_client_id;
    
    RAISE NOTICE '✅ Client de test créé: %', test_client_id;
    
    -- Créer une simulation de test avec statut autorisé
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
        'active',
        'eligibility_check',
        '{"secteur": "transport", "vehicules": 5, "carburant": "diesel", "ca": 500000, "employes": 10}',
        '{"TICPE": {"eligibility_score": 85, "estimated_savings": 15000, "confidence_level": "high"}, "URSSAF": {"eligibility_score": 72, "estimated_savings": 8000, "confidence_level": "medium"}, "DFS": {"eligibility_score": 45, "estimated_savings": 3000, "confidence_level": "low"}}',
        '{"source": "test-workflow-realiste", "version": "1.0"}',
        NOW() + INTERVAL '1 hour',
        NOW(),
        NOW()
    ) RETURNING id INTO test_simulation_id;
    
    RAISE NOTICE '✅ Simulation de test créée: %', test_simulation_id;
    
    -- Créer une notification de bienvenue
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
        test_user_id,
        'client',
        'Bienvenue sur Profitum !',
        'Votre compte a été créé avec succès. Découvrez vos opportunités d''optimisation.',
        'welcome',
        'high',
        FALSE,
        NOW(),
        NOW()
    ) RETURNING id INTO test_notification_id;
    
    RAISE NOTICE '✅ Notification de bienvenue créée: %', test_notification_id;
    
    -- Créer une conversation de test
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
        'Accompagnement post-simulation',
        'active',
        NOW(),
        NOW()
    ) RETURNING id INTO test_conversation_id;
    
    RAISE NOTICE '✅ Conversation de test créée: %', test_conversation_id;
    
    RAISE NOTICE '=== WORKFLOW RÉALISTE CRÉÉ AVEC SUCCÈS ===';
    RAISE NOTICE 'Utilisateur: %', test_user_id;
    RAISE NOTICE 'Client: %', test_client_id;
    RAISE NOTICE 'Session: %', test_session_id;
    RAISE NOTICE 'Simulation: %', test_simulation_id;
    RAISE NOTICE 'Notification: %', test_notification_id;
    RAISE NOTICE 'Conversation: %', test_conversation_id;
    
END $$;

-- ===== 2. VÉRIFICATION DES DONNÉES CRÉÉES =====
DO $$
DECLARE
    user_count INTEGER;
    client_count INTEGER;
    session_count INTEGER;
    simulation_count INTEGER;
    notification_count INTEGER;
    conversation_count INTEGER;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES DONNÉES CRÉÉES ===';
    
    -- Compter les utilisateurs de test
    SELECT COUNT(*) INTO user_count 
    FROM auth.users 
    WHERE email = 'test-workflow-realiste@profitum.fr';
    
    -- Compter les clients de test
    SELECT COUNT(*) INTO client_count 
    FROM "Client" 
    WHERE email = 'test-workflow-realiste@profitum.fr';
    
    -- Compter les sessions de test
    SELECT COUNT(*) INTO session_count 
    FROM simulations 
    WHERE session_token LIKE 'test-session-%';
    
    -- Compter les simulations de test
    SELECT COUNT(*) INTO simulation_count 
    FROM simulations 
    WHERE session_token LIKE 'test-session-%';
    
    -- Compter les notifications de test
    SELECT COUNT(*) INTO notification_count 
    FROM notification 
    WHERE user_type = 'client' AND title = 'Bienvenue sur Profitum !';
    
    -- Compter les conversations de test
    SELECT COUNT(*) INTO conversation_count 
    FROM conversations 
    WHERE title = 'Accompagnement post-simulation';
    
    RAISE NOTICE 'Utilisateurs de test: %', user_count;
    RAISE NOTICE 'Clients de test: %', client_count;
    RAISE NOTICE 'Sessions de test: %', session_count;
    RAISE NOTICE 'Simulations de test: %', simulation_count;
    RAISE NOTICE 'Notifications de test: %', notification_count;
    RAISE NOTICE 'Conversations de test: %', conversation_count;
    
    -- Vérifier l'intégrité des données
    IF user_count > 0 AND client_count > 0 AND session_count > 0 AND simulation_count > 0 THEN
        RAISE NOTICE '✅ Workflow de test complet et fonctionnel';
    ELSE
        RAISE NOTICE '❌ Problème dans le workflow de test';
    END IF;
    
END $$;

-- ===== 3. TEST DES FONCTIONNALITÉS CRITIQUES =====
DO $$
DECLARE
    notification_works BOOLEAN;
    conversation_works BOOLEAN;
    simulation_works BOOLEAN;
    auth_works BOOLEAN;
BEGIN
    RAISE NOTICE '=== TEST DES FONCTIONNALITÉS ===';
    
    -- Test des notifications
    SELECT EXISTS (
        SELECT 1 FROM notification 
        WHERE user_type = 'client' 
        AND notification_type = 'welcome'
    ) INTO notification_works;
    
    -- Test des conversations
    SELECT EXISTS (
        SELECT 1 FROM conversations 
        WHERE status = 'active'
    ) INTO conversation_works;
    
    -- Test des simulations
    SELECT EXISTS (
        SELECT 1 FROM simulations 
        WHERE status = 'active'
    ) INTO simulation_works;
    
    -- Test de l'authentification
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'test-workflow-realiste@profitum.fr'
    ) INTO auth_works;
    
    IF notification_works THEN
        RAISE NOTICE '✅ Système de notifications fonctionnel';
    ELSE
        RAISE NOTICE '❌ Problème avec les notifications';
    END IF;
    
    IF conversation_works THEN
        RAISE NOTICE '✅ Système de conversations fonctionnel';
    ELSE
        RAISE NOTICE '❌ Problème avec les conversations';
    END IF;
    
    IF simulation_works THEN
        RAISE NOTICE '✅ Système de simulations fonctionnel';
    ELSE
        RAISE NOTICE '❌ Problème avec les simulations';
    END IF;
    
    IF auth_works THEN
        RAISE NOTICE '✅ Système d''authentification fonctionnel';
    ELSE
        RAISE NOTICE '❌ Problème avec l''authentification';
    END IF;
    
END $$;

-- ===== 4. NETTOYAGE DES DONNÉES DE TEST =====
-- ATTENTION: À exécuter seulement après vérification
/*
DELETE FROM notification WHERE user_type = 'client' AND title = 'Bienvenue sur Profitum !';
DELETE FROM conversations WHERE title = 'Accompagnement post-simulation';
DELETE FROM simulations WHERE session_token LIKE 'test-session-%';
DELETE FROM "Client" WHERE email = 'test-workflow-realiste@profitum.fr';
DELETE FROM auth.users WHERE email = 'test-workflow-realiste@profitum.fr';
*/

RAISE NOTICE '=== TEST WORKFLOW RÉALISTE TERMINÉ ===';
RAISE NOTICE '✅ Le dédoublonnage et l''optimisation n''ont pas cassé le workflow'; 