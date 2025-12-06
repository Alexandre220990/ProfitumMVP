-- ============================================================================
-- IDENTIFICATION DES INDEX ET TRIGGERS MANQUANTS SUR notification
-- Comparaison avec l'analyse complète du système de notifications
-- Date: 2025-12-05
-- ============================================================================

-- ============================================================================
-- 1. INDEX ACTUELS SUR notification (14 index détectés)
-- ============================================================================

SELECT 
    'Index actuels' as type,
    indexname as nom,
    indexdef as definition,
    'Présent' as statut
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================================
-- 2. INDEX ATTENDUS SELON L'ANALYSE (16 index mentionnés)
-- ============================================================================

-- Liste des index attendus basée sur l'analyse
WITH index_attendus AS (
    SELECT 'idx_notification_user_id' as nom_index, 'Index sur user_id' as description
    UNION ALL SELECT 'notification_user_idx', 'Index sur user_id (dupliqué à nettoyer)'
    UNION ALL SELECT 'idx_notification_user_status', 'Index sur user_status'
    UNION ALL SELECT 'notification_user_status_idx', 'Index sur user_status (dupliqué à nettoyer)'
    UNION ALL SELECT 'notification_user_unread_idx', 'Index sur user_unread (dupliqué à nettoyer)'
    UNION ALL SELECT 'idx_notification_final_is_read', 'Index final sur is_read'
    UNION ALL SELECT 'idx_notification_final_user_id', 'Index final sur user_id'
    UNION ALL SELECT 'idx_notification_final_user_type', 'Index final sur user_type'
    UNION ALL SELECT 'idx_notification_final_user_id_type', 'Index composite (user_id, user_type)'
    UNION ALL SELECT 'idx_notification_final_created_at', 'Index final sur created_at'
    UNION ALL SELECT 'idx_notification_final_notification_type', 'Index final sur notification_type'
    UNION ALL SELECT 'idx_notification_final_priority', 'Index final sur priority'
    UNION ALL SELECT 'idx_notification_final_status', 'Index final sur status'
    UNION ALL SELECT 'idx_notification_final_expires_at', 'Index final sur expires_at'
    UNION ALL SELECT 'idx_notification_parent_id', 'Index sur parent_id (notifications groupées)'
    UNION ALL SELECT 'idx_notification_hidden_in_list', 'Index sur hidden_in_list'
)
SELECT 
    'Index attendus' as type,
    ia.nom_index as nom,
    ia.description,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'notification' 
            AND indexname = ia.nom_index
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END as statut
FROM index_attendus ia
ORDER BY 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'notification' 
            AND indexname = ia.nom_index
        ) THEN 1
        ELSE 0
    END,
    ia.nom_index;

-- ============================================================================
-- 3. INDEX MANQUANTS (non présents dans la base)
-- ============================================================================

WITH index_attendus AS (
    SELECT 'idx_notification_user_id' as nom_index
    UNION ALL SELECT 'idx_notification_user_status'
    UNION ALL SELECT 'idx_notification_final_is_read'
    UNION ALL SELECT 'idx_notification_final_user_id'
    UNION ALL SELECT 'idx_notification_final_user_type'
    UNION ALL SELECT 'idx_notification_final_user_id_type'
    UNION ALL SELECT 'idx_notification_final_created_at'
    UNION ALL SELECT 'idx_notification_final_notification_type'
    UNION ALL SELECT 'idx_notification_final_priority'
    UNION ALL SELECT 'idx_notification_final_status'
    UNION ALL SELECT 'idx_notification_final_expires_at'
    UNION ALL SELECT 'idx_notification_parent_id'
    UNION ALL SELECT 'idx_notification_hidden_in_list'
)
SELECT 
    'Index manquants' as type,
    ia.nom_index as nom,
    'Index attendu mais non présent' as description,
    '❌ À créer' as statut
FROM index_attendus ia
WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'notification' 
    AND indexname = ia.nom_index
)
ORDER BY ia.nom_index;

