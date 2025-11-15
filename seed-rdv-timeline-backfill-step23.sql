-- ============================================================================
-- Étape 23 : Backfill RDV_Timeline à partir des RDV existants
-- ============================================================================

WITH inserted AS (
  INSERT INTO "RDV_Timeline" (
    rdv_id,
    client_id,
    expert_id,
    apporteur_id,
    cabinet_id,
    client_produit_eligible_id,
    event_type,
    metadata,
    created_at
  )
  SELECT
    r.id,
    r.client_id,
    r.expert_id,
    r.apporteur_id,
    r.cabinet_id,
    r.client_produit_eligible_id,
    'rdv_created',
    jsonb_build_object(
      'category', r.category,
      'title', r.title,
      'scheduled_date', r.scheduled_date,
      'scheduled_time', r.scheduled_time,
      'meeting_type', r.meeting_type,
      'status', r.status
    ),
    r.created_at
  FROM "RDV" r
  WHERE NOT EXISTS (
    SELECT 1 FROM "RDV_Timeline" t
    WHERE t.rdv_id = r.id
      AND t.event_type = 'rdv_created'
  )
  RETURNING id
)
SELECT COUNT(*) AS timeline_created FROM inserted;

