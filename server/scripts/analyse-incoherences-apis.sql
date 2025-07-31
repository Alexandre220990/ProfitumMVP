-- =====================================================
-- ANALYSE DES INCOHÉRENCES ENTRE APIs ET BASE DE DONNÉES
-- Date : 2025-01-05
-- Objectif : Identifier les problèmes dans les APIs après dédoublonnage
-- =====================================================

-- ===== 1. VÉRIFICATION DES TABLES EXISTANTES =====
DO $$
DECLARE
    table_exists BOOLEAN;
    tables_apis TEXT[] := ARRAY[
        'simulations', 'Simulation', 'SimulationProcessed', 'chatbotsimulation',
        'Client', 'notification', 'conversations', 'messages'
    ];
    current_table TEXT;
    tables_existantes TEXT[] := ARRAY[]::TEXT[];
    tables_manquantes TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES TABLES UTILISÉES PAR LES APIs ===';
    
    FOREACH current_table IN ARRAY tables_apis
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = current_table
        ) INTO table_exists;
        
        IF table_exists THEN
            tables_existantes := array_append(tables_existantes, current_table);
            RAISE NOTICE '✅ % existe', current_table;
        ELSE
            tables_manquantes := array_append(tables_manquantes, current_table);
            RAISE NOTICE '❌ % manquante', current_table;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Tables existantes: %', array_to_string(tables_existantes, ', ');
    RAISE NOTICE 'Tables manquantes: %', array_to_string(tables_manquantes, ', ');
END $$;

-- ===== 2. ANALYSE DES COLONNES CRITIQUES =====
DO $$
DECLARE
    col_info RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ANALYSE DES COLONNES CRITIQUES ===';
    
    -- Vérifier les colonnes de la table simulations
    RAISE NOTICE 'Colonnes de la table simulations:';
    FOR col_info IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - % (%s, nullable: %)', 
            col_info.column_name, col_info.data_type, col_info.is_nullable;
    END LOOP;
    
    -- Vérifier les colonnes de la table Client
    RAISE NOTICE '';
    RAISE NOTICE 'Colonnes de la table Client:';
    FOR col_info IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Client'
        AND column_name IN ('id', 'auth_id', 'email', 'company_name', 'siren', 'type')
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - % (%s, nullable: %)', 
            col_info.column_name, col_info.data_type, col_info.is_nullable;
    END LOOP;
END $$;

-- ===== 3. IDENTIFICATION DES PROBLÈMES DANS LES APIs =====
DO $$
DECLARE
    problem_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== PROBLÈMES IDENTIFIÉS DANS LES APIs ===';
    
    -- Problème 1: Table Simulation vs simulations
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'simulations'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Simulation'
    ) THEN
        problem_count := problem_count + 1;
        RAISE NOTICE '❌ PROBLÈME %: Les APIs utilisent "Simulation" mais la table s''appelle "simulations"', problem_count;
        RAISE NOTICE '   Solution: Remplacer "Simulation" par "simulations" dans tous les fichiers';
    END IF;
    
    -- Problème 2: Table SimulationProcessed manquante
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'SimulationProcessed'
    ) THEN
        problem_count := problem_count + 1;
        RAISE NOTICE '❌ PROBLÈME %: Table "SimulationProcessed" manquante', problem_count;
        RAISE NOTICE '   Solution: Créer la table ou adapter les APIs';
    END IF;
    
    -- Problème 3: Table chatbotsimulation manquante
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'chatbotsimulation'
    ) THEN
        problem_count := problem_count + 1;
        RAISE NOTICE '❌ PROBLÈME %: Table "chatbotsimulation" manquante (supprimée lors du dédoublonnage)', problem_count;
        RAISE NOTICE '   Solution: Adapter les APIs pour utiliser "simulations"';
    END IF;
    
    -- Problème 4: Colonnes manquantes dans simulations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'simulations' 
        AND column_name = 'clientId'
    ) THEN
        problem_count := problem_count + 1;
        RAISE NOTICE '❌ PROBLÈME %: Colonne "clientId" manquante dans simulations', problem_count;
        RAISE NOTICE '   Solution: Utiliser "client_id" au lieu de "clientId"';
    END IF;
    
    IF problem_count = 0 THEN
        RAISE NOTICE '✅ Aucun problème majeur identifié';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'Total problèmes identifiés: %', problem_count;
    END IF;
END $$;

-- ===== 4. RECOMMANDATIONS DE CORRECTION =====
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RECOMMANDATIONS DE CORRECTION ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. CORRECTION DES NOMS DE TABLES:';
    RAISE NOTICE '   - Remplacer "Simulation" par "simulations"';
    RAISE NOTICE '   - Remplacer "chatbotsimulation" par "simulations"';
    RAISE NOTICE '   - Adapter les APIs pour SimulationProcessed';
    RAISE NOTICE '';
    RAISE NOTICE '2. CORRECTION DES NOMS DE COLONNES:';
    RAISE NOTICE '   - Remplacer "clientId" par "client_id"';
    RAISE NOTICE '   - Remplacer "createdBy" par "created_by"';
    RAISE NOTICE '   - Remplacer "createdAt" par "created_at"';
    RAISE NOTICE '';
    RAISE NOTICE '3. FICHIERS À MODIFIER:';
    RAISE NOTICE '   - server/src/routes/simulations.ts';
    RAISE NOTICE '   - server/src/routes/simulation.ts';
    RAISE NOTICE '   - server/src/routes/simulationRoutes.ts';
    RAISE NOTICE '   - server/src/services/simulationProcessor.ts';
    RAISE NOTICE '   - server/src/services/sessionMigrationService.ts';
    RAISE NOTICE '';
    RAISE NOTICE '4. VÉRIFICATIONS POST-CORRECTION:';
    RAISE NOTICE '   - Tester toutes les routes de simulation';
    RAISE NOTICE '   - Vérifier les migrations de session';
    RAISE NOTICE '   - Tester le workflow complet';
END $$;

-- ===== 5. SCRIPT DE CORRECTION AUTOMATIQUE =====
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SCRIPT DE CORRECTION AUTOMATIQUE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Pour corriger automatiquement, exécuter:';
    RAISE NOTICE 'server/scripts/correction-automatique-apis.sql';
END $$; 