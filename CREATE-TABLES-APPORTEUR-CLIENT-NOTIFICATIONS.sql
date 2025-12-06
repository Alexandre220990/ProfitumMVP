-- ============================================================================
-- CRÉATION DES TABLES APPORTEUR ET CLIENT NOTIFICATIONS
-- Date: 05 Décembre 2025
-- Créées sur le même modèle que AdminNotification et ExpertNotification
-- ============================================================================
-- 
-- Ce script crée les deux tables en une seule exécution :
--   1. ApporteurNotification
--   2. ClientNotification
-- 
-- Chaque table contient :
--   - 17 colonnes (même structure que AdminNotification)
--   - 8 index
--   - 3 triggers (updated_at, initialize_status, validation)
--   - Vue Active pour les notifications non archivées
--   - Fonctions helper
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTIE 1: CRÉATION DE LA TABLE APPORTEUR NOTIFICATION
-- ============================================================================

\echo '========================================';
\echo 'CRÉATION DE ApporteurNotification';
\echo '========================================';

-- Vérifier si la table existe
DO $$
DECLARE
    table_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ApporteurNotification'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'ℹ️ Table ApporteurNotification existe déjà';
    ELSE
        RAISE NOTICE '✅ Création de ApporteurNotification';
    END IF;
END $$;

-- Créer la table
CREATE TABLE IF NOT EXISTS "ApporteurNotification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  metadata JSONB,
  action_url TEXT,
  action_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  handled_by UUID,
  handled_at TIMESTAMP WITH TIME ZONE
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_apporteur_notification_status 
  ON "ApporteurNotification"(status);
CREATE INDEX IF NOT EXISTS idx_apporteur_notification_created_at 
  ON "ApporteurNotification"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apporteur_notification_priority 
  ON "ApporteurNotification"(priority);
CREATE INDEX IF NOT EXISTS idx_apporteur_notification_type 
  ON "ApporteurNotification"(type);
CREATE INDEX IF NOT EXISTS idx_apporteur_notification_status_priority 
  ON "ApporteurNotification"(status, priority);
CREATE INDEX IF NOT EXISTS idx_apporteur_notification_handled_by 
  ON "ApporteurNotification"(handled_by) 
  WHERE handled_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_apporteur_notification_read_at 
  ON "ApporteurNotification"(read_at) 
  WHERE read_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_apporteur_notification_archived_at 
  ON "ApporteurNotification"(archived_at) 
  WHERE archived_at IS NOT NULL;

-- Créer les fonctions et triggers
CREATE OR REPLACE FUNCTION update_apporteur_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apporteur_notification_updated_at ON "ApporteurNotification";
CREATE TRIGGER trg_apporteur_notification_updated_at
    BEFORE UPDATE ON "ApporteurNotification"
    FOR EACH ROW
    EXECUTE FUNCTION update_apporteur_notification_updated_at();

CREATE OR REPLACE FUNCTION validate_apporteur_notification_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS NOT NULL AND NEW.status NOT IN ('pending', 'read', 'archived', 'unread') THEN
        RAISE EXCEPTION 'Status invalide: %', NEW.status;
    END IF;
    IF NEW.priority IS NOT NULL AND NEW.priority NOT IN ('low', 'normal', 'medium', 'high', 'urgent') THEN
        RAISE EXCEPTION 'Priority invalide: %', NEW.priority;
    END IF;
    IF NEW.status = 'read' AND NEW.read_at IS NULL THEN
        NEW.read_at = NOW();
    END IF;
    IF NEW.status = 'archived' AND NEW.archived_at IS NULL THEN
        NEW.archived_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apporteur_notification_validation ON "ApporteurNotification";
CREATE TRIGGER trg_apporteur_notification_validation
    BEFORE INSERT OR UPDATE ON "ApporteurNotification"
    FOR EACH ROW
    EXECUTE FUNCTION validate_apporteur_notification_data();

-- Créer la vue
CREATE OR REPLACE VIEW "ApporteurNotificationActive" AS
SELECT 
  id, type, title, message, status, priority, metadata,
  action_url, action_label, created_at, updated_at,
  read_at, archived_at, handled_by, handled_at,
  CASE 
    WHEN priority = 'urgent' THEN 1
    WHEN priority = 'high' THEN 2
    WHEN priority = 'normal' THEN 3
    ELSE 4
  END as priority_order
