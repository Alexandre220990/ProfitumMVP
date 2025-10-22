-- ============================================================================
-- FINALISER MIGRATION RDV - VERSION SIMPLE (colonnes existantes uniquement)
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : CRÉER RDV_Participants
-- ============================================================================

CREATE TABLE IF NOT EXISTS "RDV_Participants" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rdv_id uuid NOT NULL REFERENCES "RDV"(id) ON DELETE CASCADE,
    user_id uuid,
    user_type character varying NOT NULL,
    user_email character varying,
    user_name character varying,
    status character varying NOT NULL DEFAULT 'pending',
    response_date timestamp with time zone,
    notified_at timestamp with time zone,
    reminder_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rdv_participants_rdv_id ON "RDV_Participants"(rdv_id);

SELECT '✅ RDV_Participants créée' as statut;

-- ============================================================================
-- ÉTAPE 2 : SUPPRIMER VUES ET TABLES OBSOLÈTES
-- ============================================================================

DROP VIEW IF EXISTS v_calendar_events_with_participants CASCADE;
DROP VIEW IF EXISTS v_today_events CASCADE;
DROP VIEW IF EXISTS vue_apporteur_agenda CASCADE;
DROP VIEW IF EXISTS vue_apporteur_rendez_vous CASCADE;

DROP TRIGGER IF EXISTS update_calendar_event_updated_at ON "CalendarEvent" CASCADE;
DROP TRIGGER IF EXISTS update_calendar_template_updated_at ON "CalendarEventTemplate" CASCADE;

DROP TABLE IF EXISTS "GoogleCalendarEventMapping" CASCADE;
DROP TABLE IF EXISTS "CalendarEventReminder" CASCADE;
DROP TABLE IF EXISTS "CalendarEventParticipant" CASCADE;
DROP TABLE IF EXISTS "CalendarEventTemplate" CASCADE;
DROP TABLE IF EXISTS "CalendarEvent" CASCADE;

SELECT '✅ Ancien système supprimé' as statut;

-- ============================================================================
-- ÉTAPE 3 : RECRÉER VUES SIMPLES (colonnes existantes uniquement)
-- ============================================================================

-- Vue 1: v_calendar_events_with_participants
CREATE OR REPLACE VIEW v_calendar_events_with_participants AS
SELECT 
    r.id,
    r.title,
    r.notes as description,
    (r.scheduled_date::text || ' ' || r.scheduled_time::text)::timestamp with time zone AS start_date,
    ((r.scheduled_date::text || ' ' || r.scheduled_time::text)::timestamp + 
     (COALESCE(r.duration_minutes, 60) || ' minutes')::interval) AS end_date,
    r.meeting_type as type,
    CASE r.priority
        WHEN 4 THEN 'critical'
        WHEN 3 THEN 'high'
        WHEN 2 THEN 'medium'
        ELSE 'low'
    END AS priority,
    r.status,
    r.category,
    r.client_id,
    r.expert_id,
    r.created_by,
    r.location,
    r.meeting_type = 'video' AS is_online,
    r.meeting_url,
    r.metadata,
    r.created_at,
    r.updated_at,
    COUNT(p.id) AS participant_count,
    array_agg(DISTINCT p.user_name) FILTER (WHERE p.user_name IS NOT NULL) AS participant_names
FROM "RDV" r
LEFT JOIN "RDV_Participants" p ON r.id = p.rdv_id
GROUP BY r.id;

-- Vue 2: v_today_events
CREATE OR REPLACE VIEW v_today_events AS
SELECT 
    r.id,
    r.title,
    r.notes as description,
    (r.scheduled_date::text || ' ' || r.scheduled_time::text)::timestamp with time zone AS start_date,
    ((r.scheduled_date::text || ' ' || r.scheduled_time::text)::timestamp + 
     (COALESCE(r.duration_minutes, 60) || ' minutes')::interval) AS end_date,
    r.meeting_type as type,
    CASE r.priority
        WHEN 4 THEN 'critical'
        WHEN 3 THEN 'high'
        WHEN 2 THEN 'medium'
        ELSE 'low'
    END AS priority,
    r.status,
    r.category,
    r.client_id,
    r.expert_id,
    r.created_by,
    r.location,
    r.meeting_type = 'video' AS is_online,
    r.meeting_url,
    r.metadata,
    r.created_at,
    r.updated_at,
    COUNT(p.id) AS participant_count
