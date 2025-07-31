-- =====================================================
-- CORRECTION DES APIs DE SIMULATION
-- Date : 2025-01-05
-- Objectif : Corriger les incohérences après dédoublonnage
-- =====================================================

-- ===== 1. VÉRIFICATION DES TABLES DE SIMULATION =====
DO $$
DECLARE
    table_exists BOOLEAN;
    table_count INTEGER;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES TABLES DE SIMULATION ===';
    
    -- Vérifier la table simulations (minuscule)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'simulations'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO table_count FROM simulations;
        RAISE NOTICE '✅ Table simulations existe avec % enregistrements', table_count;
    ELSE
        RAISE NOTICE '❌ Table simulations n''existe pas';
    END IF;
    
    -- Vérifier la table Simulation (majuscule)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Simulation'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO table_count FROM "Simulation";
        RAISE NOTICE '⚠️ Table Simulation existe avec % enregistrements (obsolète)', table_count;
    ELSE
        RAISE NOTICE '✅ Table Simulation n''existe pas (normal après dédoublonnage)';
    END IF;
    
    -- Vérifier la table chatbotsimulation
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'chatbotsimulation'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO table_count FROM chatbotsimulation;
        RAISE NOTICE '⚠️ Table chatbotsimulation existe avec % enregistrements (obsolète)', table_count;
    ELSE
        RAISE NOTICE '✅ Table chatbotsimulation n''existe pas (normal après dédoublonnage)';
    END IF;
END $$;

-- ===== 2. ANALYSE DES COLONNES DE LA TABLE simulations =====
SELECT 
    'simulations' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'simulations'
ORDER BY ordinal_position;

-- ===== 3. VÉRIFICATION DES DONNÉES EXISTANTES =====
DO $$
DECLARE
    total_simulations INTEGER;
    status_distribution RECORD;
    type_distribution RECORD;
BEGIN
    RAISE NOTICE '=== ANALYSE DES DONNÉES EXISTANTES ===';
    
    -- Compter le total
    SELECT COUNT(*) INTO total_simulations FROM simulations;
    RAISE NOTICE 'Total simulations: %', total_simulations;
    
    -- Distribution par statut
    FOR status_distribution IN 
        SELECT status, COUNT(*) as count
        FROM simulations 
        GROUP BY status 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Statut %: % enregistrements', status_distribution.status, status_distribution.count;
    END LOOP;
    
    -- Distribution par type
    FOR type_distribution IN 
        SELECT type, COUNT(*) as count
        FROM simulations 
        GROUP BY type 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Type %: % enregistrements', type_distribution.type, type_distribution.count;
    END LOOP;
END $$;

-- ===== 4. RECOMMANDATIONS POUR LES APIs =====
DO $$
BEGIN
    RAISE NOTICE '=== RECOMMANDATIONS POUR LES APIs ===';
    RAISE NOTICE '1. Remplacer toutes les références à "Simulation" par "simulations"';
    RAISE NOTICE '2. Remplacer toutes les références à "chatbotsimulation" par "simulations"';
    RAISE NOTICE '3. Mettre à jour les colonnes: clientId -> client_id';
    RAISE NOTICE '4. Mettre à jour les colonnes: createdBy -> created_by';
    RAISE NOTICE '5. Mettre à jour les colonnes: statut -> status';
    RAISE NOTICE '6. Vérifier que session_token est utilisé correctement';
    RAISE NOTICE '7. S''assurer que les types JSONB sont utilisés pour answers et results';
END $$;

-- ===== 5. EXEMPLES DE REQUÊTES CORRIGÉES =====
DO $$
BEGIN
    RAISE NOTICE '=== EXEMPLES DE REQUÊTES CORRIGÉES ===';
    RAISE NOTICE '';
    RAISE NOTICE '-- AVANT (incorrect):';
    RAISE NOTICE 'SELECT * FROM "Simulation" WHERE clientId = $1';
    RAISE NOTICE '';
    RAISE NOTICE '-- APRÈS (correct):';
    RAISE NOTICE 'SELECT * FROM simulations WHERE client_id = $1';
    RAISE NOTICE '';
    RAISE NOTICE '-- AVANT (incorrect):';
    RAISE NOTICE 'INSERT INTO "Simulation" (clientId, type, data) VALUES ($1, $2, $3)';
    RAISE NOTICE '';
    RAISE NOTICE '-- APRÈS (correct):';
    RAISE NOTICE 'INSERT INTO simulations (client_id, type, answers) VALUES ($1, $2, $3)';
END $$;

-- ===== 6. VÉRIFICATION DES INDEX ET CONTRAINTES =====
SELECT 
    'Index et contraintes simulations' as section,
    indexname as name,
    indexdef as definition
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'simulations'
ORDER BY indexname;

-- ===== 7. RÉSUMÉ DES CORRECTIONS NÉCESSAIRES =====
DO $$
BEGIN
    RAISE NOTICE '=== RÉSUMÉ DES CORRECTIONS NÉCESSAIRES ===';
    RAISE NOTICE '';
    RAISE NOTICE 'FICHIERS À MODIFIER:';
    RAISE NOTICE '- server/src/routes/simulations.ts';
    RAISE NOTICE '- server/src/routes/simulation.ts';
    RAISE NOTICE '- server/src/routes/simulationRoutes.ts';
    RAISE NOTICE '- server/src/services/simulationProcessor.ts';
    RAISE NOTICE '- server/src/services/sessionMigrationService.ts';
    RAISE NOTICE '- server/src/services/realTimeProcessor.ts';
    RAISE NOTICE '- server/src/services/conversationOrchestrator.ts';
    RAISE NOTICE '- server/src/services/decisionEngine.ts';
    RAISE NOTICE '';
    RAISE NOTICE 'MODIFICATIONS PRINCIPALES:';
    RAISE NOTICE '1. .from("Simulation") -> .from("simulations")';
    RAISE NOTICE '2. .from("chatbotsimulation") -> .from("simulations")';
    RAISE NOTICE '3. clientId -> client_id';
    RAISE NOTICE '4. createdBy -> created_by';
    RAISE NOTICE '5. statut -> status';
    RAISE NOTICE '6. data -> answers';
    RAISE NOTICE '7. results -> results (JSONB)';
END $$; 