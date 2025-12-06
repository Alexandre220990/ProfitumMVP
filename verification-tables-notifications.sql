-- ============================================================================
-- SCRIPT DE VÉRIFICATION DES TABLES DE NOTIFICATIONS
-- Basé sur l'analyse complète du système de notifications
-- Date: 2025-12-05
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION DE LA TABLE PRINCIPALE : notification
-- ============================================================================

-- Vérification de l'existence et des statistiques
SELECT 
    'notification' as table_name,
    'Table principale' as description,
    COUNT(*) as nombre_lignes,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = 'notification' 
     AND table_schema = 'public') as nombre_colonnes,
    (SELECT COUNT(*) 
     FROM pg_indexes 
     WHERE tablename = 'notification' 
     AND schemaname = 'public') as nombre_index,
    (SELECT COUNT(*) 
     FROM pg_policies 
     WHERE tablename = 'notification' 
     AND schemaname = 'public') as nombre_policies_rls,
    (SELECT COUNT(*) 
     FROM pg_trigger t
     JOIN pg_class c ON t.tgrelid = c.oid
     WHERE c.relname = 'notification' 
     AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as nombre_triggers
FROM notification;

-- Vérification des colonnes attendues (26 colonnes selon l'analyse)
SELECT 
    'notification' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'notification' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérification des colonnes spécifiques pour notifications groupées
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'parent_id') 
        THEN '✅ parent_id existe'
        ELSE '❌ parent_id manquant'
    END as parent_id_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'is_parent') 
        THEN '✅ is_parent existe'
        ELSE '❌ is_parent manquant'
    END as is_parent_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'is_child') 
        THEN '✅ is_child existe'
        ELSE '❌ is_child manquant'
    END as is_child_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'hidden_in_list') 
        THEN '✅ hidden_in_list existe'
        ELSE '❌ hidden_in_list manquant'
    END as hidden_in_list_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'children_count') 
        THEN '✅ children_count existe'
        ELSE '❌ children_count manquant'
    END as children_count_check;

