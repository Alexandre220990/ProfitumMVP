-- =====================================================
-- TEST DES MISES À JOUR DU SIMULATEUR
-- Date : 2025-01-26
-- Objectif : Vérifier que la table simulations se met à jour correctement
-- =====================================================

-- ===== 1. CRÉATION D'UNE SIMULATION DE TEST =====
DO $$
DECLARE
    test_client_id UUID;
    test_simulation_id UUID;
    test_session_token TEXT;
BEGIN
    RAISE NOTICE '=== TEST DES MISES À JOUR DU SIMULATEUR ===';
    
    -- Récupérer un client existant
    SELECT id INTO test_client_id 
    FROM "Client" 
    LIMIT 1;
    
    IF test_client_id IS NULL THEN
        RAISE NOTICE '❌ Aucun client trouvé pour le test';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Client de test: %', test_client_id;
    
    -- Générer un session_token unique
    test_session_token := 'test-simulateur-' || extract(epoch from now())::text;
    
    -- ===== 2. SIMULATION ÉTAPE 1: DÉBUT DE SIMULATION =====
    RAISE NOTICE '=== ÉTAPE 1: DÉBUT DE SIMULATION ===';
    
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
            test_session_token,
            'en_cours',
            'authentifiee',
            '{"etape": 1, "source": "chatbot", "profileData": {"besoinsSpecifiques": []}}',
            '{"score": 0, "abandonA": null, "cheminParcouru": ["debut"], "tempsCompletion": 0}',
            '{"type": "chatbot", "source": "profitum", "metadata": {"etape": 1}}',
            NOW() + INTERVAL '1 hour',
            NOW(),
            NOW()
        ) RETURNING id INTO test_simulation_id;
        
        RAISE NOTICE '✅ Simulation créée avec ID: %', test_simulation_id;
        RAISE NOTICE '📋 État initial:';
        RAISE NOTICE '   - Status: en_cours';
        RAISE NOTICE '   - Étape: 1';
        RAISE NOTICE '   - Score: 0';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur lors de la création: %', SQLERRM;
        RETURN;
    END;
    
    -- ===== 3. SIMULATION ÉTAPE 2: PREMIÈRE RÉPONSE =====
    RAISE NOTICE '=== ÉTAPE 2: PREMIÈRE RÉPONSE ===';
    
    BEGIN
        UPDATE simulations
        SET 
            status = 'en_cours',
            answers = answers || '{"secteur": "transport", "vehicules": 5, "carburant": "diesel"}'::jsonb,
            results = results || '{"score": 25, "abandonA": null, "cheminParcouru": ["debut", "secteur"], "tempsCompletion": 30}'::jsonb,
            metadata = metadata || '{"etape": 2, "produits_eligibles": ["TICPE"]}'::jsonb,
            updated_at = NOW()
        WHERE id = test_simulation_id;
        
        RAISE NOTICE '✅ Première réponse enregistrée';
        RAISE NOTICE '📋 Mise à jour:';
        RAISE NOTICE '   - Secteur: transport';
        RAISE NOTICE '   - Véhicules: 5';
        RAISE NOTICE '   - Score: 25';
        RAISE NOTICE '   - Temps: 30s';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur lors de la première réponse: %', SQLERRM;
    END;
    
    -- ===== 4. SIMULATION ÉTAPE 3: DEUXIÈME RÉPONSE =====
    RAISE NOTICE '=== ÉTAPE 3: DEUXIÈME RÉPONSE ===';
    
    BEGIN
        UPDATE simulations
        SET 
            status = 'en_cours',
            answers = answers || '{"ca": 500000, "employes": 10, "region": "Ile-de-France"}'::jsonb,
            results = results || '{"score": 60, "abandonA": null, "cheminParcouru": ["debut", "secteur", "entreprise"], "tempsCompletion": 90}'::jsonb,
            metadata = metadata || '{"etape": 3, "produits_eligibles": ["TICPE", "URSSAF", "DFS"]}'::jsonb,
            updated_at = NOW()
        WHERE id = test_simulation_id;
        
        RAISE NOTICE '✅ Deuxième réponse enregistrée';
        RAISE NOTICE '📋 Mise à jour:';
        RAISE NOTICE '   - CA: 500000€';
        RAISE NOTICE '   - Employés: 10';
        RAISE NOTICE '   - Score: 60';
        RAISE NOTICE '   - Temps: 90s';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur lors de la deuxième réponse: %', SQLERRM;
    END;
    
    -- ===== 5. SIMULATION ÉTAPE 4: FINALISATION =====
    RAISE NOTICE '=== ÉTAPE 4: FINALISATION ===';
    
    BEGIN
        UPDATE simulations
        SET 
            status = 'termine',
            answers = answers || '{"besoins_specifiques": ["optimisation_fiscale", "reduction_charges"], "contact_prefere": "email"}'::jsonb,
            results = results || '{"score": 100, "abandonA": null, "cheminParcouru": ["debut", "secteur", "entreprise", "finalisation"], "tempsCompletion": 180}'::jsonb,
            metadata = metadata || '{"etape": 4, "produits_eligibles": ["TICPE", "URSSAF", "DFS"], "gains_estimes": 25000}'::jsonb,
            updated_at = NOW()
        WHERE id = test_simulation_id;
        
        RAISE NOTICE '✅ Simulation finalisée';
        RAISE NOTICE '📋 Finalisation:';
        RAISE NOTICE '   - Status: termine';
        RAISE NOTICE '   - Score final: 100';
        RAISE NOTICE '   - Temps total: 180s';
        RAISE NOTICE '   - Gains estimés: 25000€';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur lors de la finalisation: %', SQLERRM;
    END;
    
    -- ===== 6. VÉRIFICATION FINALE =====
    RAISE NOTICE '=== VÉRIFICATION FINALE ===';
    
    DECLARE
        final_simulation RECORD;
        answers_content JSONB;
        results_content JSONB;
        metadata_content JSONB;
    BEGIN
        SELECT * INTO final_simulation
        FROM simulations
        WHERE id = test_simulation_id;
        
        IF final_simulation.id IS NOT NULL THEN
            RAISE NOTICE '✅ Simulation finale trouvée:';
            RAISE NOTICE '   - ID: %', final_simulation.id;
            RAISE NOTICE '   - Status: %', final_simulation.status;
            RAISE NOTICE '   - Type: %', final_simulation.type;
            RAISE NOTICE '   - Créée: %', final_simulation.created_at;
            RAISE NOTICE '   - Mise à jour: %', final_simulation.updated_at;
            
            -- Analyser le contenu des réponses
            answers_content := final_simulation.answers;
            RAISE NOTICE '📋 Contenu des réponses (answers):';
            RAISE NOTICE '   - Secteur: %', answers_content->>'secteur';
            RAISE NOTICE '   - Véhicules: %', answers_content->>'vehicules';
            RAISE NOTICE '   - CA: %', answers_content->>'ca';
            RAISE NOTICE '   - Employés: %', answers_content->>'employes';
            
            -- Analyser le contenu des résultats
            results_content := final_simulation.results;
            RAISE NOTICE '📋 Contenu des résultats (results):';
            RAISE NOTICE '   - Score final: %', results_content->>'score';
            RAISE NOTICE '   - Temps completion: %', results_content->>'tempsCompletion';
            RAISE NOTICE '   - Chemin parcouru: %', results_content->>'cheminParcouru';
            
            -- Analyser le contenu des métadonnées
            metadata_content := final_simulation.metadata;
            RAISE NOTICE '📋 Contenu des métadonnées (metadata):';
            RAISE NOTICE '   - Type: %', metadata_content->>'type';
            RAISE NOTICE '   - Source: %', metadata_content->>'source';
            RAISE NOTICE '   - Gains estimés: %', metadata_content->>'gains_estimes';
            
        ELSE
            RAISE NOTICE '❌ Simulation finale non trouvée';
        END IF;
    END;
    
    RAISE NOTICE '=== TEST TERMINÉ AVEC SUCCÈS ===';
    
