-- ============================================================================
-- VÉRIFICATION DE LA TABLE AdminNotification RESTAURÉE
-- Comparaison avec les attentes de l'analyse (17 colonnes, 8 index, 3 triggers)
-- Date: 05 Décembre 2025
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION DES COLONNES (15 colonnes actuelles vs 17 attendues)
-- ============================================================================

SELECT 
    'Colonnes actuelles' as type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'AdminNotification' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Colonnes attendues selon l'analyse
WITH colonnes_attendues AS (
    SELECT 'id' as nom, 'UUID PRIMARY KEY' as type_attendu
    UNION ALL SELECT 'type', 'TEXT NOT NULL'
    UNION ALL SELECT 'title', 'TEXT NOT NULL'
    UNION ALL SELECT 'message', 'TEXT NOT NULL'
    UNION ALL SELECT 'status', 'TEXT DEFAULT pending'
    UNION ALL SELECT 'priority', 'TEXT DEFAULT normal'
    UNION ALL SELECT 'metadata', 'JSONB'
    UNION ALL SELECT 'action_url', 'TEXT'
    UNION ALL SELECT 'action_label', 'TEXT'
    UNION ALL SELECT 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    UNION ALL SELECT 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    UNION ALL SELECT 'read_at', 'TIMESTAMP WITH TIME ZONE'
    UNION ALL SELECT 'archived_at', 'TIMESTAMP WITH TIME ZONE'
    UNION ALL SELECT 'handled_by', 'UUID'
    UNION ALL SELECT 'handled_at', 'TIMESTAMP WITH TIME ZONE'
    -- Colonnes supplémentaires possibles
    UNION ALL SELECT 'is_read', 'BOOLEAN'
    UNION ALL SELECT 'admin_notes', 'TEXT'
)
SELECT 
    'Colonnes attendues' as type,
    ca.nom as colonne_attendu,
    ca.type_attendu,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'AdminNotification' 
            AND column_name = ca.nom
        ) THEN '✅ Présente'
        ELSE '❌ MANQUANTE'
    END as statut
FROM colonnes_attendues ca
ORDER BY 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'AdminNotification' 
            AND column_name = ca.nom
        ) THEN 1
        ELSE 0
    END,
    ca.nom;

-- ============================================================================
-- 2. VÉRIFICATION DES INDEX (9 index actuels vs 8 attendus)
-- ============================================================================

SELECT 
    'Index actuels' as type,
    indexname as nom_index,
    indexdef as definition
FROM pg_indexes
WHERE tablename = 'AdminNotification' 
  AND schemaname = 'public'
ORDER BY indexname;

-- Index attendus selon l'analyse (8 index)
WITH index_attendus AS (
    SELECT 'idx_admin_notification_status' as nom
    UNION ALL SELECT 'idx_admin_notification_created_at'
    UNION ALL SELECT 'idx_admin_notification_priority'
    UNION ALL SELECT 'idx_admin_notification_type'
    UNION ALL SELECT 'idx_admin_notification_status_priority'
    -- Index supplémentaires possibles
    UNION ALL SELECT 'idx_admin_notification_handled_by'
    UNION ALL SELECT 'idx_admin_notification_read_at'
    UNION ALL SELECT 'idx_admin_notification_archived_at'
)
SELECT 
    'Index attendus' as type,
    ia.nom as index_attendu,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'AdminNotification' 
            AND indexname = ia.nom
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END as statut
FROM index_attendus ia
ORDER BY 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'AdminNotification' 
            AND indexname = ia.nom
        ) THEN 1
        ELSE 0
    END,
    ia.nom;

-- ============================================================================
-- 3. VÉRIFICATION DES TRIGGERS (2 triggers actuels vs 3 attendus)
-- ============================================================================

