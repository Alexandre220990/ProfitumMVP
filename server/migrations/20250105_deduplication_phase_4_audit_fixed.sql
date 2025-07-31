-- =====================================================
-- DÉDOUBLONNAGE PHASE 4 : Tables d'Audit (CORRIGÉ)
-- Date : 2025-01-05
-- Objectif : Fusionner les tables d'audit en tenant compte des types de données
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
    RAISE NOTICE 'auditlog existe: %, enregistrements: %', auditlog_exists, auditlog_count;
    RAISE NOTICE 'audit_logs existe: %, enregistrements: %', audit_logs_exists, audit_logs_count;
END $$;

-- ===== 2. SAUVEGARDE DES DONNÉES =====
BEGIN;

-- Créer des sauvegardes temporaires seulement si les tables existent
DO $$
DECLARE
    auditlog_exists BOOLEAN;
    audit_logs_exists BOOLEAN;
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
    
    -- Créer les sauvegardes seulement si les tables existent
    IF auditlog_exists AND audit_logs_exists THEN
        -- Créer une sauvegarde des données uniques d'auditlog
        CREATE TEMP TABLE temp_auditlog_backup AS 
        SELECT 
            id, user_id, action, resource_type, resource_id,
            ip_address, user_agent, timestamp, success, details,
            compliance_impact, created_at
        FROM auditlog 
        WHERE id NOT IN (SELECT id FROM audit_logs);
        
        RAISE NOTICE 'Sauvegarde auditlog créée';
    ELSIF auditlog_exists AND NOT audit_logs_exists THEN
        -- Si audit_logs n'existe pas, sauvegarder tout auditlog
        CREATE TEMP TABLE temp_auditlog_backup AS 
        SELECT 
            id, user_id, action, resource_type, resource_id,
            ip_address, user_agent, timestamp, success, details,
            compliance_impact, created_at
        FROM auditlog;
        
        RAISE NOTICE 'Sauvegarde complète auditlog créée (audit_logs n''existe pas)';
    ELSE
        RAISE NOTICE 'Aucune sauvegarde nécessaire - tables non trouvées';
    END IF;
END $$;

-- ===== 3. MIGRATION DES DONNÉES =====

-- Migrer les données d'auditlog vers audit_logs si les deux tables existent
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
        -- Migrer les données uniques en spécifiant les colonnes
        INSERT INTO audit_logs (
            id, user_id, action, resource_type, resource_id, 
            ip_address, user_agent, timestamp, success, details, 
            compliance_impact, created_at
        )
        SELECT 
            id, user_id, action, resource_type, resource_id,
            ip_address, user_agent, timestamp, success, details,
            compliance_impact, created_at
        FROM temp_auditlog_backup
        ON CONFLICT (id) DO NOTHING;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migration auditlog -> audit_logs: % enregistrements migrés', migrated_count;
        
    ELSIF auditlog_exists AND NOT audit_logs_exists THEN
        -- Créer audit_logs avec la même structure qu'auditlog
        CREATE TABLE audit_logs AS 
        SELECT 
            id, user_id, action, resource_type, resource_id,
            ip_address, user_agent, timestamp, success, details,
            compliance_impact, created_at
        FROM auditlog;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Création audit_logs avec % enregistrements depuis auditlog', migrated_count;
        
    ELSE
        RAISE NOTICE 'Aucune migration nécessaire';
    END IF;
END $$;

-- ===== 4. SUPPRESSION DE LA TABLE EN DOUBLON =====

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

-- ===== 5. VÉRIFICATION FINALE =====

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