-- Vérification des index (16 index attendus selon l'analyse)
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
ORDER BY indexname;

-- Vérification des index dupliqués mentionnés dans l'analyse
SELECT 
    'Index dupliqués détectés' as check_type,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
  AND (
    indexname LIKE '%user_id%' OR
    indexname LIKE '%user_status%' OR
    indexname LIKE '%user_unread%'
  )
ORDER BY indexname;

-- Vérification des politiques RLS (4 politiques attendues selon l'analyse)
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'notification' 
  AND schemaname = 'public'
ORDER BY policyname;

-- Vérification des triggers (5 triggers attendus selon l'analyse)
SELECT 
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'notification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- 2. VÉRIFICATION DE LA TABLE : AdminNotification
-- ============================================================================

-- Fonction helper pour compter les lignes d'une table si elle existe
CREATE OR REPLACE FUNCTION safe_count_table(table_name text)
RETURNS bigint AS $$
DECLARE
    row_count bigint;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND information_schema.tables.table_name = safe_count_table.table_name
    ) THEN
        EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
        RETURN row_count;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Vérification de l'existence et des statistiques
SELECT 
    'AdminNotification' as table_name,
    'Notifications admin' as description,
    safe_count_table('AdminNotification') as nombre_lignes,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = 'AdminNotification' 
     AND table_schema = 'public') as nombre_colonnes,
    (SELECT COUNT(*) 
     FROM pg_indexes 
     WHERE tablename = 'AdminNotification' 
     AND schemaname = 'public') as nombre_index,
    (SELECT COUNT(*) 
     FROM pg_policies 
     WHERE tablename = 'AdminNotification' 
     AND schemaname = 'public') as nombre_policies_rls,
    (SELECT COUNT(*) 
     FROM pg_trigger t
     JOIN pg_class c ON t.tgrelid = c.oid
     WHERE c.relname = 'AdminNotification' 
     AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as nombre_triggers,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminNotification' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table;

-- Vérification des colonnes attendues (17 colonnes selon l'analyse)
SELECT 
    'AdminNotification' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'AdminNotification' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Si la table n'existe pas, afficher un message
SELECT 
    'AdminNotification' as table_name,
    '❌ Table n''existe pas - Vérification des colonnes impossible' as message
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'AdminNotification' 
    AND table_schema = 'public'
);

-- Vérification des index (8 index attendus selon l'analyse)
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'AdminNotification' 
  AND schemaname = 'public'
ORDER BY indexname;

-- ⚠️ Vérification critique : RLS doit être activé (0 politique selon l'analyse = PROBLÈME)
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminNotification' AND table_schema = 'public')
        THEN '❌ Table n''existe pas - vérification RLS impossible'
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'AdminNotification' AND schemaname = 'public') = 0
        THEN '❌ PROBLÈME: Aucune politique RLS sur AdminNotification'
        ELSE '✅ RLS activé'
    END as rls_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminNotification' AND table_schema = 'public')
        THEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'AdminNotification' AND schemaname = 'public')
        ELSE 0
    END as nombre_policies;

-- Vérification des triggers (3 triggers attendus selon l'analyse)
SELECT 
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'AdminNotification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- Si la table AdminNotification n'existe pas, afficher un message
SELECT 
    'AdminNotification' as table_name,
    '❌ Table n''existe pas - Vérification des triggers impossible' as message
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'AdminNotification' 
    AND table_schema = 'public'
);

-- ============================================================================
-- 3. VÉRIFICATION DE LA TABLE : ExpertNotification
-- ============================================================================

-- Vérification de l'existence et des statistiques
SELECT 
    'ExpertNotification' as table_name,
    'Notifications expert' as description,
    safe_count_table('ExpertNotification') as nombre_lignes,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = 'ExpertNotification' 
     AND table_schema = 'public') as nombre_colonnes,
    (SELECT COUNT(*) 
     FROM pg_indexes 
     WHERE tablename = 'ExpertNotification' 
     AND schemaname = 'public') as nombre_index,
    (SELECT COUNT(*) 
     FROM pg_policies 
     WHERE tablename = 'ExpertNotification' 
     AND schemaname = 'public') as nombre_policies_rls,
    (SELECT COUNT(*) 
     FROM pg_trigger t
     JOIN pg_class c ON t.tgrelid = c.oid
     WHERE c.relname = 'ExpertNotification' 
     AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as nombre_triggers,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ExpertNotification' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table;

-- Vérification des colonnes attendues (13 colonnes selon l'analyse)
SELECT 
    'ExpertNotification' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ExpertNotification' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérification des index (4 index attendus selon l'analyse)
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ExpertNotification' 
  AND schemaname = 'public'
ORDER BY indexname;

-- Vérification des politiques RLS (4 politiques attendues selon l'analyse)
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'ExpertNotification' 
  AND schemaname = 'public'
ORDER BY policyname;

-- Si la table ExpertNotification n'existe pas, afficher un message
SELECT 
    'ExpertNotification' as table_name,
    '❌ Table n''existe pas - Vérification des politiques RLS impossible' as message
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ExpertNotification' 
    AND table_schema = 'public'
);

-- ============================================================================
-- 4. VÉRIFICATION DES TABLES DE SUPPORT
-- ============================================================================

-- notification_preferences
SELECT 
    'notification_preferences' as table_name,
    safe_count_table('notification_preferences') as nombre_lignes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notification_preferences' AND table_schema = 'public') as nombre_colonnes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
FROM information_schema.tables
WHERE table_name = 'notification_preferences' AND table_schema = 'public'
UNION ALL
SELECT 
    'notification_preferences' as table_name,
    0 as nombre_lignes,
    0 as nombre_colonnes,
    '❌ Table n''existe pas' as statut_table
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences' AND table_schema = 'public');

-- notification_groups
SELECT 
    'notification_groups' as table_name,
    safe_count_table('notification_groups') as nombre_lignes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notification_groups' AND table_schema = 'public') as nombre_colonnes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_groups' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
FROM information_schema.tables
WHERE table_name = 'notification_groups' AND table_schema = 'public'
UNION ALL
SELECT 
    'notification_groups' as table_name,
    0 as nombre_lignes,
    0 as nombre_colonnes,
    '❌ Table n''existe pas' as statut_table
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_groups' AND table_schema = 'public');

-- notification_group_members
SELECT 
    'notification_group_members' as table_name,
    safe_count_table('notification_group_members') as nombre_lignes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notification_group_members' AND table_schema = 'public') as nombre_colonnes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_group_members' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
FROM information_schema.tables
WHERE table_name = 'notification_group_members' AND table_schema = 'public'
UNION ALL
SELECT 
    'notification_group_members' as table_name,
    0 as nombre_lignes,
    0 as nombre_colonnes,
    '❌ Table n''existe pas' as statut_table
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_group_members' AND table_schema = 'public');

-- notification_metrics
SELECT 
    'notification_metrics' as table_name,
    safe_count_table('notification_metrics') as nombre_lignes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notification_metrics' AND table_schema = 'public') as nombre_colonnes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_metrics' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
FROM information_schema.tables
WHERE table_name = 'notification_metrics' AND table_schema = 'public'
UNION ALL
SELECT 
    'notification_metrics' as table_name,
    0 as nombre_lignes,
    0 as nombre_colonnes,
    '❌ Table n''existe pas' as statut_table
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_metrics' AND table_schema = 'public');

-- AdminNotificationStatus
SELECT 
    'AdminNotificationStatus' as table_name,
    safe_count_table('AdminNotificationStatus') as nombre_lignes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'AdminNotificationStatus' AND table_schema = 'public') as nombre_colonnes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminNotificationStatus' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
FROM information_schema.tables
WHERE table_name = 'AdminNotificationStatus' AND table_schema = 'public'
UNION ALL
SELECT 
    'AdminNotificationStatus' as table_name,
    0 as nombre_lignes,
    0 as nombre_colonnes,
    '❌ Table n''existe pas' as statut_table
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminNotificationStatus' AND table_schema = 'public');

-- UserNotificationPreferences
SELECT 
    'UserNotificationPreferences' as table_name,
    safe_count_table('UserNotificationPreferences') as nombre_lignes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'UserNotificationPreferences' AND table_schema = 'public') as nombre_colonnes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'UserNotificationPreferences' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
