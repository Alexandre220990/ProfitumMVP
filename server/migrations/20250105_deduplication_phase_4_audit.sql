-- =====================================================
-- DÉDOUBLONNAGE PHASE 4 : Tables d'Audit
-- Date : 2025-01-05
-- Objectif : Fusionner les tables d'audit en minuscules vers les tables en majuscules
-- =====================================================

-- ===== 1. SAUVEGARDE DES DONNÉES =====
BEGIN;

-- Créer des sauvegardes temporaires
CREATE TEMP TABLE temp_auditlog_backup AS 
SELECT * FROM auditlog WHERE id NOT IN (SELECT id FROM audit_logs);

CREATE TEMP TABLE temp_documentauditlog_backup AS 
SELECT * FROM "DocumentAuditLog" WHERE id NOT IN (SELECT id FROM "DocumentFileAccessLog");

-- ===== 2. ANALYSE DES DONNÉES =====

-- Vérifier la structure et le contenu des tables d'audit
SELECT 
    'auditlog' as table_name,
    COUNT(*) as record_count,
    'Minuscule' as status
FROM auditlog
UNION ALL
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as record_count,
    'Principale' as status
FROM audit_logs
UNION ALL
SELECT 
    'DocumentAuditLog' as table_name,
    COUNT(*) as record_count,
    'Documentaire' as status
FROM "DocumentAuditLog"
UNION ALL
SELECT 
    'DocumentFileAccessLog' as table_name,
    COUNT(*) as record_count,
    'Documentaire Principale' as status
FROM "DocumentFileAccessLog";

-- ===== 3. STRATÉGIE DE FUSION =====

-- Décision : 
-- 1. Garder 'audit_logs' comme table principale d'audit général
-- 2. Garder 'DocumentFileAccessLog' comme table principale d'audit documentaire

-- Fusion des données de 'auditlog' vers 'audit_logs'
INSERT INTO audit_logs 
SELECT * FROM auditlog 
WHERE id NOT IN (SELECT id FROM audit_logs)
ON CONFLICT (id) DO NOTHING;

-- Fusion des données de 'DocumentAuditLog' vers 'DocumentFileAccessLog'
INSERT INTO "DocumentFileAccessLog" 
SELECT * FROM "DocumentAuditLog" 
WHERE id NOT IN (SELECT id FROM "DocumentFileAccessLog")
ON CONFLICT (id) DO NOTHING;

-- ===== 4. VÉRIFICATION DES DONNÉES MIGRÉES =====

-- Compter les enregistrements migrés
SELECT 
    'Fusion auditlog -> audit_logs' as operation,
    COUNT(*) as migrated_records
FROM auditlog 
WHERE id IN (SELECT id FROM audit_logs)
UNION ALL
SELECT 
    'Fusion DocumentAuditLog -> DocumentFileAccessLog' as operation,
    COUNT(*) as migrated_records
FROM "DocumentAuditLog" 
WHERE id IN (SELECT id FROM "DocumentFileAccessLog");

-- ===== 5. SUPPRESSION DES TABLES EN DOUBLON =====

-- Supprimer les tables en doublon après vérification
DROP TABLE IF EXISTS auditlog CASCADE;
DROP TABLE IF EXISTS "DocumentAuditLog" CASCADE;

-- ===== 6. VÉRIFICATION FINALE =====

-- Vérifier que seules les tables principales existent
SELECT 
    table_name,
    'Audit' as category
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'audit_logs',
    'DocumentFileAccessLog'
)
ORDER BY table_name;

-- ===== 7. OPTIMISATION DES INDEX =====

-- Recréer les index sur les tables d'audit principales
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_documentfileaccesslog_timestamp ON "DocumentFileAccessLog"(created_at);
CREATE INDEX IF NOT EXISTS idx_documentfileaccesslog_user_id ON "DocumentFileAccessLog"(user_id);
CREATE INDEX IF NOT EXISTS idx_documentfileaccesslog_file_id ON "DocumentFileAccessLog"(file_id);

COMMIT;

-- ===== 8. RAPPORT DE MIGRATION =====
DO $$
DECLARE
    audit_logs_count INTEGER := 0;
    document_access_count INTEGER := 0;
BEGIN
    -- Compter les enregistrements finaux
    SELECT COUNT(*) INTO audit_logs_count FROM audit_logs;
    SELECT COUNT(*) INTO document_access_count FROM "DocumentFileAccessLog";
    
    RAISE NOTICE '✅ Migration Phase 4 Audit terminée:';
    RAISE NOTICE '   - audit_logs: % enregistrements', audit_logs_count;
    RAISE NOTICE '   - DocumentFileAccessLog: % enregistrements', document_access_count;
END $$; 