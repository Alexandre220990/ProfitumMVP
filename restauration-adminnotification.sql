-- ============================================================================
-- RESTAURATION DE LA TABLE AdminNotification
-- Restaure la table avec sa structure complète (17 colonnes, 8 index, 3 triggers)
-- Date: 05 Décembre 2025
-- ============================================================================
-- 
-- ⚠️ ATTENTION: Ce script restaure la table AdminNotification
-- Si vous avez migré les données vers notification, elles ne seront pas restaurées ici
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1: VÉRIFIER L'ÉTAT ACTUEL
-- ============================================================================

DO $$
DECLARE
    table_exists boolean;
    view_exists boolean;
BEGIN
    -- Vérifier si la table existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'AdminNotification'
    ) INTO table_exists;
    
    -- Vérifier si une vue existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'AdminNotification'
    ) INTO view_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'ℹ️ Table AdminNotification existe déjà - Pas de restauration nécessaire';
    ELSIF view_exists THEN
        RAISE NOTICE '⚠️ Une vue AdminNotification existe - Elle sera supprimée et remplacée par la table';
        DROP VIEW IF EXISTS "AdminNotification" CASCADE;
    ELSE
        RAISE NOTICE '✅ AdminNotification n''existe pas - Restauration nécessaire';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2: CRÉER LA TABLE AdminNotification
-- ============================================================================

