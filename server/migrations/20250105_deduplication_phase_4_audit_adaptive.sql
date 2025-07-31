-- =====================================================
-- DÉDOUBLONNAGE PHASE 4 : Tables d'Audit (ADAPTATIVE)
-- Date : 2025-01-05
-- Objectif : Fusionner les tables d'audit en s'adaptant aux structures réelles
-- =====================================================

-- ===== 1. ANALYSE AUTOMATIQUE DES STRUCTURES =====
DO $$
DECLARE
    auditlog_exists BOOLEAN;
    audit_logs_exists BOOLEAN;
    auditlog_columns TEXT[] := '{}';
    audit_logs_columns TEXT[] := '{}';
    common_columns TEXT[] := '{}';
    column_name TEXT;
    column_list TEXT := '';
    select_list TEXT := '';
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
    
    RAISE NOTICE '=== ANALYSE DES STRUCTURES ===';
    RAISE NOTICE 'auditlog existe: %', auditlog_exists;
    RAISE NOTICE 'audit_logs existe: %', audit_logs_exists;
    
    -- Récupérer les colonnes d'auditlog
    IF auditlog_exists THEN
        SELECT ARRAY_AGG(column_name ORDER BY ordinal_position) 
        INTO auditlog_columns
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'auditlog';
        
        RAISE NOTICE 'Colonnes auditlog: %', auditlog_columns;
    END IF;
    
    -- Récupérer les colonnes d'audit_logs
    IF audit_logs_exists THEN
        SELECT ARRAY_AGG(column_name ORDER BY ordinal_position) 
        INTO audit_logs_columns
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'audit_logs';
        
        RAISE NOTICE 'Colonnes audit_logs: %', audit_logs_columns;
    END IF;
    
    -- Trouver les colonnes communes
    IF auditlog_exists AND audit_logs_exists THEN
        SELECT ARRAY_AGG(col) INTO common_columns
        FROM (
            SELECT UNNEST(auditlog_columns) AS col
            INTERSECT
            SELECT UNNEST(audit_logs_columns) AS col
        ) t;
        
        RAISE NOTICE 'Colonnes communes: %', common_columns;
        
        -- Construire les listes de colonnes pour l'INSERT
        IF ARRAY_LENGTH(common_columns, 1) > 0 THEN
            SELECT STRING_AGG(col, ', ') INTO column_list FROM UNNEST(common_columns) AS col;
            SELECT STRING_AGG(col, ', ') INTO select_list FROM UNNEST(common_columns) AS col;
            
            RAISE NOTICE 'Liste colonnes: %', column_list;
            RAISE NOTICE 'Liste SELECT: %', select_list;
        END IF;
    END IF;
    
END $$;

-- ===== 2. MIGRATION ADAPTATIVE =====
DO $$
DECLARE
    auditlog_exists BOOLEAN;
    audit_logs_exists BOOLEAN;
    common_columns TEXT[] := '{}';
    column_list TEXT := '';
    select_list TEXT := '';
    migrated_count INTEGER := 0;
    sql_query TEXT;
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
    
    -- Trouver les colonnes communes
    IF auditlog_exists AND audit_logs_exists THEN
        SELECT ARRAY_AGG(col) INTO common_columns
        FROM (
            SELECT column_name AS col
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'auditlog'
            INTERSECT
            SELECT column_name AS col
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'audit_logs'
        ) t;
        
        -- Construire les listes de colonnes
        IF ARRAY_LENGTH(common_columns, 1) > 0 THEN
            SELECT STRING_AGG(col, ', ') INTO column_list FROM UNNEST(common_columns) AS col;
            SELECT STRING_AGG(col, ', ') INTO select_list FROM UNNEST(common_columns) AS col;
            
            -- Créer la requête SQL dynamique
            sql_query := 'INSERT INTO audit_logs (' || column_list || ') ' ||
                        'SELECT ' || select_list || ' FROM auditlog ' ||
                        'WHERE id NOT IN (SELECT id FROM audit_logs) ' ||
                        'ON CONFLICT (id) DO NOTHING';
            
            RAISE NOTICE 'Exécution de la migration adaptative...';
            RAISE NOTICE 'SQL: %', sql_query;
            
            -- Exécuter la migration
            EXECUTE sql_query;
            GET DIAGNOSTICS migrated_count = ROW_COUNT;
            
            RAISE NOTICE 'Migration terminée: % enregistrements migrés', migrated_count;
        ELSE
            RAISE NOTICE 'Aucune colonne commune trouvée - migration impossible';
        END IF;
    ELSE
        RAISE NOTICE 'Une ou les deux tables d''audit n''existent pas';
    END IF;
END $$;

-- ===== 3. VÉRIFICATION FINALE =====
DO $$
DECLARE
    audit_logs_exists BOOLEAN;
    final_count INTEGER := 0;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'audit_logs'
    ) INTO audit_logs_exists;
    
    IF audit_logs_exists THEN
        SELECT COUNT(*) INTO final_count FROM audit_logs;
        RAISE NOTICE '=== RÉSULTAT FINAL ===';
        RAISE NOTICE 'audit_logs: % enregistrements', final_count;
    ELSE
        RAISE NOTICE '=== RÉSULTAT FINAL ===';
        RAISE NOTICE 'Table audit_logs n''existe pas';
    END IF;
END $$; 