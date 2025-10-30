-- ============================================================================
-- TABLE: DossierComment
-- Système de timeline/commentaires pour suivi commercial des dossiers
-- ============================================================================

CREATE TABLE IF NOT EXISTS "DossierComment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence au dossier
  dossier_id UUID NOT NULL REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
  
  -- Type de commentaire
  comment_type TEXT NOT NULL CHECK (comment_type IN ('system', 'manual')),
  
  -- Catégorie (pour filtrage)
  category TEXT NOT NULL CHECK (category IN (
    'alert',              -- Alertes (inactivité, relances)
    'rdv_event',          -- Événements RDV
    'document',           -- Documents
    'status_change',      -- Changements de statut
    'expert_action',      -- Actions commerciales expert
    'apporteur_action'    -- Actions commerciales apporteur
  )),
  
  -- Sous-catégorie (événement précis)
  event_type TEXT NOT NULL,
  
  -- Contenu
  content TEXT NOT NULL,
  
  -- Métadonnées additionnelles (JSON)
  metadata JSONB DEFAULT '{}',
  
  -- Niveau de priorité (pour alertes)
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Auteur (pour commentaires manuels)
  created_by UUID, -- Référence User (expert, admin, apporteur)
  created_by_type TEXT CHECK (created_by_type IN ('expert', 'admin', 'apporteur', 'system')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Visibilité
  visible_to_expert BOOLEAN DEFAULT true,
  visible_to_apporteur BOOLEAN DEFAULT true,
  visible_to_admin BOOLEAN DEFAULT true
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_dossier_comment_dossier_id ON "DossierComment"(dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_comment_category ON "DossierComment"(category);
CREATE INDEX IF NOT EXISTS idx_dossier_comment_created_at ON "DossierComment"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dossier_comment_priority ON "DossierComment"(priority) WHERE priority IS NOT NULL;

-- ============================================================================
-- FONCTION: Créer un commentaire système automatique
-- ============================================================================

CREATE OR REPLACE FUNCTION create_system_comment(
  p_dossier_id UUID,
  p_category TEXT,
  p_event_type TEXT,
  p_content TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_priority TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_comment_id UUID;
BEGIN
  INSERT INTO "DossierComment" (
    dossier_id,
    comment_type,
    category,
    event_type,
    content,
    metadata,
    priority,
    created_by_type
  ) VALUES (
    p_dossier_id,
    'system',
    p_category,
    p_event_type,
    p_content,
    p_metadata,
    p_priority,
    'system'
  ) RETURNING id INTO v_comment_id;
  
  RETURN v_comment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Commentaires automatiques sur changements de statut
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_status_change_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut a changé
  IF NEW.statut IS DISTINCT FROM OLD.statut THEN
    PERFORM create_system_comment(
      NEW.id,
      'status_change',
      'statut_changed',
      'Statut changé de "' || COALESCE(OLD.statut, 'aucun') || '" à "' || NEW.statut || '"',
      jsonb_build_object(
        'old_status', OLD.statut,
        'new_status', NEW.statut,
        'changed_at', NOW()
      ),
      CASE 
        WHEN NEW.statut IN ('eligibility_rejected', 'cancelled', 'rejected') THEN 'high'
        WHEN NEW.statut IN ('validated', 'refund_completed') THEN 'low'
        ELSE 'medium'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_status_change_comment ON "ClientProduitEligible";
CREATE TRIGGER trg_status_change_comment
  AFTER UPDATE ON "ClientProduitEligible"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_status_change_comment();

-- ============================================================================
-- TRIGGERS: Commentaires automatiques sur événements RDV
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_rdv_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_dossier_id UUID;
  v_event_type TEXT;
  v_content TEXT;
  v_priority TEXT;
BEGIN
  -- Récupérer le dossier_id si client_id est présent
  IF TG_OP = 'INSERT' THEN
    SELECT id INTO v_dossier_id
    FROM "ClientProduitEligible"
    WHERE "clientId" = NEW.client_id
    AND expert_id = NEW.expert_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_dossier_id IS NOT NULL THEN
      v_event_type := 'rdv_created';
      v_content := 'RDV créé: ' || NEW.title || ' le ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY') || ' à ' || NEW.scheduled_time;
      v_priority := CASE WHEN NEW.priority >= 3 THEN 'high' ELSE 'medium' END;
      
      PERFORM create_system_comment(
        v_dossier_id,
        'rdv_event',
        v_event_type,
        v_content,
        jsonb_build_object(
          'rdv_id', NEW.id,
          'scheduled_date', NEW.scheduled_date,
          'scheduled_time', NEW.scheduled_time,
          'meeting_type', NEW.meeting_type
        ),
        v_priority
      );
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT id INTO v_dossier_id
    FROM "ClientProduitEligible"
    WHERE "clientId" = NEW.client_id
    AND expert_id = NEW.expert_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_dossier_id IS NOT NULL THEN
      v_event_type := 'rdv_' || NEW.status;
      v_content := CASE NEW.status
        WHEN 'confirmed' THEN 'RDV confirmé: ' || NEW.title
        WHEN 'completed' THEN 'RDV complété: ' || NEW.title
        WHEN 'cancelled' THEN 'RDV annulé: ' || NEW.title
        WHEN 'rescheduled' THEN 'RDV reprogrammé: ' || NEW.title
        ELSE 'RDV mis à jour: ' || NEW.title
      END;
      v_priority := CASE 
        WHEN NEW.status = 'cancelled' THEN 'high'
        WHEN NEW.status = 'completed' THEN 'low'
        ELSE 'medium'
      END;
      
      PERFORM create_system_comment(
        v_dossier_id,
        'rdv_event',
        v_event_type,
        v_content,
        jsonb_build_object(
          'rdv_id', NEW.id,
          'old_status', OLD.status,
          'new_status', NEW.status
        ),
        v_priority
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rdv_comment ON "RDV";
CREATE TRIGGER trg_rdv_comment
  AFTER INSERT OR UPDATE ON "RDV"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_rdv_comment();

-- ============================================================================
-- TRIGGERS: Commentaires automatiques sur documents (OPTIONNEL)
-- Note: Ce trigger nécessite une table de documents. Décommentez et adaptez
-- selon votre schéma (DocumentFile, GEDDocument, ou autre)
-- ============================================================================

-- DÉSACTIVÉ PAR DÉFAUT - À activer manuellement selon votre schéma
/*
CREATE OR REPLACE FUNCTION trigger_document_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_dossier_id UUID;
  v_event_type TEXT;
  v_content TEXT;
BEGIN
  -- Essayer de récupérer dossier_id depuis metadata
  IF NEW.metadata ? 'dossier_id' THEN
    v_dossier_id := (NEW.metadata->>'dossier_id')::UUID;
  ELSIF NEW.client_id IS NOT NULL THEN
    -- Récupérer le dernier dossier actif du client
    SELECT id INTO v_dossier_id
    FROM "ClientProduitEligible"
    WHERE "clientId" = NEW.client_id
    AND statut NOT IN ('archived', 'cancelled', 'rejected')
    ORDER BY updated_at DESC
    LIMIT 1;
  END IF;
  
  IF v_dossier_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      v_event_type := 'document_uploaded';
      v_content := 'Document uploadé: ' || NEW.original_filename;
      
      PERFORM create_system_comment(
        v_dossier_id,
        'document',
        v_event_type,
        v_content,
        jsonb_build_object(
          'document_id', NEW.id,
          'document_type', NEW.document_type,
          'filename', NEW.original_filename,
          'category', NEW.category
        ),
        'low'
      );
    ELSIF TG_OP = 'UPDATE' AND NEW.validation_status IS DISTINCT FROM OLD.validation_status THEN
      v_event_type := 'document_' || NEW.validation_status;
      v_content := CASE NEW.validation_status
        WHEN 'approved' THEN 'Document validé: ' || NEW.original_filename
        WHEN 'rejected' THEN 'Document rejeté: ' || NEW.original_filename
        ELSE 'Document mis à jour: ' || NEW.original_filename
      END;
      
      PERFORM create_system_comment(
        v_dossier_id,
        'document',
        v_event_type,
        v_content,
        jsonb_build_object(
          'document_id', NEW.id,
          'old_status', OLD.validation_status,
          'new_status', NEW.validation_status
        ),
        CASE WHEN NEW.validation_status = 'rejected' THEN 'medium' ELSE 'low' END
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adaptez le nom de la table selon votre schéma:
-- Option 1: DocumentFile
-- DROP TRIGGER IF EXISTS trg_document_comment ON "DocumentFile";
-- CREATE TRIGGER trg_document_comment
--   AFTER INSERT OR UPDATE ON "DocumentFile"
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_document_comment();

-- Option 2: GEDDocument
-- DROP TRIGGER IF EXISTS trg_document_comment ON "GEDDocument";
-- CREATE TRIGGER trg_document_comment
--   AFTER INSERT OR UPDATE ON "GEDDocument"
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_document_comment();
*/

-- ============================================================================
-- FONCTION: Détecter et créer des alertes d'inactivité
-- ============================================================================

CREATE OR REPLACE FUNCTION check_inactivity_alerts()
RETURNS void AS $$
DECLARE
  v_dossier RECORD;
  v_last_activity TIMESTAMPTZ;
  v_days_inactive INTEGER;
  v_alert_level TEXT;
  v_priority TEXT;
BEGIN
  -- Parcourir tous les dossiers actifs
  FOR v_dossier IN
    SELECT id, "clientId", statut, updated_at
    FROM "ClientProduitEligible"
    WHERE statut NOT IN ('archived', 'cancelled', 'rejected', 'refund_completed')
  LOOP
    -- Récupérer la dernière activité (commentaire ou update)
    SELECT GREATEST(
      v_dossier.updated_at,
      COALESCE((
        SELECT MAX(created_at)
        FROM "DossierComment"
        WHERE dossier_id = v_dossier.id
      ), v_dossier.updated_at)
    ) INTO v_last_activity;
    
    v_days_inactive := EXTRACT(DAY FROM NOW() - v_last_activity)::INTEGER;
    
    -- Déterminer le niveau d'alerte
    IF v_days_inactive >= 30 THEN
      v_alert_level := 'high';
      v_priority := 'critical';
    ELSIF v_days_inactive >= 14 THEN
      v_alert_level := 'medium';
      v_priority := 'high';
    ELSIF v_days_inactive >= 7 THEN
      v_alert_level := 'low';
      v_priority := 'medium';
    ELSE
      CONTINUE; -- Pas d'alerte nécessaire
    END IF;
    
    -- Vérifier si une alerte similaire existe déjà récemment
    IF NOT EXISTS (
      SELECT 1 FROM "DossierComment"
      WHERE dossier_id = v_dossier.id
      AND category = 'alert'
      AND event_type = 'inactivity_' || v_alert_level
      AND created_at > NOW() - INTERVAL '1 day'
    ) THEN
      -- Créer l'alerte
      PERFORM create_system_comment(
        v_dossier.id,
        'alert',
        'inactivity_' || v_alert_level,
        'Aucune action depuis ' || v_days_inactive || ' jours - Relance nécessaire',
        jsonb_build_object(
          'days_inactive', v_days_inactive,
          'last_activity', v_last_activity,
          'alert_level', v_alert_level
        ),
        v_priority
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Vue: Statistiques des commentaires par dossier
-- ============================================================================

CREATE OR REPLACE VIEW "DossierCommentStats" AS
SELECT
  dossier_id,
  COUNT(*) as total_comments,
  COUNT(*) FILTER (WHERE comment_type = 'system') as system_comments,
  COUNT(*) FILTER (WHERE comment_type = 'manual') as manual_comments,
  COUNT(*) FILTER (WHERE category = 'alert') as alerts_count,
  COUNT(*) FILTER (WHERE category = 'rdv_event') as rdv_events_count,
  COUNT(*) FILTER (WHERE category = 'document') as document_events_count,
  COUNT(*) FILTER (WHERE priority = 'critical') as critical_alerts,
  COUNT(*) FILTER (WHERE priority = 'high') as high_alerts,
  MAX(created_at) as last_comment_at
FROM "DossierComment"
WHERE deleted_at IS NULL
GROUP BY dossier_id;

-- ============================================================================
-- RLS (Row Level Security) - À activer si nécessaire
-- ============================================================================

-- ALTER TABLE "DossierComment" ENABLE ROW LEVEL SECURITY;

-- Politique pour experts: voir les commentaires de leurs dossiers
-- CREATE POLICY "Experts can view their dossier comments"
--   ON "DossierComment"
--   FOR SELECT
--   USING (
--     visible_to_expert = true
--     AND dossier_id IN (
--       SELECT id FROM "ClientProduitEligible" WHERE expert_id = auth.uid()
--     )
--   );

-- Commentaires de bienvenue pour dossiers existants
DO $$
DECLARE
  v_dossier RECORD;
BEGIN
  FOR v_dossier IN
    SELECT id, created_at, statut
    FROM "ClientProduitEligible"
    ORDER BY created_at DESC
    LIMIT 100 -- Limiter pour éviter surcharge
  LOOP
    -- Créer commentaire initial si aucun commentaire n'existe
    IF NOT EXISTS (SELECT 1 FROM "DossierComment" WHERE dossier_id = v_dossier.id) THEN
      PERFORM create_system_comment(
        v_dossier.id,
        'status_change',
        'dossier_created',
        'Dossier créé - Statut initial: ' || v_dossier.statut,
        jsonb_build_object(
          'initial_status', v_dossier.statut,
          'created_at', v_dossier.created_at
        ),
        'low'
      );
    END IF;
  END LOOP;
END $$;

COMMENT ON TABLE "DossierComment" IS 'Timeline et commentaires pour suivi commercial des dossiers';
COMMENT ON COLUMN "DossierComment".category IS 'Catégorie: alert, rdv_event, document, status_change, expert_action, apporteur_action';
COMMENT ON COLUMN "DossierComment".priority IS 'Priorité des alertes: low (7j), medium (14j), high (30j), critical';

