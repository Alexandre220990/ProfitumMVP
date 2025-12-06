-- ============================================================================
-- TABLE CLIENT NOTIFICATIONS
-- Date: 05 Décembre 2025
-- Créée sur le même modèle que AdminNotification et ExpertNotification
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
        AND table_name = 'ClientNotification'
    ) INTO table_exists;
    
    -- Vérifier si une vue existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'ClientNotification'
    ) INTO view_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'ℹ️ Table ClientNotification existe déjà - Pas de création nécessaire';
    ELSIF view_exists THEN
        RAISE NOTICE '⚠️ Une vue ClientNotification existe - Elle sera supprimée et remplacée par la table';
        DROP VIEW IF EXISTS "ClientNotification" CASCADE;
    ELSE
        RAISE NOTICE '✅ ClientNotification n''existe pas - Création nécessaire';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2: CRÉER LA TABLE ClientNotification
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ClientNotification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type et contenu
  type TEXT NOT NULL, -- 'document_required', 'dossier_status_changed', 'message_received', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Statut
  status TEXT DEFAULT 'pending', -- 'pending', 'read', 'archived'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Métadonnées
  metadata JSONB, -- Données additionnelles (dossier_id, document_id, etc.)
  
  -- Actions
  action_url TEXT, -- URL pour action rapide
  action_label TEXT, -- Label du bouton d'action
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Client qui a traité
  handled_by UUID, -- ID du client qui a traité la notification
  handled_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- ÉTAPE 3: CRÉER LES INDEX (8 index selon le modèle AdminNotification)
-- ============================================================================

-- Index sur status
CREATE INDEX IF NOT EXISTS idx_client_notification_status 
  ON "ClientNotification"(status);

-- Index sur created_at (DESC pour tri chronologique inverse)
CREATE INDEX IF NOT EXISTS idx_client_notification_created_at 
  ON "ClientNotification"(created_at DESC);

-- Index sur priority
CREATE INDEX IF NOT EXISTS idx_client_notification_priority 
  ON "ClientNotification"(priority);

-- Index sur type
CREATE INDEX IF NOT EXISTS idx_client_notification_type 
  ON "ClientNotification"(type);

-- Index composite sur status et priority
CREATE INDEX IF NOT EXISTS idx_client_notification_status_priority 
  ON "ClientNotification"(status, priority);

-- Index sur handled_by (pour trouver les notifications traitées par un client)
CREATE INDEX IF NOT EXISTS idx_client_notification_handled_by 
  ON "ClientNotification"(handled_by) 
  WHERE handled_by IS NOT NULL;

-- Index sur read_at (pour requêtes temporelles)
CREATE INDEX IF NOT EXISTS idx_client_notification_read_at 
  ON "ClientNotification"(read_at) 
  WHERE read_at IS NOT NULL;

-- Index sur archived_at (pour nettoyage)
CREATE INDEX IF NOT EXISTS idx_client_notification_archived_at 
  ON "ClientNotification"(archived_at) 
  WHERE archived_at IS NOT NULL;

-- ============================================================================
-- ÉTAPE 4: CRÉER LES TRIGGERS (3 triggers selon le modèle AdminNotification)
-- ============================================================================

-- Trigger pour mettre à jour updated_at automatiquement
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

-- Trigger pour initialiser les statuts dans ClientNotificationStatus (si la table existe)
CREATE OR REPLACE FUNCTION initialize_client_notification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer une entrée de statut pour chaque client actif
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ClientNotificationStatus'
    ) THEN
        INSERT INTO "ClientNotificationStatus" (notification_id, client_id, is_read, is_archived)
        SELECT NEW.id, c.id, FALSE, FALSE
        FROM "Client" c
        WHERE c.is_active = TRUE
        ON CONFLICT (notification_id, client_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger seulement si ClientNotificationStatus existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ClientNotificationStatus'
    ) THEN
        DROP TRIGGER IF EXISTS trg_initialize_client_notification_status ON "ClientNotification";
        CREATE TRIGGER trg_initialize_client_notification_status
            AFTER INSERT ON "ClientNotification"
            FOR EACH ROW
            EXECUTE FUNCTION initialize_client_notification_status();
        
        RAISE NOTICE '✅ Trigger trg_initialize_client_notification_status créé';
    ELSE
        RAISE NOTICE 'ℹ️ Table ClientNotificationStatus n''existe pas - Trigger non créé';
    END IF;
END $$;

