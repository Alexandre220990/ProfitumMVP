-- =====================================================
-- ANALYSE DE CONFORMITÉ DASHBOARDS vs BASE DE DONNÉES
-- Client, Expert, Admin
-- =====================================================

-- ===== 1. ANALYSE DASHBOARD CLIENT =====

-- Vérification des tables nécessaires pour le dashboard client
SELECT 
    '📱 DASHBOARD CLIENT' as section,
    'Tables requises' as test,
    tablename as table_name,
    CASE 
        WHEN tablename IN ('Client', 'ClientProduitEligible', 'Audit', 'Expert', 'notification') 
        THEN '✅ Table requise présente'
        ELSE '⚠️ Table optionnelle'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('Client', 'ClientProduitEligible', 'Audit', 'Expert', 'notification', 'conversations', 'messages')
ORDER BY tablename;

-- Vérification des champs Client utilisés dans le dashboard
SELECT 
    '📱 DASHBOARD CLIENT' as section,
    'Champs Client requis' as test,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('id', 'name', 'email', 'company_name', 'phone', 'city', 'siren') 
        THEN '✅ Champ utilisé dans dashboard'
        ELSE '⚠️ Champ optionnel'
    END as usage
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Client'
ORDER BY ordinal_position;

-- Vérification des champs ClientProduitEligible utilisés dans le dashboard
SELECT 
    '📱 DASHBOARD CLIENT' as section,
    'Champs ClientProduitEligible requis' as test,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('id', 'clientId', 'produitId', 'statut', 'tauxFinal', 'montantFinal', 'dureeFinale', 'current_step', 'progress', 'expert_id', 'charte_signed', 'created_at', 'updated_at', 'priorite') 
        THEN '✅ Champ utilisé dans dashboard'
        ELSE '⚠️ Champ optionnel'
    END as usage
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- Vérification des champs Audit utilisés dans le dashboard
SELECT 
    '📱 DASHBOARD CLIENT' as section,
    'Champs Audit requis' as test,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('id', 'client_id', 'expert_id', 'audit_type', 'status', 'current_step', 'potential_gain', 'obtained_gain', 'reliability', 'progress', 'description', 'is_eligible_product', 'charte_signed', 'created_at', 'updated_at') 
        THEN '✅ Champ utilisé dans dashboard'
        ELSE '⚠️ Champ optionnel'
    END as usage
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Audit'
ORDER BY ordinal_position;

-- ===== 2. ANALYSE DASHBOARD EXPERT =====

-- Vérification des tables nécessaires pour le dashboard expert
SELECT 
    '👨‍💼 DASHBOARD EXPERT' as section,
    'Tables requises' as test,
    tablename as table_name,
    CASE 
        WHEN tablename IN ('Expert', 'expertassignment', 'ClientProduitEligible', 'Client', 'notification', 'conversations', 'messages') 
        THEN '✅ Table requise présente'
        ELSE '⚠️ Table optionnelle'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('Expert', 'expertassignment', 'ClientProduitEligible', 'Client', 'notification', 'conversations', 'messages', 'CalendarEvent', 'DossierStep')
ORDER BY tablename;

-- Vérification des champs Expert utilisés dans le dashboard
SELECT 
    '👨‍💼 DASHBOARD EXPERT' as section,
    'Champs Expert requis' as test,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('id', 'name', 'email', 'company_name', 'specializations', 'experience', 'location', 'rating', 'compensation', 'status', 'total_assignments', 'completed_assignments', 'total_earnings', 'monthly_earnings', 'approval_status', 'phone', 'website', 'linkedin', 'languages', 'availability', 'max_clients', 'hourly_rate') 
        THEN '✅ Champ utilisé dans dashboard'
        ELSE '⚠️ Champ optionnel'
    END as usage
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Expert'
ORDER BY ordinal_position;

-- Vérification des champs expertassignment utilisés dans le dashboard
SELECT 
    '👨‍💼 DASHBOARD EXPERT' as section,
    'Champs expertassignment requis' as test,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('id', 'expert_id', 'client_id', 'produit_eligible_id', 'status', 'assigned_at', 'completed_at', 'earnings', 'rating', 'feedback', 'created_at', 'updated_at') 
        THEN '✅ Champ utilisé dans dashboard'
        ELSE '⚠️ Champ optionnel'
    END as usage
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'expertassignment'
ORDER BY ordinal_position;

-- Vérification des champs conversations utilisés dans le dashboard expert
SELECT 
    '👨‍💼 DASHBOARD EXPERT' as section,
    'Champs conversations requis' as test,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('id', 'type', 'participant_ids', 'title', 'description', 'status', 'last_message_at', 'expert_id', 'client_id', 'created_at', 'updated_at') 
        THEN '✅ Champ utilisé dans dashboard'
        ELSE '⚠️ Champ optionnel'
    END as usage
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversations'
ORDER BY ordinal_position;