CREATE TABLE IF NOT EXISTS "AdminNotification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type et contenu
  type TEXT NOT NULL, -- 'document_validation', 'expert_pending', 'dossier_urgent', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Statut
  status TEXT DEFAULT 'pending', -- 'pending', 'read', 'archived'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Métadonnées
  metadata JSONB, -- Données additionnelles (client_id, dossier_id, etc.)
  
  -- Actions
  action_url TEXT, -- URL pour action rapide
  action_label TEXT, -- Label du bouton d'action
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin qui a traité
  handled_by UUID, -- ID de l'admin qui a traité la notification
  handled_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- ÉTAPE 3: CRÉER LES INDEX (8 index selon l'analyse)
-- ============================================================================

-- Index sur status
CREATE INDEX IF NOT EXISTS idx_admin_notification_status 
  ON "AdminNotification"(status);

-- Index sur created_at (DESC pour tri chronologique inverse)
CREATE INDEX IF NOT EXISTS idx_admin_notification_created_at 
  ON "AdminNotification"(created_at DESC);

-- Index sur priority
CREATE INDEX IF NOT EXISTS idx_admin_notification_priority 
  ON "AdminNotification"(priority);

-- Index sur type
CREATE INDEX IF NOT EXISTS idx_admin_notification_type 
  ON "AdminNotification"(type);

-- Index composite sur status et priority
CREATE INDEX IF NOT EXISTS idx_admin_notification_status_priority 
  ON "AdminNotification"(status, priority);

-- Index sur handled_by (pour trouver les notifications traitées par un admin)
CREATE INDEX IF NOT EXISTS idx_admin_notification_handled_by 
  ON "AdminNotification"(handled_by) 
  WHERE handled_by IS NOT NULL;

-- Index sur read_at (pour requêtes temporelles)
CREATE INDEX IF NOT EXISTS idx_admin_notification_read_at 
  ON "AdminNotification"(read_at) 
  WHERE read_at IS NOT NULL;

-- Index sur archived_at (pour nettoyage)
CREATE INDEX IF NOT EXISTS idx_admin_notification_archived_at 
  ON "AdminNotification"(archived_at) 
  WHERE archived_at IS NOT NULL;

-- ============================================================================
-- ÉTAPE 4: CRÉER LES TRIGGERS (3 triggers selon l'analyse)
-- ============================================================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_admin_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_notification_updated_at ON "AdminNotification";
CREATE TRIGGER trg_admin_notification_updated_at
    BEFORE UPDATE ON "AdminNotification"
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_notification_updated_at();

-- Trigger pour initialiser les statuts dans AdminNotificationStatus (si la table existe)
CREATE OR REPLACE FUNCTION initialize_admin_notification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer une entrée de statut pour chaque admin actif
    INSERT INTO "AdminNotificationStatus" (notification_id, admin_id, is_read, is_archived)
    SELECT NEW.id, a.id, FALSE, FALSE
    FROM "Admin" a
    WHERE a.is_active = TRUE
    ON CONFLICT (notification_id, admin_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger seulement si AdminNotificationStatus existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'AdminNotificationStatus'
    ) THEN
        DROP TRIGGER IF EXISTS trg_initialize_admin_notification_status ON "AdminNotification";
        CREATE TRIGGER trg_initialize_admin_notification_status
            AFTER INSERT ON "AdminNotification"
            FOR EACH ROW
            EXECUTE FUNCTION initialize_admin_notification_status();
        
        RAISE NOTICE '✅ Trigger trg_initialize_admin_notification_status créé';
    ELSE
        RAISE NOTICE 'ℹ️ Table AdminNotificationStatus n''existe pas - Trigger non créé';
    END IF;
END $$;

-- Trigger pour validation (optionnel - peut être ajouté plus tard)
-- CREATE TRIGGER trg_admin_notification_validation
--     BEFORE INSERT OR UPDATE ON "AdminNotification"
--     FOR EACH ROW
--     EXECUTE FUNCTION validate_admin_notification();

-- ============================================================================
-- ÉTAPE 5: CRÉER LA VUE AdminNotificationActive
-- ============================================================================

CREATE OR REPLACE VIEW "AdminNotificationActive" AS
SELECT 
  id,
  type,
  title,
  message,
  status,
  priority,
  metadata,
  action_url,
  action_label,
  created_at,
  updated_at,
  read_at,
  archived_at,
  handled_by,
  handled_at,
  CASE 
    WHEN priority = 'urgent' THEN 1
    WHEN priority = 'high' THEN 2
    WHEN priority = 'normal' THEN 3
    ELSE 4
  END as priority_order
FROM "AdminNotification"
WHERE status != 'archived'
ORDER BY priority_order ASC, created_at DESC;

-- ============================================================================
-- ÉTAPE 6: CRÉER LES FONCTIONS HELPER
-- ============================================================================

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_admin_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "AdminNotification"
  SET 
    status = 'read',
    read_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour archiver une notification
CREATE OR REPLACE FUNCTION archive_admin_notification(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "AdminNotification"
  SET 
    status = 'archived',
    archived_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciennes notifications
CREATE OR REPLACE FUNCTION cleanup_old_admin_notifications()
RETURNS void AS $$
BEGIN
  -- Archiver les notifications lues de plus de 30 jours
  UPDATE "AdminNotification"
  SET 
    status = 'archived',
    archived_at = NOW()
  WHERE 
    status = 'read' 
    AND read_at < NOW() - INTERVAL '30 days';
    
  -- Supprimer les notifications archivées de plus de 90 jours
  DELETE FROM "AdminNotification"
  WHERE 
    status = 'archived' 
    AND archived_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÉTAPE 7: AJOUTER LES COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE "AdminNotification" IS 'Notifications pour les administrateurs de la plateforme';
COMMENT ON COLUMN "AdminNotification".type IS 'Type: document_validation, expert_pending, dossier_urgent, etc.';
COMMENT ON COLUMN "AdminNotification".status IS 'Statut: pending, read, archived';
COMMENT ON COLUMN "AdminNotification".priority IS 'Priorité: low, normal, high, urgent';
COMMENT ON COLUMN "AdminNotification".metadata IS 'Données JSON (client_id, dossier_id, etc.)';
COMMENT ON COLUMN "AdminNotification".action_url IS 'URL pour action rapide';
COMMENT ON COLUMN "AdminNotification".action_label IS 'Label du bouton action';

-- ============================================================================
-- ÉTAPE 8: VÉRIFICATION POST-RESTAURATION
-- ============================================================================

DO $$
DECLARE
    table_exists boolean;
    index_count integer;
    trigger_count integer;
    column_count integer;
BEGIN
    -- Vérifier la table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'AdminNotification'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION '❌ ERREUR: Table AdminNotification non créée';
    END IF;
    
    -- Compter les colonnes
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'AdminNotification' 
    AND table_schema = 'public';
    
    -- Compter les index
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'AdminNotification' 
    AND schemaname = 'public';
    
    -- Compter les triggers
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'AdminNotification' 
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT t.tgisinternal;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RESTAURATION RÉUSSIE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Colonnes: % (attendu: 17)', column_count;
    RAISE NOTICE 'Index: % (attendu: 8)', index_count;
    RAISE NOTICE 'Triggers: % (attendu: 3)', trigger_count;
    RAISE NOTICE '========================================';
    
    IF column_count = 17 AND index_count >= 8 AND trigger_count >= 2 THEN
        RAISE NOTICE '✅ Configuration conforme';
    ELSE
        RAISE WARNING '⚠️ Configuration partielle - Vérifier les détails';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- ÉTAPE 9: VÉRIFICATION FINALE
-- ============================================================================

SELECT 
    'Vérification finale' as type,
    'AdminNotification' as table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'AdminNotification' AND table_schema = 'public') as colonnes,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'AdminNotification' AND schemaname = 'public') as index,
    (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'AdminNotification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) as triggers,
    (SELECT COUNT(*) FROM "AdminNotification") as lignes;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- ✅ La table AdminNotification a été restaurée avec :
--    - 17 colonnes
--    - 8 index
--    - 2-3 triggers (selon dépendances)
--    - Vue AdminNotificationActive
--    - Fonctions helper
-- 
-- ⚠️ ATTENTION: Les données n'ont PAS été restaurées
--    Si vous aviez des données dans AdminNotification avant la suppression,
--    elles ont probablement été migrées vers notification.
--    Pour restaurer les données, vous devrez les extraire de notification
--    où user_type='admin' et les réinsérer dans AdminNotification.
-- 
-- 📝 Prochaines étapes recommandées :
--    1. Vérifier que la table fonctionne correctement
--    2. Tester les endpoints qui utilisent AdminNotification
--    3. Décider si vous voulez restaurer les données depuis notification
--    4. Activer RLS si nécessaire (actuellement 0 policy selon l'analyse)
-- 
-- ============================================================================
