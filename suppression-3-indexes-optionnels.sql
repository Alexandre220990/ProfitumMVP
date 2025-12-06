-- ============================================================================
-- SUPPRESSION DES 3 INDEX OPTIONNELS POUR REVENIR À 16 INDEX
-- Supprime les index supplémentaires pour se conformer à l'analyse
-- Date: 2025-12-05
-- ============================================================================
-- NOTE : Actuellement 19 index, objectif 16 index
-- Les 3 index optionnels à supprimer sont :
-- - idx_notification_final_read_at
-- - idx_notification_final_dismissed_at
-- - idx_notification_final_event_id
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. SUPPRESSION DE idx_notification_final_read_at
-- ============================================================================
-- Raison : Index optionnel, moins utilisé que updated_at
-- L'index sur updated_at couvre déjà la plupart des besoins temporels
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'notification' 
        AND indexname = 'idx_notification_final_read_at'
    ) THEN
        DROP INDEX IF EXISTS idx_notification_final_read_at;
        RAISE NOTICE '✅ Index idx_notification_final_read_at supprimé';
    ELSE
        RAISE NOTICE 'ℹ️ Index idx_notification_final_read_at n''existe pas';
    END IF;
END $$;

-- ============================================================================
-- 2. SUPPRESSION DE idx_notification_final_dismissed_at
-- ============================================================================
-- Raison : Index optionnel, moins utilisé que archived_at
-- L'index sur archived_at couvre déjà la plupart des besoins de nettoyage
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'notification' 
        AND indexname = 'idx_notification_final_dismissed_at'
    ) THEN
        DROP INDEX IF EXISTS idx_notification_final_dismissed_at;
        RAISE NOTICE '✅ Index idx_notification_final_dismissed_at supprimé';
    ELSE
        RAISE NOTICE 'ℹ️ Index idx_notification_final_dismissed_at n''existe pas';
    END IF;
END $$;

-- ============================================================================
-- 3. SUPPRESSION DE idx_notification_final_event_id
-- ============================================================================
-- Raison : Index optionnel, peut être recréé plus tard si nécessaire
-- Les requêtes sur event_id peuvent utiliser d'autres index existants
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'notification' 
        AND indexname = 'idx_notification_final_event_id'
    ) THEN
        DROP INDEX IF EXISTS idx_notification_final_event_id;
        RAISE NOTICE '✅ Index idx_notification_final_event_id supprimé';
    ELSE
        RAISE NOTICE 'ℹ️ Index idx_notification_final_event_id n''existe pas';
    END IF;
END $$;

-- ============================================================================
-- VÉRIFICATION : Comptage des index après suppression
-- ============================================================================

DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'notification' 
    AND schemaname = 'public';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Nombre total d''index sur notification : %', index_count;
    RAISE NOTICE '========================================';
    
    IF index_count = 16 THEN
        RAISE NOTICE '✅ PARFAIT : Exactement 16 index (conforme à l''analyse)';
    ELSIF index_count > 16 THEN
        RAISE NOTICE '⚠️ % index - Il reste encore % index de plus que l''objectif', index_count, (index_count - 16);
    ELSE
        RAISE NOTICE '⚠️ % index - Il manque % index pour atteindre 16', index_count, (16 - index_count);
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================
-- VÉRIFICATION FINALE : Liste des index restants
-- ============================================================================

SELECT 
    'Index restants' as type,
    COUNT(*) as total_index,
    CASE 
        WHEN COUNT(*) = 16 THEN '✅ Conforme (16 index)'
        WHEN COUNT(*) < 16 THEN CONCAT('⚠️ Manque ', 16 - COUNT(*), ' index')
        ELSE CONCAT('ℹ️ ', COUNT(*), ' index (objectif: 16)')
    END as statut
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public';

-- Liste détaillée des index supprimés (vérification)
SELECT 
    'Index supprimés' as type,
    'idx_notification_final_read_at' as nom_index,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_read_at')
        THEN '✅ Supprimé'
        ELSE '❌ Encore présent'
    END as statut
UNION ALL
SELECT 
    'Index supprimés',
    'idx_notification_final_dismissed_at',
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_dismissed_at')
        THEN '✅ Supprimé'
        ELSE '❌ Encore présent'
    END
UNION ALL
SELECT 
    'Index supprimés',
    'idx_notification_final_event_id',
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_event_id')
        THEN '✅ Supprimé'
        ELSE '❌ Encore présent'
    END;

-- ============================================================================
-- LISTE COMPLÈTE DES INDEX RESTANTS (16 index attendus)
-- ============================================================================

SELECT 
    'Liste complète' as type,
    indexname as nom_index,
    indexdef as definition
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public'
ORDER BY 
    CASE 
        WHEN indexname LIKE '%final_%' THEN 1
        WHEN indexname LIKE '%parent%' OR indexname LIKE '%hidden%' OR indexname LIKE '%visible%' THEN 2
        WHEN indexname LIKE '%pkey%' THEN 3
        ELSE 4
    END,
    indexname;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
