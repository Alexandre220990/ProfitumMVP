-- ============================================================================
-- VÉRIFICATION DES INDEX POUR NOTIFICATIONS GROUPÉES
-- Vérifie si idx_notification_parent_id et idx_notification_hidden_in_list existent
-- Date: 2025-12-05
-- ============================================================================

-- Vérification de l'existence des index pour notifications groupées
SELECT 
    'Vérification index groupées' as type,
    'idx_notification_parent_id' as nom_index,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'notification' 
            AND indexname = 'idx_notification_parent_id'
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT - À créer'
    END as statut,
    'Index sur parent_id pour retrouver rapidement les enfants d''un parent' as description
UNION ALL
SELECT 
    'Vérification index groupées',
    'idx_notification_hidden_in_list',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'notification' 
            AND indexname = 'idx_notification_hidden_in_list'
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT - À créer'
    END,
    'Index sur hidden_in_list pour filtrer dans les requêtes UI'
UNION ALL
SELECT 
    'Vérification index groupées',
    'idx_notification_is_parent',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'notification' 
            AND indexname = 'idx_notification_is_parent'
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT - À créer'
    END,
    'Index sur is_parent pour filtrer rapidement les parents'
UNION ALL
SELECT 
    'Vérification index groupées',
    'idx_notification_visible_list',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'notification' 
            AND indexname = 'idx_notification_visible_list'
        ) THEN '✅ Présent (composite)'
        ELSE '❌ MANQUANT - À créer'
    END,
    'Index composite pour requêtes fréquentes (récupérer notifications visibles)';

-- Liste de tous les index actuels pour référence
SELECT 
    'Tous les index' as type,
    indexname as nom_index,
    indexdef as definition
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
ORDER BY indexname;
