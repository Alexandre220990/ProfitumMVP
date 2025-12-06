-- ============================================================================
-- VÉRIFICATION DES TABLES APPORTEUR ET CLIENT NOTIFICATIONS
-- Date: 05 Décembre 2025
-- Vérifie la structure complète des deux tables créées
-- ============================================================================

-- Fonction helper pour compter les lignes en toute sécurité
CREATE OR REPLACE FUNCTION safe_count_table(table_name text)
RETURNS integer AS $$
DECLARE
    result integer;
BEGIN
    EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO result;
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VÉRIFICATION GLOBALE DES DEUX TABLES
-- ============================================================================

SELECT 
    'ApporteurNotification' as table_name,
    'Notifications apporteur' as description,
    safe_count_table('ApporteurNotification') as nombre_lignes,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = 'ApporteurNotification' 
     AND table_schema = 'public') as nombre_colonnes,
    (SELECT COUNT(*) 
     FROM pg_indexes 
     WHERE tablename = 'ApporteurNotification' 
     AND schemaname = 'public') as nombre_index,
    (SELECT COUNT(*) 
     FROM pg_policies 
     WHERE tablename = 'ApporteurNotification' 
     AND schemaname = 'public') as nombre_policies_rls,
    (SELECT COUNT(*) 
     FROM pg_trigger t
     JOIN pg_class c ON t.tgrelid = c.oid
     WHERE c.relname = 'ApporteurNotification' 
     AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
     AND NOT t.tgisinternal) as nombre_triggers,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ApporteurNotification' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
UNION ALL
SELECT 
    'ClientNotification' as table_name,
    'Notifications client' as description,
    safe_count_table('ClientNotification') as nombre_lignes,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = 'ClientNotification' 
     AND table_schema = 'public') as nombre_colonnes,
    (SELECT COUNT(*) 
     FROM pg_indexes 
     WHERE tablename = 'ClientNotification' 
     AND schemaname = 'public') as nombre_index,
    (SELECT COUNT(*) 
     FROM pg_policies 
     WHERE tablename = 'ClientNotification' 
     AND schemaname = 'public') as nombre_policies_rls,
    (SELECT COUNT(*) 
     FROM pg_trigger t
     JOIN pg_class c ON t.tgrelid = c.oid
     WHERE c.relname = 'ClientNotification' 
     AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
     AND NOT t.tgisinternal) as nombre_triggers,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ClientNotification' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table;

-- ============================================================================
-- VÉRIFICATION DES COLONNES - ApporteurNotification
-- ============================================================================

SELECT 
    'ApporteurNotification' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ApporteurNotification' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- VÉRIFICATION DES COLONNES - ClientNotification
-- ============================================================================

SELECT 
    'ClientNotification' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ClientNotification' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- VÉRIFICATION DES INDEX - ApporteurNotification
-- ============================================================================

SELECT 
    'ApporteurNotification' as table_name,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ApporteurNotification' 
  AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================================
-- VÉRIFICATION DES INDEX - ClientNotification
-- ============================================================================

SELECT 
    'ClientNotification' as table_name,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ClientNotification' 
  AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================================
-- VÉRIFICATION DES TRIGGERS - ApporteurNotification
-- ============================================================================

SELECT 
    'ApporteurNotification' as table_name,
    t.tgname as nom_trigger,
    pg_get_triggerdef(t.oid) as definition,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✅ Activé'
        ELSE '⚠️ Désactivé'
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'ApporteurNotification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- VÉRIFICATION DES TRIGGERS - ClientNotification
-- ============================================================================

SELECT 
    'ClientNotification' as table_name,
    t.tgname as nom_trigger,
    pg_get_triggerdef(t.oid) as definition,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✅ Activé'
        ELSE '⚠️ Désactivé'
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'ClientNotification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- VÉRIFICATION DES VUES
-- ============================================================================

SELECT 
    'Vues créées' as type,
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public' 
  AND table_name IN ('ApporteurNotificationActive', 'ClientNotificationActive')
ORDER BY table_name;

-- ============================================================================
-- VÉRIFICATION DES FONCTIONS HELPER
-- ============================================================================

SELECT 
    'Fonctions helper' as type,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND (
    routine_name LIKE '%apporteur%notification%' 
    OR routine_name LIKE '%client%notification%'
  )
ORDER BY routine_name;

-- ============================================================================
-- COMPARAISON AVEC LE MODÈLE AdminNotification
-- ============================================================================

SELECT 
    'Comparaison avec AdminNotification' as check_type,
    'ApporteurNotification' as table_name,
    safe_count_table('ApporteurNotification') as lignes_actuelles,
    0 as lignes_attendues_analyse,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ApporteurNotification' AND table_schema = 'public')
        THEN '❌ Table n''existe pas'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ApporteurNotification' AND table_schema = 'public')
        AND safe_count_table('ApporteurNotification') = 0 THEN '✅ Conforme (table vide)'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ApporteurNotification' AND table_schema = 'public')
        THEN '⚠️ Table contient des données'
        ELSE '❌ Table n''existe pas'
    END as statut,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ApporteurNotification' AND table_schema = 'public') as colonnes_actuelles,
    17 as colonnes_attendues,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'ApporteurNotification' AND schemaname = 'public') as index_actuels,
    8 as index_attendus,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ApporteurNotification' AND schemaname = 'public') as policies_actuelles,
    0 as policies_attendues,
    (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'ApporteurNotification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) as triggers_actuels,
    2 as triggers_attendus
UNION ALL
SELECT 
    'Comparaison avec AdminNotification' as check_type,
    'ClientNotification' as table_name,
    safe_count_table('ClientNotification') as lignes_actuelles,
    0 as lignes_attendues_analyse,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ClientNotification' AND table_schema = 'public')
        THEN '❌ Table n''existe pas'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ClientNotification' AND table_schema = 'public')
        AND safe_count_table('ClientNotification') = 0 THEN '✅ Conforme (table vide)'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ClientNotification' AND table_schema = 'public')
        THEN '⚠️ Table contient des données'
        ELSE '❌ Table n''existe pas'
    END as statut,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ClientNotification' AND table_schema = 'public') as colonnes_actuelles,
    17 as colonnes_attendues,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'ClientNotification' AND schemaname = 'public') as index_actuels,
    8 as index_attendus,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ClientNotification' AND schemaname = 'public') as policies_actuelles,
    0 as policies_attendues,
    (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'ClientNotification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) as triggers_actuels,
    2 as triggers_attendus;

-- ============================================================================
-- NETTOYAGE : Suppression de la fonction temporaire
-- ============================================================================

DROP FUNCTION IF EXISTS safe_count_table(text);

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
