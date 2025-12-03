-- ============================================================================
-- Migration : Ajout colonnes système parent/enfant pour notifications
-- Date : 3 Décembre 2025
-- Objectif : Permettre le regroupement des notifications par client
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : AJOUTER LES NOUVELLES COLONNES
-- ============================================================================

-- Colonne parent_id : Référence vers la notification parent
ALTER TABLE notification 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES notification(id) ON DELETE CASCADE;

-- Colonne is_parent : Indique si c'est une notification parent (agrégée)
ALTER TABLE notification 
ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT FALSE;

-- Colonne is_child : Indique si c'est une notification enfant (détail)
ALTER TABLE notification 
ADD COLUMN IF NOT EXISTS is_child BOOLEAN DEFAULT FALSE;

-- Colonne hidden_in_list : Les enfants sont masqués par défaut dans la liste
ALTER TABLE notification 
ADD COLUMN IF NOT EXISTS hidden_in_list BOOLEAN DEFAULT FALSE;

-- Colonne children_count : Nombre d'enfants actifs (pour les parents)
ALTER TABLE notification 
ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0;

COMMENT ON COLUMN notification.parent_id IS 'ID de la notification parent (pour les notifications enfants)';
COMMENT ON COLUMN notification.is_parent IS 'True si notification parent/agrégée';
COMMENT ON COLUMN notification.is_child IS 'True si notification enfant/détail';
COMMENT ON COLUMN notification.hidden_in_list IS 'True si masquée dans la liste principale';
COMMENT ON COLUMN notification.children_count IS 'Nombre de notifications enfants actives';

-- ============================================================================
-- ÉTAPE 2 : CRÉER LES INDEX POUR PERFORMANCE
-- ============================================================================

-- Index sur parent_id pour retrouver rapidement les enfants d'un parent
CREATE INDEX IF NOT EXISTS idx_notification_parent_id 
  ON notification(parent_id) 
  WHERE parent_id IS NOT NULL;

-- Index sur is_parent pour filtrer rapidement les parents
CREATE INDEX IF NOT EXISTS idx_notification_is_parent 
  ON notification(is_parent) 
  WHERE is_parent = TRUE;

-- Index sur hidden_in_list pour filtrer dans les requêtes UI
CREATE INDEX IF NOT EXISTS idx_notification_hidden_in_list 
  ON notification(hidden_in_list) 
  WHERE hidden_in_list = FALSE;

-- Index composite pour requêtes fréquentes (récupérer notifications visibles)
CREATE INDEX IF NOT EXISTS idx_notification_visible_list 
  ON notification(user_id, user_type, is_read, hidden_in_list, created_at DESC)
  WHERE hidden_in_list = FALSE AND status != 'replaced';

-- ============================================================================
-- ÉTAPE 3 : AJOUTER UN TYPE DE NOTIFICATION POUR LES PARENTS
-- ============================================================================

-- Aucune contrainte sur notification_type, mais documenter le nouveau type
COMMENT ON COLUMN notification.notification_type IS 
  'Type de notification. Nouveau type: client_actions_summary (notification parent groupée par client)';

-- ============================================================================
-- ÉTAPE 4 : FONCTION HELPER POUR RECALCULER children_count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_parent_children_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'enfant a un parent, mettre à jour le compteur du parent
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE notification
    SET 
      children_count = (
        SELECT COUNT(*)
        FROM notification
        WHERE parent_id = NEW.parent_id
          AND is_read = FALSE
          AND status != 'replaced'
      ),
      updated_at = NOW()
    WHERE id = NEW.parent_id;
  END IF;

  -- Si l'ancien parent est différent du nouveau (changement de parent), mettre à jour l'ancien
  IF TG_OP = 'UPDATE' AND OLD.parent_id IS NOT NULL AND OLD.parent_id != NEW.parent_id THEN
    UPDATE notification
    SET 
      children_count = (
        SELECT COUNT(*)
        FROM notification
        WHERE parent_id = OLD.parent_id
          AND is_read = FALSE
          AND status != 'replaced'
      ),
      updated_at = NOW()
    WHERE id = OLD.parent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur INSERT et UPDATE
