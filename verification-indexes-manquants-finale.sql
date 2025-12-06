-- ============================================================================
-- VÉRIFICATION FINALE : IDENTIFICATION DES INDEX MANQUANTS
-- Comparaison avec les 16 index attendus selon l'analyse
-- Date: 2025-12-05
-- ============================================================================

-- ============================================================================
-- 1. COMPTAGE ACTUEL
-- ============================================================================

SELECT 
    'Comptage actuel' as type,
    COUNT(*) as total_index,
    CASE 
        WHEN COUNT(*) = 16 THEN '✅ Conforme (16 index)'
        WHEN COUNT(*) < 16 THEN CONCAT('⚠️ Manque ', 16 - COUNT(*), ' index')
        ELSE CONCAT('ℹ️ ', COUNT(*) - 16, ' index de plus')
    END as statut
FROM pg_indexes
WHERE tablename = 'notification' 
  AND schemaname = 'public';

-- ============================================================================
-- 2. LISTE DES INDEX ATTENDUS SELON L'ANALYSE (16 index)
-- ============================================================================

WITH index_attendus AS (
    -- Index finaux (nouveau système)
    SELECT 'idx_notification_final_user_id' as nom, 'Index sur user_id' as description, 'Index final' as categorie
    UNION ALL SELECT 'idx_notification_final_user_type', 'Index sur user_type', 'Index final'
    UNION ALL SELECT 'idx_notification_final_user_id_type', 'Index composite (user_id, user_type)', 'Index final'
    UNION ALL SELECT 'idx_notification_final_is_read', 'Index sur is_read', 'Index final'
    UNION ALL SELECT 'idx_notification_final_created_at', 'Index sur created_at', 'Index final'
    UNION ALL SELECT 'idx_notification_final_notification_type', 'Index sur notification_type', 'Index final'
    UNION ALL SELECT 'idx_notification_final_priority', 'Index sur priority', 'Index final'
    UNION ALL SELECT 'idx_notification_final_status', 'Index sur status', 'Index final'
    UNION ALL SELECT 'idx_notification_final_expires_at', 'Index sur expires_at', 'Index final'
    
    -- Index pour notifications groupées
    UNION ALL SELECT 'idx_notification_parent_id', 'Index sur parent_id', 'Notifications groupées'
    UNION ALL SELECT 'idx_notification_is_parent', 'Index sur is_parent', 'Notifications groupées'
    UNION ALL SELECT 'idx_notification_hidden_in_list', 'Index sur hidden_in_list', 'Notifications groupées'
    UNION ALL SELECT 'idx_notification_visible_list', 'Index composite visible', 'Notifications groupées'
    
    -- Contrainte primaire (comptée dans les 16)
    UNION ALL SELECT 'notification_final_pkey', 'Contrainte primaire (id)', 'Contrainte'
    
    -- Index supplémentaires possibles (pour atteindre 16)
    UNION ALL SELECT 'idx_notification_final_updated_at', 'Index sur updated_at', 'Index final'
    UNION ALL SELECT 'idx_notification_final_archived_at', 'Index sur archived_at', 'Index final'
)
SELECT 
    'Index attendus' as type,
    ia.nom as nom_index,
    ia.description,
    ia.categorie,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'notification' 
            AND indexname = ia.nom
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END as statut
FROM index_attendus ia
ORDER BY 
    CASE 
        WHEN ia.categorie = 'Contrainte' THEN 1
        WHEN ia.categorie = 'Index final' THEN 2
        WHEN ia.categorie = 'Notifications groupées' THEN 3
        ELSE 4
    END,
    ia.nom;

-- ============================================================================
-- 3. INDEX MANQUANTS IDENTIFIÉS
-- ============================================================================

WITH index_attendus AS (
    SELECT 'idx_notification_final_updated_at' as nom
    UNION ALL SELECT 'idx_notification_final_archived_at'
    UNION ALL SELECT 'idx_notification_final_read_at'
    UNION ALL SELECT 'idx_notification_final_dismissed_at'
    UNION ALL SELECT 'idx_notification_final_event_id'
)
SELECT 
    'Index manquants' as type,
    ia.nom as nom_index,
    CASE 
        WHEN ia.nom = 'idx_notification_final_updated_at' THEN 'Index sur updated_at pour requêtes de tri par modification'
        WHEN ia.nom = 'idx_notification_final_archived_at' THEN 'Index sur archived_at pour filtrage des notifications archivées'
        WHEN ia.nom = 'idx_notification_final_read_at' THEN 'Index sur read_at pour requêtes temporelles'
        WHEN ia.nom = 'idx_notification_final_dismissed_at' THEN 'Index sur dismissed_at pour nettoyage'
        WHEN ia.nom = 'idx_notification_final_event_id' THEN 'Index sur event_id pour notifications liées aux événements'
        ELSE 'Index à créer'
    END as description,
    '❌ À créer' as statut
