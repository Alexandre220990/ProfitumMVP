-- =====================================================
-- ANALYSE DE LA LOGIQUE IDÉALE DU SIMULATEUR
-- Date: 2025-01-30
-- Objectif: Identifier et uniformiser la logique du simulateur
-- =====================================================

-- 1. VÉRIFIER L'EXISTENCE DES TABLES ACTUELLES
SELECT 
    'Tables existantes' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'TemporarySession',
    'TemporaryResponse', 
    'TemporaryEligibility',
    'SimulatorAnalytics',
    'TemporarySimulationSession',
    'ClientProduitEligible',
    'QuestionnaireQuestion',
    'TICPESectors',
    'TICPERates',
    'TICPEVehicleTypes',
    'TICPEUsageScenarios',
    'TICPEBenchmarks',
    'TICPEAdvancedRules',
    'TICPEAdminMaturity',
    'TICPESimulationResults'
)
ORDER BY table_name;

-- 2. VÉRIFIER LA STRUCTURE DE ClientProduitEligible
SELECT 
    'Structure ClientProduitEligible' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- 3. VÉRIFIER LA STRUCTURE DE TemporarySimulationSession
SELECT 
    'Structure TemporarySimulationSession' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'TemporarySimulationSession'
ORDER BY ordinal_position;

-- 4. VÉRIFIER LES CONTRAINTES SUR ClientProduitEligible
SELECT 
    'Contraintes ClientProduitEligible' as section,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'ClientProduitEligible'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 5. VÉRIFIER LES POLITIQUES RLS
SELECT 
    'Politiques RLS' as section,
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'TemporarySimulationSession',
    'ClientProduitEligible',
    'QuestionnaireQuestion'
)
ORDER BY tablename, policyname;

-- 6. VÉRIFIER LES FONCTIONS DE NETTOYAGE
SELECT 
    'Fonctions de nettoyage' as section,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'cleanup_expired_sessions',
    'trigger_cleanup_expired_sessions',
    'update_session_activity'
)
ORDER BY routine_name;

-- 7. VÉRIFIER LES TRIGGERS
SELECT 
    'Triggers' as section,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN (
    'TemporarySimulationSession',
    'ClientProduitEligible'
)
ORDER BY event_object_table, trigger_name;

-- 8. ANALYSER LES DONNÉES EXISTANTES
SELECT 
    'Données ClientProduitEligible' as section,
    COUNT(*) as total_records,
    COUNT(CASE WHEN "clientId" IS NOT NULL THEN 1 END) as with_client,
    COUNT(CASE WHEN "sessionId" IS NOT NULL THEN 1 END) as with_session,
    COUNT(CASE WHEN "clientId" IS NULL AND "sessionId" IS NULL THEN 1 END) as orphaned
FROM "ClientProduitEligible";

-- 9. VÉRIFIER LES SESSIONS TEMPORAIRES
SELECT 
    'Sessions temporaires' as section,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN expiresAt < NOW() THEN 1 END) as expired_sessions,
    COUNT(CASE WHEN expiresAt >= NOW() THEN 1 END) as active_sessions
FROM "TemporarySimulationSession";

-- 10. RECOMMANDATIONS POUR L'UNIFORMISATION
SELECT 
    'RECOMMANDATIONS' as section,
    '1. Utiliser TemporarySimulationSession + ClientProduitEligible avec sessionId' as recommendation_1,
    '2. Supprimer les anciennes tables TemporarySession, TemporaryResponse, TemporaryEligibility' as recommendation_2,
    '3. Uniformiser les politiques RLS pour TemporarySimulationSession' as recommendation_3,
    '4. Mettre à jour le code du simulateur pour utiliser la nouvelle logique' as recommendation_4,
    '5. Créer des fonctions helper pour la gestion des sessions' as recommendation_5; 