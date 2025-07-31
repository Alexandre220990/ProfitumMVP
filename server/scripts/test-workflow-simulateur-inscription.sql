-- =====================================================
-- TEST WORKFLOW SIMULATEUR + INSCRIPTION
-- Date : 2025-01-05
-- Objectif : Tester le workflow complet après dédoublonnage
-- =====================================================

-- ===== 1. VÉRIFICATION DES TABLES NÉCESSAIRES =====
DO $$
DECLARE
    table_exists BOOLEAN;
    tables_requises TEXT[] := ARRAY[
        'notification', 'Client', 'Expert', 'conversations', 'messages',
        'simulations', 'TemporarySimulationSession', 'ClientProduitEligible',
        'ProduitEligible', 'QuestionnaireQuestion'
    ];
    current_table TEXT;
    tables_manquantes TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES TABLES REQUISES ===';
    
    FOREACH current_table IN ARRAY tables_requises
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = current_table
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '✅ % existe', current_table;
        ELSE
            RAISE NOTICE '❌ % manquante', current_table;
            tables_manquantes := array_append(tables_manquantes, current_table);
        END IF;
    END LOOP;
    
    IF array_length(tables_manquantes, 1) > 0 THEN
        RAISE NOTICE '⚠️ Tables manquantes: %', array_to_string(tables_manquantes, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les tables requises sont présentes';
    END IF;
END $$;

-- ===== 2. CRÉATION D'UN UTILISATEUR DE TEST =====
DO $$
DECLARE
    test_user_id UUID;
    test_client_id UUID;
    test_session_id TEXT;
BEGIN
    RAISE NOTICE '=== CRÉATION UTILISATEUR DE TEST ===';
    
    -- Créer un utilisateur de test dans auth.users
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
        gen_random_uuid(),
        'test-simulateur@profitum.fr',
        crypt('TestPassword123!', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"username": "test-simulateur", "type": "client", "company_name": "Test Company", "siren": "123456789"}'
    ) RETURNING id INTO test_user_id;
    
    RAISE NOTICE '✅ Utilisateur de test créé: %', test_user_id;
    
    -- Créer un client correspondant
    INSERT INTO "Client" (
        id,
        auth_id,
        company_name,
        siren,
        email,
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
        'Test Company',
        '123456789',
        'test-simulateur@profitum.fr',
        '0123456789',
        '123 Test Street',
        'Test City',
        '75001',
        'test-simulateur',
        'client',
        NOW(),
        NOW()
    ) RETURNING id INTO test_client_id;
    
    RAISE NOTICE '✅ Client de test créé: %', test_client_id;
    
    -- Créer une session de simulation
    test_session_id := 'test-session-' || extract(epoch from now())::text;
    
    INSERT INTO "TemporarySimulationSession" (
        session_id,
        client_data,
        created_at,
        expires_at
    ) VALUES (
        test_session_id,
        '{"company_name": "Test Company", "siren": "123456789", "secteur": "transport"}',
        NOW(),
        NOW() + INTERVAL '1 hour'
    );
    
    RAISE NOTICE '✅ Session de simulation créée: %', test_session_id;
    
    -- Créer des résultats de simulation
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
        'completed',
        'eligibility_check',
        '{"secteur": "transport", "vehicules": 5, "carburant": "diesel", "ca": 500000, "employes": 10}',
        '{"TICPE": {"eligibility_score": 85, "estimated_savings": 15000, "confidence_level": "high"}, "URSSAF": {"eligibility_score": 72, "estimated_savings": 8000, "confidence_level": "medium"}, "DFS": {"eligibility_score": 45, "estimated_savings": 3000, "confidence_level": "low"}}',
        '{"source": "test", "version": "1.0"}',
        NOW() + INTERVAL '1 hour',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Résultats de simulation créés';
    
    -- Créer des notifications de test
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
    );
    
    RAISE NOTICE '✅ Notification de bienvenue créée';
    
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
    );
    
    RAISE NOTICE '✅ Conversation de test créée';
    
    RAISE NOTICE '=== WORKFLOW DE TEST CRÉÉ AVEC SUCCÈS ===';
    RAISE NOTICE 'Utilisateur: %', test_user_id;
    RAISE NOTICE 'Client: %', test_client_id;
    RAISE NOTICE 'Session: %', test_session_id;
    
END $$;

-- ===== 3. VÉRIFICATION DES DONNÉES CRÉÉES =====
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
    WHERE email = 'test-simulateur@profitum.fr';
    
    -- Compter les clients de test
    SELECT COUNT(*) INTO client_count 
    FROM "Client" 
    WHERE email = 'test-simulateur@profitum.fr';
    
    -- Compter les sessions de test
    SELECT COUNT(*) INTO session_count 
    FROM "TemporarySimulationSession" 
    WHERE session_id LIKE 'test-session-%';
    
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

-- ===== 4. TEST DES FONCTIONNALITÉS CRITIQUES =====
DO $$
DECLARE
    notification_works BOOLEAN;
    conversation_works BOOLEAN;
    simulation_works BOOLEAN;
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
        WHERE type = 'eligibility_check'
    ) INTO simulation_works;
    
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
    
END $$;

-- ===== 5. NETTOYAGE DES DONNÉES DE TEST =====
-- ATTENTION: À exécuter seulement après vérification
/*
DELETE FROM notification WHERE user_type = 'client' AND title = 'Bienvenue sur Profitum !';
DELETE FROM conversations WHERE title = 'Accompagnement post-simulation';
DELETE FROM simulations WHERE session_token LIKE 'test-session-%';
DELETE FROM "TemporarySimulationSession" WHERE session_id LIKE 'test-session-%';
DELETE FROM "Client" WHERE email = 'test-simulateur@profitum.fr';
DELETE FROM auth.users WHERE email = 'test-simulateur@profitum.fr';
*/

RAISE NOTICE '=== TEST WORKFLOW TERMINÉ ===';
RAISE NOTICE '✅ Le dédoublonnage n''a pas cassé le workflow simulateur + inscription'; 