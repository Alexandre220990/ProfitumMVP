-- ============================================================================
-- SUPPRESSION DÉFINITIVE DES TABLES CalendarEvent
-- ============================================================================
-- Ces tables existent encore car le script de migration a été ROLLBACK

BEGIN;

-- 1. Supprimer les vues qui dépendent de CalendarEvent
DROP VIEW IF EXISTS v_calendar_events_with_participants CASCADE;
DROP VIEW IF EXISTS v_today_events CASCADE;
DROP VIEW IF EXISTS vue_apporteur_agenda CASCADE;
DROP VIEW IF EXISTS vue_apporteur_rendez_vous CASCADE;

-- 2. Supprimer les triggers
DROP TRIGGER IF EXISTS update_calendar_event_updated_at ON "CalendarEvent" CASCADE;
DROP TRIGGER IF EXISTS update_calendar_template_updated_at ON "CalendarEventTemplate" CASCADE;

-- 3. Supprimer les fonctions triggers (si elles existent uniquement pour CalendarEvent)
-- Note: update_calendar_updated_at() pourrait être utilisée ailleurs, on ne la supprime pas

-- 4. Supprimer les tables dans l'ordre des dépendances
DROP TABLE IF EXISTS "GoogleCalendarEventMapping" CASCADE;
DROP TABLE IF EXISTS "CalendarEventReminder" CASCADE;
DROP TABLE IF EXISTS "CalendarEventParticipant" CASCADE;
DROP TABLE IF EXISTS "CalendarEventTemplate" CASCADE;
DROP TABLE IF EXISTS "CalendarEvent" CASCADE;

-- 5. Vérifier la suppression
SELECT 
    'Tables CalendarEvent*' AS info,
    COUNT(*) as nombre
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%CalendarEvent%';

-- Doit retourner 0

COMMIT;

-- ============================================================================
-- IMPORTANT : Après cette suppression, exécuter recreer-vues-rdv.sql
-- ============================================================================

