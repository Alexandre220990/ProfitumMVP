-- =====================================================
-- OPTIMISATION DES STRUCTURES POUR COMPATIBILITÉ API
-- Date : 2025-01-05
-- Objectif : Implémenter les recommandations pour optimiser les APIs
-- =====================================================

-- ===== 1. VÉRIFICATION ET CORRECTION DES TYPES UUID =====
DO $$
DECLARE
    column_info RECORD;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES TYPES UUID ===';
    
    -- Vérifier les colonnes ID qui devraient être UUID
    FOR column_info IN 
        SELECT table_name, column_name, data_type
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('Client', 'simulations', 'notification', 'conversations')
        AND column_name IN ('auth_id', 'client_id', 'user_id', 'expert_id')
        AND data_type != 'uuid'
    LOOP
        RAISE NOTICE '⚠️ %.% devrait être UUID (actuellement: %)', 
            column_info.table_name, column_info.column_name, column_info.data_type;
    END LOOP;
    
    -- Vérifier que les colonnes UUID existent
    FOR column_info IN 
        SELECT table_name, column_name, data_type
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('Client', 'simulations', 'notification', 'conversations')
        AND column_name IN ('auth_id', 'client_id', 'user_id', 'expert_id')
        AND data_type = 'uuid'
    LOOP
        RAISE NOTICE '✅ %.% est correctement en UUID', 
            column_info.table_name, column_info.column_name;
    END LOOP;
END $$;

-- ===== 2. CRÉATION D'INDEX POUR PERFORMANCE =====
DO $$
BEGIN
    RAISE NOTICE '=== CRÉATION D''INDEX POUR PERFORMANCE ===';
    
    -- Index sur Client.auth_id
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_client_auth_id ON "Client"(auth_id);
        RAISE NOTICE '✅ Index créé sur Client.auth_id';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index Client.auth_id déjà existant ou erreur: %', SQLERRM;
    END;
    
    -- Index sur simulations.client_id
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_simulations_client_id ON simulations(client_id);
        RAISE NOTICE '✅ Index créé sur simulations.client_id';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index simulations.client_id déjà existant ou erreur: %', SQLERRM;
    END;
    
    -- Index sur simulations.session_token
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_simulations_session_token ON simulations(session_token);
        RAISE NOTICE '✅ Index créé sur simulations.session_token';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index simulations.session_token déjà existant ou erreur: %', SQLERRM;
    END;
    
    -- Index sur notification.user_id
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification(user_id);
        RAISE NOTICE '✅ Index créé sur notification.user_id';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index notification.user_id déjà existant ou erreur: %', SQLERRM;
    END;
    
    -- Index sur conversations.client_id
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
        RAISE NOTICE '✅ Index créé sur conversations.client_id';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index conversations.client_id déjà existant ou erreur: %', SQLERRM;
    END;
    
    -- Index sur conversations.expert_id
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_conversations_expert_id ON conversations(expert_id);
        RAISE NOTICE '✅ Index créé sur conversations.expert_id';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index conversations.expert_id déjà existant ou erreur: %', SQLERRM;
    END;
    
    -- Index sur Client.email pour recherche rapide
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_client_email ON "Client"(email);
        RAISE NOTICE '✅ Index créé sur Client.email';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index Client.email déjà existant ou erreur: %', SQLERRM;
    END;
    
    -- Index sur Client.siren pour recherche rapide
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_client_siren ON "Client"(siren);
        RAISE NOTICE '✅ Index créé sur Client.siren';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index Client.siren déjà existant ou erreur: %', SQLERRM;
    END;
END $$;

-- ===== 3. VÉRIFICATION DES CONTRAINTES DE RÉFÉRENCE =====
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES CONTRAINTES DE RÉFÉRENCE ===';
    
    -- Vérifier la contrainte simulations.client_id -> Client.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%client_id%'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE NOTICE '⚠️ Contrainte simulations.client_id -> Client.id recommandée';
        -- ALTER TABLE simulations ADD CONSTRAINT fk_simulations_client_id 
        --     FOREIGN KEY (client_id) REFERENCES "Client"(id);
    ELSE
        RAISE NOTICE '✅ Contrainte simulations.client_id -> Client.id existe';
    END IF;
    
    -- Vérifier la contrainte conversations.client_id -> Client.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%client_id%'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE NOTICE '⚠️ Contrainte conversations.client_id -> Client.id recommandée';
        -- ALTER TABLE conversations ADD CONSTRAINT fk_conversations_client_id 
        --     FOREIGN KEY (client_id) REFERENCES "Client"(id);
    ELSE
        RAISE NOTICE '✅ Contrainte conversations.client_id -> Client.id existe';
    END IF;
    
    -- Vérifier la contrainte Client.auth_id -> auth.users.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'Client' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%auth_id%'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE NOTICE '⚠️ Contrainte Client.auth_id -> auth.users.id recommandée';
        -- ALTER TABLE "Client" ADD CONSTRAINT fk_client_auth_id 
        --     FOREIGN KEY (auth_id) REFERENCES auth.users(id);
    ELSE
        RAISE NOTICE '✅ Contrainte Client.auth_id -> auth.users.id existe';
    END IF;
END $$;

