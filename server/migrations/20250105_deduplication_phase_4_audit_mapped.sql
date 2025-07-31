-- =====================================================
-- DÉDOUBLONNAGE PHASE 4 : Tables d'Audit (MAPPING CORRECT)
-- Date : 2025-01-05
-- Objectif : Fusionner auditlog vers audit_logs avec mapping correct des colonnes
-- =====================================================

-- ===== 1. ANALYSE PRÉ-MIGRATION =====
DO $$
DECLARE
    auditlog_exists BOOLEAN;
    audit_logs_exists BOOLEAN;
    auditlog_count INTEGER := 0;
    audit_logs_count INTEGER := 0;
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
    
    -- Compter les enregistrements
    IF auditlog_exists THEN
        SELECT COUNT(*) INTO auditlog_count FROM auditlog;
    END IF;
    
    IF audit_logs_exists THEN
        SELECT COUNT(*) INTO audit_logs_count FROM audit_logs;
    END IF;
    
    RAISE NOTICE '=== ANALYSE PRÉ-MIGRATION ===';
    RAISE NOTICE 'auditlog: % enregistrements', auditlog_count;
    RAISE NOTICE 'audit_logs: % enregistrements', audit_logs_count;
END $$;

-- ===== 2. MIGRATION AVEC MAPPING CORRECT =====
BEGIN;

-- Migrer les données d'auditlog vers audit_logs avec mapping correct
DO $$
DECLARE
    auditlog_exists BOOLEAN;
    audit_logs_exists BOOLEAN;
    migrated_count INTEGER := 0;
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
    
    IF auditlog_exists AND audit_logs_exists THEN
        -- Migration avec mapping correct des colonnes
        INSERT INTO audit_logs (
            id,                    -- auditlog.id -> audit_logs.id
            timestamp,             -- auditlog.timestamp -> audit_logs.timestamp
            level,                 -- Défaut: 'INFO'
            category,              -- auditlog.resource_type -> audit_logs.category
            message,               -- auditlog.action -> audit_logs.message
            details,               -- auditlog.details -> audit_logs.details
            user_id,               -- auditlog.user_id -> audit_logs.user_id
            user_email,            -- NULL (pas de correspondance)
            ip_address,            -- auditlog.ip_address -> audit_logs.ip_address
            resource_type,         -- auditlog.resource_type -> audit_logs.resource_type
            resource_id,           -- auditlog.resource_id -> audit_logs.resource_id
            success,               -- auditlog.success -> audit_logs.success
            created_at             -- auditlog.created_at -> audit_logs.created_at
        )
        SELECT 
            al.id,
            al.timestamp,
            'INFO'::text as level,
            al.resource_type::text as category,
            al.action::text as message,
            al.details,
            al.user_id,
            NULL::text as user_email,
            al.ip_address,
            al.resource_type::text as resource_type,
            al.resource_id::text as resource_id,
            al.success,
            al.created_at
        FROM auditlog al
        WHERE al.id NOT IN (SELECT id FROM audit_logs)
        ON CONFLICT (id) DO NOTHING;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migration auditlog -> audit_logs: % enregistrements migrés', migrated_count;
        
    ELSIF auditlog_exists AND NOT audit_logs_exists THEN
        -- Créer audit_logs avec la structure complète
        CREATE TABLE audit_logs AS 
        SELECT 
            al.id,
            al.timestamp,
            'INFO'::text as level,
            al.resource_type::text as category,
            al.action::text as message,
            al.details,
            al.user_id,
            NULL::text as user_email,
            al.ip_address,
            al.resource_type::text as resource_type,
            al.resource_id::text as resource_id,
            al.success,
            al.created_at
        FROM auditlog al;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Création audit_logs avec % enregistrements depuis auditlog', migrated_count;
        
    ELSE
        RAISE NOTICE 'Aucune migration nécessaire';
    END IF;
END $$;

-- ===== 3. SUPPRESSION DE LA TABLE EN DOUBLON =====

-- Supprimer auditlog seulement si audit_logs existe et contient les données
DO $$
DECLARE
    auditlog_exists BOOLEAN;
    audit_logs_exists BOOLEAN;
    auditlog_count INTEGER := 0;
    audit_logs_count INTEGER := 0;
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
    
    IF auditlog_exists AND audit_logs_exists THEN
        -- Compter les enregistrements avant suppression
        SELECT COUNT(*) INTO auditlog_count FROM auditlog;
        SELECT COUNT(*) INTO audit_logs_count FROM audit_logs;
        
        -- Vérifier que audit_logs contient au moins autant d'enregistrements
        IF audit_logs_count >= auditlog_count THEN
            DROP TABLE auditlog CASCADE;
            RAISE NOTICE 'Table auditlog supprimée (audit_logs contient % enregistrements)', audit_logs_count;
        ELSE
            RAISE NOTICE 'ATTENTION: audit_logs contient moins d''enregistrements que auditlog - suppression annulée';
        END IF;
    ELSE
        RAISE NOTICE 'Aucune suppression nécessaire';
    END IF;
END $$;

-- ===== 4. VÉRIFICATION FINALE =====

-- Vérifier l'état final
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
        RAISE NOTICE 'Aucune table d''audit trouvée';
    END IF;
END $$;

COMMIT; 