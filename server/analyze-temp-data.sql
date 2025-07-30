-- Script d'analyse des données temporaires restantes
-- À exécuter dans Supabase SQL Editor

-- 1. Analyser les sessions temporaires
SELECT 
    'Sessions par statut' as analysis_type,
    CASE 
        WHEN migrated_to_account = true THEN 'Migrées'
        WHEN completed = true THEN 'Complétées non migrées'
        WHEN abandoned = true THEN 'Abandonnées'
        ELSE 'En cours'
    END as status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM "TemporarySession"
GROUP BY 
    CASE 
        WHEN migrated_to_account = true THEN 'Migrées'
        WHEN completed = true THEN 'Complétées non migrées'
        WHEN abandoned = true THEN 'Abandonnées'
        ELSE 'En cours'
    END
ORDER BY count DESC;

-- 2. Analyser les éligibilités par produit
SELECT 
    'Éligibilités par produit' as analysis_type,
    produit_id,
    COUNT(*) as total_checks,
    AVG(eligibility_score) as avg_score,
    SUM(estimated_savings) as total_savings,
    COUNT(CASE WHEN eligibility_score >= 70 THEN 1 END) as high_eligibility,
    COUNT(CASE WHEN eligibility_score >= 40 AND eligibility_score < 70 THEN 1 END) as medium_eligibility,
    COUNT(CASE WHEN eligibility_score < 40 THEN 1 END) as low_eligibility
FROM "TemporaryEligibility"
GROUP BY produit_id
ORDER BY total_checks DESC;

-- 3. Analyser les sessions récentes (moins de 7 jours)
SELECT 
    'Sessions récentes (< 7 jours)' as analysis_type,
    session_token,
    completed,
    migrated_to_account,
    created_at,
    CASE 
        WHEN created_at > NOW() - INTERVAL '1 day' THEN 'Aujourd''hui'
        WHEN created_at > NOW() - INTERVAL '3 days' THEN 'Cette semaine'
        WHEN created_at > NOW() - INTERVAL '7 days' THEN 'Cette semaine'
        ELSE 'Ancien'
    END as age
FROM "TemporarySession"
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- 4. Analyser les sessions avec éligibilités
SELECT 
    'Sessions avec éligibilités' as analysis_type,
    ts.session_token,
    ts.completed,
    ts.migrated_to_account,
    COUNT(te.id) as eligibility_count,
    SUM(te.estimated_savings) as total_savings,
    AVG(te.eligibility_score) as avg_score
FROM "TemporarySession" ts
LEFT JOIN "TemporaryEligibility" te ON ts.id = te.session_id
GROUP BY ts.id, ts.session_token, ts.completed, ts.migrated_to_account
HAVING COUNT(te.id) > 0
ORDER BY ts.created_at DESC
LIMIT 10;

-- 5. Analyser les analytics par type d'événement
SELECT 
    'Analytics par type' as analysis_type,
    event_type,
    COUNT(*) as event_count,
    MIN(timestamp) as oldest_event,
    MAX(timestamp) as newest_event
FROM "SimulatorAnalytics"
GROUP BY event_type
ORDER BY event_count DESC;

-- 6. Identifier les sessions candidates pour migration
SELECT 
    'Sessions candidates pour migration' as analysis_type,
    ts.session_token,
    ts.created_at,
    COUNT(te.id) as eligibility_count,
    SUM(te.estimated_savings) as total_savings,
    AVG(te.eligibility_score) as avg_score
FROM "TemporarySession" ts
LEFT JOIN "TemporaryEligibility" te ON ts.id = te.session_id
WHERE ts.completed = true 
AND ts.migrated_to_account = false
AND ts.created_at > NOW() - INTERVAL '30 days'
GROUP BY ts.id, ts.session_token, ts.created_at
HAVING COUNT(te.id) > 0
ORDER BY ts.created_at DESC
LIMIT 10;

-- 7. Statistiques générales de nettoyage
SELECT 
    'Statistiques de nettoyage' as analysis_type,
    'Sessions > 7 jours' as category,
    COUNT(*) as count
FROM "TemporarySession"
WHERE created_at < NOW() - INTERVAL '7 days'
AND (migrated_to_account = false OR migrated_to_account IS NULL)
UNION ALL
SELECT 
    'Statistiques de nettoyage' as analysis_type,
    'Sessions > 30 jours' as category,
    COUNT(*) as count
FROM "TemporarySession"
WHERE created_at < NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
    'Statistiques de nettoyage' as analysis_type,
    'Sessions migrées' as category,
    COUNT(*) as count
FROM "TemporarySession"
WHERE migrated_to_account = true; 