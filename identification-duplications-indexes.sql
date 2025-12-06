-- ============================================================================
-- IDENTIFICATION DES DUPLICATIONS D'INDEX SUR notification
-- Analyse des 17 index pour identifier les redondances
-- Date: 2025-12-05
-- ============================================================================

-- ============================================================================
-- 1. DÉTECTION DES INDEX DUPLIQUÉS PAR COLONNE
-- ============================================================================

-- Index sur user_id
SELECT 
    'Duplication user_id' as type,
    indexname as nom_index,
    indexdef as definition,
    CASE 
        WHEN indexname = 'idx_notification_final_user_id' THEN '✅ Garder (index final)'
        WHEN indexname = 'idx_notification_user_id' THEN '⚠️ Possible duplication - Vérifier si redondant avec idx_notification_final_user_id'
        WHEN indexname = 'idx_notification_final_user_id_type' THEN '✅ Garder (composite, plus complet)'
        ELSE 'ℹ️ Autre'
    END as recommandation
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
  AND (
    indexname LIKE '%user_id%'
    OR indexdef LIKE '%user_id%'
  )
ORDER BY 
    CASE 
        WHEN indexname LIKE '%final%' THEN 1
        ELSE 2
    END,
    indexname;

-- Index sur status
SELECT 
    'Duplication status' as type,
    indexname as nom_index,
    indexdef as definition,
    CASE 
        WHEN indexname = 'idx_notification_final_status' THEN '✅ Garder (index final avec WHERE)'
        WHEN indexname = 'idx_notification_status' THEN '⚠️ Possible duplication - Vérifier si redondant avec idx_notification_final_status'
        ELSE 'ℹ️ Autre'
    END as recommandation
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
  AND (
    indexname LIKE '%status%'
    OR indexdef LIKE '%status%'
  )
ORDER BY 
    CASE 
        WHEN indexname LIKE '%final%' THEN 1
        ELSE 2
    END,
    indexname;

-- Index sur user_id + status (composites)
SELECT 
    'Index composites user_id+status' as type,
    indexname as nom_index,
    indexdef as definition,
    CASE 
        WHEN indexname = 'idx_notification_final_user_id_type' THEN '✅ Garder (composite user_id + user_type)'
        WHEN indexname = 'idx_notification_user_status' THEN '⚠️ Possible duplication - Vérifier si redondant avec idx_notification_final_user_id_type'
        ELSE 'ℹ️ Autre'
    END as recommandation
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
  AND (
    indexname LIKE '%user_status%'
    OR (indexdef LIKE '%user_id%' AND indexdef LIKE '%status%')
  )
ORDER BY indexname;

-- ============================================================================
-- 2. COMPARAISON DÉTAILLÉE DES INDEX SIMILAIRES
-- ============================================================================

-- Comparaison idx_notification_user_id vs idx_notification_final_user_id
SELECT 
    'Comparaison user_id' as type,
    'idx_notification_user_id' as index_ancien,
    'idx_notification_final_user_id' as index_final,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_user_id')
        AND EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_user_id')
        THEN '⚠️ Les deux existent - idx_notification_user_id peut être supprimé'
        ELSE '✅ Pas de duplication'
    END as statut,
    'idx_notification_final_user_id_type couvre aussi user_id' as note
UNION ALL
SELECT 
    'Comparaison status',
    'idx_notification_status',
    'idx_notification_final_status',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_status')
        AND EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_status')
        THEN '⚠️ Les deux existent - idx_notification_status peut être supprimé (idx_notification_final_status a WHERE)'
        ELSE '✅ Pas de duplication'
    END,
    'idx_notification_final_status est plus optimisé (index partiel)';

-- ============================================================================
-- 3. RECOMMANDATIONS DE NETTOYAGE
-- ============================================================================

SELECT 
    'Recommandations' as type,
    indexname as index_a_supprimer,
    'Index redondant avec version "final"' as raison,
    CONCAT('DROP INDEX IF EXISTS ', indexname, ';') as commande_sql,
    CASE 
        WHEN indexname = 'idx_notification_user_id' THEN 'Remplacé par idx_notification_final_user_id et idx_notification_final_user_id_type'
        WHEN indexname = 'idx_notification_status' THEN 'Remplacé par idx_notification_final_status (plus optimisé avec WHERE)'
        WHEN indexname = 'idx_notification_user_status' THEN 'Remplacé par idx_notification_final_user_id_type (plus complet)'
        ELSE 'À vérifier manuellement'
    END as remplace_par
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
  AND (
    (indexname = 'idx_notification_user_id' AND EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_user_id'))
    OR (indexname = 'idx_notification_status' AND EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_status'))
    OR (indexname = 'idx_notification_user_status' AND EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_user_id_type'))
  )
ORDER BY indexname;

-- ============================================================================
-- 4. RÉSUMÉ : INDEX PAR CATÉGORIE
-- ============================================================================

SELECT 
    'Résumé par catégorie' as type,
    CASE 
        WHEN indexname LIKE '%final_%' THEN 'Index finaux (nouveau système)'
        WHEN indexname LIKE '%parent%' OR indexname LIKE '%hidden%' OR indexname LIKE '%visible%' OR indexname LIKE '%is_parent%' THEN 'Index notifications groupées'
        WHEN indexname LIKE '%user_id%' OR indexname LIKE '%user_type%' OR indexname LIKE '%user_status%' THEN 'Index utilisateur'
        WHEN indexname LIKE '%status%' THEN 'Index statut'
        WHEN indexname LIKE '%pkey%' THEN 'Contrainte primaire'
        ELSE 'Autre'
    END as categorie,
    COUNT(*) as nombre_index,
    STRING_AGG(indexname, ', ' ORDER BY indexname) as liste_index
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
GROUP BY 
    CASE 
        WHEN indexname LIKE '%final_%' THEN 'Index finaux (nouveau système)'
        WHEN indexname LIKE '%parent%' OR indexname LIKE '%hidden%' OR indexname LIKE '%visible%' OR indexname LIKE '%is_parent%' THEN 'Index notifications groupées'
        WHEN indexname LIKE '%user_id%' OR indexname LIKE '%user_type%' OR indexname LIKE '%user_status%' THEN 'Index utilisateur'
        WHEN indexname LIKE '%status%' THEN 'Index statut'
        WHEN indexname LIKE '%pkey%' THEN 'Contrainte primaire'
        ELSE 'Autre'
    END
ORDER BY 
    CASE 
        WHEN categorie LIKE '%final%' THEN 1
        WHEN categorie LIKE '%groupées%' THEN 2
        WHEN categorie LIKE '%utilisateur%' THEN 3
        WHEN categorie LIKE '%statut%' THEN 4
        WHEN categorie LIKE '%primaire%' THEN 5
        ELSE 6
    END;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
