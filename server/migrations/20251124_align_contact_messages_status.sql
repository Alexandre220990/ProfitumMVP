-- ============================================================================
-- Migration : Alignement des statuts contact_messages avec AdminNotification
-- Date: 2025-11-24
-- ============================================================================
-- 
-- Cette migration aligne les statuts de la table contact_messages avec
-- ceux utilisés dans AdminNotification (unread, read, archived)
-- 
-- Mapping :
--   'new' -> 'unread'
--   'read' -> 'read'
--   'replied' -> 'replied' (statut spécifique pour les messages répondus)
--   'archived' -> 'archived'
--
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Ajouter la colonne status si elle n'existe pas déjà
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_messages' AND column_name = 'status'
  ) THEN
    ALTER TABLE contact_messages ADD COLUMN status VARCHAR(50) DEFAULT 'unread';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Migrer les statuts existants vers les nouveaux statuts
-- ----------------------------------------------------------------------------
UPDATE contact_messages
SET status = CASE
  WHEN status = 'new' THEN 'unread'
  WHEN status = 'read' THEN 'read'
  WHEN status = 'replied' THEN 'replied'  -- Garder 'replied' comme statut distinct
  WHEN status = 'archived' THEN 'archived'
  ELSE 'unread'  -- Par défaut pour les valeurs inconnues
END
WHERE status IN ('new', 'read', 'replied', 'archived');

-- ----------------------------------------------------------------------------
-- 3. Créer une contrainte CHECK pour valider les statuts
-- ----------------------------------------------------------------------------
-- Supprimer TOUTES les contraintes CHECK existantes sur la colonne status
DO $$ 
DECLARE
  constraint_name text;
BEGIN
  -- Trouver et supprimer toutes les contraintes CHECK sur la colonne status
  FOR constraint_name IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'contact_messages'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE contact_messages DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    RAISE NOTICE 'Contrainte supprimée: %', constraint_name;
  END LOOP;
END $$;

-- Créer la nouvelle contrainte avec les statuts alignés (incluant 'replied')
ALTER TABLE contact_messages 
  ADD CONSTRAINT contact_messages_status_check 
  CHECK (status IN ('unread', 'read', 'replied', 'archived'));

-- ----------------------------------------------------------------------------
-- 5. Mettre à jour la valeur par défaut
-- ----------------------------------------------------------------------------
ALTER TABLE contact_messages 
  ALTER COLUMN status SET DEFAULT 'unread';

-- ----------------------------------------------------------------------------
-- 6. Créer un index sur status pour les performances
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contact_messages_status 
  ON contact_messages(status);

-- ----------------------------------------------------------------------------
-- 7. Mettre à jour les notifications AdminNotification existantes
-- ----------------------------------------------------------------------------
-- Synchroniser les statuts des notifications de contact avec les messages
UPDATE "AdminNotification"
SET 
  status = cm.status,
  is_read = (cm.status = 'read' OR cm.status = 'replied'), -- replied est considéré comme lu
  read_at = CASE WHEN cm.status IN ('read', 'replied') THEN cm.updated_at ELSE NULL END,
  archived_at = CASE WHEN cm.status = 'archived' THEN cm.updated_at ELSE NULL END,
  updated_at = NOW()
FROM contact_messages cm
WHERE "AdminNotification".type = 'contact_message'
  AND ("AdminNotification".metadata->>'contact_message_id')::text = cm.id::text
  AND "AdminNotification".status != cm.status;

-- ----------------------------------------------------------------------------
-- 8. Commentaires
-- ----------------------------------------------------------------------------
COMMENT ON COLUMN contact_messages.status IS 'Statut: unread (non lu), read (lu), replied (répondu), archived (archivé).';

COMMIT;

