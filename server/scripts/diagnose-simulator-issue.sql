-- =====================================================
-- DIAGNOSTIC DU PROBLÈME SIMULATEUR
-- Date: 2025-01-30
-- =====================================================

-- 1. Vérifier l'existence des tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('TemporarySession', 'TemporaryResponse', 'TemporaryEligibility', 'SimulatorAnalytics', 'QuestionnaireQuestion')
ORDER BY table_name;

-- 2. Vérifier la structure de TemporarySession
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'temporarysession'
ORDER BY ordinal_position;

-- 3. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('temporarysession', 'temporaryresponse', 'temporaryeligibility', 'simulatoranalytics')
ORDER BY tablename, policyname;

-- 4. Vérifier les permissions sur les tables
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('TemporarySession', 'TemporaryResponse', 'TemporaryEligibility', 'SimulatorAnalytics')
ORDER BY table_name, privilege_type;

-- 5. Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('temporarysession', 'temporaryresponse', 'temporaryeligibility', 'simulatoranalytics');

-- 6. Tester l'insertion d'une session (simulation)
-- Note: Cette requête ne sera pas exécutée automatiquement, elle est pour référence
/*
INSERT INTO "public"."TemporarySession" (
    session_token,
    ip_address,
    user_agent
) VALUES (
    'test-session-' || gen_random_uuid(),
    '127.0.0.1',
    'test-user-agent'
) RETURNING id, session_token;
*/

-- 7. Vérifier les contraintes
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name IN ('TemporarySession', 'TemporaryResponse', 'TemporaryEligibility')
ORDER BY tc.table_name, tc.constraint_type;

-- 8. Vérifier les index
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('temporarysession', 'temporaryresponse', 'temporaryeligibility', 'simulatoranalytics')
ORDER BY tablename, indexname;

-- 9. Vérifier les triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('temporarysession', 'temporaryresponse', 'temporaryeligibility', 'simulatoranalytics')
ORDER BY event_object_table, trigger_name;

-- 10. Vérifier les fonctions
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_session_activity', 'cleanup_expired_sessions')
ORDER BY routine_name; 