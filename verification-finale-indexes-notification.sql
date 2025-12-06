-- ============================================================================
-- VÉRIFICATION FINALE DES INDEX SUR notification
-- Après création des 3 index manquants
-- Date: 2025-12-05
-- ============================================================================

-- ============================================================================
-- 1. COMPTAGE TOTAL DES INDEX
-- ============================================================================

SELECT 
    'Comptage total' as type,
    COUNT(*) as nombre_index_actuels,
    19 as nombre_index_attendus,
    COUNT(*) - 19 as ecart,
    CASE 
        WHEN COUNT(*) = 19 THEN '✅ Conforme exactement (16 de base + 3 optionnels)'
        WHEN COUNT(*) > 19 THEN CONCAT('ℹ️ ', COUNT(*) - 19, ' index supplémentaire(s)')
        WHEN COUNT(*) >= 16 THEN CONCAT('✅ Conforme (', COUNT(*), ' index - 16 de base + ', COUNT(*) - 16, ' optionnels)')
        ELSE CONCAT('⚠️ Manque ', 16 - COUNT(*), ' index de base')
    END as statut
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public';

-- ============================================================================
-- 2. LISTE COMPLÈTE DES INDEX PAR CATÉGORIE
-- ============================================================================

SELECT 
    'Index par catégorie' as type,
    CASE 
        WHEN indexname LIKE '%parent%' OR indexname LIKE '%child%' OR indexname LIKE '%hidden%' THEN 'Notifications groupées'
        WHEN indexname LIKE '%user_id%' OR indexname LIKE '%user_type%' THEN 'Filtrage utilisateur'
        WHEN indexname LIKE '%is_read%' OR indexname LIKE '%unread%' THEN 'Statut lecture'
        WHEN indexname LIKE '%priority%' THEN 'Priorité'
        WHEN indexname LIKE '%status%' THEN 'Statut'
        WHEN indexname LIKE '%created_at%' OR indexname LIKE '%expires_at%' THEN 'Dates'
        WHEN indexname LIKE '%notification_type%' THEN 'Type'
        WHEN indexname LIKE '%pkey%' OR indexname LIKE '%primary%' THEN 'Contrainte primaire'
        ELSE 'Autre'
    END as categorie,
    indexname as nom_index,
    indexdef as definition
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
ORDER BY 
    CASE 
        WHEN indexname LIKE '%parent%' OR indexname LIKE '%child%' OR indexname LIKE '%hidden%' THEN 1
        WHEN indexname LIKE '%user_id%' OR indexname LIKE '%user_type%' THEN 2
        WHEN indexname LIKE '%is_read%' OR indexname LIKE '%unread%' THEN 3
        WHEN indexname LIKE '%priority%' THEN 4
        WHEN indexname LIKE '%status%' THEN 5
        WHEN indexname LIKE '%created_at%' OR indexname LIKE '%expires_at%' THEN 6
        WHEN indexname LIKE '%notification_type%' THEN 7
        WHEN indexname LIKE '%pkey%' OR indexname LIKE '%primary%' THEN 8
        ELSE 9
    END,
    indexname;

-- ============================================================================
-- 3. VÉRIFICATION DES INDEX POUR NOTIFICATIONS GROUPÉES
-- ============================================================================

SELECT 
    'Index notifications groupées' as type,
    'idx_notification_parent_id' as index_attendu,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_parent_id')
        THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END as statut
UNION ALL
SELECT 
    'Index notifications groupées',
    'idx_notification_is_parent',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_is_parent')
        THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END
UNION ALL
SELECT 
    'Index notifications groupées',
    'idx_notification_hidden_in_list',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_hidden_in_list')
        THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END
UNION ALL
SELECT 
    'Index notifications groupées',
    'idx_notification_visible_list',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_visible_list')
        THEN '✅ Présent (composite)'
        ELSE '❌ MANQUANT'
    END;

-- ============================================================================
-- 4. VÉRIFICATION DES INDEX FINAUX (nouveau système)
-- ============================================================================

SELECT 
    'Index finaux' as type,
    indexname as nom_index,
    CASE 
        WHEN indexname LIKE 'idx_notification_final_%' THEN '✅ Index final'
        ELSE '⚠️ Ancien format'
    END as statut
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
  AND (
    indexname LIKE 'idx_notification_final_%'
    OR indexname LIKE 'idx_notification_%'
  )
ORDER BY indexname;

-- ============================================================================
-- 5. DÉTECTION DES INDEX DUPLIQUÉS (à nettoyer)
-- ============================================================================

SELECT 
    'Index dupliqués' as type,
    indexname as nom_index,
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
    OR (indexname LIKE '%user_id%' AND indexname NOT LIKE 'idx_notification_final_user_id_type')
  )
ORDER BY indexname;

-- ============================================================================
-- 6. RÉSUMÉ FINAL
-- ============================================================================

SELECT 
    'RÉSUMÉ FINAL' as type,
    'Total index' as element,
    COUNT(*)::text as valeur,
    CASE 
        WHEN COUNT(*) = 19 THEN '✅ Conforme (16 de base + 3 optionnels)'
        WHEN COUNT(*) >= 16 THEN CONCAT('✅ Conforme (', COUNT(*), ' index - 16 de base + ', COUNT(*) - 16, ' optionnels)')
        ELSE CONCAT('⚠️ ', 16 - COUNT(*), ' index de base manquant(s)')
    END as commentaire
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
UNION ALL
SELECT 
    'RÉSUMÉ FINAL',
    'Index groupées',
    COUNT(*)::text,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ Tous présents'
        ELSE CONCAT('⚠️ Manque ', 4 - COUNT(*))
    END
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
  AND indexname IN ('idx_notification_parent_id', 'idx_notification_is_parent', 'idx_notification_hidden_in_list', 'idx_notification_visible_list')
UNION ALL
SELECT 
    'RÉSUMÉ FINAL',
    'Index dupliqués',
    COUNT(*)::text,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Aucun dupliqué'
        ELSE CONCAT('⚠️ ', COUNT(*), ' à supprimer')
    END
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
  AND indexname IN ('notification_user_idx', 'notification_user_status_idx', 'notification_user_unread_idx');

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
