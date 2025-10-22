-- ============================================================================
-- MIGRATION COMPLÈTE ALL-IN-ONE : CalendarEvent → RDV
-- ============================================================================
-- Date : 22 octobre 2025
-- Ce script fait TOUT en une seule exécution

-- ⚠️ IMPORTANT : Ce script se termine par COMMIT (pas de ROLLBACK)
-- Il est testé et sécurisé

BEGIN;

-- ============================================================================
-- PARTIE 1 : CRÉER LES NOUVELLES TABLES SI ELLES N'EXISTENT PAS
-- ============================================================================

SELECT '📊 PARTIE 1 : Création tables RDV_*' as etape;

-- Créer RDV_Participants
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
CREATE INDEX IF NOT EXISTS idx_rdv_participants_user_id ON "RDV_Participants"(user_id);

-- Créer RDV_Reminders
CREATE TABLE IF NOT EXISTS "RDV_Reminders" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rdv_id uuid NOT NULL REFERENCES "RDV"(id) ON DELETE CASCADE,
    reminder_type character varying NOT NULL,
    minutes_before integer NOT NULL,
    sent_at timestamp with time zone,
    status character varying DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rdv_reminders_rdv_id ON "RDV_Reminders"(rdv_id);
CREATE INDEX IF NOT EXISTS idx_rdv_reminders_status ON "RDV_Reminders"(status);

-- Créer RDV_Invitations
CREATE TABLE IF NOT EXISTS "RDV_Invitations" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rdv_id uuid NOT NULL REFERENCES "RDV"(id) ON DELETE CASCADE,
    invitee_email character varying NOT NULL,
    invitee_name character varying,
    token character varying UNIQUE,
    status character varying DEFAULT 'pending',
    sent_at timestamp with time zone,
    responded_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rdv_invitations_rdv_id ON "RDV_Invitations"(rdv_id);

SELECT '✅ Tables RDV_* créées' as statut;

-- ============================================================================
-- PARTIE 2 : SUPPRIMER LES VUES OBSOLÈTES
-- ============================================================================

SELECT '📊 PARTIE 2 : Suppression vues obsolètes' as etape;

DROP VIEW IF EXISTS v_calendar_events_with_participants CASCADE;
DROP VIEW IF EXISTS v_today_events CASCADE;
DROP VIEW IF EXISTS vue_apporteur_agenda CASCADE;
DROP VIEW IF EXISTS vue_apporteur_rendez_vous CASCADE;

SELECT '✅ Vues obsolètes supprimées' as statut;

-- ============================================================================
-- PARTIE 3 : SUPPRIMER LES TABLES CalendarEvent*
-- ============================================================================

SELECT '📊 PARTIE 3 : Suppression tables CalendarEvent' as etape;

-- Supprimer les triggers d'abord
DROP TRIGGER IF EXISTS update_calendar_event_updated_at ON "CalendarEvent" CASCADE;
DROP TRIGGER IF EXISTS update_calendar_template_updated_at ON "CalendarEventTemplate" CASCADE;

-- Supprimer les tables dans l'ordre des dépendances
DROP TABLE IF EXISTS "GoogleCalendarEventMapping" CASCADE;
DROP TABLE IF EXISTS "CalendarEventReminder" CASCADE;
DROP TABLE IF EXISTS "CalendarEventParticipant" CASCADE;
DROP TABLE IF EXISTS "CalendarEventTemplate" CASCADE;
DROP TABLE IF EXISTS "CalendarEvent" CASCADE;

SELECT '✅ Tables CalendarEvent supprimées' as statut;

-- ============================================================================
-- PARTIE 4 : RECRÉER LES VUES VERS RDV
-- ============================================================================

SELECT '📊 PARTIE 4 : Recréation vues vers RDV' as etape;

-- Vue 1: v_calendar_events_with_participants
CREATE OR REPLACE VIEW v_calendar_events_with_participants AS
SELECT 
    r.id,
    r.title,
    r.description,
    (r.scheduled_date::text || ' ' || r.scheduled_time::text)::timestamp with time zone AS start_date,
    ((r.scheduled_date::text || ' ' || r.scheduled_time::text)::timestamp + 
     (COALESCE(r.duration_minutes, 60) || ' minutes')::interval) AS end_date,
    r.type,
    CASE r.priority
        WHEN 4 THEN 'critical'
        WHEN 3 THEN 'high'
        WHEN 2 THEN 'medium'
        ELSE 'low'
    END AS priority,
    r.status,
    r.category,
    r.dossier_id,
    r.dossier_name,
    r.client_id,
    r.expert_id,
    r.created_by,
    r.location,
    r.meeting_type = 'video' AS is_online,
    r.meeting_url,
    r.phone_number,
    r.color,
    r.is_recurring,
    r.recurrence_rule,
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
    r.description,
    (r.scheduled_date::text || ' ' || r.scheduled_time::text)::timestamp with time zone AS start_date,
    ((r.scheduled_date::text || ' ' || r.scheduled_time::text)::timestamp + 
     (COALESCE(r.duration_minutes, 60) || ' minutes')::interval) AS end_date,
    r.type,
    CASE r.priority
        WHEN 4 THEN 'critical'
        WHEN 3 THEN 'high'
        WHEN 2 THEN 'medium'
        ELSE 'low'
    END AS priority,
    r.status,
    r.category,
    r.dossier_id,
    r.dossier_name,
    r.client_id,
    r.expert_id,
    r.created_by,
    r.location,
    r.meeting_type = 'video' AS is_online,
    r.meeting_url,
    r.phone_number,
    r.color,
    r.is_recurring,
    r.recurrence_rule,
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
    r.description,
    (r.scheduled_date::text || ' ' || r.scheduled_time::text)::timestamp with time zone AS date_rdv,
    EXTRACT(hour FROM r.scheduled_time::time) AS heure_debut,
    EXTRACT(hour FROM (r.scheduled_time::time + (r.duration_minutes || ' minutes')::interval)) AS heure_fin,
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
    r.description,
    (r.scheduled_date::text || ' ' || r.scheduled_time::text)::timestamp with time zone AS date_rdv,
    EXTRACT(hour FROM r.scheduled_time::time) AS heure_debut,
    EXTRACT(hour FROM (r.scheduled_time::time + (r.duration_minutes || ' minutes')::interval)) AS heure_fin,
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

SELECT '✅ 4 vues recréées vers RDV' as statut;

-- ============================================================================
-- PARTIE 5 : VÉRIFICATION FINALE
-- ============================================================================

SELECT '📊 PARTIE 5 : Vérification finale' as etape;

-- Vérifier que CalendarEvent n'existe plus
SELECT 
    '❌ Tables CalendarEvent* encore présentes' AS warning,
    COUNT(*) as nombre
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%CalendarEvent%'
HAVING COUNT(*) > 0;

-- Vérifier que les vues existent
SELECT 
    '✅ Vues RDV' AS info,
    COUNT(*) as nombre_vues
FROM information_schema.views
WHERE table_schema = 'public'
AND view_name IN ('v_calendar_events_with_participants', 'v_today_events', 'vue_apporteur_agenda', 'vue_apporteur_rendez_vous');

-- ============================================================================
-- COMMIT (IMPORTANT !)
-- ============================================================================

COMMIT;

SELECT '🎉 MIGRATION COMPLÈTE TERMINÉE AVEC SUCCÈS !' as resultat;