DROP TRIGGER IF EXISTS trigger_update_parent_children_count ON notification;
CREATE TRIGGER trigger_update_parent_children_count
  AFTER INSERT OR UPDATE OF parent_id, is_read, status
  ON notification
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_children_count();

COMMENT ON FUNCTION update_parent_children_count() IS 
  'Met à jour automatiquement children_count du parent quand un enfant change';

-- ============================================================================
-- ÉTAPE 5 : FONCTION HELPER POUR ARCHIVER PARENTS ORPHELINS
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_orphan_parents()
RETURNS TRIGGER AS $$
BEGIN
  -- Si un enfant est supprimé/archivé, vérifier si le parent a encore des enfants
  IF OLD.parent_id IS NOT NULL THEN
    -- Archiver le parent s'il n'a plus d'enfants actifs
    UPDATE notification
    SET 
      status = 'archived',
      is_read = TRUE,
      updated_at = NOW()
    WHERE id = OLD.parent_id
      AND is_parent = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM notification
        WHERE parent_id = OLD.parent_id
          AND is_read = FALSE
          AND status NOT IN ('replaced', 'archived')
      );
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur UPDATE et DELETE
DROP TRIGGER IF EXISTS trigger_archive_orphan_parents ON notification;
CREATE TRIGGER trigger_archive_orphan_parents
  AFTER UPDATE OF is_read, status OR DELETE
  ON notification
  FOR EACH ROW
  WHEN (OLD.parent_id IS NOT NULL)
  EXECUTE FUNCTION archive_orphan_parents();

COMMENT ON FUNCTION archive_orphan_parents() IS 
  'Archive automatiquement les parents qui n ont plus d enfants actifs';

-- ============================================================================
-- ÉTAPE 6 : VÉRIFICATIONS
-- ============================================================================

-- Vérifier que les colonnes ont été ajoutées
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification' AND column_name = 'parent_id'
  ) THEN
    RAISE EXCEPTION 'Erreur: colonne parent_id non créée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification' AND column_name = 'is_parent'
  ) THEN
    RAISE EXCEPTION 'Erreur: colonne is_parent non créée';
  END IF;

  RAISE NOTICE 'Toutes les colonnes ont été créées avec succès';
END $$;

-- Afficher un résumé
SELECT 
  'notification' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notification'
  AND column_name IN ('parent_id', 'is_parent', 'is_child', 'hidden_in_list', 'children_count')
ORDER BY ordinal_position;

COMMIT;

-- ============================================================================
-- NOTES D'UTILISATION
-- ============================================================================

/*
EXEMPLE D'UTILISATION :

1. CRÉER UNE NOTIFICATION PARENT :
   INSERT INTO notification (
     user_id, user_type, title, message,
     notification_type, priority,
     is_parent, children_count,
     ...
   ) VALUES (
     'admin-id', 'admin', 'Client X - 3 dossiers', '...',
     'client_actions_summary', 'high',
     TRUE, 0,  -- sera recalculé automatiquement
     ...
   );

2. CRÉER DES NOTIFICATIONS ENFANTS :
   INSERT INTO notification (
     user_id, user_type, title, message,
     parent_id, is_child, hidden_in_list,
     ...
   ) VALUES (
     'admin-id', 'admin', 'Document DFS', '...',
     'parent-id-uuid', TRUE, TRUE,
     ...
   );
   -- Le trigger mettra à jour children_count automatiquement

3. REQUÊTE POUR AFFICHER SEULEMENT LES PARENTS :
   SELECT * FROM notification
   WHERE user_type = 'admin'
     AND is_read = FALSE
     AND hidden_in_list = FALSE
     AND status != 'replaced'
   ORDER BY created_at DESC;

4. REQUÊTE POUR RÉCUPÉRER LES ENFANTS D'UN PARENT :
   SELECT * FROM notification
   WHERE parent_id = 'parent-id-uuid'
     AND status != 'replaced'
   ORDER BY created_at DESC;

5. ARCHIVER UN PARENT ET SES ENFANTS :
   UPDATE notification
   SET is_read = TRUE, status = 'archived'
   WHERE id = 'parent-id' OR parent_id = 'parent-id';
*/