FROM index_attendus ia
WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'notification' 
    AND indexname = ia.nom
)
ORDER BY ia.nom;

-- ============================================================================
-- 4. VÉRIFICATION DES COLONNES POUR DÉTERMINER QUELS INDEX CRÉER
-- ============================================================================

SELECT 
    'Colonnes disponibles' as type,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('updated_at', 'archived_at', 'read_at', 'dismissed_at', 'event_id') 
        AND NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'notification' 
            AND indexname = CONCAT('idx_notification_final_', column_name)
        )
        THEN '❌ Colonne présente mais index manquant'
        WHEN column_name IN ('updated_at', 'archived_at', 'read_at', 'dismissed_at', 'event_id')
        THEN '✅ Colonne et index présents'
        ELSE 'ℹ️ Colonne présente'
    END as statut_index
FROM information_schema.columns
WHERE table_name = 'notification' 
  AND table_schema = 'public'
  AND column_name IN ('updated_at', 'archived_at', 'read_at', 'dismissed_at', 'event_id', 'created_at', 'expires_at')
ORDER BY 
    CASE 
        WHEN column_name = 'created_at' THEN 1
        WHEN column_name = 'updated_at' THEN 2
        WHEN column_name = 'read_at' THEN 3
        WHEN column_name = 'expires_at' THEN 4
        WHEN column_name = 'archived_at' THEN 5
        WHEN column_name = 'dismissed_at' THEN 6
        WHEN column_name = 'event_id' THEN 7
    END;

-- ============================================================================
-- 5. SUGGESTIONS D'INDEX À CRÉER POUR ATTEINDRE 16
-- ============================================================================

-- Vérifier quelles colonnes existent et créer les index correspondants
SELECT 
    'Suggestions' as type,
    CONCAT('CREATE INDEX IF NOT EXISTS idx_notification_final_updated_at ON notification(updated_at) WHERE updated_at IS NOT NULL;') as commande_sql,
    'Index sur updated_at pour tri par date de modification' as description,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'updated_at')
        THEN '✅ Colonne existe - Index recommandé'
        ELSE '❌ Colonne n''existe pas'
    END as statut
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'updated_at')
  AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_updated_at')
UNION ALL
SELECT 
    'Suggestions',
    CONCAT('CREATE INDEX IF NOT EXISTS idx_notification_final_archived_at ON notification(archived_at) WHERE archived_at IS NOT NULL;'),
    'Index sur archived_at pour filtrage des notifications archivées',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'archived_at')
        THEN '✅ Colonne existe - Index recommandé'
        ELSE '❌ Colonne n''existe pas'
    END
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'archived_at')
  AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_archived_at')
UNION ALL
SELECT 
    'Suggestions',
    CONCAT('CREATE INDEX IF NOT EXISTS idx_notification_final_read_at ON notification(read_at) WHERE read_at IS NOT NULL;'),
    'Index sur read_at pour requêtes temporelles',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'read_at')
        THEN '✅ Colonne existe - Index recommandé'
        ELSE '❌ Colonne n''existe pas'
    END
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'read_at')
  AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_read_at')
UNION ALL
SELECT 
    'Suggestions',
    CONCAT('CREATE INDEX IF NOT EXISTS idx_notification_final_dismissed_at ON notification(dismissed_at) WHERE dismissed_at IS NOT NULL;'),
    'Index sur dismissed_at pour nettoyage',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'dismissed_at')
        THEN '✅ Colonne existe - Index recommandé'
        ELSE '❌ Colonne n''existe pas'
    END
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'dismissed_at')
  AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_dismissed_at')
UNION ALL
SELECT 
    'Suggestions',
    CONCAT('CREATE INDEX IF NOT EXISTS idx_notification_final_event_id ON notification(event_id) WHERE event_id IS NOT NULL;'),
    'Index sur event_id pour notifications liées aux événements',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'event_id')
        THEN '✅ Colonne existe - Index recommandé'
        ELSE '❌ Colonne n''existe pas'
    END
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'event_id')
  AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notification' AND indexname = 'idx_notification_final_event_id');

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
