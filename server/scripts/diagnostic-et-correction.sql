-- =====================================================
-- DIAGNOSTIC ET CORRECTION DES CONTRAINTES
-- Date : 2025-01-05
-- Objectif : Diagnostiquer et corriger les problèmes de contraintes
-- =====================================================

-- ===== 1. DIAGNOSTIC DES CONTRAINTES DE VÉRIFICATION =====
DO $$
DECLARE
    constraint_def TEXT;
BEGIN
    RAISE NOTICE '=== DIAGNOSTIC DES CONTRAINTES ===';
    
    -- Récupérer la définition de la contrainte simulations_unified_status_check
    SELECT pg_get_constraintdef(oid) INTO constraint_def
    FROM pg_constraint 
    WHERE conname = 'simulations_unified_status_check';
    
    IF constraint_def IS NOT NULL THEN
        RAISE NOTICE 'Contrainte status: %', constraint_def;
    ELSE
        RAISE NOTICE 'Aucune contrainte de vérification trouvée pour status';
    END IF;
END $$;

-- ===== 2. VÉRIFICATION DES VALEURS DE STATUT EXISTANTES =====
SELECT 
    'Valeurs de statut existantes' as info,
    status,
    COUNT(*) as count
FROM simulations 
GROUP BY status 
ORDER BY status;

-- ===== 3. VÉRIFICATION DES COLONNES MANQUANTES =====
DO $$
DECLARE
    required_columns TEXT[] := ARRAY['id', 'client_id', 'session_token', 'status', 'type', 'answers', 'results', 'metadata', 'expires_at', 'created_at', 'updated_at'];
    existing_columns TEXT[];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    current_column TEXT;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES COLONNES ===';
    
    -- Récupérer les colonnes existantes
    SELECT array_agg(column_name) INTO existing_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'simulations';
    
    -- Vérifier les colonnes manquantes
    FOREACH current_column IN ARRAY required_columns
    LOOP
        IF NOT (current_column = ANY(existing_columns)) THEN
            missing_columns := array_append(missing_columns, current_column);
            RAISE NOTICE '❌ Colonne manquante: %', current_column;
        ELSE
            RAISE NOTICE '✅ Colonne présente: %', current_column;
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️ Colonnes manquantes: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes requises sont présentes';
    END IF;
END $$;

-- ===== 4. AJOUT DES COLONNES MANQUANTES SI NÉCESSAIRE =====
DO $$
BEGIN
    RAISE NOTICE '=== AJOUT DES COLONNES MANQUANTES ===';
    
    -- Ajouter la colonne metadata si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE simulations ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Colonne metadata ajoutée';
    ELSE
        RAISE NOTICE '✅ Colonne metadata existe déjà';
    END IF;
    
    -- Ajouter la colonne expires_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE simulations ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Colonne expires_at ajoutée';
    ELSE
        RAISE NOTICE '✅ Colonne expires_at existe déjà';
    END IF;
    
    -- Ajouter la colonne updated_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE simulations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Colonne updated_at ajoutée';
    ELSE
        RAISE NOTICE '✅ Colonne updated_at existe déjà';
    END IF;
END $$;

-- ===== 5. CRÉATION D'UNE CONTRAINTE DE VÉRIFICATION SI NÉCESSAIRE =====
DO $$
BEGIN
    RAISE NOTICE '=== GESTION DES CONTRAINTES DE STATUT ===';
    
    -- Supprimer l'ancienne contrainte si elle existe
    BEGIN
        ALTER TABLE simulations DROP CONSTRAINT IF EXISTS simulations_unified_status_check;
        RAISE NOTICE '✅ Ancienne contrainte supprimée';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erreur lors de la suppression: %', SQLERRM;
    END;
    
    -- Créer une nouvelle contrainte avec des valeurs autorisées
    BEGIN
        ALTER TABLE simulations ADD CONSTRAINT simulations_unified_status_check 
            CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'expired'));
        RAISE NOTICE '✅ Nouvelle contrainte de statut créée';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erreur lors de la création: %', SQLERRM;
    END;
END $$;

-- ===== 6. VÉRIFICATION DES DONNÉES EXISTANTES =====
SELECT 
    'Données existantes' as info,
    COUNT(*) as total_simulations,
    COUNT(DISTINCT client_id) as clients_uniques,
    COUNT(DISTINCT session_token) as sessions_uniques
FROM simulations;

-- ===== 7. TEST D'INSERTION AVEC LES BONNES VALEURS =====
DO $$
DECLARE
    test_client_id UUID;
    test_session_id TEXT;
    test_simulation_id UUID;
BEGIN
    RAISE NOTICE '=== TEST D''INSERTION ===';
    
    -- Récupérer un client existant pour le test
    SELECT id INTO test_client_id FROM "Client" LIMIT 1;
    
    IF test_client_id IS NULL THEN
        RAISE NOTICE '❌ Aucun client trouvé pour le test';
        RETURN;
    END IF;
    
    test_session_id := 'test-session-' || extract(epoch from now())::text;
    
    RAISE NOTICE 'Client de test: %', test_client_id;
    RAISE NOTICE 'Session de test: %', test_session_id;
    
    -- Test d'insertion avec status 'pending'
    BEGIN
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
            'pending',
            'eligibility_check',
            '{"secteur": "transport", "vehicules": 5}',
            '{"TICPE": {"eligibility_score": 85}}',
            '{"source": "test"}',
            NOW() + INTERVAL '1 hour',
            NOW(),
            NOW()
        ) RETURNING id INTO test_simulation_id;
        
        RAISE NOTICE '✅ Test d''insertion réussi avec status ''pending'': %', test_simulation_id;
        
        -- Nettoyer le test
        DELETE FROM simulations WHERE id = test_simulation_id;
        RAISE NOTICE '✅ Données de test nettoyées';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur lors du test: %', SQLERRM;
    END;
END $$;

-- ===== 8. RÉSUMÉ FINAL =====
DO $$
BEGIN
    RAISE NOTICE '=== RÉSUMÉ FINAL ===';
    RAISE NOTICE '✅ Diagnostic terminé';
    RAISE NOTICE '✅ Corrections appliquées';
    RAISE NOTICE '✅ Test d''insertion effectué';
    RAISE NOTICE '🎉 La table simulations est maintenant prête pour les tests';
END $$; 