FROM information_schema.tables
WHERE table_name = 'UserNotificationPreferences' AND table_schema = 'public'
UNION ALL
SELECT 
    'UserNotificationPreferences' as table_name,
    0 as nombre_lignes,
    0 as nombre_colonnes,
    '❌ Table n''existe pas' as statut_table
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'UserNotificationPreferences' AND table_schema = 'public');

-- ============================================================================
-- 5. VÉRIFICATION DES TABLES EMAIL ET MESSAGES
-- ============================================================================

-- EmailQueue
SELECT 
    'EmailQueue' as table_name,
    safe_count_table('EmailQueue') as nombre_lignes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'EmailQueue' AND table_schema = 'public') as nombre_colonnes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'EmailQueue' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
FROM information_schema.tables
WHERE table_name = 'EmailQueue' AND table_schema = 'public'
UNION ALL
SELECT 
    'EmailQueue' as table_name,
    0 as nombre_lignes,
    0 as nombre_colonnes,
    '❌ Table n''existe pas' as statut_table
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'EmailQueue' AND table_schema = 'public');

-- EmailTracking
SELECT 
    'EmailTracking' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'EmailTracking' AND table_schema = 'public')
        THEN (SELECT COUNT(*) FROM "EmailTracking")
        ELSE 0
    END as nombre_lignes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'EmailTracking' AND table_schema = 'public') as nombre_colonnes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'EmailTracking' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
FROM information_schema.tables
WHERE table_name = 'EmailTracking' AND table_schema = 'public'
UNION ALL
SELECT 
    'EmailTracking' as table_name,
    0 as nombre_lignes,
    0 as nombre_colonnes,
    '❌ Table n''existe pas' as statut_table
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'EmailTracking' AND table_schema = 'public');

-- EmailEvent
SELECT 
    'EmailEvent' as table_name,
    safe_count_table('EmailEvent') as nombre_lignes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'EmailEvent' AND table_schema = 'public') as nombre_colonnes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'EmailEvent' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
FROM information_schema.tables
WHERE table_name = 'EmailEvent' AND table_schema = 'public'
UNION ALL
SELECT 
    'EmailEvent' as table_name,
    0 as nombre_lignes,
    0 as nombre_colonnes,
    '❌ Table n''existe pas' as statut_table
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'EmailEvent' AND table_schema = 'public');

-- messages
SELECT 
    'messages' as table_name,
    safe_count_table('messages') as nombre_lignes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'messages' AND table_schema = 'public') as nombre_colonnes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
FROM information_schema.tables
WHERE table_name = 'messages' AND table_schema = 'public'
UNION ALL
SELECT 
    'messages' as table_name,
    0 as nombre_lignes,
    0 as nombre_colonnes,
    '❌ Table n''existe pas' as statut_table
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public');

