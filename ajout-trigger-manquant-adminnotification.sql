-- ============================================================================
-- AJOUT DU TRIGGER MANQUANT SUR AdminNotification
-- Ajoute le 3ème trigger pour atteindre 3 triggers
-- Date: 05 Décembre 2025
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. VÉRIFIER LES TRIGGERS ACTUELS
-- ============================================================================

DO $$
DECLARE
    trigger_count integer;
    updated_at_exists boolean;
    initialize_status_exists boolean;
    validation_exists boolean;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'AdminNotification' 
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT t.tgisinternal;
    
    RAISE NOTICE 'Triggers actuels: %', trigger_count;
    
    -- Vérifier chaque trigger
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'AdminNotification' 
        AND t.tgname LIKE '%updated_at%'
        AND NOT t.tgisinternal
    ) INTO updated_at_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'AdminNotification' 
        AND t.tgname LIKE '%initialize%status%'
        AND NOT t.tgisinternal
    ) INTO initialize_status_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'AdminNotification' 
        AND (t.tgname LIKE '%valid%' OR t.tgname LIKE '%check%')
        AND NOT t.tgisinternal
    ) INTO validation_exists;
    
    RAISE NOTICE 'updated_at: %', CASE WHEN updated_at_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'initialize_status: %', CASE WHEN initialize_status_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'validation: %', CASE WHEN validation_exists THEN '✅' ELSE '❌' END;
END $$;

-- ============================================================================
-- 2. CRÉER LE TRIGGER DE VALIDATION (si manquant)
-- ============================================================================

-- Fonction pour valider les données AdminNotification
CREATE OR REPLACE FUNCTION validate_admin_notification_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validation: status doit être dans la liste autorisée
    IF NEW.status NOT IN ('pending', 'read', 'archived') THEN
        RAISE EXCEPTION 'Status invalide: % (doit être pending, read ou archived)', NEW.status;
    END IF;
    
    -- Validation: priority doit être dans la liste autorisée
    IF NEW.priority NOT IN ('low', 'normal', 'high', 'urgent') THEN
        RAISE EXCEPTION 'Priority invalide: % (doit être low, normal, high ou urgent)', NEW.priority;
    END IF;
    
    -- Validation: Si status = 'read', read_at doit être défini
    IF NEW.status = 'read' AND NEW.read_at IS NULL THEN
        NEW.read_at = NOW();
    END IF;
    
    -- Validation: Si status = 'archived', archived_at doit être défini
    IF NEW.status = 'archived' AND NEW.archived_at IS NULL THEN
        NEW.archived_at = NOW();
    END IF;
    
    -- Validation: Si handled_by est défini, handled_at doit être défini
    IF NEW.handled_by IS NOT NULL AND NEW.handled_at IS NULL THEN
        NEW.handled_at = NOW();
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
        WHERE c.relname = 'AdminNotification' 
        AND (t.tgname LIKE '%valid%' OR t.tgname LIKE '%check%')
        AND NOT t.tgisinternal
    ) THEN
        CREATE TRIGGER trg_admin_notification_validation
            BEFORE INSERT OR UPDATE ON "AdminNotification"
            FOR EACH ROW
            EXECUTE FUNCTION validate_admin_notification_data();
        
        RAISE NOTICE '✅ Trigger trg_admin_notification_validation créé';
    ELSE
        RAISE NOTICE 'ℹ️ Trigger validation existe déjà';
    END IF;
END $$;

-- ============================================================================
-- 3. VÉRIFICATION POST-CRÉATION
-- ============================================================================

DO $$
DECLARE
    trigger_count integer;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'AdminNotification' 
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT t.tgisinternal;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Nombre total de triggers après création: %', trigger_count;
    RAISE NOTICE 'Triggers attendus: 3';
    RAISE NOTICE '========================================';
    
    IF trigger_count >= 3 THEN
        RAISE NOTICE '✅ Objectif atteint : 3 triggers ou plus';
    ELSE
        RAISE NOTICE '⚠️ Il manque encore % trigger(s)', (3 - trigger_count);
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- 4. LISTE FINALE DES TRIGGERS
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
WHERE c.relname = 'AdminNotification' 
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
        WHEN COUNT(*) = 3 THEN '✅ Conforme (3 triggers)'
        WHEN COUNT(*) >= 3 THEN CONCAT('✅ ', COUNT(*), ' triggers (3+ attendus)')
        ELSE CONCAT('⚠️ Manque ', 3 - COUNT(*), ' trigger(s)')
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'AdminNotification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