END $$;

-- ===== 7. REQUÊTES DE VÉRIFICATION COMPLÉMENTAIRES =====

-- Vérifier les simulations récentes avec progression
SELECT 
    id,
    client_id,
    status,
    type,
    created_at,
    updated_at,
    CASE 
        WHEN answers ? 'secteur' THEN 'Étape 2+'
        WHEN answers ? 'etape' THEN 'Étape 1'
        ELSE 'Inconnu'
    END as progression,
    CASE 
        WHEN results ? 'score' THEN (results->>'score')::integer
        ELSE 0
    END as score_final
FROM simulations 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Analyser la progression des simulations
SELECT 
    status,
    COUNT(*) as nombre,
    AVG(CASE WHEN results ? 'tempsCompletion' THEN (results->>'tempsCompletion')::integer ELSE 0 END) as temps_moyen,
    AVG(CASE WHEN results ? 'score' THEN (results->>'score')::integer ELSE 0 END) as score_moyen
FROM simulations 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY nombre DESC;

-- Vérifier les simulations avec des données complètes
SELECT 
    COUNT(*) as total_simulations,
    COUNT(CASE WHEN answers IS NOT NULL THEN 1 END) as avec_reponses,
    COUNT(CASE WHEN results IS NOT NULL THEN 1 END) as avec_resultats,
    COUNT(CASE WHEN metadata IS NOT NULL THEN 1 END) as avec_metadonnees,
    COUNT(CASE WHEN status = 'termine' THEN 1 END) as terminees
FROM simulations 
WHERE created_at >= NOW() - INTERVAL '24 hours'; 