-- contact_messages
SELECT 
    'contact_messages' as table_name,
    safe_count_table('contact_messages') as nombre_lignes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'contact_messages' AND table_schema = 'public') as nombre_colonnes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_messages' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
FROM information_schema.tables
WHERE table_name = 'contact_messages' AND table_schema = 'public'
UNION ALL
SELECT 
    'contact_messages' as table_name,
    0 as nombre_lignes,
    0 as nombre_colonnes,
    '❌ Table n''existe pas' as statut_table
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_messages' AND table_schema = 'public');

-- admin_messages
SELECT 
    'admin_messages' as table_name,
    safe_count_table('admin_messages') as nombre_lignes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'admin_messages' AND table_schema = 'public') as nombre_colonnes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_messages' AND table_schema = 'public')
        THEN '✅ Table existe'
        ELSE '❌ Table n''existe pas'
    END as statut_table
FROM information_schema.tables
WHERE table_name = 'admin_messages' AND table_schema = 'public'
UNION ALL
SELECT 
    'admin_messages' as table_name,
    0 as nombre_lignes,
    0 as nombre_colonnes,
    '❌ Table n''existe pas' as statut_table
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_messages' AND table_schema = 'public');

-- ============================================================================
-- 6. RÉSUMÉ GLOBAL - VUE D'ENSEMBLE
-- ============================================================================

-- Vue d'ensemble de toutes les tables de notifications
SELECT 
    t.table_name,
    CASE 
        WHEN t.table_name = 'notification' THEN 'Table principale'
        WHEN t.table_name = 'AdminNotification' THEN 'Notifications admin'
        WHEN t.table_name = 'ExpertNotification' THEN 'Notifications expert'
        WHEN t.table_name IN ('notification_preferences', 'notification_groups', 'notification_group_members', 'notification_metrics', 'AdminNotificationStatus', 'UserNotificationPreferences') THEN 'Tables de support'
        WHEN t.table_name IN ('EmailQueue', 'EmailTracking', 'EmailEvent', 'messages', 'contact_messages', 'admin_messages') THEN 'Tables email/messages'
        ELSE 'Autre'
    END as categorie,
    COALESCE((SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public'), 0) as nombre_colonnes,
    COALESCE((SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name AND schemaname = 'public'), 0) as nombre_index,
    COALESCE((SELECT COUNT(*) FROM pg_policies WHERE tablename = t.table_name AND schemaname = 'public'), 0) as nombre_policies_rls,
    safe_count_table(t.table_name) as nombre_lignes
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND (
    t.table_name = 'notification' OR
    t.table_name = 'AdminNotification' OR
    t.table_name = 'ExpertNotification' OR
    t.table_name = 'notification_preferences' OR
    t.table_name = 'notification_groups' OR
    t.table_name = 'notification_group_members' OR
    t.table_name = 'notification_metrics' OR
    t.table_name = 'AdminNotificationStatus' OR
    t.table_name = 'UserNotificationPreferences' OR
    t.table_name = 'EmailQueue' OR
    t.table_name = 'EmailTracking' OR
    t.table_name = 'EmailEvent' OR
    t.table_name = 'messages' OR
    t.table_name = 'contact_messages' OR
    t.table_name = 'admin_messages'
  )
ORDER BY 
    CASE 
        WHEN t.table_name = 'notification' THEN 1
        WHEN t.table_name = 'AdminNotification' THEN 2
        WHEN t.table_name = 'ExpertNotification' THEN 3
        WHEN t.table_name IN ('notification_preferences', 'notification_groups', 'notification_group_members', 'notification_metrics', 'AdminNotificationStatus', 'UserNotificationPreferences') THEN 4
        WHEN t.table_name IN ('EmailQueue', 'EmailTracking', 'EmailEvent', 'messages', 'contact_messages', 'admin_messages') THEN 5
        ELSE 6
    END,
    t.table_name;

-- ============================================================================
-- 7. VÉRIFICATIONS SPÉCIFIQUES SELON L'ANALYSE
-- ============================================================================

-- Vérification des colonnes redondantes mentionnées dans l'analyse
SELECT 
    'Vérification colonnes redondantes' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'status')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'is_read')
        THEN '⚠️ Colonnes status et is_read coexistent (peuvent être incohérents)'
        ELSE '✅ Pas de redondance détectée'
    END as status_vs_is_read,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'archived_at')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'dismissed_at')
        THEN '⚠️ Colonnes archived_at et dismissed_at coexistent'
        ELSE '✅ Pas de redondance détectée'
    END as archived_vs_dismissed;

