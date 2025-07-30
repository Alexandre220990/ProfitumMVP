-- Script de nettoyage sécurisé des données temporaires
-- À exécuter dans Supabase SQL Editor

-- PHASE 1: Sauvegarde des données importantes
-- Créer une table de sauvegarde pour les sessions avec éligibilités
CREATE TABLE IF NOT EXISTS "MigrationBackup_$(date +%Y%m%d)" AS
SELECT 
    ts.session_token,
    ts.created_at as session_created,
    ts.completed,
    ts.migrated_to_account,
    te.produit_id,
    te.eligibility_score,
    te.estimated_savings,
    te.confidence_level,
    te.recommendations,
    te.created_at as eligibility_created
FROM "TemporarySession" ts
LEFT JOIN "TemporaryEligibility" te ON ts.id = te.session_id
WHERE ts.completed = true 
AND ts.migrated_to_account = false
AND ts.created_at > NOW() - INTERVAL '30 days';

-- PHASE 2: Nettoyage progressif par âge

-- 2.1. Supprimer les données très anciennes (> 30 jours)
DELETE FROM "TemporaryEligibility" 
WHERE session_id IN (
    SELECT id FROM "TemporarySession" 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND (migrated_to_account = false OR migrated_to_account IS NULL)
);

DELETE FROM "TemporaryResponse" 
WHERE session_id IN (
    SELECT id FROM "TemporarySession" 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND (migrated_to_account = false OR migrated_to_account IS NULL)
);

DELETE FROM "SimulatorAnalytics" 
WHERE session_token IN (
    SELECT session_token FROM "TemporarySession" 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND (migrated_to_account = false OR migrated_to_account IS NULL)
);

DELETE FROM "TemporarySession" 
WHERE created_at < NOW() - INTERVAL '30 days'
AND (migrated_to_account = false OR migrated_to_account IS NULL);

-- 2.2. Supprimer les données anciennes (> 7 jours)
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

-- PHASE 3: Nettoyer les sessions abandonnées récentes
DELETE FROM "TemporaryEligibility" 
WHERE session_id IN (
    SELECT id FROM "TemporarySession" 
    WHERE abandoned = true
    AND created_at < NOW() - INTERVAL '3 days'
);

DELETE FROM "TemporaryResponse" 
WHERE session_id IN (
    SELECT id FROM "TemporarySession" 
    WHERE abandoned = true
    AND created_at < NOW() - INTERVAL '3 days'
);

DELETE FROM "TemporarySession" 
WHERE abandoned = true
AND created_at < NOW() - INTERVAL '3 days';

-- PHASE 4: Nettoyer les analytics anciens
DELETE FROM "SimulatorAnalytics" 
WHERE timestamp < NOW() - INTERVAL '7 days';

-- PHASE 5: Vérification du nettoyage
SELECT 
    'Résultat du nettoyage' as status,
    'TemporarySession' as table_name,
    COUNT(*) as remaining_records
FROM "TemporarySession"
UNION ALL
SELECT 
    'Résultat du nettoyage' as status,
    'TemporaryEligibility' as table_name,
    COUNT(*) as remaining_records
FROM "TemporaryEligibility"
UNION ALL
SELECT 
    'Résultat du nettoyage' as status,
    'TemporaryResponse' as table_name,
    COUNT(*) as remaining_records
FROM "TemporaryResponse"
UNION ALL
SELECT 
    'Résultat du nettoyage' as status,
    'SimulatorAnalytics' as table_name,
    COUNT(*) as remaining_records
FROM "SimulatorAnalytics";

-- PHASE 6: Statistiques finales
SELECT 
    'Statistiques finales' as category,
    'Sessions restantes' as metric,
    COUNT(*) as value
FROM "TemporarySession"
UNION ALL
SELECT 
    'Statistiques finales' as category,
    'Sessions migrées' as metric,
    COUNT(*) as value
FROM "TemporarySession"
WHERE migrated_to_account = true
UNION ALL
SELECT 
    'Statistiques finales' as category,
    'Sessions complétées non migrées' as metric,
    COUNT(*) as value
FROM "TemporarySession"
WHERE completed = true AND migrated_to_account = false
UNION ALL
SELECT 
    'Statistiques finales' as category,
    'Sessions abandonnées' as metric,
    COUNT(*) as value
FROM "TemporarySession"
WHERE abandoned = true; 