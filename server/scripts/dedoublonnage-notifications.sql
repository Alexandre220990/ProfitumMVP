-- =====================================================
-- SCRIPT DE DÉDOUBLONNAGE DES TABLES DE NOTIFICATIONS
-- Date : 2025-01-05
-- Objectif : Fusionner toutes les tables de notifications vers notification_final
-- =====================================================

-- ===== 1. VÉRIFICATION PRÉALABLE =====
DO $$
DECLARE
    notification_count INTEGER := 0;
    notification_caps_count INTEGER := 0;
    notification_backup_count INTEGER := 0;
    notification_backup_caps_count INTEGER := 0;
    notification_final_count INTEGER := 0;
BEGIN
    -- Compter les enregistrements dans chaque table
    SELECT COUNT(*) INTO notification_count FROM notification;
    SELECT COUNT(*) INTO notification_caps_count FROM "Notification";
    SELECT COUNT(*) INTO notification_backup_count FROM notification_backup;
    SELECT COUNT(*) INTO notification_backup_caps_count FROM "Notification_backup";
    SELECT COUNT(*) INTO notification_final_count FROM notification_final;
    
    RAISE NOTICE '=== ÉTAT AVANT DÉDOUBLONNAGE ===';
    RAISE NOTICE 'notification: % enregistrements', notification_count;
    RAISE NOTICE 'Notification: % enregistrements', notification_caps_count;
    RAISE NOTICE 'notification_backup: % enregistrements', notification_backup_count;
    RAISE NOTICE 'Notification_backup: % enregistrements', notification_backup_caps_count;
    RAISE NOTICE 'notification_final: % enregistrements', notification_final_count;
END $$;

-- ===== 2. MIGRATION DES DONNÉES DE notification (minuscule) =====
-- Cette table a la même structure que notification_final
INSERT INTO notification_final (
    id, user_id, user_type, title, message, notification_type, 
    priority, is_read, read_at, action_url, action_data, 
    expires_at, is_dismissed, dismissed_at, created_at, updated_at
)
SELECT 
    id, user_id, user_type, title, message, notification_type,
    priority, is_read, read_at, action_url, action_data,
    expires_at, is_dismissed, dismissed_at, created_at, updated_at
FROM notification
ON CONFLICT (id) DO NOTHING;

-- ===== 3. MIGRATION DES DONNÉES DE notification_backup =====
-- Cette table a la même structure que notification_final
INSERT INTO notification_final (
    id, user_id, user_type, title, message, notification_type, 
    priority, is_read, read_at, action_url, action_data, 
    expires_at, is_dismissed, dismissed_at, created_at, updated_at
)
SELECT 
    id, user_id, user_type, title, message, notification_type,
    priority, is_read, read_at, action_url, action_data,
    expires_at, is_dismissed, dismissed_at, created_at, updated_at
FROM notification_backup
ON CONFLICT (id) DO NOTHING;

-- ===== 4. MIGRATION DES DONNÉES DE Notification (majuscule) =====
-- Conversion de la structure ancienne vers la nouvelle
INSERT INTO notification_final (
    id, user_id, user_type, title, message, notification_type,
    priority, is_read, read_at, action_url, action_data,
    expires_at, is_dismissed, dismissed_at, created_at, updated_at
)
SELECT 
    gen_random_uuid() as id,
    recipient_id as user_id,
    'client' as user_type, -- Par défaut, à ajuster selon les données
    type_notification as title,
    message,
    type_notification as notification_type,
    'medium' as priority, -- Par défaut
    lu as is_read,
    CASE WHEN lu THEN date_notification ELSE NULL END as read_at,
    NULL as action_url,
    NULL as action_data,
    NULL as expires_at,
    FALSE as is_dismissed,
    NULL as dismissed_at,
    date_notification as created_at,
    date_notification as updated_at
FROM "Notification"
ON CONFLICT (id) DO NOTHING;

-- ===== 5. MIGRATION DES DONNÉES DE Notification_backup (majuscule) =====
-- Conversion de la structure ancienne vers la nouvelle
INSERT INTO notification_final (
    id, user_id, user_type, title, message, notification_type,
    priority, is_read, read_at, action_url, action_data,
    expires_at, is_dismissed, dismissed_at, created_at, updated_at
)
SELECT 
    gen_random_uuid() as id,
    recipient_id as user_id,
    'client' as user_type, -- Par défaut, à ajuster selon les données
    type_notification as title,
    message,
    type_notification as notification_type,
    'medium' as priority, -- Par défaut
    lu as is_read,
    CASE WHEN lu THEN date_notification ELSE NULL END as read_at,
    NULL as action_url,
    NULL as action_data,
    NULL as expires_at,
    FALSE as is_dismissed,
    NULL as dismissed_at,
    date_notification as created_at,
    date_notification as updated_at
FROM "Notification_backup"
ON CONFLICT (id) DO NOTHING;

-- ===== 6. VÉRIFICATION POST-MIGRATION =====
DO $$
DECLARE
    final_count INTEGER := 0;
    total_expected INTEGER := 0;
    notification_count INTEGER := 0;
    notification_caps_count INTEGER := 0;
    notification_backup_count INTEGER := 0;
    notification_backup_caps_count INTEGER := 0;
BEGIN
    -- Compter les enregistrements finaux
    SELECT COUNT(*) INTO final_count FROM notification_final;
    
    -- Compter les enregistrements dans les tables sources
    SELECT COUNT(*) INTO notification_count FROM notification;
    SELECT COUNT(*) INTO notification_caps_count FROM "Notification";
    SELECT COUNT(*) INTO notification_backup_count FROM notification_backup;
    SELECT COUNT(*) INTO notification_backup_caps_count FROM "Notification_backup";
    
    total_expected := notification_count + notification_caps_count + 
                     notification_backup_count + notification_backup_caps_count;
    
    RAISE NOTICE '=== ÉTAT APRÈS MIGRATION ===';
    RAISE NOTICE 'notification_final: % enregistrements', final_count;
    RAISE NOTICE 'Total attendu: % enregistrements', total_expected;
    RAISE NOTICE 'Différence (doublons supprimés): % enregistrements', total_expected - final_count;
END $$;

-- ===== 7. NETTOYAGE DES TABLES DOUBLONS =====
-- ATTENTION: À exécuter seulement après vérification des données

-- DROP TABLE IF EXISTS notification;
-- DROP TABLE IF EXISTS "Notification";
-- DROP TABLE IF EXISTS notification_backup;
-- DROP TABLE IF EXISTS "Notification_backup";

-- ===== 8. RENOMMAGE DE notification_final EN notification =====
-- ATTENTION: À exécuter seulement après vérification des données

-- ALTER TABLE notification_final RENAME TO notification;

-- ===== 9. VÉRIFICATION FINALE =====
DO $$
DECLARE
    final_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO final_count FROM notification_final;
    RAISE NOTICE '=== VÉRIFICATION FINALE ===';
    RAISE NOTICE 'Total enregistrements dans notification_final: %', final_count;
END $$; 