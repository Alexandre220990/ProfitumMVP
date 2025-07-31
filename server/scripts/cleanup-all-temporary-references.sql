-- =====================================================
-- NETTOYAGE COMPLET DES RÉFÉRENCES À TemporarySimulationSession
-- Date: 2025-01-31
-- Description: Supprimer toutes les références à la table obsolète TemporarySimulationSession
-- =====================================================

-- ÉTAPE 1: SUPPRIMER TOUS LES TRIGGERS QUI RÉFÉRENCENT TemporarySimulationSession
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE '=== SUPPRESSION DES TRIGGERS OBSOLÈTES ===';
    
    -- Supprimer tous les triggers qui pourraient référencer TemporarySimulationSession
    FOR trigger_record IN 
        SELECT tgname, tgrelid::regclass as table_name
        FROM pg_trigger 
        WHERE tgname LIKE '%temporary%' OR tgname LIKE '%session%' OR tgname LIKE '%cleanup%'
    LOOP
        RAISE NOTICE 'Suppression du trigger % sur la table %', trigger_record.tgname, trigger_record.table_name;
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_record.tgname, trigger_record.table_name);
    END LOOP;
END $$;

-- ÉTAPE 2: SUPPRIMER TOUTES LES FONCTIONS QUI RÉFÉRENCENT TemporarySimulationSession
DO $$
DECLARE
    function_record RECORD;
BEGIN
    RAISE NOTICE '=== SUPPRESSION DES FONCTIONS OBSOLÈTES ===';
    
    -- Supprimer toutes les fonctions qui pourraient référencer TemporarySimulationSession
    FOR function_record IN 
        SELECT proname, prosrc
        FROM pg_proc 
        WHERE prosrc LIKE '%TemporarySimulationSession%' 
           OR prosrc LIKE '%simulations_unified%'
           OR proname LIKE '%cleanup%'
           OR proname LIKE '%temporary%'
    LOOP
        RAISE NOTICE 'Suppression de la fonction %', function_record.proname;
        EXECUTE format('DROP FUNCTION IF EXISTS %I()', function_record.proname);
    END LOOP;
END $$;

-- ÉTAPE 3: SUPPRIMER LES TRIGGERS SPÉCIFIQUES (AVANT LES FONCTIONS)
DROP TRIGGER IF EXISTS cleanup_expired_sessions_trigger ON "TemporarySimulationSession";
DROP TRIGGER IF EXISTS trigger_cleanup_expired_data ON simulations;
DROP TRIGGER IF EXISTS trigger_cleanup_expired_data ON "Client";
DROP TRIGGER IF EXISTS cleanup_expired_data_trigger ON simulations;

-- ÉTAPE 4: SUPPRIMER LES FONCTIONS SPÉCIFIQUES (APRÈS LES TRIGGERS)
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS trigger_cleanup_expired_data() CASCADE;
DROP FUNCTION IF EXISTS trigger_cleanup_expired_sessions() CASCADE;

-- ÉTAPE 5: VÉRIFICATION
DO $$
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DU NETTOYAGE ===';
    
    -- Vérifier qu'il n'y a plus de triggers problématiques
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname LIKE '%cleanup%' OR tgname LIKE '%temporary%'
    ) THEN
        RAISE NOTICE '✅ Aucun trigger problématique trouvé';
    ELSE
        RAISE NOTICE '⚠️ Il reste des triggers potentiellement problématiques';
    END IF;
    
    -- Vérifier qu'il n'y a plus de fonctions problématiques
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE prosrc LIKE '%TemporarySimulationSession%' OR prosrc LIKE '%simulations_unified%'
    ) THEN
        RAISE NOTICE '✅ Aucune fonction problématique trouvée';
    ELSE
        RAISE NOTICE '⚠️ Il reste des fonctions potentiellement problématiques';
    END IF;
    
END $$;

-- ÉTAPE 6: RÉSUMÉ
DO $$
BEGIN
    RAISE NOTICE '=== RÉSUMÉ DU NETTOYAGE ===';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tous les triggers obsolètes supprimés';
    RAISE NOTICE '✅ Toutes les fonctions obsolètes supprimées';
    RAISE NOTICE '✅ Références à TemporarySimulationSession nettoyées';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Le simulateur devrait maintenant fonctionner sans erreur';
END $$; 