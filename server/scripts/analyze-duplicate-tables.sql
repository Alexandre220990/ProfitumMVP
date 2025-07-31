-- =====================================================
-- DIAGNOSTIC DES TABLES EN DOUBLE
-- Date : 2025-01-05
-- Objectif : Analyser la structure réelle des tables en double
-- =====================================================

-- ===== 1. VÉRIFICATION DE L'EXISTENCE DES TABLES =====

-- Tables documentaires
SELECT 
    'Documentaires' as category,
    t.table_name,
    CASE 
        WHEN ist.table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'N''EXISTE PAS'
    END as status
FROM (
    SELECT 'DocumentFile' as table_name
    UNION ALL SELECT 'documentfile'
    UNION ALL SELECT 'DocumentFileAccessLog'
    UNION ALL SELECT 'documentfileaccesslog'
    UNION ALL SELECT 'DocumentFilePermission'
    UNION ALL SELECT 'documentfilepermission'
    UNION ALL SELECT 'DocumentFileShare'
    UNION ALL SELECT 'documentfileshare'
    UNION ALL SELECT 'DocumentFileVersion'
    UNION ALL SELECT 'documentfileversion'
    UNION ALL SELECT 'DocumentShare'
    UNION ALL SELECT 'documentshare'
) t
LEFT JOIN information_schema.tables ist ON ist.table_name = t.table_name
WHERE ist.table_schema = 'public'
ORDER BY category, t.table_name;

-- Tables de messagerie
SELECT 
    'Messagerie' as category,
    t.table_name,
    CASE 
        WHEN ist.table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'N''EXISTE PAS'
    END as status
FROM (
    SELECT 'message' as table_name
    UNION ALL SELECT 'messages'
    UNION ALL SELECT 'Conversation'
    UNION ALL SELECT 'conversations'
) t
LEFT JOIN information_schema.tables ist ON ist.table_name = t.table_name
WHERE ist.table_schema = 'public'
ORDER BY category, t.table_name;

-- Tables de notifications
SELECT 
    'Notifications' as category,
    t.table_name,
    CASE 
        WHEN ist.table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'N''EXISTE PAS'
    END as status
FROM (
    SELECT 'notification' as table_name
    UNION ALL SELECT 'Notification'
    UNION ALL SELECT 'notification_backup'
    UNION ALL SELECT 'Notification_backup'
    UNION ALL SELECT 'notification_final'
) t
LEFT JOIN information_schema.tables ist ON ist.table_name = t.table_name
WHERE ist.table_schema = 'public'
ORDER BY category, t.table_name;

-- Tables d'audit
SELECT 
    'Audit' as category,
    t.table_name,
    CASE 
        WHEN ist.table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'N''EXISTE PAS'
    END as status
FROM (
    SELECT 'auditlog' as table_name
    UNION ALL SELECT 'audit_logs'
    UNION ALL SELECT 'DocumentAuditLog'
    UNION ALL SELECT 'DocumentFileAccessLog'
) t
LEFT JOIN information_schema.tables ist ON ist.table_name = t.table_name
WHERE ist.table_schema = 'public'
ORDER BY category, t.table_name;

-- ===== 2. ANALYSE DE LA STRUCTURE DES TABLES EXISTANTES =====

-- Structure des tables documentaires existantes
SELECT 
    'DocumentFile' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'DocumentFile'
ORDER BY ordinal_position;

SELECT 
    'documentfile' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'documentfile'
ORDER BY ordinal_position;

-- Structure des tables de messagerie existantes
SELECT 
    'message' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'message'
ORDER BY ordinal_position;

SELECT 
    'messages' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;

-- Structure des tables de notifications existantes
SELECT 
    'notification' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notification'
ORDER BY ordinal_position;

SELECT 
    'Notification' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Notification'
ORDER BY ordinal_position;

-- Structure des tables d'audit existantes
SELECT 
    'audit_logs' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'audit_logs'
ORDER BY ordinal_position;

SELECT 
    'auditlog' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'auditlog'
ORDER BY ordinal_position;

-- ===== 3. COMPTAGE DES ENREGISTREMENTS =====

-- Compter les enregistrements dans chaque table existante (avec vérification)
DO $$
DECLARE
    table_exists BOOLEAN;
    record_count INTEGER;
BEGIN
    -- DocumentFile
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'DocumentFile'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO record_count FROM "DocumentFile";
        RAISE NOTICE 'DocumentFile: % enregistrements', record_count;
    ELSE
        RAISE NOTICE 'DocumentFile: TABLE N''EXISTE PAS';
    END IF;
    
    -- documentfile
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'documentfile'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO record_count FROM documentfile;
        RAISE NOTICE 'documentfile: % enregistrements', record_count;
    ELSE
        RAISE NOTICE 'documentfile: TABLE N''EXISTE PAS';
    END IF;
    
    -- message
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'message'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO record_count FROM message;
        RAISE NOTICE 'message: % enregistrements', record_count;
    ELSE
        RAISE NOTICE 'message: TABLE N''EXISTE PAS';
    END IF;
    
    -- messages
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO record_count FROM messages;
        RAISE NOTICE 'messages: % enregistrements', record_count;
    ELSE
        RAISE NOTICE 'messages: TABLE N''EXISTE PAS';
    END IF;
    
    -- notification
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notification'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO record_count FROM notification;
        RAISE NOTICE 'notification: % enregistrements', record_count;
    ELSE
        RAISE NOTICE 'notification: TABLE N''EXISTE PAS';
    END IF;
    
    -- Notification
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Notification'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO record_count FROM "Notification";
        RAISE NOTICE 'Notification: % enregistrements', record_count;
    ELSE
        RAISE NOTICE 'Notification: TABLE N''EXISTE PAS';
    END IF;
    
    -- audit_logs
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'audit_logs'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO record_count FROM audit_logs;
        RAISE NOTICE 'audit_logs: % enregistrements', record_count;
    ELSE
        RAISE NOTICE 'audit_logs: TABLE N''EXISTE PAS';
    END IF;
    
    -- auditlog
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'auditlog'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO record_count FROM auditlog;
        RAISE NOTICE 'auditlog: % enregistrements', record_count;
    ELSE
        RAISE NOTICE 'auditlog: TABLE N''EXISTE PAS';
    END IF;
    
END $$; 