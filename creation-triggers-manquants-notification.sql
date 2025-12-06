-- ============================================================================
-- CRÉATION DES TRIGGERS MANQUANTS SUR notification
-- Crée les 2 triggers manquants pour atteindre les 5 attendus
-- Date: 05 Décembre 2025
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1: VÉRIFIER LES TRIGGERS ACTUELS
-- ============================================================================

DO $$
DECLARE
    trigger_count integer;
    updated_at_exists boolean;
    children_count_exists boolean;
    validation_exists boolean;
    archive_exists boolean;
    parent_child_exists boolean;
BEGIN
    -- Compter les triggers
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'notification' 
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT t.tgisinternal;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Triggers actuels: %', trigger_count;
    RAISE NOTICE 'Triggers attendus: 5';
    RAISE NOTICE '========================================';
    
    -- Vérifier chaque type de trigger
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
        AND (t.tgname LIKE '%children%' OR t.tgname LIKE '%parent%child%')
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
        AND (t.tgname LIKE '%archive%' OR t.tgname LIKE '%expire%')
        AND NOT t.tgisinternal
    ) INTO archive_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%parent%' OR t.tgname LIKE '%child%')
        AND NOT t.tgisinternal
    ) INTO parent_child_exists;
    
    RAISE NOTICE 'updated_at: %', CASE WHEN updated_at_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'children_count: %', CASE WHEN children_count_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'validation: %', CASE WHEN validation_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'archive: %', CASE WHEN archive_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'parent_child: %', CASE WHEN parent_child_exists THEN '✅' ELSE '❌' END;
END $$;

-- ============================================================================
-- ÉTAPE 2: CRÉER LE TRIGGER POUR updated_at (si manquant)
-- ============================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger seulement s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%updated%' OR t.tgname LIKE '%update_timestamp%')
        AND NOT t.tgisinternal
    ) THEN
        CREATE TRIGGER trigger_notification_updated_at
            BEFORE UPDATE ON notification
            FOR EACH ROW
            EXECUTE FUNCTION update_notification_updated_at();
        
        RAISE NOTICE '✅ Trigger trigger_notification_updated_at créé';
    ELSE
        RAISE NOTICE 'ℹ️ Trigger updated_at existe déjà';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3: CRÉER LE TRIGGER POUR children_count (si manquant)
-- ============================================================================

-- Fonction pour mettre à jour children_count (déjà dans la migration mais on vérifie)
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
          AND hidden_in_list = FALSE
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
          AND hidden_in_list = FALSE
      ),
      updated_at = NOW()
    WHERE id = OLD.parent_id;
  END IF;

  -- Si un enfant est supprimé, mettre à jour le parent
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

-- Créer le trigger seulement s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%children%' OR t.tgname LIKE '%parent%child%' OR t.tgname = 'trigger_update_parent_children_count')
        AND NOT t.tgisinternal
    ) THEN
        CREATE TRIGGER trigger_update_parent_children_count
            AFTER INSERT OR UPDATE OF parent_id, is_read, status, hidden_in_list OR DELETE
            ON notification
            FOR EACH ROW
            EXECUTE FUNCTION update_parent_children_count();
        
        RAISE NOTICE '✅ Trigger trigger_update_parent_children_count créé';
    ELSE
        RAISE NOTICE 'ℹ️ Trigger children_count existe déjà';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 4: CRÉER LE TRIGGER POUR VALIDATION (si manquant)
-- ============================================================================

