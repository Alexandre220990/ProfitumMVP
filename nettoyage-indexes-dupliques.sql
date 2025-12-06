-- ============================================================================
-- NETTOYAGE DES INDEX DUPLIQUÉS SUR notification
-- Supprime les index redondants avec les versions "final"
-- Date: 2025-12-05
-- ============================================================================
-- ATTENTION : Exécuter d'abord identification-duplications-indexes.sql
-- pour vérifier quels index peuvent être supprimés en toute sécurité
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. SUPPRESSION DE idx_notification_user_id
-- ============================================================================
-- Raison : Remplacé par idx_notification_final_user_id 
--          et couvert par idx_notification_final_user_id_type (composite)
-- Vérification : S'assurer que idx_notification_final_user_id existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'notification' 
        AND indexname = 'idx_notification_final_user_id'
    ) THEN
        DROP INDEX IF EXISTS idx_notification_user_id;
        RAISE NOTICE '✅ Index idx_notification_user_id supprimé (remplacé par version final)';
    ELSE
        RAISE WARNING '⚠️ idx_notification_final_user_id n''existe pas - Conservation de idx_notification_user_id';
    END IF;
END $$;

-- ============================================================================
-- 2. SUPPRESSION DE idx_notification_status
-- ============================================================================
-- Raison : Remplacé par idx_notification_final_status (index partiel avec WHERE, plus optimisé)
-- Vérification : S'assurer que idx_notification_final_status existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'notification' 
        AND indexname = 'idx_notification_final_status'
    ) THEN
        DROP INDEX IF EXISTS idx_notification_status;
        RAISE NOTICE '✅ Index idx_notification_status supprimé (remplacé par version final optimisée)';
    ELSE
        RAISE WARNING '⚠️ idx_notification_final_status n''existe pas - Conservation de idx_notification_status';
    END IF;
END $$;

-- ============================================================================
-- 3. SUPPRESSION DE idx_notification_user_status
-- ============================================================================
-- Raison : Remplacé par idx_notification_final_user_id_type (composite user_id + user_type, plus complet)
-- Note : idx_notification_user_status est sur (user_id, status)
--        idx_notification_final_user_id_type est sur (user_id, user_type)
--        Ces index ne sont pas exactement identiques, mais idx_notification_final_user_id_type
--        peut couvrir la plupart des cas d'usage de idx_notification_user_status
-- Vérification : S'assurer que idx_notification_final_user_id_type existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'notification' 
        AND indexname = 'idx_notification_final_user_id_type'
    ) THEN
        -- Vérifier si idx_notification_user_status est vraiment redondant
        -- Si vous utilisez beaucoup de requêtes avec (user_id, status), gardez cet index
        -- Sinon, supprimez-le
        DROP INDEX IF EXISTS idx_notification_user_status;
        RAISE NOTICE '✅ Index idx_notification_user_status supprimé (remplacé par idx_notification_final_user_id_type)';
        RAISE NOTICE 'ℹ️ Note: Si vous avez des requêtes fréquentes avec (user_id, status), recréez un index spécifique';
    ELSE
        RAISE WARNING '⚠️ idx_notification_final_user_id_type n''existe pas - Conservation de idx_notification_user_status';
    END IF;
END $$;

-- ============================================================================
-- VÉRIFICATION : Comptage des index après nettoyage
-- ============================================================================

DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'notification' 
    AND schemaname = 'public';
    
    RAISE NOTICE 'Nombre total d''index sur notification après nettoyage : %', index_count;
    
    IF index_count = 16 THEN
        RAISE NOTICE '✅ Parfait : Exactement 16 index (conforme à l''analyse)';
    ELSIF index_count < 16 THEN
        RAISE NOTICE '⚠️ Il manque % index', (16 - index_count);
    ELSE
        RAISE NOTICE 'ℹ️ % index (objectif: 16)', index_count;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- VÉRIFICATION FINALE : Liste des index restants
-- ============================================================================

SELECT 
    'Index restants' as type,
    COUNT(*) as total_index,
    'Index après nettoyage' as description
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public';

-- Liste détaillée
SELECT 
    'Détail index' as type,
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
