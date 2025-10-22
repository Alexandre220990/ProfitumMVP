-- ============================================================================
-- DIAGNOSTIC : Vues et Fonctions référençant CalendarEvent
-- ============================================================================
-- Objectif : Trouver les vues/fonctions obsolètes qui référencent CalendarEvent

-- 1. Lister toutes les VUES de la BDD
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
AND (
    definition LIKE '%CalendarEvent%'
    OR definition LIKE '%CalendarEventParticipant%'
    OR definition LIKE '%CalendarEventReminder%'
)
ORDER BY viewname;

-- 2. Lister toutes les FONCTIONS qui mentionnent CalendarEvent
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) LIKE '%CalendarEvent%'
ORDER BY p.proname;

-- 3. Vérifier les foreign keys de RDV_Reminders
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'RDV_Reminders'
AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Vérifier si CalendarEvent existe encore (vue ou table)
SELECT 
    table_type,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%CalendarEvent%';

-- 5. Chercher dans les triggers
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND (
    event_object_table LIKE '%CalendarEvent%'
    OR action_statement LIKE '%CalendarEvent%'
);

