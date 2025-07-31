-- =====================================================
-- ANALYSE DE LA TABLE SIMULATIONS
-- Date : 2025-01-26
-- Objectif : Vérifier le bon fonctionnement de la table simulations
-- =====================================================

-- ===== 1. VÉRIFICATION DE LA STRUCTURE DE LA TABLE =====
DO $$
DECLARE
    table_exists BOOLEAN;
    column_count INTEGER;
    simulation_count INTEGER;
    recent_simulations INTEGER;
    client_with_simulations UUID;
    test_simulation_id UUID;
BEGIN
    RAISE NOTICE '=== ANALYSE DE LA TABLE SIMULATIONS ===';
    
    -- Vérifier si la table existe
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Table simulations existe';
        
        -- Compter les colonnes
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations';
        
        RAISE NOTICE '📊 Nombre de colonnes: %', column_count;
        
        -- Lister les colonnes
        RAISE NOTICE '📋 Colonnes de la table simulations:';
        DECLARE
            col RECORD;
        BEGIN
            FOR col IN 
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'simulations'
                ORDER BY ordinal_position
            LOOP
                RAISE NOTICE '   - % (%s, nullable: %)', col.column_name, col.data_type, col.is_nullable;
            END LOOP;
        END;
        
    ELSE
        RAISE NOTICE '❌ Table simulations n''existe pas';
        RETURN;
    END IF;
    
    -- ===== 2. ANALYSE DES DONNÉES EXISTANTES =====
    RAISE NOTICE '=== ANALYSE DES DONNÉES EXISTANTES ===';
    
    -- Compter le nombre total de simulations
    SELECT COUNT(*) INTO simulation_count FROM simulations;
    RAISE NOTICE '📊 Nombre total de simulations: %', simulation_count;
    
    -- Compter les simulations récentes (dernières 24h)
    SELECT COUNT(*) INTO recent_simulations 
    FROM simulations 
    WHERE created_at >= NOW() - INTERVAL '24 hours';
    RAISE NOTICE '📊 Simulations des dernières 24h: %', recent_simulations;
    
    -- Analyser les statuts
    RAISE NOTICE '📊 Répartition par statut:';
    DECLARE
        stat RECORD;
    BEGIN
        FOR stat IN 
            SELECT status, COUNT(*) as count
            FROM simulations 
            GROUP BY status 
            ORDER BY count DESC
        LOOP
            RAISE NOTICE '   - %: % simulations', stat.status, stat.count;
        END LOOP;
    END;
    
    -- Analyser les types
    RAISE NOTICE '📊 Répartition par type:';
    DECLARE
        typ RECORD;
    BEGIN
        FOR typ IN 
            SELECT type, COUNT(*) as count
            FROM simulations 
            WHERE type IS NOT NULL
            GROUP BY type 
            ORDER BY count DESC
        LOOP
            RAISE NOTICE '   - %: % simulations', typ.type, typ.count;
        END LOOP;
    END;
    
    -- ===== 3. ANALYSE DES DONNÉES DE TEST =====
    RAISE NOTICE '=== ANALYSE DES DONNÉES DE TEST ===';
    
    -- Récupérer un client avec des simulations
    SELECT client_id INTO client_with_simulations
    FROM simulations 
    WHERE client_id IS NOT NULL
    LIMIT 1;
    
    IF client_with_simulations IS NOT NULL THEN
        RAISE NOTICE '✅ Client trouvé avec simulations: %', client_with_simulations;
        
        -- Analyser les simulations de ce client
        DECLARE
            client_sim_count INTEGER;
            latest_simulation RECORD;
        BEGIN
            SELECT COUNT(*) INTO client_sim_count
            FROM simulations 
            WHERE client_id = client_with_simulations;
            
            RAISE NOTICE '📊 Nombre de simulations pour ce client: %', client_sim_count;
            
            -- Récupérer la simulation la plus récente
            SELECT * INTO latest_simulation
            FROM simulations 
            WHERE client_id = client_with_simulations
            ORDER BY created_at DESC
            LIMIT 1;
            
            IF latest_simulation.id IS NOT NULL THEN
                RAISE NOTICE '📋 Dernière simulation:';
                RAISE NOTICE '   - ID: %', latest_simulation.id;
                RAISE NOTICE '   - Status: %', latest_simulation.status;
                RAISE NOTICE '   - Type: %', latest_simulation.type;
                RAISE NOTICE '   - Créée le: %', latest_simulation.created_at;
                RAISE NOTICE '   - Mise à jour le: %', latest_simulation.updated_at;
                
                -- Analyser les réponses (answers)
                IF latest_simulation.answers IS NOT NULL THEN
                    RAISE NOTICE '📋 Contenu des réponses (answers):';
                    RAISE NOTICE '   %', latest_simulation.answers;
                END IF;
                
                -- Analyser les résultats (results)
                IF latest_simulation.results IS NOT NULL THEN
                    RAISE NOTICE '📋 Contenu des résultats (results):';
                    RAISE NOTICE '   %', latest_simulation.results;
                END IF;
                
                -- Analyser les métadonnées (metadata)
                IF latest_simulation.metadata IS NOT NULL THEN
                    RAISE NOTICE '📋 Contenu des métadonnées (metadata):';
                    RAISE NOTICE '   %', latest_simulation.metadata;
                END IF;
                
                test_simulation_id := latest_simulation.id;
            END IF;
        END;
    ELSE
        RAISE NOTICE '⚠️ Aucun client avec simulations trouvé';
    END IF;
    
    -- ===== 4. TEST DE MISE À JOUR =====
    RAISE NOTICE '=== TEST DE MISE À JOUR ===';
    
    IF test_simulation_id IS NOT NULL THEN
        -- Tester une mise à jour
        BEGIN
            UPDATE simulations
            SET 
                status = 'en_cours',
                updated_at = NOW(),
                answers = answers || '{"test_update": "mise_a_jour_test"}'::jsonb
            WHERE id = test_simulation_id;
            
            RAISE NOTICE '✅ Mise à jour test réussie pour simulation: %', test_simulation_id;
            
            -- Vérifier la mise à jour
            DECLARE
                updated_simulation RECORD;
            BEGIN
                SELECT * INTO updated_simulation
                FROM simulations
                WHERE id = test_simulation_id;
                
                RAISE NOTICE '📋 Vérification après mise à jour:';
                RAISE NOTICE '   - Status: %', updated_simulation.status;
                RAISE NOTICE '   - Updated at: %', updated_simulation.updated_at;
                RAISE NOTICE '   - Contient test_update: %', 
                    CASE WHEN updated_simulation.answers ? 'test_update' THEN 'OUI' ELSE 'NON' END;
            END;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Erreur lors de la mise à jour: %', SQLERRM;
        END;
    END IF;
    
    -- ===== 5. TEST D'INSERTION =====
    RAISE NOTICE '=== TEST D''INSERTION ===';
    
    IF client_with_simulations IS NOT NULL THEN
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
                client_with_simulations,
                'test-session-' || extract(epoch from now())::text,
                'en_cours',
                'authentifiee',
                '{"source": "test_script", "profileData": {"besoinsSpecifiques": []}, "eligibleProducts": [{"nom": "Test Produit", "reasons": ["Test"], "estimatedGain": 1000}]}',
                '{"score": 100, "abandonA": null, "cheminParcouru": null, "tempsCompletion": 0}',
                '{"type": "test", "source": "test_script", "metadata": {}}',
                NOW() + INTERVAL '1 hour',
                NOW(),
                NOW()
            );
            
            RAISE NOTICE '✅ Insertion test réussie';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Erreur lors de l''insertion: %', SQLERRM;
        END;
    END IF;
    
    -- ===== 6. VÉRIFICATION DES CONTRAINTES =====
    RAISE NOTICE '=== VÉRIFICATION DES CONTRAINTES ===';
    
    -- Vérifier les contraintes de clés étrangères
    DECLARE
        orphan_simulations INTEGER;
    BEGIN
        SELECT COUNT(*) INTO orphan_simulations
        FROM simulations s
        LEFT JOIN "Client" c ON s.client_id = c.id
        WHERE c.id IS NULL AND s.client_id IS NOT NULL;
        
        IF orphan_simulations = 0 THEN
            RAISE NOTICE '✅ Aucune simulation orpheline (toutes les client_id sont valides)';
        ELSE
            RAISE NOTICE '⚠️ % simulations avec client_id invalide', orphan_simulations;
        END IF;
    END;
    
    -- Vérifier les valeurs NULL dans les champs obligatoires
    DECLARE
        null_client_count INTEGER;
        null_status_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO null_client_count
        FROM simulations
        WHERE client_id IS NULL;
        
        SELECT COUNT(*) INTO null_status_count
        FROM simulations
        WHERE status IS NULL;
        
        RAISE NOTICE '📊 Vérification des champs obligatoires:';
        RAISE NOTICE '   - Simulations sans client_id: %', null_client_count;
        RAISE NOTICE '   - Simulations sans status: %', null_status_count;
    END;
    
    RAISE NOTICE '=== ANALYSE TERMINÉE ===';
    
END $$;

-- ===== 7. REQUÊTES D'ANALYSE COMPLÉMENTAIRES =====

-- Récupérer les 5 dernières simulations avec détails
SELECT 
    id,
    client_id,
    status,
    type,
    created_at,
    updated_at,
    CASE 
        WHEN answers IS NOT NULL THEN 'OUI'
        ELSE 'NON'
    END as has_answers,
    CASE 
        WHEN results IS NOT NULL THEN 'OUI'
        ELSE 'NON'
    END as has_results
FROM simulations 
ORDER BY created_at DESC 
LIMIT 5;

-- Analyser la distribution temporelle des simulations
SELECT 
    DATE(created_at) as date_creation,
    COUNT(*) as nombre_simulations,
    COUNT(CASE WHEN status = 'en_cours' THEN 1 END) as en_cours,
    COUNT(CASE WHEN status = 'termine' THEN 1 END) as terminees
FROM simulations 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date_creation DESC;

-- Vérifier les clients avec le plus de simulations
SELECT 
    client_id,
    COUNT(*) as nombre_simulations,
    MAX(created_at) as derniere_simulation
FROM simulations 
GROUP BY client_id
HAVING COUNT(*) > 1
ORDER BY nombre_simulations DESC
LIMIT 10; 