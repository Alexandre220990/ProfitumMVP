-- ============================================================================
-- CRÉATION DES TRIGGERS POUR ExpertNotification
-- Crée 3 triggers similaires à AdminNotification pour cohérence
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
    WHERE c.relname = 'ExpertNotification' 
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT t.tgisinternal;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VÉRIFICATION DES TRIGGERS ExpertNotification';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Triggers actuels: %', trigger_count;
    
    -- Vérifier chaque trigger
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'ExpertNotification' 
        AND t.tgname LIKE '%updated_at%'
        AND NOT t.tgisinternal
    ) INTO updated_at_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'ExpertNotification' 
        AND t.tgname LIKE '%initialize%status%'
        AND NOT t.tgisinternal
    ) INTO initialize_status_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'ExpertNotification' 
        AND (t.tgname LIKE '%valid%' OR t.tgname LIKE '%check%')
        AND NOT t.tgisinternal
    ) INTO validation_exists;
    
    RAISE NOTICE 'updated_at: %', CASE WHEN updated_at_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'initialize_status: %', CASE WHEN initialize_status_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'validation: %', CASE WHEN validation_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 2. CRÉER LE TRIGGER POUR updated_at
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_expert_notification_updated_at()
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
        WHERE c.relname = 'ExpertNotification' 
        AND t.tgname LIKE '%updated_at%'
        AND NOT t.tgisinternal
    ) THEN
        DROP TRIGGER IF EXISTS trg_expert_notification_updated_at ON "ExpertNotification";
        CREATE TRIGGER trg_expert_notification_updated_at
            BEFORE UPDATE ON "ExpertNotification"
            FOR EACH ROW
            EXECUTE FUNCTION update_expert_notification_updated_at();
        
        RAISE NOTICE '✅ Trigger trg_expert_notification_updated_at créé';
    ELSE
        RAISE NOTICE 'ℹ️ Trigger updated_at existe déjà';
    END IF;
END $$;

-- ============================================================================
-- 3. CRÉER LE TRIGGER POUR INITIALISER LES STATUTS (si table ExpertNotificationStatus existe)
-- ============================================================================

-- Fonction pour initialiser les statuts dans ExpertNotificationStatus (si la table existe)
CREATE OR REPLACE FUNCTION initialize_expert_notification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer une entrée de statut pour chaque expert actif
    -- Note: Adaptez cette logique selon votre structure ExpertNotificationStatus
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ExpertNotificationStatus'
    ) THEN
        INSERT INTO "ExpertNotificationStatus" (notification_id, expert_id, is_read, is_archived)
        SELECT NEW.id, e.id, FALSE, FALSE
        FROM "Expert" e
        WHERE e.is_active = TRUE
        ON CONFLICT (notification_id, expert_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger seulement si ExpertNotificationStatus existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ExpertNotificationStatus'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'ExpertNotification' 
            AND t.tgname LIKE '%initialize%status%'
            AND NOT t.tgisinternal
        ) THEN
            DROP TRIGGER IF EXISTS trg_initialize_expert_notification_status ON "ExpertNotification";
            CREATE TRIGGER trg_initialize_expert_notification_status
                AFTER INSERT ON "ExpertNotification"
                FOR EACH ROW
                EXECUTE FUNCTION initialize_expert_notification_status();
            
            RAISE NOTICE '✅ Trigger trg_initialize_expert_notification_status créé';
        ELSE
            RAISE NOTICE 'ℹ️ Trigger initialize_status existe déjà';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Table ExpertNotificationStatus n''existe pas - Trigger non créé';
    END IF;
END $$;

-- ============================================================================
-- 4. CRÉER LE TRIGGER DE VALIDATION
-- ============================================================================