-- Fonction pour valider les données
CREATE OR REPLACE FUNCTION validate_notification_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validation: is_parent et is_child ne peuvent pas être tous les deux TRUE
    IF NEW.is_parent = TRUE AND NEW.is_child = TRUE THEN
        RAISE EXCEPTION 'Une notification ne peut pas être à la fois parent et enfant';
    END IF;
    
    -- Validation: Si is_child = TRUE, parent_id doit être défini
    IF NEW.is_child = TRUE AND NEW.parent_id IS NULL THEN
        RAISE EXCEPTION 'Une notification enfant doit avoir un parent_id';
    END IF;
    
    -- Validation: Si parent_id est défini, is_child doit être TRUE
    IF NEW.parent_id IS NOT NULL AND NEW.is_child != TRUE THEN
        RAISE EXCEPTION 'Une notification avec parent_id doit avoir is_child = TRUE';
    END IF;
    
    -- Validation: Si is_parent = TRUE, parent_id doit être NULL
    IF NEW.is_parent = TRUE AND NEW.parent_id IS NOT NULL THEN
        RAISE EXCEPTION 'Une notification parent ne peut pas avoir de parent_id';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger seulement s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%valid%' OR t.tgname LIKE '%check%')
        AND NOT t.tgisinternal
    ) THEN
        CREATE TRIGGER trigger_notification_validation
            BEFORE INSERT OR UPDATE ON notification
            FOR EACH ROW
            EXECUTE FUNCTION validate_notification_data();
        
        RAISE NOTICE '✅ Trigger trigger_notification_validation créé';
    ELSE
        RAISE NOTICE 'ℹ️ Trigger validation existe déjà';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 5: CRÉER LE TRIGGER POUR ARCHIVAGE AUTOMATIQUE (si manquant)
-- ============================================================================

-- Fonction pour archiver automatiquement les notifications expirées
CREATE OR REPLACE FUNCTION auto_archive_expired_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Si expires_at est défini et dépassé, archiver automatiquement
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() THEN
        NEW.status = 'archived';
        NEW.archived_at = NOW();
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger seulement s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%archive%' OR t.tgname LIKE '%expire%')
        AND NOT t.tgisinternal
    ) THEN
        CREATE TRIGGER trigger_notification_auto_archive
            BEFORE INSERT OR UPDATE OF expires_at ON notification
            FOR EACH ROW
            EXECUTE FUNCTION auto_archive_expired_notifications();
        
        RAISE NOTICE '✅ Trigger trigger_notification_auto_archive créé';
    ELSE
        RAISE NOTICE 'ℹ️ Trigger archive existe déjà';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 6: CRÉER LE TRIGGER POUR GESTION PARENT/CHILD (si manquant)
-- ============================================================================

-- Fonction pour gérer automatiquement les relations parent/enfant
CREATE OR REPLACE FUNCTION manage_parent_child_relationships()
RETURNS TRIGGER AS $$
BEGIN
    -- Si parent_id est défini, s'assurer que is_child = TRUE et hidden_in_list = TRUE
    IF NEW.parent_id IS NOT NULL THEN
        NEW.is_child = TRUE;
        NEW.hidden_in_list = TRUE;
        NEW.is_parent = FALSE;
    END IF;
    
    -- Si is_parent = TRUE, s'assurer que parent_id = NULL
    IF NEW.is_parent = TRUE THEN
        NEW.parent_id = NULL;
        NEW.is_child = FALSE;
        NEW.hidden_in_list = FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger seulement s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'notification' 
        AND (t.tgname LIKE '%parent%child%' OR t.tgname LIKE '%manage%parent%')
        AND NOT t.tgisinternal
    ) THEN
        CREATE TRIGGER trigger_notification_manage_parent_child
            BEFORE INSERT OR UPDATE OF parent_id, is_parent, is_child ON notification
            FOR EACH ROW
            EXECUTE FUNCTION manage_parent_child_relationships();
        
        RAISE NOTICE '✅ Trigger trigger_notification_manage_parent_child créé';
    ELSE
        RAISE NOTICE 'ℹ️ Trigger parent_child existe déjà';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 7: VÉRIFICATION POST-CRÉATION
-- ============================================================================

DO $$
DECLARE
    trigger_count integer;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'notification' 
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT t.tgisinternal;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Nombre total de triggers après création: %', trigger_count;
    RAISE NOTICE '========================================';
    
    IF trigger_count >= 5 THEN
        RAISE NOTICE '✅ Objectif atteint : 5 triggers ou plus';
    ELSE
        RAISE NOTICE '⚠️ Il manque encore % trigger(s)', (5 - trigger_count);
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- ÉTAPE 8: LISTE FINALE DES TRIGGERS
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

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
