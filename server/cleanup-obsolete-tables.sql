-- Script de nettoyage des tables temporaires obsolètes
-- À exécuter dans Supabase SQL Editor après vérification

-- 1. Vérifier les données existantes dans les tables temporaires
SELECT 
    'TemporarySession' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM "TemporarySession"
UNION ALL
SELECT 
    'TemporaryEligibility' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM "TemporaryEligibility"
UNION ALL
SELECT 
    'TemporaryResponse' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM "TemporaryResponse"
UNION ALL
SELECT 
    'SimulatorAnalytics' as table_name,
    COUNT(*) as record_count,
    MIN(timestamp) as oldest_record,
    MAX(timestamp) as newest_record
FROM "SimulatorAnalytics";

-- 2. Sauvegarder les données importantes avant suppression
-- (Optionnel - décommenter si nécessaire)
/*
CREATE TABLE IF NOT EXISTS "MigrationBackup" AS
SELECT 
    ts.session_token,
    ts.created_at as session_created,
    te.produit_id,
    te.eligibility_score,
    te.estimated_savings,
    te.confidence_level,
    te.recommendations
FROM "TemporarySession" ts
LEFT JOIN "TemporaryEligibility" te ON ts.id = te.session_id
WHERE ts.migrated_to_account = false
AND ts.created_at > NOW() - INTERVAL '30 days';
*/

-- 3. Supprimer les données temporaires anciennes (plus de 7 jours)
DELETE FROM "TemporaryEligibility" 
WHERE session_id IN (
    SELECT id FROM "TemporarySession" 
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND (migrated_to_account = false OR migrated_to_account IS NULL)
);

DELETE FROM "TemporaryResponse" 
WHERE session_id IN (
    SELECT id FROM "TemporarySession" 
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND (migrated_to_account = false OR migrated_to_account IS NULL)
);

DELETE FROM "SimulatorAnalytics" 
WHERE session_token IN (
    SELECT session_token FROM "TemporarySession" 
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND (migrated_to_account = false OR migrated_to_account IS NULL)
);

DELETE FROM "TemporarySession" 
WHERE created_at < NOW() - INTERVAL '7 days'
AND (migrated_to_account = false OR migrated_to_account IS NULL);

-- 4. Vérifier le nettoyage
SELECT 
    'TemporarySession' as table_name,
    COUNT(*) as remaining_records
FROM "TemporarySession"
UNION ALL
SELECT 
    'TemporaryEligibility' as table_name,
    COUNT(*) as remaining_records
FROM "TemporaryEligibility"
UNION ALL
SELECT 
    'TemporaryResponse' as table_name,
    COUNT(*) as remaining_records
FROM "TemporaryResponse"
UNION ALL
SELECT 
    'SimulatorAnalytics' as table_name,
    COUNT(*) as remaining_records
FROM "SimulatorAnalytics";

-- 5. Optionnel : Supprimer complètement les tables si elles ne sont plus utilisées
-- (Décommenter seulement après avoir vérifié qu'aucune application n'utilise ces tables)
/*
DROP TABLE IF EXISTS "TemporaryEligibility" CASCADE;
DROP TABLE IF EXISTS "TemporaryResponse" CASCADE;
DROP TABLE IF EXISTS "SimulatorAnalytics" CASCADE;
DROP TABLE IF EXISTS "TemporarySession" CASCADE;
DROP TABLE IF EXISTS "SimulatorFollowUp" CASCADE;

-- Supprimer les vues associées
DROP VIEW IF EXISTS "SimulatorStats" CASCADE;
DROP VIEW IF EXISTS "SimulatorProductStats" CASCADE;

-- Supprimer les fonctions associées
DROP FUNCTION IF EXISTS update_session_activity() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS mark_session_completed(text) CASCADE;
*/ 