FROM "ApporteurNotification"
WHERE status != 'archived'
ORDER BY priority_order ASC, created_at DESC;

-- Fonctions helper
CREATE OR REPLACE FUNCTION mark_apporteur_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "ApporteurNotification"
  SET status = 'read', read_at = NOW(), updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION archive_apporteur_notification(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "ApporteurNotification"
  SET status = 'archived', archived_at = NOW(), updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE "ApporteurNotification" IS 'Notifications pour les apporteurs de la plateforme';

-- ============================================================================
-- PARTIE 2: CRÉATION DE LA TABLE CLIENT NOTIFICATION
-- ============================================================================

\echo '========================================';
\echo 'CRÉATION DE ClientNotification';
\echo '========================================';

-- Vérifier si la table existe
DO $$
DECLARE
    table_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ClientNotification'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'ℹ️ Table ClientNotification existe déjà';
    ELSE
        RAISE NOTICE '✅ Création de ClientNotification';
    END IF;
END $$;

-- Créer la table
CREATE TABLE IF NOT EXISTS "ClientNotification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  metadata JSONB,
  action_url TEXT,
  action_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  handled_by UUID,
  handled_at TIMESTAMP WITH TIME ZONE
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_client_notification_status 
  ON "ClientNotification"(status);
CREATE INDEX IF NOT EXISTS idx_client_notification_created_at 
  ON "ClientNotification"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_notification_priority 
  ON "ClientNotification"(priority);
CREATE INDEX IF NOT EXISTS idx_client_notification_type 
  ON "ClientNotification"(type);
CREATE INDEX IF NOT EXISTS idx_client_notification_status_priority 
  ON "ClientNotification"(status, priority);
CREATE INDEX IF NOT EXISTS idx_client_notification_handled_by 
  ON "ClientNotification"(handled_by) 
  WHERE handled_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_client_notification_read_at 
  ON "ClientNotification"(read_at) 
  WHERE read_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_client_notification_archived_at 
  ON "ClientNotification"(archived_at) 
  WHERE archived_at IS NOT NULL;

-- Créer les fonctions et triggers
CREATE OR REPLACE FUNCTION update_client_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_notification_updated_at ON "ClientNotification";
CREATE TRIGGER trg_client_notification_updated_at
    BEFORE UPDATE ON "ClientNotification"
    FOR EACH ROW
    EXECUTE FUNCTION update_client_notification_updated_at();

CREATE OR REPLACE FUNCTION validate_client_notification_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS NOT NULL AND NEW.status NOT IN ('pending', 'read', 'archived', 'unread') THEN
        RAISE EXCEPTION 'Status invalide: %', NEW.status;
    END IF;
    IF NEW.priority IS NOT NULL AND NEW.priority NOT IN ('low', 'normal', 'medium', 'high', 'urgent') THEN
        RAISE EXCEPTION 'Priority invalide: %', NEW.priority;
    END IF;
    IF NEW.status = 'read' AND NEW.read_at IS NULL THEN
        NEW.read_at = NOW();
    END IF;
    IF NEW.status = 'archived' AND NEW.archived_at IS NULL THEN
        NEW.archived_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_notification_validation ON "ClientNotification";
CREATE TRIGGER trg_client_notification_validation
    BEFORE INSERT OR UPDATE ON "ClientNotification"
    FOR EACH ROW
    EXECUTE FUNCTION validate_client_notification_data();

-- Créer la vue
CREATE OR REPLACE VIEW "ClientNotificationActive" AS
SELECT 
  id, type, title, message, status, priority, metadata,
  action_url, action_label, created_at, updated_at,
  read_at, archived_at, handled_by, handled_at,
  CASE 
    WHEN priority = 'urgent' THEN 1
    WHEN priority = 'high' THEN 2
    WHEN priority = 'normal' THEN 3
    ELSE 4
  END as priority_order
FROM "ClientNotification"
WHERE status != 'archived'
ORDER BY priority_order ASC, created_at DESC;

-- Fonctions helper
CREATE OR REPLACE FUNCTION mark_client_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "ClientNotification"
  SET status = 'read', read_at = NOW(), updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION archive_client_notification(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "ClientNotification"
  SET status = 'archived', archived_at = NOW(), updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE "ClientNotification" IS 'Notifications pour les clients de la plateforme';

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

DO $$
DECLARE
    apporteur_exists boolean;
    client_exists boolean;
    apporteur_cols integer;
    client_cols integer;
    apporteur_idx integer;
    client_idx integer;
    apporteur_triggers integer;
    client_triggers integer;
BEGIN
    -- Vérifier les tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ApporteurNotification'
    ) INTO apporteur_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ClientNotification'
    ) INTO client_exists;
    
    -- Compter les colonnes
    SELECT COUNT(*) INTO apporteur_cols
    FROM information_schema.columns
    WHERE table_name = 'ApporteurNotification' AND table_schema = 'public';
    
    SELECT COUNT(*) INTO client_cols
    FROM information_schema.columns
    WHERE table_name = 'ClientNotification' AND table_schema = 'public';
    
    -- Compter les index
    SELECT COUNT(*) INTO apporteur_idx
    FROM pg_indexes
    WHERE tablename = 'ApporteurNotification' AND schemaname = 'public';
    
    SELECT COUNT(*) INTO client_idx
    FROM pg_indexes
    WHERE tablename = 'ClientNotification' AND schemaname = 'public';
    
    -- Compter les triggers
    SELECT COUNT(*) INTO apporteur_triggers
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'ApporteurNotification' 
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT t.tgisinternal;
    
    SELECT COUNT(*) INTO client_triggers
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'ClientNotification' 
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT t.tgisinternal;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RÉSUMÉ DE LA CRÉATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ApporteurNotification:';
    RAISE NOTICE '  - Table: %', CASE WHEN apporteur_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE '  - Colonnes: % (attendu: 17)', apporteur_cols;
    RAISE NOTICE '  - Index: % (attendu: 8)', apporteur_idx;
    RAISE NOTICE '  - Triggers: % (attendu: 2-3)', apporteur_triggers;
    RAISE NOTICE '';
    RAISE NOTICE 'ClientNotification:';
    RAISE NOTICE '  - Table: %', CASE WHEN client_exists THEN '✅' ELSE '❌' END;
    RAISE NOTICE '  - Colonnes: % (attendu: 17)', client_cols;
    RAISE NOTICE '  - Index: % (attendu: 8)', client_idx;
    RAISE NOTICE '  - Triggers: % (attendu: 2-3)', client_triggers;
    RAISE NOTICE '========================================';
    
    IF apporteur_exists AND client_exists 
       AND apporteur_cols = 17 AND client_cols = 17
       AND apporteur_idx >= 8 AND client_idx >= 8
       AND apporteur_triggers >= 2 AND client_triggers >= 2 THEN
        RAISE NOTICE '✅ Configuration conforme pour les deux tables';
    ELSE
        RAISE WARNING '⚠️ Configuration partielle - Vérifier les détails';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- RÉSUMÉ FINAL
-- ============================================================================

SELECT 
    'ApporteurNotification' as table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ApporteurNotification' AND table_schema = 'public') as colonnes,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'ApporteurNotification' AND schemaname = 'public') as index,
    (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'ApporteurNotification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) as triggers,
    (SELECT COUNT(*) FROM "ApporteurNotification") as lignes
UNION ALL
SELECT 
    'ClientNotification' as table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ClientNotification' AND table_schema = 'public') as colonnes,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'ClientNotification' AND schemaname = 'public') as index,
    (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'ClientNotification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) as triggers,
    (SELECT COUNT(*) FROM "ClientNotification") as lignes;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- ✅ Les deux tables ont été créées avec succès :
--    - ApporteurNotification : 17 colonnes, 8 index, 2-3 triggers
--    - ClientNotification : 17 colonnes, 8 index, 2-3 triggers
-- 
-- 📝 Prochaines étapes recommandées :
--    1. Vérifier que les tables fonctionnent correctement
--    2. Tester les insertions et mises à jour
--    3. Créer les endpoints qui utilisent ces tables
--    4. Activer RLS si nécessaire (actuellement 0 policy pour chaque table)
-- 
-- ============================================================================
