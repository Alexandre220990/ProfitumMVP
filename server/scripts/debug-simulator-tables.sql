-- =====================================================
-- DIAGNOSTIC DES TABLES DU SIMULATEUR
-- Date: 2025-01-30
-- =====================================================

-- 1. Vérifier l'existence des tables du simulateur
SELECT 
    'Tables du simulateur' as section,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'N''EXISTE PAS'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('SimulatorSession', 'SimulatorResponse', 'SimulatorEligibility', 'SimulatorAnalytics')
ORDER BY table_name;

-- 2. Vérifier la structure de SimulatorSession
SELECT 
    'Structure SimulatorSession' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'SimulatorSession' 
ORDER BY ordinal_position;

-- 3. Vérifier la structure de SimulatorEligibility
SELECT 
    'Structure SimulatorEligibility' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'SimulatorEligibility' 
ORDER BY ordinal_position;

-- 4. Vérifier les données existantes dans SimulatorSession
SELECT 
    'Données SimulatorSession' as section,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned_sessions,
    COUNT(CASE WHEN status = 'migrated' THEN 1 END) as migrated_sessions,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_sessions,
    MIN(created_at) as oldest_session,
    MAX(created_at) as newest_session
FROM "SimulatorSession";

-- 5. Vérifier les données existantes dans SimulatorEligibility
SELECT 
    'Données SimulatorEligibility' as section,
    COUNT(*) as total_eligibility_checks,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT produit_id) as unique_products,
    ROUND(AVG(eligibility_score), 2) as avg_eligibility_score,
    MIN(created_at) as oldest_check,
    MAX(created_at) as newest_check
FROM "SimulatorEligibility";

-- 6. Vérifier les analytics du simulateur
SELECT 
    'Données SimulatorAnalytics' as section,
    COUNT(*) as total_events,
    COUNT(DISTINCT session_token) as unique_sessions,
    COUNT(DISTINCT event_type) as unique_event_types,
    MIN(timestamp) as oldest_event,
    MAX(timestamp) as newest_event
FROM "SimulatorAnalytics";

-- 7. Lister les types d'événements dans les analytics
SELECT 
    'Types d\'événements' as section,
    event_type,
    COUNT(*) as event_count
FROM "SimulatorAnalytics"
GROUP BY event_type
ORDER BY event_count DESC; 