-- ============================================================================
-- Migration : Ajout des colonnes sender_id et sender_type à contact_messages
-- Date: 2025-01-15
-- ============================================================================
-- 
-- Cette migration ajoute les colonnes sender_id et sender_type pour
-- identifier qui a créé le lead/message :
-- - sender_id : ID de l'utilisateur (admin, expert) qui a créé le lead
-- - sender_type : Type d'utilisateur ('admin', 'expert') ou NULL pour contact public
--
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Ajouter la colonne sender_id si elle n'existe pas déjà
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_messages' AND column_name = 'sender_id'
  ) THEN
    ALTER TABLE contact_messages ADD COLUMN sender_id UUID;
    RAISE NOTICE 'Colonne sender_id ajoutée';
  ELSE
    RAISE NOTICE 'Colonne sender_id existe déjà';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Ajouter la colonne sender_type si elle n'existe pas déjà
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_messages' AND column_name = 'sender_type'
  ) THEN
    ALTER TABLE contact_messages ADD COLUMN sender_type VARCHAR(50);
    RAISE NOTICE 'Colonne sender_type ajoutée';
  ELSE
    RAISE NOTICE 'Colonne sender_type existe déjà';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Créer un index sur sender_id pour les performances
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contact_messages_sender_id 
  ON contact_messages(sender_id);

-- ----------------------------------------------------------------------------
-- 4. Créer un index sur sender_type pour les performances
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contact_messages_sender_type 
  ON contact_messages(sender_type);

-- ----------------------------------------------------------------------------
-- 5. Ajouter des commentaires
-- ----------------------------------------------------------------------------
COMMENT ON COLUMN contact_messages.sender_id IS 'ID de l''utilisateur (admin/expert) qui a créé le lead. NULL pour les messages de contact public.';
COMMENT ON COLUMN contact_messages.sender_type IS 'Type d''utilisateur qui a créé le lead: ''admin'', ''expert'', ou NULL pour contact public.';

COMMIT;

