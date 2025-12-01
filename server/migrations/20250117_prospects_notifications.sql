-- ============================================================================
-- Migration : Notifications pour réponses prospects
-- Date: 2025-01-17
-- Description: Créer des notifications admin quand un prospect répond à un email
-- ============================================================================

BEGIN;

-- ============================================================================
-- FONCTION: Créer une notification admin pour réponse prospect
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_prospect_reply()
RETURNS TRIGGER AS $$
DECLARE
  prospect_data RECORD;
  admin_ids UUID[];
  admin_id UUID;
BEGIN
  -- Vérifier si c'est une nouvelle réponse (replied passe de false à true)
  IF NEW.replied = TRUE AND (OLD.replied IS NULL OR OLD.replied = FALSE) THEN
    -- Récupérer les informations du prospect
    SELECT * INTO prospect_data
    FROM prospects
    WHERE id = NEW.prospect_id;
    
    -- Récupérer tous les admins
    SELECT ARRAY_AGG(id) INTO admin_ids
    FROM "Admin";
    
    -- Créer une notification pour chaque admin
    IF admin_ids IS NOT NULL THEN
      FOREACH admin_id IN ARRAY admin_ids
      LOOP
        INSERT INTO "AdminNotification" (
          admin_id,
          notification_type,
          title,
          message,
          priority,
          status,
          action_url,
          action_data,
          created_at
        ) VALUES (
          admin_id,
          'prospect_reply',
          'Nouvelle réponse prospect',
          format(
            'Le prospect %s (%s) a répondu à l''email #%s',
            COALESCE(prospect_data.firstname || ' ' || prospect_data.lastname, prospect_data.email),
            COALESCE(prospect_data.company_name, 'Entreprise inconnue'),
            NEW.step
          ),
          'high',
          'unread',
          format('/admin/prospection?prospect=%s', prospect_data.id),
          jsonb_build_object(
            'prospect_id', prospect_data.id,
            'prospect_email', prospect_data.email,
            'prospect_name', COALESCE(prospect_data.firstname || ' ' || prospect_data.lastname, prospect_data.email),
            'company_name', prospect_data.company_name,
            'email_id', NEW.id,
            'email_step', NEW.step,
            'replied_at', NEW.replied_at
          ),
          NOW()
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Détecter les réponses et créer notifications
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_notify_prospect_reply ON prospects_emails;

CREATE TRIGGER trigger_notify_prospect_reply
  AFTER UPDATE ON prospects_emails
  FOR EACH ROW
  WHEN (NEW.replied = TRUE AND (OLD.replied IS NULL OR OLD.replied = FALSE))
  EXECUTE FUNCTION notify_prospect_reply();

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON FUNCTION notify_prospect_reply() IS 'Crée une notification admin quand un prospect répond à un email';
COMMENT ON TRIGGER trigger_notify_prospect_reply ON prospects_emails IS 'Déclenche la création de notification lors d''une réponse prospect';

COMMIT;

-- ============================================================================
-- MESSAGE DE CONFIRMATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration notifications prospects terminée avec succès';
    RAISE NOTICE '🔔 Notifications créées automatiquement pour les réponses prospects';
END $$;