-- ===== 4. VÉRIFICATION DES COLONNES CRITIQUES =====
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    current_table TEXT;
    current_column TEXT;
    column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES COLONNES CRITIQUES ===';
    
    -- Vérifier les colonnes critiques par table
    FOR current_table IN SELECT unnest(ARRAY['Client', 'simulations', 'notification', 'conversations'])
    LOOP
        RAISE NOTICE 'Vérification de la table: %', current_table;
        
        -- Colonnes critiques selon la table
        IF current_table = 'Client' THEN
            FOR current_column IN SELECT unnest(ARRAY['auth_id', 'type', 'email', 'company_name', 'siren'])
            LOOP
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = current_table 
                    AND column_name = current_column
                ) INTO column_exists;
                
                IF NOT column_exists THEN
                    missing_columns := array_append(missing_columns, current_table || '.' || current_column);
                    RAISE NOTICE '❌ % manquante', current_column;
                ELSE
                    RAISE NOTICE '✅ % présente', current_column;
                END IF;
            END LOOP;
        END IF;
        
        IF current_table = 'simulations' THEN
            FOR current_column IN SELECT unnest(ARRAY['client_id', 'session_token', 'results', 'status'])
            LOOP
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = current_table 
                    AND column_name = current_column
                ) INTO column_exists;
                
                IF NOT column_exists THEN
                    missing_columns := array_append(missing_columns, current_table || '.' || current_column);
                    RAISE NOTICE '❌ % manquante', current_column;
                ELSE
                    RAISE NOTICE '✅ % présente', current_column;
                END IF;
            END LOOP;
        END IF;
        
        IF current_table = 'notification' THEN
            FOR current_column IN SELECT unnest(ARRAY['user_id', 'user_type', 'notification_type', 'title', 'message'])
            LOOP
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = current_table 
                    AND column_name = current_column
                ) INTO column_exists;
                
                IF NOT column_exists THEN
                    missing_columns := array_append(missing_columns, current_table || '.' || current_column);
                    RAISE NOTICE '❌ % manquante', current_column;
                ELSE
                    RAISE NOTICE '✅ % présente', current_column;
                END IF;
            END LOOP;
        END IF;
        
        IF current_table = 'conversations' THEN
            FOR current_column IN SELECT unnest(ARRAY['client_id', 'expert_id', 'title', 'status'])
            LOOP
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = current_table 
                    AND column_name = current_column
                ) INTO column_exists;
                
                IF NOT column_exists THEN
                    missing_columns := array_append(missing_columns, current_table || '.' || current_column);
                    RAISE NOTICE '❌ % manquante', current_column;
                ELSE
                    RAISE NOTICE '✅ % présente', current_column;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
    
    -- Résumé des colonnes manquantes
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️ Colonnes manquantes: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes critiques sont présentes';
    END IF;
END $$;

-- ===== 5. RÉSUMÉ FINAL DE COMPATIBILITÉ API =====
DO $$
DECLARE
    tables_ready INTEGER := 0;
    total_tables INTEGER := 4;
    index_count INTEGER;
    constraint_count INTEGER;
BEGIN
    RAISE NOTICE '=== RÉSUMÉ FINAL DE COMPATIBILITÉ API ===';
    
    -- Compter les index sur les tables critiques
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename IN ('Client', 'simulations', 'notification', 'conversations')
    AND indexname NOT LIKE '%_pkey';
    
    -- Compter les contraintes de clés étrangères
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name IN ('Client', 'simulations', 'notification', 'conversations')
    AND constraint_type = 'FOREIGN KEY';
    
    RAISE NOTICE '📊 Statistiques:';
    RAISE NOTICE '   - Index de performance: %', index_count;
    RAISE NOTICE '   - Contraintes de clés étrangères: %', constraint_count;
    
    -- Vérifier chaque table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Client' 
        AND column_name IN ('auth_id', 'type', 'email', 'company_name', 'siren')
    ) THEN
        tables_ready := tables_ready + 1;
        RAISE NOTICE '✅ Client prêt pour les APIs';
    ELSE
        RAISE NOTICE '❌ Client nécessite des corrections';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations' 
        AND column_name IN ('client_id', 'session_token', 'results', 'status')
    ) THEN
        tables_ready := tables_ready + 1;
        RAISE NOTICE '✅ simulations prêt pour les APIs';
    ELSE
        RAISE NOTICE '❌ simulations nécessite des corrections';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notification' 
        AND column_name IN ('user_id', 'user_type', 'notification_type', 'title', 'message')
    ) THEN
        tables_ready := tables_ready + 1;
        RAISE NOTICE '✅ notification prêt pour les APIs';
    ELSE
        RAISE NOTICE '❌ notification nécessite des corrections';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations' 
        AND column_name IN ('client_id', 'expert_id', 'title', 'status')
    ) THEN
        tables_ready := tables_ready + 1;
        RAISE NOTICE '✅ conversations prêt pour les APIs';
    ELSE
        RAISE NOTICE '❌ conversations nécessite des corrections';
    END IF;
    
    RAISE NOTICE '=== RÉSULTAT FINAL ===';
    RAISE NOTICE 'Tables prêtes pour les APIs: %/%', tables_ready, total_tables;
    
    IF tables_ready = total_tables THEN
        RAISE NOTICE '🎉 Toutes les tables sont optimisées pour les APIs !';
    ELSE
        RAISE NOTICE '⚠️ Certaines tables nécessitent encore des corrections';
    END IF;
END $$; 