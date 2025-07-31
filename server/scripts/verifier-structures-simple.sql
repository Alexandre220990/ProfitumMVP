-- =====================================================
-- VÉRIFICATION SIMPLIFIÉE DES STRUCTURES API
-- Date : 2025-01-05
-- Objectif : Vérifier rapidement les structures essentielles
-- =====================================================

-- ===== 1. VÉRIFICATION TABLE Client =====
SELECT 
    'Client' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'Client'
AND column_name IN ('id', 'auth_id', 'email', 'company_name', 'siren', 'type')
ORDER BY ordinal_position;

-- ===== 2. VÉRIFICATION TABLE simulations =====
SELECT 
    'simulations' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'simulations'
AND column_name IN ('id', 'client_id', 'session_token', 'status', 'type', 'results')
ORDER BY ordinal_position;

-- ===== 3. VÉRIFICATION TABLE notification =====
SELECT 
    'notification' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notification'
AND column_name IN ('id', 'user_id', 'user_type', 'title', 'message', 'notification_type')
ORDER BY ordinal_position;

-- ===== 4. VÉRIFICATION TABLE conversations =====
SELECT 
    'conversations' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'conversations'
AND column_name IN ('id', 'client_id', 'expert_id', 'title', 'status')
ORDER BY ordinal_position;

-- ===== 5. VÉRIFICATION DES INDEX =====
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('Client', 'simulations', 'notification', 'conversations')
ORDER BY tablename, indexname;

-- ===== 6. VÉRIFICATION DES CONTRAINTES =====
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name IN ('Client', 'simulations', 'notification', 'conversations')
ORDER BY table_name, constraint_name;

-- ===== 7. RÉSUMÉ DES TABLES =====
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('Client', 'simulations', 'notification', 'conversations')
GROUP BY table_name
ORDER BY table_name; 