-- ============================================================================
-- RECRÉER LES VUES POUR POINTER VERS RDV
-- ============================================================================
-- Ces vues pointaient vers CalendarEvent, on les recrée vers RDV

BEGIN;

-- 1. Supprimer les anciennes vues
DROP VIEW IF EXISTS v_calendar_events_with_participants CASCADE;
DROP VIEW IF EXISTS v_today_events CASCADE;
DROP VIEW IF EXISTS vue_apporteur_agenda CASCADE;
DROP VIEW IF EXISTS vue_apporteur_rendez_vous CASCADE;

-- 2. Recréer v_calendar_events_with_participants
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

-- 3. Recréer v_today_events
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

-- 4. Recréer vue_apporteur_agenda
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

-- 5. Recréer vue_apporteur_rendez_vous
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

COMMIT;

-- Vérification
SELECT 'Vue créée' AS vue, COUNT(*) as nb_lignes FROM v_calendar_events_with_participants
UNION ALL
SELECT 'Vue créée', COUNT(*) FROM v_today_events
UNION ALL
SELECT 'Vue créée', COUNT(*) FROM vue_apporteur_agenda
UNION ALL
SELECT 'Vue créée', COUNT(*) FROM vue_apporteur_rendez_vous;