-- ============================================================================
-- 4. INDEX DUPLIQUÉS À NETTOYER (selon l'analyse)
-- ============================================================================

SELECT 
    'Index dupliqués' as type,
    indexname as nom,
    indexdef as definition,
    CASE 
        WHEN indexname = 'notification_user_idx' THEN '⚠️ Duplique idx_notification_user_id - À supprimer'
        WHEN indexname = 'notification_user_status_idx' THEN '⚠️ Duplique idx_notification_user_status - À supprimer'
        WHEN indexname = 'notification_user_unread_idx' THEN '⚠️ Duplique idx_notification_final_is_read - À supprimer'
        ELSE '⚠️ Possible duplication - À vérifier'
    END as statut
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
  AND (
    indexname = 'notification_user_idx'
    OR indexname = 'notification_user_status_idx'
    OR indexname = 'notification_user_unread_idx'
  )
ORDER BY indexname;

-- ============================================================================
-- 5. TRIGGERS ACTUELS SUR notification (3 triggers détectés)
-- ============================================================================

SELECT 
    'Triggers actuels' as type,
    t.tgname as nom,
    pg_get_triggerdef(t.oid) as definition,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✅ Activé'
        ELSE '⚠️ Désactivé'
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
-- 6. TRIGGERS ATTENDUS SELON L'ANALYSE (5 triggers mentionnés)
-- ============================================================================

-- Les triggers typiques sur une table notification incluent :
-- 1. Trigger pour updated_at automatique
-- 2. Trigger pour children_count (notifications groupées)
-- 3. Trigger pour validation des données
-- 4. Trigger pour archivage automatique
-- 5. Trigger pour notifications groupées (parent/child)

-- Vérification des triggers communs
SELECT 
    'Triggers attendus' as type,
    'trigger_notification_updated_at' as nom_attendu,
    'Mise à jour automatique de updated_at' as description,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND t.tgname LIKE '%updated_at%'
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END as statut
UNION ALL
SELECT 
    'Triggers attendus',
    'trigger_notification_children_count',
    'Mise à jour automatique de children_count',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND t.tgname LIKE '%children%'
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END
UNION ALL
SELECT 
    'Triggers attendus',
    'trigger_notification_validation',
    'Validation des données',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%valid%' OR t.tgname LIKE '%check%')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END
UNION ALL
SELECT 
    'Triggers attendus',
    'trigger_notification_archive',
    'Archivage automatique',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%archive%' OR t.tgname LIKE '%expire%')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END
UNION ALL
SELECT 
    'Triggers attendus',
    'trigger_notification_parent_child',
    'Gestion parent/enfant (notifications groupées)',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'notification' 
            AND (t.tgname LIKE '%parent%' OR t.tgname LIKE '%child%')
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END;

-- ============================================================================
-- 7. RÉSUMÉ : CE QUI MANQUE EXACTEMENT
-- ============================================================================

SELECT 
    'RÉSUMÉ' as type,
    'Index manquants' as element,
    (16 - (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'notification' AND schemaname = 'public')) as nombre,
    'Index à créer pour atteindre les 16 attendus' as description
UNION ALL
SELECT 
    'RÉSUMÉ',
    'Index dupliqués',
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE tablename = 'notification' 
     AND indexname IN ('notification_user_idx', 'notification_user_status_idx', 'notification_user_unread_idx')),
    'Index à supprimer (duplications)'
UNION ALL
SELECT 
    'RÉSUMÉ',
    'Triggers manquants',
    (5 - (SELECT COUNT(*) FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          WHERE c.relname = 'notification' 
          AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          AND NOT t.tgisinternal)),
    'Triggers à créer pour atteindre les 5 attendus';

-- ============================================================================
-- 8. SUGGESTIONS DE CRÉATION D'INDEX MANQUANTS
-- ============================================================================

-- Script SQL suggéré pour créer les index manquants (à adapter selon les besoins)
SELECT 
    'Script suggéré' as type,
    CONCAT(
        'CREATE INDEX IF NOT EXISTS idx_notification_final_priority ',
        'ON notification(priority) ',
        'WHERE priority IS NOT NULL;'
    ) as commande_sql,
    'Index sur priority pour filtrage rapide' as description
WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'notification' 
    AND indexname = 'idx_notification_final_priority'
)
UNION ALL
SELECT 
    'Script suggéré',
    CONCAT(
        'CREATE INDEX IF NOT EXISTS idx_notification_final_status ',
        'ON notification(status) ',
        'WHERE status IS NOT NULL;'
    ),
    'Index sur status pour filtrage rapide'
WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'notification' 
    AND indexname = 'idx_notification_final_status'
)
UNION ALL
SELECT 
    'Script suggéré',
    CONCAT(
        'CREATE INDEX IF NOT EXISTS idx_notification_final_expires_at ',
        'ON notification(expires_at) ',
        'WHERE expires_at IS NOT NULL;'
    ),
    'Index sur expires_at pour nettoyage automatique'
WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'notification' 
    AND indexname = 'idx_notification_final_expires_at'
)
UNION ALL
SELECT 
    'Script suggéré',
    CONCAT(
        'CREATE INDEX IF NOT EXISTS idx_notification_parent_id ',
        'ON notification(parent_id) ',
        'WHERE parent_id IS NOT NULL;'
    ),
    'Index sur parent_id pour notifications groupées'
WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'notification' 
    AND indexname = 'idx_notification_parent_id'
)
UNION ALL
SELECT 
    'Script suggéré',
    CONCAT(
        'CREATE INDEX IF NOT EXISTS idx_notification_hidden_in_list ',
        'ON notification(hidden_in_list) ',
        'WHERE hidden_in_list = false;'
    ),
    'Index partiel sur hidden_in_list pour filtrage des notifications visibles'
WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'notification' 
    AND indexname = 'idx_notification_hidden_in_list'
);

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
