-- ============================================================================
-- Migration : Ajouter la colonne comment aux tables d'emails
-- Date: 2025-12-02
-- Description: Permet d'ajouter des commentaires aux emails envoyés et programmés
-- ============================================================================

BEGIN;

-- ============================================================================
-- Ajouter colonne comment dans prospects_emails
-- ============================================================================
ALTER TABLE "prospects_emails"
ADD COLUMN IF NOT EXISTS comment TEXT;

-- ============================================================================
-- Ajouter colonne comment dans prospect_email_scheduled
-- ============================================================================
ALTER TABLE "prospect_email_scheduled"
ADD COLUMN IF NOT EXISTS comment TEXT;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON COLUMN "prospects_emails".comment IS 'Commentaire personnel sur l''email envoyé';
COMMENT ON COLUMN "prospect_email_scheduled".comment IS 'Commentaire personnel sur l''email programmé';

COMMIT;

-- ============================================================================
-- MESSAGE DE CONFIRMATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration commentaires emails terminée avec succès';
    RAISE NOTICE '💬 Colonne comment ajoutée aux tables d''emails';
END $$;

