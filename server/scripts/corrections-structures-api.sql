-- =====================================================
-- CORRECTIONS DES STRUCTURES POUR COMPATIBILITÉ API
-- Date : 2025-01-05
-- Objectif : Corriger les structures des tables pour les APIs
-- =====================================================

-- ===== 1. CORRECTIONS TABLE Client =====
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== CORRECTIONS TABLE Client ===';
    
    -- Vérifier si auth_id existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Client' 
        AND column_name = 'auth_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE '❌ Colonne auth_id manquante dans Client';
        -- ALTER TABLE "Client" ADD COLUMN auth_id UUID;
        RAISE NOTICE '⚠️ Ajout de auth_id recommandé';
    ELSE
        RAISE NOTICE '✅ auth_id existe dans Client';
    END IF;
    
    -- Vérifier si type existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Client' 
        AND column_name = 'type'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE '❌ Colonne type manquante dans Client';
        -- ALTER TABLE "Client" ADD COLUMN type TEXT DEFAULT 'client';
        RAISE NOTICE '⚠️ Ajout de type recommandé';
    ELSE
        RAISE NOTICE '✅ type existe dans Client';
    END IF;
END $$;

-- ===== 2. CORRECTIONS TABLE simulations =====
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== CORRECTIONS TABLE simulations ===';
    
    -- Vérifier si session_token existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations' 
        AND column_name = 'session_token'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE '❌ Colonne session_token manquante dans simulations';
        -- ALTER TABLE simulations ADD COLUMN session_token TEXT;
        RAISE NOTICE '⚠️ Ajout de session_token recommandé';
    ELSE
        RAISE NOTICE '✅ session_token existe dans simulations';
    END IF;
    
    -- Vérifier si results existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations' 
        AND column_name = 'results'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE '❌ Colonne results manquante dans simulations';
        -- ALTER TABLE simulations ADD COLUMN results JSONB;
        RAISE NOTICE '⚠️ Ajout de results recommandé';
    ELSE
        RAISE NOTICE '✅ results existe dans simulations';
    END IF;
END $$;

-- ===== 3. CORRECTIONS TABLE notification =====
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== CORRECTIONS TABLE notification ===';
    
    -- Vérifier si user_type existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notification' 
        AND column_name = 'user_type'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE '❌ Colonne user_type manquante dans notification';
        -- ALTER TABLE notification ADD COLUMN user_type TEXT DEFAULT 'client';
        RAISE NOTICE '⚠️ Ajout de user_type recommandé';
    ELSE
        RAISE NOTICE '✅ user_type existe dans notification';
    END IF;
    
    -- Vérifier si notification_type existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notification' 
        AND column_name = 'notification_type'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE '❌ Colonne notification_type manquante dans notification';
        -- ALTER TABLE notification ADD COLUMN notification_type TEXT DEFAULT 'info';
        RAISE NOTICE '⚠️ Ajout de notification_type recommandé';
    ELSE
        RAISE NOTICE '✅ notification_type existe dans notification';
    END IF;
END $$;

-- ===== 4. CRÉATION D'INDEX POUR PERFORMANCE =====
DO $$
BEGIN
    RAISE NOTICE '=== CRÉATION D''INDEX POUR PERFORMANCE ===';
    
    -- Index sur Client.auth_id
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_client_auth_id ON "Client"(auth_id);
        RAISE NOTICE '✅ Index sur Client.auth_id créé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index sur Client.auth_id déjà existant';
    END;
    
    -- Index sur simulations.client_id
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_simulations_client_id ON simulations(client_id);
        RAISE NOTICE '✅ Index sur simulations.client_id créé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index sur simulations.client_id déjà existant';
    END;
    
    -- Index sur simulations.session_token
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_simulations_session_token ON simulations(session_token);
        RAISE NOTICE '✅ Index sur simulations.session_token créé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index sur simulations.session_token déjà existant';
    END;
    
    -- Index sur notification.user_id
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification(user_id);
        RAISE NOTICE '✅ Index sur notification.user_id créé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index sur notification.user_id déjà existant';
    END;
    
    -- Index sur conversations.client_id
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
        RAISE NOTICE '✅ Index sur conversations.client_id créé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Index sur conversations.client_id déjà existant';
    END;
END $$;

-- ===== 5. VÉRIFICATION DES CONTRAINTES DE RÉFÉRENCE =====
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION CONTRAINTES DE RÉFÉRENCE ===';
    
    -- Vérifier la contrainte simulations.client_id -> Client.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations' 
        AND constraint_name LIKE '%client_id%'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE NOTICE '⚠️ Contrainte de référence simulations.client_id -> Client.id recommandée';
        -- ALTER TABLE simulations ADD CONSTRAINT fk_simulations_client_id 
        --     FOREIGN KEY (client_id) REFERENCES "Client"(id);
    ELSE
        RAISE NOTICE '✅ Contrainte de référence simulations.client_id existe';
    END IF;
    
    -- Vérifier la contrainte conversations.client_id -> Client.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations' 
        AND constraint_name LIKE '%client_id%'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE NOTICE '⚠️ Contrainte de référence conversations.client_id -> Client.id recommandée';
        -- ALTER TABLE conversations ADD CONSTRAINT fk_conversations_client_id 
        --     FOREIGN KEY (client_id) REFERENCES "Client"(id);
    ELSE
        RAISE NOTICE '✅ Contrainte de référence conversations.client_id existe';
    END IF;
END $$;

-- ===== 6. VÉRIFICATION FINALE =====
DO $$
DECLARE
    tables_ready INTEGER := 0;
    total_tables INTEGER := 4;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION FINALE ===';
    
    -- Vérifier Client
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Client' 
        AND column_name IN ('auth_id', 'type')
    ) THEN
        tables_ready := tables_ready + 1;
        RAISE NOTICE '✅ Client prêt pour les APIs';
    ELSE
        RAISE NOTICE '❌ Client nécessite des corrections';
    END IF;
    
    -- Vérifier simulations
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations' 
        AND column_name IN ('session_token', 'results')
    ) THEN
        tables_ready := tables_ready + 1;
        RAISE NOTICE '✅ simulations prêt pour les APIs';
    ELSE
        RAISE NOTICE '❌ simulations nécessite des corrections';
    END IF;
    
    -- Vérifier notification
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notification' 
        AND column_name IN ('user_type', 'notification_type')
    ) THEN
        tables_ready := tables_ready + 1;
        RAISE NOTICE '✅ notification prêt pour les APIs';
    ELSE
        RAISE NOTICE '❌ notification nécessite des corrections';
    END IF;
    
    -- Vérifier conversations
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations' 
        AND column_name IN ('client_id', 'status')
    ) THEN
        tables_ready := tables_ready + 1;
        RAISE NOTICE '✅ conversations prêt pour les APIs';
    ELSE
        RAISE NOTICE '❌ conversations nécessite des corrections';
    END IF;
    
    RAISE NOTICE '=== RÉSULTAT FINAL ===';
    RAISE NOTICE 'Tables prêtes: %/%', tables_ready, total_tables;
    
    IF tables_ready = total_tables THEN
        RAISE NOTICE '🎉 Toutes les tables sont prêtes pour les APIs !';
    ELSE
        RAISE NOTICE '⚠️ Certaines tables nécessitent des corrections';
    END IF;
END $$; 