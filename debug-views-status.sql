-- Script de débogage pour vérifier l'état des vues et identifier les problèmes

-- 1. Vérifier quelles vues existent
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname LIKE 'vue_apporteur_%'
ORDER BY viewname;

-- 2. Vérifier la structure de la table conversations
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'conversations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier la structure de la table ApporteurCommission
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ApporteurCommission' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Vérifier la structure de la table CalendarEvent
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'CalendarEvent' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Tester les vues qui existent
SELECT 'Test vue_apporteur_rendez_vous' as test_name;
SELECT COUNT(*) as nb_rendez_vous FROM vue_apporteur_rendez_vous;

-- 6. Vérifier les données de test
SELECT 'Données Client' as test_name;
SELECT COUNT(*) as nb_clients FROM "Client" WHERE apporteur_id IS NOT NULL;

SELECT 'Données Dossier' as test_name;
SELECT COUNT(*) as nb_dossiers FROM "Dossier";

SELECT 'Données CalendarEvent' as test_name;
SELECT COUNT(*) as nb_events FROM "CalendarEvent";

SELECT 'Données conversations' as test_name;
SELECT COUNT(*) as nb_conversations FROM "conversations";
