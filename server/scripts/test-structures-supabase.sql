-- =====================================================
-- TEST STRUCTURES SUPABASE - COMPATIBILITÉ API
-- Date : 2025-01-05
-- Objectif : Vérifier que les tables sont prêtes pour les APIs
-- =====================================================

-- ===== 1. VÉRIFICATION RAPIDE DES TABLES CRITIQUES =====
SELECT 
    '✅ Tables principales' as status,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Client', 'simulations', 'notification', 'conversations');

-- ===== 2. VÉRIFICATION DES COLONNES CRITIQUES =====
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('id', 'auth_id', 'user_id', 'client_id') THEN '🔑 Clé'
        WHEN column_name IN ('email', 'company_name', 'siren') THEN '📝 Données'
        WHEN column_name IN ('session_token', 'results') THEN '💾 Session'
        WHEN column_name IN ('title', 'message', 'status') THEN '📋 Contenu'
        ELSE '📊 Autre'
    END as type_colonne
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('Client', 'simulations', 'notification', 'conversations')
AND column_name IN (
    'id', 'auth_id', 'email', 'company_name', 'siren', 'type',
    'client_id', 'session_token', 'status', 'results',
    'user_id', 'user_type', 'title', 'message', 'notification_type',
    'expert_id'
)
ORDER BY table_name, column_name;

-- ===== 3. VÉRIFICATION DES TYPES UUID =====
SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'uuid' THEN '✅ UUID correct'
        WHEN data_type = 'character varying' AND column_name LIKE '%id%' THEN '⚠️ Devrait être UUID'
        ELSE '📊 Type standard'
    END as validation
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('Client', 'simulations', 'notification', 'conversations')
AND column_name LIKE '%id%'
ORDER BY table_name, column_name;

-- ===== 4. VÉRIFICATION DES INDEX =====
SELECT 
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE '%_pkey' THEN '🔑 Clé primaire'
        WHEN indexname LIKE '%_idx%' THEN '📈 Index performance'
        ELSE '📊 Index standard'
    END as type_index
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('Client', 'simulations', 'notification', 'conversations')
ORDER BY tablename, indexname;

-- ===== 5. VÉRIFICATION DES CONTRAINTES =====
SELECT 
    table_name,
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_type = 'PRIMARY KEY' THEN '🔑 Clé primaire'
        WHEN constraint_type = 'FOREIGN KEY' THEN '🔗 Clé étrangère'
        WHEN constraint_type = 'UNIQUE' THEN '✨ Unique'
        ELSE '📊 Autre'
    END as type_contrainte
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name IN ('Client', 'simulations', 'notification', 'conversations')
ORDER BY table_name, constraint_name;

-- ===== 6. RÉSUMÉ DE COMPATIBILITÉ API =====
SELECT 
    '📊 RÉSUMÉ COMPATIBILITÉ API' as section,
    '' as detail;

SELECT 
    table_name,
    CASE 
        WHEN table_name = 'Client' AND COUNT(*) >= 6 THEN '✅ Prêt pour API'
        WHEN table_name = 'simulations' AND COUNT(*) >= 5 THEN '✅ Prêt pour API'
        WHEN table_name = 'notification' AND COUNT(*) >= 6 THEN '✅ Prêt pour API'
        WHEN table_name = 'conversations' AND COUNT(*) >= 4 THEN '✅ Prêt pour API'
        ELSE '⚠️ Vérification nécessaire'
    END as status_api
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('Client', 'simulations', 'notification', 'conversations')
AND column_name IN (
    'id', 'auth_id', 'email', 'company_name', 'siren', 'type',
    'client_id', 'session_token', 'status', 'results',
    'user_id', 'user_type', 'title', 'message', 'notification_type',
    'expert_id'
)
GROUP BY table_name
ORDER BY table_name;

-- ===== 7. RECOMMANDATIONS FINALES =====
SELECT 
    '🎯 RECOMMANDATIONS' as section,
    '' as detail;

SELECT 
    'Client.auth_id doit être UUID et correspondre à auth.users.id' as recommandation
UNION ALL
SELECT 
    'simulations.client_id doit être UUID et correspondre à Client.id'
UNION ALL
SELECT 
    'notification.user_id doit être UUID et correspondre à auth.users.id'
UNION ALL
SELECT 
    'conversations.client_id doit être UUID et correspondre à Client.id'
UNION ALL
SELECT 
    'Créer des index sur les colonnes fréquemment utilisées'
UNION ALL
SELECT 
    'Vérifier les contraintes de clés étrangères'; 