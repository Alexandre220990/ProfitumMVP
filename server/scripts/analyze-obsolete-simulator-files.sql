-- =====================================================
-- ANALYSE DES FICHIERS OBSOLÈTES DU SIMULATEUR
-- Date: 2025-01-31
-- Description: Identifier tous les fichiers de migration obsolètes
-- =====================================================

-- ÉTAPE 1: VÉRIFIER LES TABLES OBSOLÈTES RÉFÉRENCÉES
DO $$
BEGIN
    RAISE NOTICE '=== ANALYSE DES TABLES OBSOLÈTES ===';
    
    -- Vérifier SimulatorSession (obsolète)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'SimulatorSession'
    ) THEN
        RAISE NOTICE '❌ Table SimulatorSession existe encore (OBSOLÈTE)';
    ELSE
        RAISE NOTICE '✅ Table SimulatorSession supprimée (correct)';
    END IF;
    
    -- Vérifier SimulatorEligibility (obsolète)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'SimulatorEligibility'
    ) THEN
        RAISE NOTICE '❌ Table SimulatorEligibility existe encore (OBSOLÈTE)';
    ELSE
        RAISE NOTICE '✅ Table SimulatorEligibility supprimée (correct)';
    END IF;
    
    -- Vérifier TemporarySimulationSession (obsolète)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'TemporarySimulationSession'
    ) THEN
        RAISE NOTICE '❌ Table TemporarySimulationSession existe encore (OBSOLÈTE)';
    ELSE
        RAISE NOTICE '✅ Table TemporarySimulationSession supprimée (correct)';
    END IF;
    
    -- Vérifier simulations (actuelle)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'simulations'
    ) THEN
        RAISE NOTICE '✅ Table simulations existe (ACTUELLE)';
    ELSE
        RAISE NOTICE '❌ Table simulations manquante (PROBLÈME)';
    END IF;
    
    -- Vérifier Client (actuelle)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Client'
    ) THEN
        RAISE NOTICE '✅ Table Client existe (ACTUELLE)';
    ELSE
        RAISE NOTICE '❌ Table Client manquante (PROBLÈME)';
    END IF;
    
END $$;

-- ÉTAPE 2: VÉRIFIER LES FONCTIONS OBSOLÈTES
DO $$
BEGIN
    RAISE NOTICE '=== ANALYSE DES FONCTIONS OBSOLÈTES ===';
    
    -- Fonctions obsolètes à supprimer
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'migrate_session_manually'
    ) THEN
        RAISE NOTICE '❌ Fonction migrate_session_manually existe (OBSOLÈTE)';
    ELSE
        RAISE NOTICE '✅ Fonction migrate_session_manually supprimée (correct)';
    END IF;
    
    -- Fonctions actuelles à conserver
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_simulation_with_temporary_client'
    ) THEN
        RAISE NOTICE '✅ Fonction create_simulation_with_temporary_client existe (ACTUELLE)';
    ELSE
        RAISE NOTICE '❌ Fonction create_simulation_with_temporary_client manquante (PROBLÈME)';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_temporary_client'
    ) THEN
        RAISE NOTICE '✅ Fonction create_temporary_client existe (ACTUELLE)';
    ELSE
        RAISE NOTICE '❌ Fonction create_temporary_client manquante (PROBLÈME)';
    END IF;
    
END $$;

-- ÉTAPE 3: LISTE DES FICHIERS OBSOLÈTES À SUPPRIMER
DO $$
BEGIN
    RAISE NOTICE '=== FICHIERS OBSOLÈTES À SUPPRIMER ===';
    RAISE NOTICE '';
    RAISE NOTICE '📁 FICHIERS DE MIGRATION OBSOLÈTES:';
    RAISE NOTICE '• server/scripts/fix-simulation-migration.sql';
    RAISE NOTICE '• server/scripts/test-complet-simulation-migration.sql';
    RAISE NOTICE '• server/scripts/Untitled-1.sql (remplacé par quick-fix-simulator.sql)';
    RAISE NOTICE '• server/scripts/implement-simulator-option2.sql';
    RAISE NOTICE '• server/scripts/unify-simulator-logic.sql';
    RAISE NOTICE '• server/scripts/analyze-simulator-logic.sql';
    RAISE NOTICE '• server/scripts/fix-simulator-rls.sql';
    RAISE NOTICE '• server/scripts/diagnose-simulator-issue.sql';
    RAISE NOTICE '• server/scripts/fix-simulator-final.sql';
    RAISE NOTICE '• server/scripts/debug-simulator.sql';
    RAISE NOTICE '• server/scripts/fix-simulator-results.sql';
    RAISE NOTICE '';
    RAISE NOTICE '📁 FICHIERS DE TEST OBSOLÈTES:';
    RAISE NOTICE '• server/scripts/test-simulateur-mise-a-jour.sql';
    RAISE NOTICE '• server/scripts/test-workflow-simulateur-inscription.sql';
    RAISE NOTICE '• server/scripts/test-session-migration.js';
    RAISE NOTICE '• server/scripts/complete-simulation-process.js';
    RAISE NOTICE '• server/scripts/check-all-simulation-tables.js';
    RAISE NOTICE '';
    RAISE NOTICE '📁 FICHIERS DE DOCUMENTATION OBSOLÈTES:';
    RAISE NOTICE '• MIGRATION-SIMULATOR-COMPLETE.md';
    RAISE NOTICE '• DOCUMENTATION-MIGRATION-SESSION.md';
    RAISE NOTICE '';
    RAISE NOTICE '✅ FICHIERS ACTUELS À CONSERVER:';
    RAISE NOTICE '• server/scripts/quick-fix-simulator.sql (ACTUEL)';
    RAISE NOTICE '• server/scripts/cleanup-all-temporary-references.sql (ACTUEL)';
    RAISE NOTICE '• server/scripts/fix-simulator-complete.sql (ACTUEL)';
    RAISE NOTICE '• server/scripts/fix-obsolete-trigger.sql (ACTUEL)';
END $$; 