-- Fonction pour valider les données ExpertNotification
CREATE OR REPLACE FUNCTION validate_expert_notification_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validation: status doit être dans la liste autorisée (si colonne existe)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExpertNotification' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        IF NEW.status IS NOT NULL AND NEW.status NOT IN ('pending', 'read', 'archived', 'unread') THEN
            RAISE EXCEPTION 'Status invalide: % (doit être pending, read, archived ou unread)', NEW.status;
        END IF;
    END IF;
    
    -- Validation: priority doit être dans la liste autorisée (si colonne existe)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExpertNotification' 
        AND column_name = 'priority'
        AND table_schema = 'public'
    ) THEN
        IF NEW.priority IS NOT NULL AND NEW.priority NOT IN ('low', 'normal', 'medium', 'high', 'urgent') THEN
            RAISE EXCEPTION 'Priority invalide: % (doit être low, normal, medium, high ou urgent)', NEW.priority;
        END IF;
    END IF;
    
    -- Validation: Si status = 'read', read_at doit être défini (si colonnes existent)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExpertNotification' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExpertNotification' 
        AND column_name = 'read_at'
        AND table_schema = 'public'
    ) THEN
        IF NEW.status = 'read' AND NEW.read_at IS NULL THEN
            NEW.read_at = NOW();
        END IF;
    END IF;
    
    -- Validation: Si status = 'archived', archived_at doit être défini (si colonnes existent)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExpertNotification' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExpertNotification' 
        AND column_name = 'archived_at'
        AND table_schema = 'public'
    ) THEN
        IF NEW.status = 'archived' AND NEW.archived_at IS NULL THEN
            NEW.archived_at = NOW();
        END IF;
    END IF;
    
    -- Validation: Si acted_at est défini, status devrait être mis à jour (si colonnes existent)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExpertNotification' 
        AND column_name = 'acted_at'
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExpertNotification' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        IF NEW.acted_at IS NOT NULL AND NEW.status = 'pending' THEN
            NEW.status = 'read';
        END IF;
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
        WHERE c.relname = 'ExpertNotification' 
        AND (t.tgname LIKE '%valid%' OR t.tgname LIKE '%check%')
        AND NOT t.tgisinternal
    ) THEN
        DROP TRIGGER IF EXISTS trg_expert_notification_validation ON "ExpertNotification";
        CREATE TRIGGER trg_expert_notification_validation
            BEFORE INSERT OR UPDATE ON "ExpertNotification"
            FOR EACH ROW
            EXECUTE FUNCTION validate_expert_notification_data();
        
        RAISE NOTICE '✅ Trigger trg_expert_notification_validation créé';
    ELSE
        RAISE NOTICE 'ℹ️ Trigger validation existe déjà';
    END IF;
END $$;

-- ============================================================================
-- 5. VÉRIFICATION POST-CRÉATION
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
    WHERE c.relname = 'ExpertNotification' 
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT t.tgisinternal;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'ExpertNotification' 
        AND t.tgname LIKE '%updated_at%'
        AND NOT t.tgisinternal
    ) INTO updated_at_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'ExpertNotification' 
        AND t.tgname LIKE '%initialize%status%'
        AND NOT t.tgisinternal
    ) INTO initialize_status_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'ExpertNotification' 
        AND (t.tgname LIKE '%valid%' OR t.tgname LIKE '%check%')
        AND NOT t.tgisinternal
    ) INTO validation_exists;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSUMÉ POST-CRÉATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Nombre total de triggers: %', trigger_count;
    RAISE NOTICE 'Triggers attendus: 2-3 (selon dépendances)';
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'updated_at: %', CASE WHEN updated_at_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'initialize_status: %', CASE WHEN initialize_status_exists THEN '✅' ELSE 'ℹ️ (optionnel)' END;
    RAISE NOTICE 'validation: %', CASE WHEN validation_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE '========================================';
    
    IF updated_at_exists AND validation_exists THEN
        RAISE NOTICE '✅ Configuration minimale conforme (2 triggers)';
        IF initialize_status_exists THEN
            RAISE NOTICE '✅ Configuration complète conforme (3 triggers)';
        END IF;
    ELSE
        RAISE WARNING '⚠️ Configuration incomplète - Vérifier les détails';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- 6. LISTE FINALE DES TRIGGERS
-- ============================================================================

SELECT 
    'Triggers finaux ExpertNotification' as type,
    t.tgname as nom_trigger,
    pg_get_triggerdef(t.oid) as definition,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✅ Activé'
        ELSE '⚠️ Désactivé'
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'ExpertNotification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- 7. RÉSUMÉ FINAL
-- ============================================================================

SELECT 
    'Résumé final ExpertNotification' as type,
    COUNT(*) as total_triggers,
    CASE 
        WHEN COUNT(*) >= 2 THEN CONCAT('✅ Conforme (', COUNT(*), ' triggers)')
        WHEN COUNT(*) = 1 THEN '⚠️ Configuration minimale (1 trigger)'
        ELSE '❌ Aucun trigger créé'
    END as statut
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'ExpertNotification' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- ✅ Les triggers ExpertNotification ont été créés sur le même modèle que AdminNotification :
--    1. trg_expert_notification_updated_at : Mise à jour automatique de updated_at
--    2. trg_initialize_expert_notification_status : Initialisation des statuts (si table existe)
--    3. trg_expert_notification_validation : Validation des données avant insertion/mise à jour
-- 
-- ⚠️ ATTENTION: 
--    - Le trigger initialize_status ne sera créé que si la table ExpertNotificationStatus existe
--    - Les validations s'adaptent automatiquement aux colonnes présentes dans ExpertNotification
-- 
-- 📝 Prochaines étapes recommandées :
--    1. Vérifier que les triggers fonctionnent correctement
--    2. Tester les insertions et mises à jour
--    3. Adapter les validations selon vos besoins spécifiques
-- 
-- ============================================================================