SELECT 
    'Triggers actuels' as type,
    t.tgname as nom_trigger,
    pg_get_triggerdef(t.oid) as definition,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✅ Activé'
        ELSE '⚠️ Désactivé'
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'AdminNotification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- Triggers attendus selon l'analyse (3 triggers)
WITH triggers_attendus AS (
    SELECT 'trg_admin_notification_updated_at' as nom, 'Mise à jour automatique de updated_at' as description
    UNION ALL SELECT 'trg_initialize_admin_notification_status', 'Initialisation des statuts dans AdminNotificationStatus'
    UNION ALL SELECT 'trg_admin_notification_validation', 'Validation des données (optionnel)'
)
SELECT 
    'Triggers attendus' as type,
    ta.nom as trigger_attendu,
    ta.description,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'AdminNotification' 
            AND t.tgname = ta.nom
            AND NOT t.tgisinternal
        ) THEN '✅ Présent'
        ELSE '❌ MANQUANT'
    END as statut
FROM triggers_attendus ta
ORDER BY 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'AdminNotification' 
            AND t.tgname = ta.nom
            AND NOT t.tgisinternal
        ) THEN 1
        ELSE 0
    END,
    ta.nom;

-- ============================================================================
-- 4. RÉSUMÉ DES DIFFÉRENCES
-- ============================================================================

SELECT 
    'Résumé' as type,
    'Colonnes' as element,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'AdminNotification' AND table_schema = 'public')::text as valeur_actuelle,
    '17' as valeur_attendue,
    ((SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'AdminNotification' AND table_schema = 'public') - 17)::text as ecart,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'AdminNotification' AND table_schema = 'public') = 17 THEN '✅ Conforme'
        WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'AdminNotification' AND table_schema = 'public') < 17 THEN '⚠️ Manque des colonnes'
        ELSE 'ℹ️ Plus de colonnes que prévu'
    END as statut
UNION ALL
SELECT 
    'Résumé',
    'Index',
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'AdminNotification' AND schemaname = 'public')::text,
    '8',
    ((SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'AdminNotification' AND schemaname = 'public') - 8)::text,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'AdminNotification' AND schemaname = 'public') = 8 THEN '✅ Conforme'
        WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'AdminNotification' AND schemaname = 'public') < 8 THEN '⚠️ Manque des index'
        ELSE 'ℹ️ Plus d''index que prévu (peut être normal avec pkey)'
    END
UNION ALL
SELECT 
    'Résumé',
    'Triggers',
    (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'AdminNotification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal)::text,
    '3',
    ((SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'AdminNotification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) - 3)::text,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'AdminNotification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) = 3 THEN '✅ Conforme'
        WHEN (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'AdminNotification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) < 3 THEN '⚠️ Manque des triggers'
        ELSE 'ℹ️ Plus de triggers que prévu'
    END;

-- ============================================================================
-- 5. IDENTIFICATION DES COLONNES MANQUANTES
-- ============================================================================

SELECT 
    'Colonnes manquantes' as type,
    'is_read' as colonne_manquante,
    'BOOLEAN DEFAULT FALSE' as type_suggere,
    'Colonne pour indiquer si la notification a été lue' as description
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AdminNotification' 
    AND column_name = 'is_read'
)
UNION ALL
SELECT 
    'Colonnes manquantes',
    'admin_notes',
    'TEXT',
    'Notes additionnelles pour les admins'
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AdminNotification' 
    AND column_name = 'admin_notes'
);

-- ============================================================================
-- 6. IDENTIFICATION DES INDEX SUPPLÉMENTAIRES
-- ============================================================================

-- Identifier les index qui ne sont pas dans la liste attendue
SELECT 
    'Index supplémentaires' as type,
    indexname as nom_index,
    indexdef as definition,
    CASE 
        WHEN indexname LIKE '%pkey%' THEN '✅ Contrainte primaire (comptée séparément)'
        WHEN indexname LIKE '%handled_by%' THEN '✅ Index supplémentaire utile'
        WHEN indexname LIKE '%read_at%' THEN '✅ Index supplémentaire utile'
        WHEN indexname LIKE '%archived_at%' THEN '✅ Index supplémentaire utile'
        ELSE 'ℹ️ Index supplémentaire'
    END as commentaire
FROM pg_indexes
WHERE tablename = 'AdminNotification' 
  AND schemaname = 'public'
  AND indexname NOT IN (
    'idx_admin_notification_status',
    'idx_admin_notification_created_at',
    'idx_admin_notification_priority',
    'idx_admin_notification_type',
    'idx_admin_notification_status_priority'
  )
ORDER BY indexname;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
