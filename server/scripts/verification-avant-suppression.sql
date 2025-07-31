-- =====================================================
-- VÉRIFICATION AVANT SUPPRESSION DES TABLES DOUBLONS
-- Date : 2025-01-05
-- Objectif : Vérifier l'intégrité des données avant suppression
-- =====================================================

-- ===== 1. VÉRIFICATION DES NOTIFICATIONS =====
DO $$
DECLARE
    notification_count INTEGER := 0;
    notification_caps_count INTEGER := 0;
    notification_backup_count INTEGER := 0;
    notification_backup_caps_count INTEGER := 0;
    notification_final_count INTEGER := 0;
    total_expected INTEGER := 0;
BEGIN
    -- Compter les enregistrements dans chaque table
    SELECT COUNT(*) INTO notification_count FROM notification;
    SELECT COUNT(*) INTO notification_caps_count FROM "Notification";
    SELECT COUNT(*) INTO notification_backup_count FROM notification_backup;
    SELECT COUNT(*) INTO notification_backup_caps_count FROM "Notification_backup";
    SELECT COUNT(*) INTO notification_final_count FROM notification_final;
    
    total_expected := notification_count + notification_caps_count + 
                     notification_backup_count + notification_backup_caps_count;
    
    RAISE NOTICE '=== VÉRIFICATION DES NOTIFICATIONS ===';
    RAISE NOTICE 'notification: % enregistrements', notification_count;
    RAISE NOTICE 'Notification: % enregistrements', notification_caps_count;
    RAISE NOTICE 'notification_backup: % enregistrements', notification_backup_count;
    RAISE NOTICE 'Notification_backup: % enregistrements', notification_backup_caps_count;
    RAISE NOTICE 'notification_final: % enregistrements', notification_final_count;
    RAISE NOTICE 'Total attendu: % enregistrements', total_expected;
    
    IF notification_final_count >= total_expected THEN
        RAISE NOTICE '✅ Toutes les données sont migrées - OK pour suppression';
    ELSE
        RAISE NOTICE '❌ ATTENTION: Données manquantes dans notification_final';
        RAISE NOTICE 'Différence: % enregistrements', total_expected - notification_final_count;
    END IF;
END $$;

-- ===== 2. VÉRIFICATION DES DOCUMENTS =====
DO $$
DECLARE
    document_count INTEGER := 0;
    documentfile_count INTEGER := 0;
    geddocument_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO document_count FROM "Document";
    SELECT COUNT(*) INTO documentfile_count FROM "DocumentFile";
    SELECT COUNT(*) INTO geddocument_count FROM "GEDDocument";
    
    RAISE NOTICE '=== VÉRIFICATION DES DOCUMENTS ===';
    RAISE NOTICE 'Document: % enregistrements', document_count;
    RAISE NOTICE 'DocumentFile: % enregistrements', documentfile_count;
    RAISE NOTICE 'GEDDocument: % enregistrements', geddocument_count;
    
    IF document_count = 0 AND documentfile_count = 0 THEN
        RAISE NOTICE '✅ Tables Document vides - OK pour suppression';
    ELSE
        RAISE NOTICE '⚠️ ATTENTION: Données dans les tables Document';
    END IF;
END $$;

-- ===== 3. VÉRIFICATION DES AUDITS =====
DO $$
DECLARE
    adminaudit_count INTEGER := 0;
    documentaudit_count INTEGER := 0;
    audit_logs_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO adminaudit_count FROM "AdminAuditLog";
    SELECT COUNT(*) INTO documentaudit_count FROM "DocumentAuditLog";
    SELECT COUNT(*) INTO audit_logs_count FROM audit_logs;
    
    RAISE NOTICE '=== VÉRIFICATION DES AUDITS ===';
    RAISE NOTICE 'AdminAuditLog: % enregistrements', adminaudit_count;
    RAISE NOTICE 'DocumentAuditLog: % enregistrements', documentaudit_count;
    RAISE NOTICE 'audit_logs: % enregistrements', audit_logs_count;
    
    IF adminaudit_count = 0 AND documentaudit_count = 0 THEN
        RAISE NOTICE '✅ Tables Audit vides - OK pour suppression';
    ELSE
        RAISE NOTICE '⚠️ ATTENTION: Données dans les tables Audit';
    END IF;
END $$;

