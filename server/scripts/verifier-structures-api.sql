-- =====================================================
-- VÉRIFICATION DES STRUCTURES POUR COMPATIBILITÉ API
-- Date : 2025-01-05
-- Objectif : S'assurer que les tables peuvent recevoir les données des APIs
-- =====================================================

-- ===== 1. VÉRIFICATION DE LA TABLE Client =====
DO $$
DECLARE
    client_columns TEXT[];
    required_columns TEXT[] := ARRAY['id', 'email', 'company_name', 'siren', 'phone_number', 'auth_id'];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    current_column TEXT;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION TABLE Client ===';
    
    -- Récupérer les colonnes existantes
    SELECT array_agg(column_name) INTO client_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'Client';
    
    -- Vérifier les colonnes requises
    FOREACH current_column IN ARRAY required_columns
    LOOP
        IF NOT (current_column = ANY(client_columns)) THEN
            missing_columns := array_append(missing_columns, current_column);
            RAISE NOTICE '❌ Colonne manquante: %', current_column;
        ELSE
            RAISE NOTICE '✅ Colonne présente: %', current_column;
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️ Colonnes manquantes dans Client: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Table Client prête pour les APIs';
    END IF;
END $$;

-- ===== 2. VÉRIFICATION DE LA TABLE simulations =====
DO $$
DECLARE
    simulations_columns TEXT[];
    required_columns TEXT[] := ARRAY['id', 'client_id', 'session_token', 'status', 'type', 'answers', 'results'];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    current_column TEXT;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION TABLE simulations ===';
    
    -- Récupérer les colonnes existantes
    SELECT array_agg(column_name) INTO simulations_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'simulations';
    
    -- Vérifier les colonnes requises
    FOREACH current_column IN ARRAY required_columns
    LOOP
        IF NOT (current_column = ANY(simulations_columns)) THEN
            missing_columns := array_append(missing_columns, current_column);
            RAISE NOTICE '❌ Colonne manquante: %', current_column;
        ELSE
            RAISE NOTICE '✅ Colonne présente: %', current_column;
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️ Colonnes manquantes dans simulations: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Table simulations prête pour les APIs';
    END IF;
END $$;

-- ===== 3. VÉRIFICATION DE LA TABLE notification =====
DO $$
DECLARE
    notification_columns TEXT[];
    required_columns TEXT[] := ARRAY['id', 'user_id', 'user_type', 'title', 'message', 'notification_type', 'is_read'];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    current_column TEXT;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION TABLE notification ===';
    
    -- Récupérer les colonnes existantes
    SELECT array_agg(column_name) INTO notification_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notification';
    
    -- Vérifier les colonnes requises
    FOREACH current_column IN ARRAY required_columns
    LOOP
        IF NOT (current_column = ANY(notification_columns)) THEN
            missing_columns := array_append(missing_columns, current_column);
            RAISE NOTICE '❌ Colonne manquante: %', current_column;
        ELSE
            RAISE NOTICE '✅ Colonne présente: %', current_column;
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️ Colonnes manquantes dans notification: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Table notification prête pour les APIs';
    END IF;
END $$;

-- ===== 4. VÉRIFICATION DE LA TABLE conversations =====
DO $$
DECLARE
    conversations_columns TEXT[];
    required_columns TEXT[] := ARRAY['id', 'client_id', 'expert_id', 'title', 'status'];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    current_column TEXT;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION TABLE conversations ===';
    
    -- Récupérer les colonnes existantes
    SELECT array_agg(column_name) INTO conversations_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'conversations';
    
    -- Vérifier les colonnes requises
    FOREACH current_column IN ARRAY required_columns
    LOOP
        IF NOT (current_column = ANY(conversations_columns)) THEN
            missing_columns := array_append(missing_columns, current_column);
            RAISE NOTICE '❌ Colonne manquante: %', current_column;
        ELSE
            RAISE NOTICE '✅ Colonne présente: %', current_column;
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️ Colonnes manquantes dans conversations: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Table conversations prête pour les APIs';
    END IF;
END $$;

-- ===== 5. VÉRIFICATION DES CONTRAINTES ET INDEX =====
DO $$
DECLARE
    constraint_count INTEGER;
    index_count INTEGER;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION CONTRAINTES ET INDEX ===';
    
    -- Vérifier les contraintes sur Client
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public' AND table_name = 'Client';
    
    RAISE NOTICE 'Contraintes sur Client: %', constraint_count;
    
    -- Vérifier les index sur les tables critiques
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'Client';
    
    RAISE NOTICE 'Index sur Client: %', index_count;
    
    -- Vérifier les contraintes sur simulations
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public' AND table_name = 'simulations';
    
    RAISE NOTICE 'Contraintes sur simulations: %', constraint_count;
    
    -- Vérifier les index sur simulations
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'simulations';
    
    RAISE NOTICE 'Index sur simulations: %', index_count;
END $$;

-- ===== 6. VÉRIFICATION DES TYPES DE DONNÉES =====
DO $$
DECLARE
    col_info RECORD;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION TYPES DE DONNÉES ===';
    
    FOR col_info IN 
        SELECT table_name, column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('Client', 'simulations', 'notification', 'conversations')
        AND column_name IN ('id', 'client_id', 'user_id', 'auth_id', 'email', 'session_token')
    LOOP
        RAISE NOTICE 'Table: %, Colonne: %, Type: %, Nullable: %', 
            col_info.table_name, col_info.column_name, 
            col_info.data_type, col_info.is_nullable;
    END LOOP;
END $$;

-- ===== 7. RECOMMANDATIONS POUR LES APIs =====
DO $$
BEGIN
    RAISE NOTICE '=== RECOMMANDATIONS POUR LES APIs ===';
    RAISE NOTICE '1. Client.auth_id doit correspondre à auth.users.id';
    RAISE NOTICE '2. simulations.client_id doit correspondre à Client.id';
    RAISE NOTICE '3. notification.user_id doit correspondre à auth.users.id';
    RAISE NOTICE '4. conversations.client_id doit correspondre à Client.id';
    RAISE NOTICE '5. Vérifier les contraintes de clés étrangères';
    RAISE NOTICE '6. S''assurer que les types UUID sont cohérents';
END $$; 