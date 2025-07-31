-- =====================================================
-- SUPPRESSION DES TABLES DOUBLONS ET OBSOLÈTES
-- Date : 2025-01-05
-- Objectif : Nettoyer la base de données après migration
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
    
    RAISE NOTICE '=== ÉTAT AVANT SUPPRESSION ===';
    RAISE NOTICE 'notification: % enregistrements', notification_count;
    RAISE NOTICE 'Notification: % enregistrements', notification_caps_count;
    RAISE NOTICE 'notification_backup: % enregistrements', notification_backup_count;
    RAISE NOTICE 'Notification_backup: % enregistrements', notification_backup_caps_count;
    RAISE NOTICE 'notification_final: % enregistrements', notification_final_count;
    
    -- Vérifier que notification_final contient bien les données
    IF notification_final_count > 0 THEN
        RAISE NOTICE '✅ notification_final contient des données - OK pour suppression';
    ELSE
        RAISE NOTICE '❌ ATTENTION: notification_final est vide - Vérifier la migration';
    END IF;
END $$;

-- ===== 2. SUPPRESSION DES TABLES DE NOTIFICATIONS DOUBLONS =====

-- Suppression de la table notification (minuscule) - remplacée par notification_final
DROP TABLE IF EXISTS notification CASCADE;

-- Suppression de la table Notification (majuscule) - structure ancienne
DROP TABLE IF EXISTS "Notification" CASCADE;

-- Suppression de la table notification_backup - copie devenue inutile
DROP TABLE IF EXISTS notification_backup CASCADE;

-- Suppression de la table Notification_backup - copie devenue inutile
DROP TABLE IF EXISTS "Notification_backup" CASCADE;

-- ===== 3. RENOMMAGE DE notification_final EN notification =====
ALTER TABLE notification_final RENAME TO notification;

-- ===== 4. SUPPRESSION DES AUTRES TABLES DOUBLONS IDENTIFIÉES =====

-- Suppression des tables de documents doublons
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "DocumentFile" CASCADE;
DROP TABLE IF EXISTS "DocumentFileAccessLog" CASCADE;
DROP TABLE IF EXISTS "DocumentFilePermission" CASCADE;
DROP TABLE IF EXISTS "DocumentFileShare" CASCADE;
DROP TABLE IF EXISTS "DocumentFileVersion" CASCADE;
DROP TABLE IF EXISTS "DocumentShare" CASCADE;

-- Suppression des tables d'audit doublons
DROP TABLE IF EXISTS "AdminAuditLog" CASCADE;
DROP TABLE IF EXISTS "DocumentAuditLog" CASCADE;

-- Suppression des tables d'assignation doublons
DROP TABLE IF EXISTS "ExpertAssignment" CASCADE;

-- Suppression des tables de questions doublons
DROP TABLE IF EXISTS "Question_VERSION_FINALE_60Q" CASCADE;

-- Suppression des tables de compliance doublons
DROP TABLE IF EXISTS "compliancereport" CASCADE;
DROP TABLE IF EXISTS "securityincident" CASCADE;

-- Suppression des tables de messages doublons
DROP TABLE IF EXISTS "message_notifications" CASCADE;

-- ===== 5. SUPPRESSION DES TABLES TEMPORAIRES =====

-- Tables de test ou temporaires
DROP TABLE IF EXISTS "temporaryclient" CASCADE;
DROP TABLE IF EXISTS "TemporarySimulationSession" CASCADE;

-- ===== 6. SUPPRESSION DES TABLES OBSOLÈTES =====

-- Tables de simulation obsolètes
DROP TABLE IF EXISTS "chatbotsimulation" CASCADE;

-- Tables de plan obsolètes
DROP TABLE IF EXISTS "Plan" CASCADE;

-- Tables de réponse obsolètes
DROP TABLE IF EXISTS "Reponse" CASCADE;

-- ===== 7. VÉRIFICATION POST-SUPPRESSION =====
DO $$
DECLARE
    final_notification_count INTEGER := 0;
    tables_supprimees TEXT[] := ARRAY[
        'notification', 'Notification', 'notification_backup', 'Notification_backup',
        'Document', 'DocumentFile', 'DocumentFileAccessLog', 'DocumentFilePermission',
        'DocumentFileShare', 'DocumentFileVersion', 'DocumentShare',
        'AdminAuditLog', 'DocumentAuditLog', 'ExpertAssignment',
        'Question_VERSION_FINALE_60Q', 'compliancereport', 'securityincident',
        'message_notifications', 'temporaryclient', 'TemporarySimulationSession',
        'chatbotsimulation', 'Plan', 'Reponse'
    ];
    current_table_name TEXT;
    table_exists BOOLEAN;
BEGIN
    -- Vérifier que notification_final a bien été renommé en notification
    SELECT COUNT(*) INTO final_notification_count FROM notification;
    RAISE NOTICE '=== ÉTAT APRÈS SUPPRESSION ===';
    RAISE NOTICE 'notification (renommé): % enregistrements', final_notification_count;
    
    -- Vérifier que les tables ont bien été supprimées
    RAISE NOTICE '=== VÉRIFICATION DES SUPPRESSIONS ===';
    FOREACH current_table_name IN ARRAY tables_supprimees
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND information_schema.tables.table_name = current_table_name
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '❌ % existe encore', current_table_name;
        ELSE
            RAISE NOTICE '✅ % supprimée avec succès', current_table_name;
        END IF;
    END LOOP;
END $$;

-- ===== 8. RÉINDEXATION ET OPTIMISATION =====
-- Reindexer les tables restantes pour optimiser les performances
REINDEX TABLE notification;
REINDEX TABLE "Client";
REINDEX TABLE "Expert";
REINDEX TABLE conversations;
REINDEX TABLE messages;

-- ===== 9. VÉRIFICATION FINALE =====
DO $$
DECLARE
    total_tables INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO total_tables 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    RAISE NOTICE '=== VÉRIFICATION FINALE ===';
    RAISE NOTICE 'Nombre total de tables restantes: %', total_tables;
    RAISE NOTICE '✅ Nettoyage terminé avec succès';
END $$; 