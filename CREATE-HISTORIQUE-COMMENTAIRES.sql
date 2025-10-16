-- ============================================================================
-- TABLES HISTORIQUE & COMMENTAIRES DOSSIERS
-- Date: 16 Octobre 2025
-- ============================================================================

-- Table pour l'historique des modifications
CREATE TABLE IF NOT EXISTS "DossierHistorique" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID NOT NULL REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
  
  -- Qui a fait la modification
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL, -- 'admin', 'client', 'expert', 'apporteur'
  user_name TEXT NOT NULL,
  
  -- Type de modification
  action_type TEXT NOT NULL, -- 'statut_change', 'expert_assigned', 'document_uploaded', 'comment_added', etc.
  
  -- Détails de la modification
  field_changed TEXT, -- Nom du champ modifié
  old_value TEXT, -- Ancienne valeur (JSON string)
  new_value TEXT, -- Nouvelle valeur (JSON string)
  description TEXT, -- Description lisible de la modification
  
  -- Métadonnées
  metadata JSONB, -- Informations additionnelles
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les commentaires
CREATE TABLE IF NOT EXISTS "DossierCommentaire" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID NOT NULL REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
  
  -- Auteur du commentaire
  author_id UUID NOT NULL,
  author_type TEXT NOT NULL, -- 'admin', 'client', 'expert', 'apporteur'
  author_name TEXT NOT NULL,
  
  -- Contenu
  content TEXT NOT NULL,
  
  -- Visibilité
  is_private BOOLEAN DEFAULT false, -- Si true, visible uniquement par admin
  is_pinned BOOLEAN DEFAULT false, -- Commentaire épinglé en haut
  
  -- Réponse à un autre commentaire
  parent_comment_id UUID REFERENCES "DossierCommentaire"(id) ON DELETE CASCADE,
  
  -- Métadonnées
  mentions JSONB, -- Liste des utilisateurs mentionnés [@user]
  attachments JSONB, -- Pièces jointes
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited BOOLEAN DEFAULT false
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_dossier_historique_dossier_id ON "DossierHistorique"(dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_historique_created_at ON "DossierHistorique"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dossier_historique_user_id ON "DossierHistorique"(user_id);
CREATE INDEX IF NOT EXISTS idx_dossier_historique_action_type ON "DossierHistorique"(action_type);

CREATE INDEX IF NOT EXISTS idx_dossier_commentaire_dossier_id ON "DossierCommentaire"(dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_commentaire_created_at ON "DossierCommentaire"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dossier_commentaire_author_id ON "DossierCommentaire"(author_id);
CREATE INDEX IF NOT EXISTS idx_dossier_commentaire_parent_id ON "DossierCommentaire"(parent_comment_id);

-- Fonction pour créer automatiquement une entrée d'historique
CREATE OR REPLACE FUNCTION log_dossier_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_type TEXT;
  v_user_name TEXT;
  v_description TEXT;
BEGIN
  -- Récupérer l'utilisateur depuis le contexte (RLS)
  v_user_id := current_setting('app.current_user_id', true)::UUID;
  v_user_type := current_setting('app.current_user_type', true);
  v_user_name := current_setting('app.current_user_name', true);
  
  -- Si pas de contexte, utiliser un utilisateur système
  IF v_user_id IS NULL THEN
    v_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
    v_user_type := 'system';
    v_user_name := 'Système';
  END IF;
  
  -- Détecter le changement de statut
  IF TG_OP = 'UPDATE' AND OLD.statut != NEW.statut THEN
    v_description := 'Statut changé de "' || OLD.statut || '" à "' || NEW.statut || '"';
    
    INSERT INTO "DossierHistorique" (
      dossier_id, user_id, user_type, user_name,
      action_type, field_changed, old_value, new_value, description
    ) VALUES (
      NEW.id, v_user_id, v_user_type, v_user_name,
      'statut_change', 'statut', OLD.statut, NEW.statut, v_description
    );
  END IF;
  
  -- Détecter l'assignation d'expert
  IF TG_OP = 'UPDATE' AND (OLD.expert_id IS NULL AND NEW.expert_id IS NOT NULL) THEN
    v_description := 'Expert assigné au dossier';
    
    INSERT INTO "DossierHistorique" (
      dossier_id, user_id, user_type, user_name,
      action_type, field_changed, old_value, new_value, description
    ) VALUES (
      NEW.id, v_user_id, v_user_type, v_user_name,
      'expert_assigned', 'expert_id', 
      COALESCE(OLD.expert_id::TEXT, 'null'), 
      NEW.expert_id::TEXT, 
      v_description
    );
  END IF;
  
  -- Détecter le changement d'expert
  IF TG_OP = 'UPDATE' AND OLD.expert_id IS NOT NULL AND NEW.expert_id IS NOT NULL AND OLD.expert_id != NEW.expert_id THEN
    v_description := 'Expert changé';
    
    INSERT INTO "DossierHistorique" (
      dossier_id, user_id, user_type, user_name,
      action_type, field_changed, old_value, new_value, description
    ) VALUES (
      NEW.id, v_user_id, v_user_type, v_user_name,
      'expert_changed', 'expert_id', OLD.expert_id::TEXT, NEW.expert_id::TEXT, v_description
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour log automatique
DROP TRIGGER IF EXISTS trigger_log_dossier_change ON "ClientProduitEligible";
CREATE TRIGGER trigger_log_dossier_change
  AFTER UPDATE ON "ClientProduitEligible"
  FOR EACH ROW
  EXECUTE FUNCTION log_dossier_change();

-- Policies RLS (Row Level Security)

-- Historique visible par tous les participants du dossier
ALTER TABLE "DossierHistorique" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Historique visible par participants" ON "DossierHistorique"
  FOR SELECT
  USING (
    -- Admin voit tout
    current_setting('app.current_user_type', true) = 'admin'
    OR
    -- Client voit son dossier
    (current_setting('app.current_user_type', true) = 'client' 
     AND dossier_id IN (
       SELECT id FROM "ClientProduitEligible" 
       WHERE "clientId" = current_setting('app.current_user_id', true)::UUID
     ))
    OR
    -- Expert voit les dossiers assignés
    (current_setting('app.current_user_type', true) = 'expert' 
     AND dossier_id IN (
       SELECT id FROM "ClientProduitEligible" 
       WHERE expert_id = current_setting('app.current_user_id', true)::UUID
     ))
  );

-- Commentaires visibles selon règles
ALTER TABLE "DossierCommentaire" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commentaires visible par participants" ON "DossierCommentaire"
  FOR SELECT
  USING (
    -- Commentaires publics ou admin
    (NOT is_private OR current_setting('app.current_user_type', true) = 'admin')
    AND
    (
      -- Admin voit tout
      current_setting('app.current_user_type', true) = 'admin'
      OR
      -- Client voit son dossier
      (current_setting('app.current_user_type', true) = 'client' 
       AND dossier_id IN (
         SELECT id FROM "ClientProduitEligible" 
         WHERE "clientId" = current_setting('app.current_user_id', true)::UUID
       ))
      OR
      -- Expert voit les dossiers assignés
      (current_setting('app.current_user_type', true) = 'expert' 
       AND dossier_id IN (
         SELECT id FROM "ClientProduitEligible" 
         WHERE expert_id = current_setting('app.current_user_id', true)::UUID
       ))
    )
  );

CREATE POLICY "Utilisateurs peuvent créer commentaires" ON "DossierCommentaire"
  FOR INSERT
  WITH CHECK (
    author_id = current_setting('app.current_user_id', true)::UUID
    AND author_type = current_setting('app.current_user_type', true)
  );

CREATE POLICY "Utilisateurs peuvent modifier leurs commentaires" ON "DossierCommentaire"
  FOR UPDATE
  USING (author_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY "Utilisateurs peuvent supprimer leurs commentaires" ON "DossierCommentaire"
  FOR DELETE
  USING (
    author_id = current_setting('app.current_user_id', true)::UUID
    OR current_setting('app.current_user_type', true) = 'admin'
  );

-- Fonction pour nettoyer les vieux logs (optionnel)
CREATE OR REPLACE FUNCTION cleanup_old_historique()
RETURNS void AS $$
BEGIN
  -- Garder uniquement les 6 derniers mois d'historique
  DELETE FROM "DossierHistorique"
  WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Vue pour faciliter les requêtes
CREATE OR REPLACE VIEW "DossierHistoriqueEnrichi" AS
SELECT 
  h.*,
  c.company_name as client_name,
  c.first_name as client_first_name,
  c.last_name as client_last_name,
  p.nom as produit_name,
  e.first_name as expert_first_name,
  e.last_name as expert_last_name
FROM "DossierHistorique" h
LEFT JOIN "ClientProduitEligible" cpe ON h.dossier_id = cpe.id
LEFT JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" p ON cpe."produitId" = p.id
LEFT JOIN "Expert" e ON cpe.expert_id = e.id
ORDER BY h.created_at DESC;

COMMENT ON TABLE "DossierHistorique" IS 'Historique des modifications sur les dossiers ClientProduitEligible';
COMMENT ON TABLE "DossierCommentaire" IS 'Commentaires et notes sur les dossiers avec thread/réponses';
COMMENT ON COLUMN "DossierCommentaire".is_private IS 'Si true, visible uniquement par les admins';
COMMENT ON COLUMN "DossierCommentaire".parent_comment_id IS 'Pour les réponses/threads de commentaires';

