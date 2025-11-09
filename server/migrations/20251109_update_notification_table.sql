-- ============================================================================
-- Migration : Harmonisation de la table public.notification
-- Objectif  : Ajouter toutes les colonnes requises par les services Node
-- Date      : 2025-11-09
-- Auteur    : GPT-5 Codex (assistant)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Colonnes fonctionnelles manquantes
-- ----------------------------------------------------------------------------

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS user_type TEXT;

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS notification_type TEXT NOT NULL DEFAULT 'system';

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unread';

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS action_url TEXT;

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS action_data JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS event_id UUID;

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS event_title TEXT;

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Garantir les valeurs par défaut même si les colonnes existaient déjà
ALTER TABLE public.notification
  ALTER COLUMN notification_type SET DEFAULT 'system';

ALTER TABLE public.notification
  ALTER COLUMN priority SET DEFAULT 'medium';

ALTER TABLE public.notification
  ALTER COLUMN status SET DEFAULT 'unread';

ALTER TABLE public.notification
  ALTER COLUMN is_read SET DEFAULT FALSE;

ALTER TABLE public.notification
  ALTER COLUMN action_data SET DEFAULT '{}'::jsonb;

ALTER TABLE public.notification
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

ALTER TABLE public.notification
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- ----------------------------------------------------------------------------
-- Mise à jour des enregistrements existants
-- ----------------------------------------------------------------------------

UPDATE public.notification
SET
  notification_type = COALESCE(notification_type, 'system'),
  priority = COALESCE(priority, 'medium'),
  status = COALESCE(status, CASE WHEN is_read IS TRUE THEN 'read' ELSE 'unread' END),
  is_read = COALESCE(is_read, FALSE),
  action_data = COALESCE(action_data, '{}'::jsonb),
  metadata = COALESCE(metadata, '{}'::jsonb),
  updated_at = COALESCE(updated_at, NOW())
WHERE TRUE;

-- ----------------------------------------------------------------------------
-- Index pour améliorer les performances des requêtes critiques
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS notification_user_idx
  ON public.notification (user_id);

CREATE INDEX IF NOT EXISTS notification_user_status_idx
  ON public.notification (user_id, status);

CREATE INDEX IF NOT EXISTS notification_user_unread_idx
  ON public.notification (user_id)
  WHERE is_read = FALSE;

COMMIT;

-- ============================================================================
-- Fin de la migration
-- ============================================================================

