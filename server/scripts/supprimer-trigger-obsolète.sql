-- =====================================================
-- SUPPRESSION DU TRIGGER OBSOLÈTE
-- Date : 2025-01-05
-- Objectif : Supprimer le trigger qui référence simulations_unified
-- =====================================================

-- ===== 1. IDENTIFICATION DU TRIGGER PROBLÉMATIQUE =====
DO $$
DECLARE
    trigger_info RECORD;
BEGIN
    RAISE NOTICE '=== IDENTIFICATION DU TRIGGER PROBLÉMATIQUE ===';
    
    -- Rechercher le trigger trigger_cleanup_expired_data
    SELECT 
        tgname as trigger_name,
        tgrelid::regclass as table_name,
        proname as function_name
    INTO trigger_info
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE tgname = 'trigger_cleanup_expired_data';
    
    IF trigger_info.trigger_name IS NOT NULL THEN
        RAISE NOTICE '✅ Trigger trouvé: % sur la table %', 
            trigger_info.trigger_name, trigger_info.table_name;
        RAISE NOTICE '   Fonction: %', trigger_info.function_name;
    ELSE
        RAISE NOTICE '❌ Trigger trigger_cleanup_expired_data non trouvé';
    END IF;
END $$;

-- ===== 2. VÉRIFICATION DE LA FONCTION DU TRIGGER =====
DO $$
DECLARE
    function_source TEXT;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DE LA FONCTION DU TRIGGER ===';
    
    -- Récupérer le code source de la fonction
    SELECT pg_get_functiondef(oid) INTO function_source
    FROM pg_proc 
    WHERE proname = 'trigger_cleanup_expired_data';
    
    IF function_source IS NOT NULL THEN
        RAISE NOTICE '✅ Fonction trigger_cleanup_expired_data trouvée';
        RAISE NOTICE '   Longueur du code: % caractères', length(function_source);
        
        -- Vérifier si elle fait référence à simulations_unified
        IF function_source LIKE '%simulations_unified%' THEN
            RAISE NOTICE '❌ La fonction fait référence à simulations_unified (table supprimée)';
        ELSE
            RAISE NOTICE '✅ La fonction ne fait pas référence à simulations_unified';
        END IF;
    ELSE
        RAISE NOTICE '❌ Fonction trigger_cleanup_expired_data non trouvée';
    END IF;
END $$;

-- ===== 3. SUPPRESSION DU TRIGGER =====
DO $$
DECLARE
    trigger_exists BOOLEAN;
    table_name TEXT;
BEGIN
    RAISE NOTICE '=== SUPPRESSION DU TRIGGER ===';
    
    -- Vérifier si le trigger existe
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_cleanup_expired_data'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        -- Récupérer le nom de la table
        SELECT tgrelid::regclass::text INTO table_name
        FROM pg_trigger 
        WHERE tgname = 'trigger_cleanup_expired_data';
        
        RAISE NOTICE 'Suppression du trigger trigger_cleanup_expired_data de la table %', table_name;
        
        -- Supprimer le trigger
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_cleanup_expired_data ON %I', table_name);
        
        RAISE NOTICE '✅ Trigger supprimé avec succès';
    ELSE
        RAISE NOTICE '⚠️ Trigger trigger_cleanup_expired_data non trouvé';
    END IF;
END $$;

-- ===== 4. SUPPRESSION DE LA FONCTION (OPTIONNEL) =====
DO $$
DECLARE
    function_exists BOOLEAN;
    trigger_count INTEGER;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION SI LA FONCTION PEUT ÊTRE SUPPRIMÉE ===';
    
    -- Vérifier si la fonction existe
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'trigger_cleanup_expired_data'
    ) INTO function_exists;
    
    -- Compter combien de triggers utilisent cette fonction
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE p.proname = 'trigger_cleanup_expired_data';
    
    IF function_exists THEN
        RAISE NOTICE 'Fonction trigger_cleanup_expired_data trouvée';
        RAISE NOTICE 'Triggers utilisant cette fonction: %', trigger_count;
        
        IF trigger_count = 0 THEN
            RAISE NOTICE 'Suppression de la fonction trigger_cleanup_expired_data...';
            DROP FUNCTION IF EXISTS trigger_cleanup_expired_data();
            RAISE NOTICE '✅ Fonction supprimée avec succès';
        ELSE
            RAISE NOTICE '⚠️ Fonction encore utilisée par % triggers, pas supprimée', trigger_count;
        END IF;
    ELSE
        RAISE NOTICE '✅ Fonction trigger_cleanup_expired_data non trouvée';
    END IF;
END $$;

-- ===== 5. VÉRIFICATION DES AUTRES TRIGGERS PROBLÉMATIQUES =====
DO $$
DECLARE
    problematic_trigger RECORD;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES AUTRES TRIGGERS PROBLÉMATIQUES ===';
    
    -- Rechercher d'autres triggers qui pourraient faire référence à des tables supprimées
    FOR problematic_trigger IN 
        SELECT DISTINCT
            t.tgname as trigger_name,
            t.tgrelid::regclass as table_name,
            p.proname as function_name
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE p.proname LIKE '%unified%'
        OR p.proname LIKE '%backup%'
        OR p.proname LIKE '%old%'
    LOOP
        RAISE NOTICE '⚠️ Trigger suspect: % sur % (fonction: %)', 
            problematic_trigger.trigger_name, 
            problematic_trigger.table_name, 
            problematic_trigger.function_name;
    END LOOP;
    
    IF NOT FOUND THEN
        RAISE NOTICE '✅ Aucun autre trigger problématique trouvé';
    END IF;
END $$;

-- ===== 6. VÉRIFICATION FINALE =====
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION FINALE ===';
    
    -- Compter les triggers restants sur la table simulations
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'simulations';
    
    RAISE NOTICE 'Triggers restants sur la table simulations: %', trigger_count;
    
    IF trigger_count = 0 THEN
        RAISE NOTICE '✅ Aucun trigger sur simulations - table propre';
    ELSE
        RAISE NOTICE '⚠️ % triggers restants sur simulations', trigger_count;
    END IF;
    
    RAISE NOTICE '=== NETTOYAGE TERMINÉ ===';
    RAISE NOTICE '✅ Le trigger obsolète a été supprimé';
END $$; 