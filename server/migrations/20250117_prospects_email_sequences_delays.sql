-- ============================================================================
-- Migration : Permettre les délais individuels par prospect dans les séquences
-- Date: 2025-01-17
-- Description: Ajoute la possibilité de modifier les délais individuellement
-- ============================================================================

BEGIN;

-- ============================================================================
-- Ajouter colonne delay_days_override dans prospect_email_scheduled
-- ============================================================================
ALTER TABLE "prospect_email_scheduled"
ADD COLUMN IF NOT EXISTS delay_days_override INTEGER;

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_prospect_email_scheduled_delay_override 
  ON "prospect_email_scheduled"(delay_days_override) 
  WHERE delay_days_override IS NOT NULL;

-- ============================================================================
-- FONCTION: Recalculer les dates d'envoi avec délais personnalisés
-- ============================================================================
CREATE OR REPLACE FUNCTION recalculate_scheduled_emails_dates(prospect_uuid UUID)
RETURNS VOID AS $$
DECLARE
  scheduled_email RECORD;
  start_date TIMESTAMP WITH TIME ZONE;
  next_date TIMESTAMP WITH TIME ZONE;
  delay_days INTEGER;
BEGIN
  -- Récupérer la date de départ (premier email ou maintenant)
  SELECT MIN(scheduled_for) INTO start_date
  FROM "prospect_email_scheduled"
  WHERE prospect_id = prospect_uuid
    AND status = 'scheduled';
  
  IF start_date IS NULL THEN
    start_date := NOW();
  END IF;
  
  next_date := start_date;

  -- Recalculer les dates pour tous les emails programmés de ce prospect
  FOR scheduled_email IN 
    SELECT * FROM "prospect_email_scheduled"
    WHERE prospect_id = prospect_uuid
      AND status = 'scheduled'
    ORDER BY step_number ASC
  LOOP
    -- Utiliser le délai override si présent, sinon utiliser le délai de la séquence
    IF scheduled_email.delay_days_override IS NOT NULL THEN
      delay_days := scheduled_email.delay_days_override;
    ELSE
      -- Récupérer le délai depuis la séquence
      SELECT delay_days INTO delay_days
      FROM "prospect_email_sequence_steps"
      WHERE sequence_id = scheduled_email.sequence_id
        AND step_number = scheduled_email.step_number;
      
      IF delay_days IS NULL THEN
        delay_days := 0;
      END IF;
    END IF;

    -- Calculer la nouvelle date
    IF scheduled_email.step_number = 1 THEN
      -- Premier email : date de départ
      UPDATE "prospect_email_scheduled"
      SET scheduled_for = start_date
      WHERE id = scheduled_email.id;
      next_date := start_date;
    ELSE
      -- Emails suivants : date précédente + délai
      next_date := next_date + (delay_days || ' days')::INTERVAL;
      
      UPDATE "prospect_email_scheduled"
      SET scheduled_for = next_date
      WHERE id = scheduled_email.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON COLUMN "prospect_email_scheduled".delay_days_override IS 'Délai personnalisé en jours (remplace le délai de la séquence)';
COMMENT ON FUNCTION recalculate_scheduled_emails_dates(UUID) IS 'Recalcule les dates d''envoi avec délais personnalisés pour un prospect';

COMMIT;

-- ============================================================================
-- MESSAGE DE CONFIRMATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration délais individuels terminée avec succès';
    RAISE NOTICE '📅 Possibilité de modifier les délais individuellement par prospect';
END $$;