-- Vérification des différences de structure entre AdminNotification et notification
SELECT 
    'Différences de structure' as check_type,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminNotification' AND table_schema = 'public')
        THEN '❌ AdminNotification n''existe pas - vérification impossible'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminNotification' AND column_name = 'type')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'notification_type')
        THEN '⚠️ AdminNotification utilise "type" alors que notification utilise "notification_type"'
        ELSE '✅ Cohérence des noms'
    END as type_column_naming,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminNotification' AND table_schema = 'public')
        THEN '❌ AdminNotification n''existe pas - vérification impossible'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'AdminNotification' AND column_name = 'user_id')
        THEN '⚠️ AdminNotification n''a pas de colonne user_id (table globale)'
        ELSE '✅ Colonne user_id présente'
    END as user_id_check;

-- ============================================================================
-- 8. STATISTIQUES ATTENDUES SELON L'ANALYSE
-- ============================================================================

-- Comparaison avec les statistiques de l'analyse
SELECT 
    'Comparaison avec analyse' as check_type,
    'notification' as table_name,
    (SELECT COUNT(*) FROM notification) as lignes_actuelles,
    387 as lignes_attendues_analyse,
    CASE 
        WHEN (SELECT COUNT(*) FROM notification) >= 387 THEN '✅ Conforme ou supérieur'
        ELSE '⚠️ Moins de lignes que prévu'
    END as statut,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notification' AND table_schema = 'public') as colonnes_actuelles,
    26 as colonnes_attendues,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'notification' AND schemaname = 'public') as index_actuels,
    19 as index_attendus,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'notification' AND schemaname = 'public') as policies_actuelles,
    4 as policies_attendues,
    (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'notification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) as triggers_actuels,
    5 as triggers_attendus
UNION ALL
SELECT 
    'Comparaison avec analyse' as check_type,
    'AdminNotification' as table_name,
    safe_count_table('AdminNotification') as lignes_actuelles,
    26 as lignes_attendues_analyse,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminNotification' AND table_schema = 'public')
        THEN '❌ Table n''existe pas'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminNotification' AND table_schema = 'public')
        AND safe_count_table('AdminNotification') >= 26 THEN '✅ Conforme ou supérieur'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminNotification' AND table_schema = 'public')
        THEN '⚠️ Moins de lignes que prévu'
        ELSE '❌ Table n''existe pas'
    END as statut,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'AdminNotification' AND table_schema = 'public') as colonnes_actuelles,
    17 as colonnes_attendues,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'AdminNotification' AND schemaname = 'public') as index_actuels,
    8 as index_attendus,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'AdminNotification' AND schemaname = 'public') as policies_actuelles,
    0 as policies_attendues,
    (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'AdminNotification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) as triggers_actuels,
    3 as triggers_attendus
UNION ALL
SELECT 
    'Comparaison avec analyse' as check_type,
    'ExpertNotification' as table_name,
    safe_count_table('ExpertNotification') as lignes_actuelles,
    0 as lignes_attendues_analyse,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ExpertNotification' AND table_schema = 'public')
        THEN '❌ Table n''existe pas'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ExpertNotification' AND table_schema = 'public')
        AND safe_count_table('ExpertNotification') = 0 THEN '✅ Conforme (table vide)'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ExpertNotification' AND table_schema = 'public')
        THEN '⚠️ Table contient des données'
        ELSE '❌ Table n''existe pas'
    END as statut,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ExpertNotification' AND table_schema = 'public') as colonnes_actuelles,
    13 as colonnes_attendues,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'ExpertNotification' AND schemaname = 'public') as index_actuels,
    4 as index_attendus,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ExpertNotification' AND schemaname = 'public') as policies_actuelles,
    4 as policies_attendues,
    (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'ExpertNotification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) as triggers_actuels,
    0 as triggers_attendus;

-- ============================================================================
-- NETTOYAGE : Suppression de la fonction temporaire
-- ============================================================================

DROP FUNCTION IF EXISTS safe_count_table(text);

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
