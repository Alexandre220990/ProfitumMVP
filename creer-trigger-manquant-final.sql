-- ============================================================================
-- CRÉATION DU TRIGGER MANQUANT SUR notification
-- 4 triggers présents, 5 attendus - Créer celui qui manque
-- Date: 05 Décembre 2025
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1: VÉRIFIER QUELS TRIGGERS EXISTENT DÉJÀ
-- ============================================================================

DO $$
DECLARE
    updated_at_exists boolean;
    children_count_exists boolean;
    validation_exists boolean;
    archive_exists boolean;
    parent_child_exists boolean;
BEGIN
    -- Vérifier updated_at
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%updated%' OR t.tgname LIKE '%update_timestamp%')
        AND NOT t.tgisinternal
    ) INTO updated_at_exists;
    
    -- Vérifier children_count
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%children%' OR t.tgname LIKE '%parent%child%' OR t.tgname = 'trigger_update_parent_children_count')
        AND NOT t.tgisinternal
    ) INTO children_count_exists;
    
    -- Vérifier validation
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%valid%' OR t.tgname LIKE '%check%')
        AND NOT t.tgisinternal
    ) INTO validation_exists;
    
    -- Vérifier archive
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%archive%' OR t.tgname LIKE '%expire%' OR t.tgname LIKE '%auto_archive%')
        AND NOT t.tgisinternal
    ) INTO archive_exists;
    
    -- Vérifier parent_child
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%parent%child%' OR t.tgname LIKE '%manage%parent%')
        AND NOT t.tgisinternal
    ) INTO parent_child_exists;
    
    -- Afficher l'état
    RAISE NOTICE '========================================';
    RAISE NOTICE 'État des triggers:';
    RAISE NOTICE '  updated_at: %', CASE WHEN updated_at_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE '  children_count: %', CASE WHEN children_count_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE '  validation: %', CASE WHEN validation_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE '  archive: %', CASE WHEN archive_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE '  parent_child: %', CASE WHEN parent_child_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- ÉTAPE 2: CRÉER LES FONCTIONS NÉCESSAIRES (si elles n'existent pas)
-- ============================================================================

-- Fonction 1: Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction 2: Mise à jour automatique de children_count
CREATE OR REPLACE FUNCTION update_parent_children_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE notification
    SET 
      children_count = (
        SELECT COUNT(*)
        FROM notification
        WHERE parent_id = NEW.parent_id
          AND is_read = FALSE
          AND status != 'replaced'
          AND hidden_in_list = FALSE
      ),
      updated_at = NOW()
    WHERE id = NEW.parent_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.parent_id IS NOT NULL AND OLD.parent_id != NEW.parent_id THEN
    UPDATE notification
    SET 
      children_count = (
        SELECT COUNT(*)
        FROM notification
        WHERE parent_id = OLD.parent_id
          AND is_read = FALSE
          AND status != 'replaced'
          AND hidden_in_list = FALSE
      ),
      updated_at = NOW()
    WHERE id = OLD.parent_id;
  END IF;

  IF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE notification
    SET 
      children_count = (
        SELECT COUNT(*)
        FROM notification
        WHERE parent_id = OLD.parent_id
          AND is_read = FALSE
          AND status != 'replaced'
          AND hidden_in_list = FALSE
      ),
      updated_at = NOW()
    WHERE id = OLD.parent_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Fonction 3: Validation des données
CREATE OR REPLACE FUNCTION validate_notification_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_parent = TRUE AND NEW.is_child = TRUE THEN
        RAISE EXCEPTION 'Une notification ne peut pas être à la fois parent et enfant';
    END IF;
    
    IF NEW.is_child = TRUE AND NEW.parent_id IS NULL THEN
        RAISE EXCEPTION 'Une notification enfant doit avoir un parent_id';
    END IF;
    
    IF NEW.parent_id IS NOT NULL AND NEW.is_child != TRUE THEN
        RAISE EXCEPTION 'Une notification avec parent_id doit avoir is_child = TRUE';
    END IF;
    
    IF NEW.is_parent = TRUE AND NEW.parent_id IS NOT NULL THEN
        RAISE EXCEPTION 'Une notification parent ne peut pas avoir de parent_id';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction 4: Archivage automatique
CREATE OR REPLACE FUNCTION auto_archive_expired_notifications()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() THEN
        NEW.status = 'archived';
        NEW.archived_at = NOW();
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction 5: Gestion des relations parent/enfant
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

-- ============================================================================
-- ÉTAPE 3: CRÉER LE TRIGGER MANQUANT
-- ============================================================================

DO $$
DECLARE
    updated_at_exists boolean;
    children_count_exists boolean;
    validation_exists boolean;
    archive_exists boolean;
    parent_child_exists boolean;
    trigger_created boolean := false;
BEGIN
    -- Vérifier chaque trigger
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%updated%' OR t.tgname LIKE '%update_timestamp%')
        AND NOT t.tgisinternal
    ) INTO updated_at_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%children%' OR t.tgname LIKE '%parent%child%' OR t.tgname = 'trigger_update_parent_children_count')
        AND NOT t.tgisinternal
    ) INTO children_count_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%valid%' OR t.tgname LIKE '%check%')
        AND NOT t.tgisinternal
    ) INTO validation_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%archive%' OR t.tgname LIKE '%expire%' OR t.tgname LIKE '%auto_archive%')
        AND NOT t.tgisinternal
    ) INTO archive_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%parent%child%' OR t.tgname LIKE '%manage%parent%')
        AND NOT t.tgisinternal
    ) INTO parent_child_exists;
    
    -- Créer le trigger manquant
    IF NOT updated_at_exists THEN
        EXECUTE 'CREATE TRIGGER trigger_notification_updated_at
            BEFORE UPDATE ON notification
            FOR EACH ROW
            EXECUTE FUNCTION update_notification_updated_at()';
        RAISE NOTICE '✅ Trigger trigger_notification_updated_at créé';
        trigger_created := true;
    END IF;
    
    IF NOT children_count_exists THEN
        EXECUTE 'CREATE TRIGGER trigger_update_parent_children_count
            AFTER INSERT OR UPDATE OF parent_id, is_read, status, hidden_in_list OR DELETE
            ON notification
            FOR EACH ROW
            EXECUTE FUNCTION update_parent_children_count()';
        RAISE NOTICE '✅ Trigger trigger_update_parent_children_count créé';
        trigger_created := true;
    END IF;
    
    IF NOT validation_exists THEN
        EXECUTE 'CREATE TRIGGER trigger_notification_validation
            BEFORE INSERT OR UPDATE ON notification
            FOR EACH ROW
            EXECUTE FUNCTION validate_notification_data()';
        RAISE NOTICE '✅ Trigger trigger_notification_validation créé';
        trigger_created := true;
    END IF;
    
    IF NOT archive_exists THEN
        EXECUTE 'CREATE TRIGGER trigger_notification_auto_archive
            BEFORE INSERT OR UPDATE OF expires_at ON notification
            FOR EACH ROW
            EXECUTE FUNCTION auto_archive_expired_notifications()';
        RAISE NOTICE '✅ Trigger trigger_notification_auto_archive créé';
        trigger_created := true;
    END IF;
    
    IF NOT parent_child_exists THEN
        EXECUTE 'CREATE TRIGGER trigger_notification_manage_parent_child
            BEFORE INSERT OR UPDATE OF parent_id, is_parent, is_child ON notification
            FOR EACH ROW
            EXECUTE FUNCTION manage_parent_child_relationships()';
        RAISE NOTICE '✅ Trigger trigger_notification_manage_parent_child créé';
        trigger_created := true;
    END IF;
    
    IF NOT trigger_created THEN
        RAISE NOTICE 'ℹ️ Tous les triggers sont déjà présents';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- ÉTAPE 4: VÉRIFICATION FINALE
-- ============================================================================

SELECT 
    'Triggers finaux' as type,
    t.tgname as nom_trigger,
    pg_get_triggerdef(t.oid) as definition,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✅ Activé'
        ELSE '⚠️ Désactivé'
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'notification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- RÉSUMÉ FINAL
-- ============================================================================

SELECT 
    'Résumé final' as type,
    COUNT(*) as total_triggers,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ Conforme (5 triggers)'
        WHEN COUNT(*) >= 5 THEN CONCAT('✅ ', COUNT(*), ' triggers (5+ attendus)')
        ELSE CONCAT('⚠️ Manque ', 5 - COUNT(*), ' trigger(s)')
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'notification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal;
