-- =====================================================
-- ANALYSE COMPLÈTE DE CONFORMITÉ DE LA BASE DE DONNÉES
-- Notifications, Agenda, Messages
-- =====================================================

-- 1. ANALYSE NOTIFICATIONS
SELECT 
    '📢 ANALYSE NOTIFICATIONS' as section,
    'Vérification table notification' as test,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification') 
        THEN '✅ Table notification existe'
        ELSE '❌ Table notification manquante'
    END as status;

-- Structure de la table notification
SELECT 
    '📢 ANALYSE NOTIFICATIONS' as section,
    'Structure table notification' as test,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notification'
ORDER BY ordinal_position;

-- Politiques RLS Notification
SELECT 
    '📢 ANALYSE NOTIFICATIONS' as section,
    'Politiques RLS Notification' as test,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'notification'
ORDER BY policyname;

-- 2. ANALYSE CALENDRIER
SELECT 
    '📅 ANALYSE AGENDA' as section,
    'Tables calendrier existantes' as test,
    tablename as table_name,
    CASE 
        WHEN tablename IN ('CalendarEvent', 'CalendarEventParticipant', 'DossierStep') 
        THEN '✅ Table calendrier présente'
        ELSE '⚠️ Table supplémentaire'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%Calendar%' OR tablename = 'DossierStep'
ORDER BY tablename;

-- Structure CalendarEvent
SELECT 
    '📅 ANALYSE AGENDA' as section,
    'Structure CalendarEvent' as test,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'CalendarEvent'
ORDER BY ordinal_position;

-- Structure DossierStep
SELECT 
    '📅 ANALYSE AGENDA' as section,
    'Structure DossierStep' as test,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'DossierStep'
ORDER BY ordinal_position;

-- Index tables calendrier
SELECT 
    '📅 ANALYSE AGENDA' as section,
    'Index tables calendrier' as test,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('CalendarEvent', 'CalendarEventParticipant', 'DossierStep')
ORDER BY tablename, indexname;

-- 3. ANALYSE MESSAGERIE
SELECT 
    '📨 ANALYSE MESSAGERIE' as section,
    'Tables messagerie existantes' as test,
    tablename as table_name,
    CASE 
        WHEN tablename IN ('conversations', 'messages') 
        THEN '✅ Table messagerie présente'
        ELSE '⚠️ Table supplémentaire'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'message_files', 'typing_indicators')
ORDER BY tablename;

-- Structure conversations
SELECT 
    '📨 ANALYSE MESSAGERIE' as section,
    'Structure table conversations' as test,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversations'
ORDER BY ordinal_position;

-- Structure messages
SELECT 
    '📨 ANALYSE MESSAGERIE' as section,
    'Structure table messages' as test,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;

-- Index messagerie
SELECT 
    '📨 ANALYSE MESSAGERIE' as section,
    'Index tables messagerie' as test,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'message_files', 'typing_indicators')
ORDER BY tablename, indexname;

-- Politiques RLS Messagerie
SELECT 
    '📨 ANALYSE MESSAGERIE' as section,
    'Politiques RLS Messagerie' as test,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'message_files', 'typing_indicators')
ORDER BY tablename, policyname;

-- 4. RAPPORT FINAL DE CONFORMITÉ
WITH scores AS (
    SELECT 
        -- Score Notifications (30 points)
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'notification') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification') THEN 10 ELSE 0 END as notification_score,
        
        -- Score Calendrier (40 points)
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CalendarEvent') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CalendarEventParticipant') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'DossierStep') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CalendarEvent') THEN 10 ELSE 0 END as calendar_score,
        
        -- Score Messagerie (30 points)
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN 10 ELSE 0 END +
        CASE WHEN EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'conversations') THEN 10 ELSE 0 END as messaging_score
)
SELECT 
    '🎯 RAPPORT FINAL' as section,
    'Score Notifications' as test,
    notification_score as score,
    CASE 
        WHEN notification_score >= 25 THEN '✅ Excellent'
        WHEN notification_score >= 20 THEN '✅ Bon'
        WHEN notification_score >= 15 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM scores

UNION ALL

SELECT 
    '🎯 RAPPORT FINAL' as section,
    'Score Calendrier' as test,
    calendar_score as score,
    CASE 
        WHEN calendar_score >= 35 THEN '✅ Excellent'
        WHEN calendar_score >= 30 THEN '✅ Bon'
        WHEN calendar_score >= 25 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM scores

UNION ALL

SELECT 
    '🎯 RAPPORT FINAL' as section,
    'Score Messagerie' as test,
    messaging_score as score,
    CASE 
        WHEN messaging_score >= 25 THEN '✅ Excellent'
        WHEN messaging_score >= 20 THEN '✅ Bon'
        WHEN messaging_score >= 15 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM scores

UNION ALL

SELECT 
    '🎯 RAPPORT FINAL' as section,
    'Score Total' as test,
    (notification_score + calendar_score + messaging_score) as score,
    CASE 
        WHEN (notification_score + calendar_score + messaging_score) >= 85 THEN '✅ Excellent'
        WHEN (notification_score + calendar_score + messaging_score) >= 70 THEN '✅ Bon'
        WHEN (notification_score + calendar_score + messaging_score) >= 55 THEN '⚠️ Moyen'
        ELSE '❌ Insuffisant'
    END as status
FROM scores; 