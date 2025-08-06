-- ============================================================================
-- VÉRIFICATION SIMPLE DES TABLES EXISTANTES
-- ============================================================================

-- Lister toutes les tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Vérifier si CalendarEvent existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'CalendarEvent'
) as calendar_event_exists;

-- Vérifier si Client existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Client'
) as client_exists;

-- Vérifier si Expert existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Expert'
) as expert_exists;

-- Vérifier si Admin existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Admin'
) as admin_exists; 