-- ===== 4. VÉRIFICATION DES QUESTIONS =====
DO $$
DECLARE
    question_count INTEGER := 0;
    question_finale_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO question_count FROM "Question";
    SELECT COUNT(*) INTO question_finale_count FROM "Question_VERSION_FINALE_60Q";
    
    RAISE NOTICE '=== VÉRIFICATION DES QUESTIONS ===';
    RAISE NOTICE 'Question: % enregistrements', question_count;
    RAISE NOTICE 'Question_VERSION_FINALE_60Q: % enregistrements', question_finale_count;
    
    IF question_finale_count > question_count THEN
        RAISE NOTICE '⚠️ ATTENTION: Question_VERSION_FINALE_60Q contient plus de données';
    ELSE
        RAISE NOTICE '✅ Question_VERSION_FINALE_60Q peut être supprimée';
    END IF;
END $$;

-- ===== 5. VÉRIFICATION DES COMPLIANCE =====
DO $$
DECLARE
    compliancereport_count INTEGER := 0;
    compliance_reports_count INTEGER := 0;
    securityincident_count INTEGER := 0;
    security_incidents_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO compliancereport_count FROM "compliancereport";
    SELECT COUNT(*) INTO compliance_reports_count FROM compliance_reports;
    SELECT COUNT(*) INTO securityincident_count FROM "securityincident";
    SELECT COUNT(*) INTO security_incidents_count FROM security_incidents;
    
    RAISE NOTICE '=== VÉRIFICATION DES COMPLIANCE ===';
    RAISE NOTICE 'compliancereport: % enregistrements', compliancereport_count;
    RAISE NOTICE 'compliance_reports: % enregistrements', compliance_reports_count;
    RAISE NOTICE 'securityincident: % enregistrements', securityincident_count;
    RAISE NOTICE 'security_incidents: % enregistrements', security_incidents_count;
    
    IF compliancereport_count = 0 AND securityincident_count = 0 THEN
        RAISE NOTICE '✅ Tables compliance obsolètes vides - OK pour suppression';
    ELSE
        RAISE NOTICE '⚠️ ATTENTION: Données dans les tables compliance obsolètes';
    END IF;
END $$;

-- ===== 6. VÉRIFICATION DES MESSAGES =====
DO $$
DECLARE
    message_notifications_count INTEGER := 0;
    messages_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO message_notifications_count FROM "message_notifications";
    SELECT COUNT(*) INTO messages_count FROM messages;
    
    RAISE NOTICE '=== VÉRIFICATION DES MESSAGES ===';
    RAISE NOTICE 'message_notifications: % enregistrements', message_notifications_count;
    RAISE NOTICE 'messages: % enregistrements', messages_count;
    
    IF message_notifications_count = 0 THEN
        RAISE NOTICE '✅ message_notifications vide - OK pour suppression';
    ELSE
        RAISE NOTICE '⚠️ ATTENTION: Données dans message_notifications';
    END IF;
END $$;

-- ===== 7. RÉSUMÉ FINAL =====
DO $$
DECLARE
    total_tables INTEGER := 0;
    tables_a_supprimer INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO total_tables 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    -- Compter les tables à supprimer
    SELECT COUNT(*) INTO tables_a_supprimer
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    AND table_name IN (
        'notification', 'Notification', 'notification_backup', 'Notification_backup',
        'Document', 'DocumentFile', 'DocumentFileAccessLog', 'DocumentFilePermission',
        'DocumentFileShare', 'DocumentFileVersion', 'DocumentShare',
        'AdminAuditLog', 'DocumentAuditLog', 'ExpertAssignment',
        'Question_VERSION_FINALE_60Q', 'compliancereport', 'securityincident',
        'message_notifications', 'temporaryclient', 'TemporarySimulationSession',
        'chatbotsimulation', 'Plan', 'Reponse'
    );
    
    RAISE NOTICE '=== RÉSUMÉ FINAL ===';
    RAISE NOTICE 'Total tables actuelles: %', total_tables;
    RAISE NOTICE 'Tables à supprimer: %', tables_a_supprimer;
    RAISE NOTICE 'Tables restantes après nettoyage: %', total_tables - tables_a_supprimer;
    
    IF tables_a_supprimer > 0 THEN
        RAISE NOTICE '✅ Prêt pour le nettoyage - Exécuter suppression-tables-doublons.sql';
    ELSE
        RAISE NOTICE 'ℹ️ Aucune table à supprimer';
    END IF;
END $$; 