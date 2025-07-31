-- =====================================================
-- ANALYSE DE LA STRUCTURE DES TABLES D'AUDIT
-- Date : 2025-01-05
-- Objectif : Analyser la structure exacte des tables auditlog et audit_logs
-- =====================================================

-- ===== 1. ANALYSE DE LA TABLE auditlog =====
SELECT 
    'auditlog' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'auditlog'
ORDER BY ordinal_position;

-- ===== 2. ANALYSE DE LA TABLE audit_logs =====
SELECT 
    'audit_logs' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- ===== 3. COMPARAISON DES STRUCTURES =====
SELECT 
    'auditlog' as source_table,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'auditlog'
UNION ALL
SELECT 
    'audit_logs' as source_table,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'audit_logs'
ORDER BY source_table, ordinal_position;

-- ===== 4. VÉRIFICATION DE L'EXISTENCE =====
DO $$
DECLARE
    auditlog_exists BOOLEAN;
    audit_logs_exists BOOLEAN;
    auditlog_columns INTEGER := 0;
    audit_logs_columns INTEGER := 0;
BEGIN
    -- Vérifier l'existence des tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'auditlog'
    ) INTO auditlog_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'audit_logs'
    ) INTO audit_logs_exists;
    
    -- Compter les colonnes
    IF auditlog_exists THEN
        SELECT COUNT(*) INTO auditlog_columns 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'auditlog';
    END IF;
    
    IF audit_logs_exists THEN
        SELECT COUNT(*) INTO audit_logs_columns 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'audit_logs';
    END IF;
    
    RAISE NOTICE '=== ANALYSE DES TABLES D''AUDIT ===';
    RAISE NOTICE 'auditlog existe: %, colonnes: %', auditlog_exists, auditlog_columns;
    RAISE NOTICE 'audit_logs existe: %, colonnes: %', audit_logs_exists, audit_logs_columns;
END $$; 