-- ===== 3. ANALYSE DASHBOARD ADMIN =====

-- Vérification des tables nécessaires pour le dashboard admin
SELECT 
    '👑 DASHBOARD ADMIN' as section,
    'Tables requises' as test,
    tablename as table_name,
    CASE 
        WHEN tablename IN ('Client', 'Expert', 'ClientProduitEligible', 'Audit', 'expertassignment', 'notification', 'conversations', 'messages') 
        THEN '✅ Table requise présente'
        ELSE '⚠️ Table optionnelle'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('Client', 'Expert', 'ClientProduitEligible', 'Audit', 'expertassignment', 'notification', 'conversations', 'messages', 'CalendarEvent', 'DossierStep', 'CalendarEventParticipant')
ORDER BY tablename;

-- Vérification des champs pour les métriques admin
SELECT 
    '👑 DASHBOARD ADMIN' as section,
    'Champs métriques admin' as test,
    'KPIs calculés' as field_type,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Client') 
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Expert')
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ClientProduitEligible')
        THEN '✅ Toutes les tables pour KPIs présentes'
        ELSE '❌ Tables manquantes pour KPIs'
    END as status;

-- Vérification des champs pour les analytics admin
SELECT 
    '👑 DASHBOARD ADMIN' as section,
    'Champs analytics admin' as test,
    'Métriques temps réel' as field_type,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Audit')
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expertassignment')
        THEN '✅ Tables pour analytics présentes'
        ELSE '❌ Tables manquantes pour analytics'
    END as status;

-- ===== 4. ANALYSE DES RELATIONS ET RÉFÉRENCES =====

-- Vérification des clés étrangères pour les relations dashboard
SELECT 
    '🔗 RELATIONS DASHBOARDS' as section,
    'Clés étrangères requises' as test,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN tc.constraint_name IS NOT NULL 
        THEN '✅ Relation configurée'
        ELSE '❌ Relation manquante'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('ClientProduitEligible', 'expertassignment', 'Audit', 'conversations', 'messages')
ORDER BY tc.table_name, kcu.column_name;

-- ===== 5. ANALYSE DES INDEX POUR PERFORMANCE DASHBOARDS =====

-- Vérification des index critiques pour les dashboards
SELECT 
    '⚡ PERFORMANCE DASHBOARDS' as section,
    'Index critiques' as test,
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE '%_pkey' OR indexname LIKE 'idx_%' 
        THEN '✅ Index présent'
        ELSE '⚠️ Index manquant'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('Client', 'Expert', 'ClientProduitEligible', 'Audit', 'expertassignment', 'conversations', 'messages')
AND (indexname LIKE '%_pkey' OR indexname LIKE 'idx_%')
ORDER BY tablename, indexname;

-- ===== 6. RAPPORT FINAL DE CONFORMITÉ DASHBOARDS =====

WITH dashboard_scores AS (
    SELECT 
        -- Score Dashboard Client (40 points)
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Client') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ClientProduitEligible') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Audit') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification') THEN 10 ELSE 0 END as client_score,
        
        -- Score Dashboard Expert (40 points)
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Expert') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expertassignment') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN 10 ELSE 0 END as expert_score,
        
        -- Score Dashboard Admin (40 points)
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Client') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Expert') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ClientProduitEligible') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Audit') THEN 10 ELSE 0 END as admin_score
)
SELECT 
    '🎯 CONFORMITÉ DASHBOARDS' as section,
    'Score Dashboard Client' as test,
    client_score as score,
    CASE 
        WHEN client_score >= 35 THEN '✅ Excellent'
        WHEN client_score >= 30 THEN '✅ Bon'
        WHEN client_score >= 25 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM dashboard_scores

UNION ALL

SELECT 
    '🎯 CONFORMITÉ DASHBOARDS' as section,
    'Score Dashboard Expert' as test,
    expert_score as score,
    CASE 
        WHEN expert_score >= 35 THEN '✅ Excellent'
        WHEN expert_score >= 30 THEN '✅ Bon'
        WHEN expert_score >= 25 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM dashboard_scores

UNION ALL

SELECT 
    '🎯 CONFORMITÉ DASHBOARDS' as section,
    'Score Dashboard Admin' as test,
    admin_score as score,
    CASE 
        WHEN admin_score >= 35 THEN '✅ Excellent'
        WHEN admin_score >= 30 THEN '✅ Bon'
        WHEN admin_score >= 25 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM dashboard_scores

UNION ALL

SELECT 
    '🎯 CONFORMITÉ DASHBOARDS' as section,
    'Score Total Dashboards' as test,
    (client_score + expert_score + admin_score) as score,
    CASE 
        WHEN (client_score + expert_score + admin_score) >= 105 THEN '✅ Excellent'
        WHEN (client_score + expert_score + admin_score) >= 90 THEN '✅ Bon'
        WHEN (client_score + expert_score + admin_score) >= 75 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM dashboard_scores; 