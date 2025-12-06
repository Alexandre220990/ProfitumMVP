-- ============================================================================
-- ANALYSE DÉTAILLÉE DE LA TABLE notification
-- Vérification des index et triggers manquants/dupliqués
-- Date: 2025-12-05
-- ============================================================================

-- ============================================================================
-- 1. LISTE COMPLÈTE DES INDEX SUR notification
-- ============================================================================

SELECT 
    'Index sur notification' as type_verification,
    indexname as nom_index,
    indexdef as definition_index,
    CASE 
        WHEN indexname LIKE '%user_id%' AND indexname != 'idx_notification_final_user_id_type' THEN '⚠️ Possible duplication (user_id)'
        WHEN indexname LIKE '%user_status%' THEN '⚠️ Possible duplication (user_status)'
        WHEN indexname LIKE '%user_unread%' THEN '⚠️ Possible duplication (user_unread)'
        WHEN indexname LIKE 'idx_notification_final_%' THEN '✅ Index final (nouveau système)'
        ELSE 'ℹ️ Index standard'
    END as commentaire
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
ORDER BY 
    CASE 
        WHEN indexname LIKE 'idx_notification_final_%' THEN 1
        WHEN indexname LIKE '%user_id%' THEN 2
        WHEN indexname LIKE '%user_status%' THEN 3
        WHEN indexname LIKE '%user_unread%' THEN 4
        ELSE 5
    END,
    indexname;

-- ============================================================================
-- 2. DÉTECTION DES INDEX DUPLIQUÉS (selon l'analyse)
-- ============================================================================

-- Index sur user_id
SELECT 
    'Index dupliqués - user_id' as type_verification,
    indexname,
    indexdef,
    'Index potentiellement dupliqué' as statut
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
  AND (
    indexname LIKE '%user_id%' 
    OR indexdef LIKE '%user_id%'
  )
  AND indexname != 'idx_notification_final_user_id_type'  -- Exclure l'index composite
ORDER BY indexname;

-- Index sur user_status
SELECT 
    'Index dupliqués - user_status' as type_verification,
    indexname,
    indexdef,
    'Index potentiellement dupliqué' as statut
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
  AND (
    indexname LIKE '%user_status%' 
    OR indexdef LIKE '%user_status%'
  )
ORDER BY indexname;

-- Index sur is_read (user_unread)
SELECT 
    'Index dupliqués - is_read' as type_verification,
    indexname,
    indexdef,
    'Index potentiellement dupliqué' as statut
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
  AND (
    indexname LIKE '%unread%' 
    OR indexname LIKE '%is_read%'
    OR indexdef LIKE '%is_read%'
  )
ORDER BY indexname;

-- ============================================================================
-- 3. COMPARAISON AVEC LES INDEX ATTENDUS (selon l'analyse)
-- ============================================================================

-- Index attendus selon l'analyse (16 index mentionnés)
-- Vérification de la présence des index principaux
SELECT 
    'Index attendus' as type_verification,
    'idx_notification_user_id' as index_attendu,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_user_id')
        THEN '✅ Présent'
        ELSE '❌ Manquant'
    END as statut
UNION ALL
SELECT 
    'Index attendus',
    'notification_user_idx',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'notification_user_idx')
        THEN '⚠️ Présent (dupliqué selon analyse)'
        ELSE '✅ Non présent (nettoyé)'
    END
UNION ALL
SELECT 
    'Index attendus',
    'idx_notification_user_status',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_user_status')
        THEN '✅ Présent'
        ELSE '❌ Manquant'
    END
UNION ALL
SELECT 
    'Index attendus',
    'notification_user_status_idx',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'notification_user_status_idx')
        THEN '⚠️ Présent (dupliqué selon analyse)'
        ELSE '✅ Non présent (nettoyé)'
    END
UNION ALL
SELECT 
    'Index attendus',
    'notification_user_unread_idx',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'notification_user_unread_idx')
        THEN '⚠️ Présent (dupliqué selon analyse)'
        ELSE '✅ Non présent (nettoyé)'
    END
UNION ALL
SELECT 
    'Index attendus',
    'idx_notification_final_is_read',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_is_read')
        THEN '✅ Présent'
        ELSE '❌ Manquant'
    END
UNION ALL
SELECT 
    'Index attendus',
    'idx_notification_final_user_id_type',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_user_id_type')
        THEN '✅ Présent'
        ELSE '❌ Manquant'
    END
UNION ALL
SELECT 
    'Index attendus',
    'idx_notification_final_user_type',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_user_type')
        THEN '✅ Présent'
        ELSE '❌ Manquant'
    END
UNION ALL
SELECT 
    'Index attendus',
    'idx_notification_final_created_at',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_created_at')
        THEN '✅ Présent'
        ELSE '❌ Manquant'
    END
UNION ALL
SELECT 
    'Index attendus',
    'idx_notification_final_notification_type',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_notification_type')
        THEN '✅ Présent'
        ELSE '❌ Manquant'
    END;

-- ============================================================================
-- 4. LISTE COMPLÈTE DES TRIGGERS SUR notification
-- ============================================================================

SELECT 
    'Triggers sur notification' as type_verification,
    t.tgname as nom_trigger,
    pg_get_triggerdef(t.oid) as definition_trigger,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✅ Activé'
        WHEN t.tgenabled = 'D' THEN '⚠️ Désactivé'
        ELSE '❓ Statut inconnu'
    END as statut,
    CASE 
        WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE'
        WHEN t.tgtype::integer & 64 = 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as timing,
    CASE 
        WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
        ELSE 'Autre'
    END as evenement
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'notification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- 5. COMPARAISON AVEC LES TRIGGERS ATTENDUS (5 triggers selon l'analyse)
-- ============================================================================

-- Comptage des triggers par type
SELECT 
    'Comptage triggers' as type_verification,
    COUNT(*) as nombre_triggers_actuels,
    5 as nombre_triggers_attendus,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ Conforme'
        WHEN COUNT(*) < 5 THEN CONCAT('⚠️ Manquant ', 5 - COUNT(*), ' trigger(s)')
        ELSE CONCAT('ℹ️ Plus de triggers que prévu (+', COUNT(*) - 5, ')')
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'notification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal;

-- ============================================================================
-- 6. RÉSUMÉ DES ÉCARTS PAR RAPPORT À L'ANALYSE
-- ============================================================================

SELECT 
    'Résumé des écarts' as type_verification,
    'Index' as element,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'notification' AND schemaname = 'public') as valeur_actuelle,
    16 as valeur_attendue,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'notification' AND schemaname = 'public') - 16 as ecart,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'notification' AND schemaname = 'public') = 16 THEN '✅ Conforme'
        WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'notification' AND schemaname = 'public') < 16 THEN '⚠️ Manquants'
        ELSE 'ℹ️ Plus que prévu (nettoyage possible)'
    END as statut
UNION ALL
SELECT 
    'Résumé des écarts',
    'Triggers',
    (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'notification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal),
    5,
    (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'notification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) - 5,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'notification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) = 5 THEN '✅ Conforme'
        WHEN (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'notification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) < 5 THEN '⚠️ Manquants'
        ELSE 'ℹ️ Plus que prévu'
    END;

-- ============================================================================
-- 7. VÉRIFICATION DES INDEX SUR ExpertNotification (5 index vs 4 attendus)
-- ============================================================================

SELECT 
    'Index ExpertNotification' as type_verification,
    indexname as nom_index,
    indexdef as definition_index,
    'Index présent' as statut
FROM pg_indexes
WHERE tablename = 'ExpertNotification' 
  AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