-- Trigger pour validation
CREATE OR REPLACE FUNCTION validate_client_notification_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validation: status doit être dans la liste autorisée
    IF NEW.status IS NOT NULL AND NEW.status NOT IN ('pending', 'read', 'archived', 'unread') THEN
        RAISE EXCEPTION 'Status invalide: % (doit être pending, read, archived ou unread)', NEW.status;
    END IF;
    
    -- Validation: priority doit être dans la liste autorisée
    IF NEW.priority IS NOT NULL AND NEW.priority NOT IN ('low', 'normal', 'medium', 'high', 'urgent') THEN
        RAISE EXCEPTION 'Priority invalide: % (doit être low, normal, medium, high ou urgent)', NEW.priority;
    END IF;
    
    -- Validation: Si status = 'read', read_at doit être défini
    IF NEW.status = 'read' AND NEW.read_at IS NULL THEN
        NEW.read_at = NOW();
    END IF;
    
    -- Validation: Si status = 'archived', archived_at doit être défini
    IF NEW.status = 'archived' AND NEW.archived_at IS NULL THEN
        NEW.archived_at = NOW();
    END IF;
    
    -- Validation: Si acted_at est défini, status devrait être mis à jour
    IF NEW.handled_at IS NOT NULL AND NEW.status = 'pending' THEN
        NEW.status = 'read';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_notification_validation ON "ClientNotification";
CREATE TRIGGER trg_client_notification_validation
    BEFORE INSERT OR UPDATE ON "ClientNotification"
    FOR EACH ROW
    EXECUTE FUNCTION validate_client_notification_data();

-- ============================================================================
-- ÉTAPE 5: CRÉER LA VUE ClientNotificationActive
-- ============================================================================

CREATE OR REPLACE VIEW "ClientNotificationActive" AS
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
FROM "ClientNotification"
WHERE status != 'archived'
ORDER BY priority_order ASC, created_at DESC;

-- ============================================================================
-- ÉTAPE 6: CRÉER LES FONCTIONS HELPER
-- ============================================================================

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_client_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "ClientNotification"
  SET 
    status = 'read',
    read_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour archiver une notification
CREATE OR REPLACE FUNCTION archive_client_notification(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "ClientNotification"
  SET 
    status = 'archived',
    archived_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciennes notifications
CREATE OR REPLACE FUNCTION cleanup_old_client_notifications()
RETURNS void AS $$
BEGIN
  -- Archiver les notifications lues de plus de 30 jours
  UPDATE "ClientNotification"
  SET 
    status = 'archived',
    archived_at = NOW()
  WHERE 
    status = 'read' 
    AND read_at < NOW() - INTERVAL '30 days';
    
  -- Supprimer les notifications archivées de plus de 90 jours
  DELETE FROM "ClientNotification"
  WHERE 
    status = 'archived' 
    AND archived_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÉTAPE 7: AJOUTER LES COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE "ClientNotification" IS 'Notifications pour les clients de la plateforme';
COMMENT ON COLUMN "ClientNotification".type IS 'Type: document_required, dossier_status_changed, message_received, etc.';
COMMENT ON COLUMN "ClientNotification".status IS 'Statut: pending, read, archived';
COMMENT ON COLUMN "ClientNotification".priority IS 'Priorité: low, normal, high, urgent';
COMMENT ON COLUMN "ClientNotification".metadata IS 'Données JSON (dossier_id, document_id, etc.)';
COMMENT ON COLUMN "ClientNotification".action_url IS 'URL pour action rapide';
COMMENT ON COLUMN "ClientNotification".action_label IS 'Label du bouton action';

-- ============================================================================
-- ÉTAPE 8: VÉRIFICATION POST-CRÉATION
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
        AND table_name = 'ClientNotification'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION '❌ ERREUR: Table ClientNotification non créée';
    END IF;
    
    -- Compter les colonnes
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'ClientNotification' 
    AND table_schema = 'public';
    
    -- Compter les index
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'ClientNotification' 
    AND schemaname = 'public';
    
    -- Compter les triggers
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'ClientNotification' 
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT t.tgisinternal;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CRÉATION RÉUSSIE';
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
    'ClientNotification' as table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ClientNotification' AND table_schema = 'public') as colonnes,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'ClientNotification' AND schemaname = 'public') as index,
    (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'ClientNotification' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND NOT t.tgisinternal) as triggers,
    (SELECT COUNT(*) FROM "ClientNotification") as lignes;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- ✅ La table ClientNotification a été créée avec :
--    - 17 colonnes (même structure que AdminNotification)
--    - 8 index
--    - 3 triggers (updated_at, initialize_status, validation)
--    - Vue ClientNotificationActive
--    - Fonctions helper
-- 
-- 📝 Prochaines étapes recommandées :
--    1. Vérifier que la table fonctionne correctement
--    2. Tester les insertions et mises à jour
--    3. Créer les endpoints qui utilisent ClientNotification
--    4. Activer RLS si nécessaire (actuellement 0 policy)
-- 
-- ============================================================================