FROM "RDV" r
LEFT JOIN "RDV_Participants" p ON r.id = p.rdv_id
WHERE r.scheduled_date = CURRENT_DATE
AND r.status != 'cancelled'
GROUP BY r.id
ORDER BY r.scheduled_time;

-- Vue 3: vue_apporteur_agenda
CREATE OR REPLACE VIEW vue_apporteur_agenda AS
SELECT 
    r.id,
    r.title AS titre,
    r.notes as description,
    (r.scheduled_date::text || ' ' || r.scheduled_time::text)::timestamp with time zone AS date_rdv,
    EXTRACT(hour FROM r.scheduled_time::time) AS heure_debut,
    EXTRACT(hour FROM (r.scheduled_time::time + (COALESCE(r.duration_minutes, 60) || ' minutes')::interval)) AS heure_fin,
    r.duration_minutes AS duree_minutes,
    r.meeting_type AS type_rdv,
    r.status AS statut,
    r.location AS lieu,
    r.notes,
    c.name AS client_nom,
    c.email AS client_email,
    c.phone_number AS client_telephone,
    r.created_at,
    r.updated_at,
    CASE
        WHEN r.scheduled_date = CURRENT_DATE THEN 'aujourd_hui'::text
        WHEN r.scheduled_date = CURRENT_DATE + 1 THEN 'demain'::text
        WHEN r.scheduled_date > CURRENT_DATE THEN 'futur'::text
        ELSE 'passe'::text
    END AS periode
FROM "RDV" r
JOIN "Client" c ON r.client_id = c.id
WHERE r.apporteur_id = (
    SELECT "ApporteurAffaires".id
    FROM "ApporteurAffaires"
    WHERE "ApporteurAffaires".auth_user_id = auth.uid()
)
ORDER BY r.scheduled_date, r.scheduled_time;

-- Vue 4: vue_apporteur_rendez_vous  
CREATE OR REPLACE VIEW vue_apporteur_rendez_vous AS
SELECT 
    r.id,
    r.title AS titre,
    r.notes as description,
    (r.scheduled_date::text || ' ' || r.scheduled_time::text)::timestamp with time zone AS date_rdv,
    EXTRACT(hour FROM r.scheduled_time::time) AS heure_debut,
    EXTRACT(hour FROM (r.scheduled_time::time + (COALESCE(r.duration_minutes, 60) || ' minutes')::interval)) AS heure_fin,
    r.meeting_type AS type_rdv,
    r.status AS statut,
    r.location AS lieu,
    c.name AS client_nom,
    c.email AS client_email,
    c.phone_number AS client_telephone,
    r.created_at,
    r.updated_at
FROM "RDV" r
JOIN "Client" c ON r.client_id = c.id
WHERE r.apporteur_id = (
    SELECT "ApporteurAffaires".id
    FROM "ApporteurAffaires"
    WHERE "ApporteurAffaires".auth_user_id = auth.uid()
)
ORDER BY r.scheduled_date DESC, r.scheduled_time DESC;

SELECT '✅ 4 vues recréées' as statut;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Tables RDV
SELECT 'Tables RDV' as info, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%RDV%'
ORDER BY table_name;

-- Tables CalendarEvent (doit être vide)
SELECT 'Tables CalendarEvent restantes' as info, COUNT(*) as nombre
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%CalendarEvent%';

-- Vues créées (doit être 4)
SELECT 'Vues créées' as info, COUNT(*) as nombre
FROM information_schema.views
WHERE table_schema = 'public'
AND view_name IN ('v_calendar_events_with_participants', 'v_today_events', 'vue_apporteur_agenda', 'vue_apporteur_rendez_vous');

COMMIT;

SELECT '🎉 MIGRATION FINALISÉE !' as resultat;

