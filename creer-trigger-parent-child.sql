-- ============================================================================
-- CRÉATION DU TRIGGER MANQUANT : GESTION PARENT/ENFANT
-- ============================================================================

-- ÉTAPE 1 : Créer la fonction (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION manage_parent_child_relationships()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        NEW.is_child = TRUE;
        NEW.hidden_in_list = TRUE;
        NEW.is_parent = FALSE;
    END IF;
    
    IF NEW.is_parent = TRUE THEN
        NEW.parent_id = NULL;
        NEW.is_child = FALSE;
        NEW.hidden_in_list = FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 2 : Créer le trigger
CREATE TRIGGER trigger_notification_manage_parent_child
    BEFORE INSERT OR UPDATE OF parent_id, is_parent, is_child ON notification
    FOR EACH ROW
    EXECUTE FUNCTION manage_parent_child_relationships();
