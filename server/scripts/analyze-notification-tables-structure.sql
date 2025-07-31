-- =====================================================
-- ANALYSE DE LA STRUCTURE DES TABLES DE NOTIFICATIONS
-- Date : 2025-01-05
-- Objectif : Analyser la structure exacte des tables de notifications
-- =====================================================

-- ===== 1. ANALYSE DE LA TABLE notification =====
SELECT 
    'notification' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notification'
ORDER BY ordinal_position;

-- ===== 2. ANALYSE DE LA TABLE Notification =====
SELECT 
    'Notification' as table_name,   
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Notification'
ORDER BY ordinal_position;

-- ===== 3. ANALYSE DE LA TABLE notification_backup =====
SELECT 
    'notification_backup' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notification_backup'
ORDER BY ordinal_position;

-- ===== 4. ANALYSE DE LA TABLE Notification_backup =====
SELECT 
    'Notification_backup' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Notification_backup'
ORDER BY ordinal_position;

-- ===== 5. ANALYSE DE LA TABLE notification_final =====
SELECT 
    'notification_final' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notification_final'
ORDER BY ordinal_position;

-- ===== 6. COMPARAISON DES STRUCTURES =====
SELECT 
    'notification' as source_table,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notification'
UNION ALL
SELECT 
    'Notification' as source_table,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Notification'
UNION ALL
SELECT 
    'notification_backup' as source_table,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notification_backup'
UNION ALL
SELECT 
    'Notification_backup' as source_table,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Notification_backup'
UNION ALL
SELECT 
    'notification_final' as source_table,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notification_final'
ORDER BY source_table, ordinal_position;

-- ===== 7. VÉRIFICATION DE L'EXISTENCE =====
DO $$
DECLARE
    notification_exists BOOLEAN;
    notification_caps_exists BOOLEAN;
    notification_backup_exists BOOLEAN;
    notification_backup_caps_exists BOOLEAN;
    notification_final_exists BOOLEAN;
    notification_count INTEGER := 0;
    notification_caps_count INTEGER := 0;
    notification_backup_count INTEGER := 0;
    notification_backup_caps_count INTEGER := 0;
    notification_final_count INTEGER := 0;
BEGIN
    -- Vérifier l'existence des tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notification'
    ) INTO notification_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Notification'
    ) INTO notification_caps_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notification_backup'
    ) INTO notification_backup_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Notification_backup'
    ) INTO notification_backup_caps_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notification_final'
    ) INTO notification_final_exists;
    
    -- Compter les enregistrements
    IF notification_exists THEN
        SELECT COUNT(*) INTO notification_count FROM notification;
    END IF;
    
    IF notification_caps_exists THEN
        SELECT COUNT(*) INTO notification_caps_count FROM "Notification";
    END IF;
    
    IF notification_backup_exists THEN
        SELECT COUNT(*) INTO notification_backup_count FROM notification_backup;
    END IF;
    
    IF notification_backup_caps_exists THEN
        SELECT COUNT(*) INTO notification_backup_caps_count FROM "Notification_backup";
    END IF;
    
    IF notification_final_exists THEN
        SELECT COUNT(*) INTO notification_final_count FROM notification_final;
    END IF;
    
    RAISE NOTICE '=== ANALYSE DES TABLES DE NOTIFICATIONS ===';
    RAISE NOTICE 'notification: % enregistrements', notification_count;
    RAISE NOTICE 'Notification: % enregistrements', notification_caps_count;
    RAISE NOTICE 'notification_backup: % enregistrements', notification_backup_count;
    RAISE NOTICE 'Notification_backup: % enregistrements', notification_backup_caps_count;
    RAISE NOTICE 'notification_final: % enregistrements', notification_final_count;
END $$; 