-- ============================================================================
-- MIGRATION UNIFICATION SYSTÈME DOCUMENTAIRE PROFITUM
-- Date: 10 Octobre 2025
-- ============================================================================
-- ⚠️ À exécuter dans Supabase SQL Editor
-- ⚠️ Faire un backup avant exécution
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : ENRICHIR GEDDocument
-- ============================================================================

-- Supprimer contrainte CHECK sur category si elle existe
ALTER TABLE "GEDDocument" DROP CONSTRAINT IF EXISTS "GEDDocument_category_check";

-- Ajouter colonnes pour fonctionnalités de documentation_items
ALTER TABLE "GEDDocument" 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS author_id UUID,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

-- Créer index pour performances
CREATE INDEX IF NOT EXISTS idx_ged_document_slug ON "GEDDocument"(slug);
CREATE INDEX IF NOT EXISTS idx_ged_document_published ON "GEDDocument"(is_published);
CREATE INDEX IF NOT EXISTS idx_ged_document_category ON "GEDDocument"(category);
CREATE INDEX IF NOT EXISTS idx_ged_document_tags ON "GEDDocument" USING GIN(tags);

RAISE NOTICE '✅ GEDDocument enrichi avec succès';

-- ============================================================================
-- ÉTAPE 2 : CRÉER TABLE ClientProcessDocument
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ClientProcessDocument" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  client_id UUID REFERENCES "Client"(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES "ProduitEligible"(id),
  
  -- Classification
  workflow_step VARCHAR(50), -- 'cgv', 'simulation', 'facture', etc.
  document_type VARCHAR(100) NOT NULL, -- Type précis du document
  
  -- Informations fichier
  filename VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL, -- Chemin dans bucket
  bucket_name VARCHAR(100) NOT NULL, -- 'client-documents', 'rapports', etc.
  file_size BIGINT,
  mime_type VARCHAR(100),
  
  -- Traçabilité
  uploaded_by UUID, -- ID utilisateur (Admin, Expert, ou Client)
  uploaded_by_type VARCHAR(20), -- 'admin', 'expert', 'client'
  
  -- Validation
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'validated', 'rejected'
  validated_by UUID,
  validated_at TIMESTAMP,
  validation_notes TEXT,
  
  -- Métadonnées flexibles
  metadata JSONB DEFAULT '{}',
  
  -- Dates
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_client_process_doc_client ON "ClientProcessDocument"(client_id);
CREATE INDEX IF NOT EXISTS idx_client_process_doc_produit ON "ClientProcessDocument"(produit_id);
CREATE INDEX IF NOT EXISTS idx_client_process_doc_type ON "ClientProcessDocument"(document_type);
CREATE INDEX IF NOT EXISTS idx_client_process_doc_workflow ON "ClientProcessDocument"(workflow_step);
CREATE INDEX IF NOT EXISTS idx_client_process_doc_status ON "ClientProcessDocument"(status);
CREATE INDEX IF NOT EXISTS idx_client_process_doc_created ON "ClientProcessDocument"(created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_client_process_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_process_document_updated_at
  BEFORE UPDATE ON "ClientProcessDocument"
  FOR EACH ROW
  EXECUTE FUNCTION update_client_process_document_updated_at();

RAISE NOTICE '✅ Table ClientProcessDocument créée avec succès';

-- ============================================================================
-- ÉTAPE 3 : RLS POLICIES - ClientProcessDocument
-- ============================================================================

ALTER TABLE "ClientProcessDocument" ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes policies si existent
DROP POLICY IF EXISTS "admin_all_client_process_documents" ON "ClientProcessDocument";
DROP POLICY IF EXISTS "client_view_own_process_documents" ON "ClientProcessDocument";
DROP POLICY IF EXISTS "expert_view_assigned_client_documents" ON "ClientProcessDocument";
DROP POLICY IF EXISTS "apporteur_view_own_client_documents" ON "ClientProcessDocument";

-- Admin peut tout voir/faire
CREATE POLICY "admin_all_client_process_documents"
  ON "ClientProcessDocument"
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM "Admin" 
      WHERE "Admin".auth_user_id = auth.uid()
    )
  );

-- Client voit ses propres documents
CREATE POLICY "client_view_own_process_documents"
  ON "ClientProcessDocument"
  FOR SELECT
  TO public
  USING (
    client_id IN (
      SELECT id FROM "Client" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Expert voit documents de ses clients assignés
CREATE POLICY "expert_view_assigned_client_documents"
  ON "ClientProcessDocument"
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 
      FROM "Expert" e
      JOIN "ClientProduitEligible" cpe ON cpe.expert_id = e.id
      WHERE e.auth_user_id = auth.uid()
        AND cpe."clientId" = "ClientProcessDocument".client_id::text::uuid
        AND cpe."produitId" = "ClientProcessDocument".produit_id::text::uuid
    )
  );

-- Apporteur voit documents de ses clients
CREATE POLICY "apporteur_view_own_client_documents"
  ON "ClientProcessDocument"
  FOR SELECT
  TO public
  USING (
    client_id IN (
      SELECT id FROM "Client" 
      WHERE apporteur_id IN (
        SELECT id FROM "ApporteurAffaires"
        WHERE auth_user_id = auth.uid()
      )
    )
  );

RAISE NOTICE '✅ RLS Policies ClientProcessDocument créées';

-- ============================================================================
-- ÉTAPE 4 : MIGRER documentation_items → GEDDocument
-- ============================================================================

-- Migrer les données existantes (si existent)
INSERT INTO "GEDDocument" (
  title,
  description,
  content,
  category,
  slug,
  meta_description,
  tags,
  is_published,
  is_featured,
  view_count,
  helpful_count,
  not_helpful_count,
  author_id,
  created_at,
  published_at,
  is_active
)
SELECT 
  title,
  meta_description as description,
  content,
  'documentation' as category, -- Catégorie par défaut
  slug,
  meta_description,
  tags,
  is_published,
  is_featured,
  view_count,
  helpful_count,
  not_helpful_count,
  author_id,
  created_at,
  published_at,
  true as is_active
FROM documentation_items
WHERE is_published = true
ON CONFLICT (slug) DO NOTHING; -- Éviter doublons si slug existe

-- Migrer les permissions (mapper category_id vers permissions par type)
INSERT INTO "GEDDocumentPermission" (
  document_id,
  user_type,
  can_read,
  can_write,
  can_delete,
  can_share
)
SELECT 
  gd.id,
  'client' as user_type,
  true as can_read,
  false as can_write,
  false as can_delete,
  false as can_share
FROM "GEDDocument" gd
WHERE gd.category = 'documentation'
  AND gd.is_published = true
ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ Données migrées de documentation_items vers GEDDocument';

-- ============================================================================
-- ÉTAPE 5 : CRÉER VUE HELPER POUR ADMIN
-- ============================================================================

-- Vue pour liste documents process clients avec infos enrichies
CREATE OR REPLACE VIEW v_admin_client_process_documents AS
SELECT 
  cpd.*,
  c.name as client_name,
  c.company_name as client_company,
  c.email as client_email,
  pe.nom as produit_nom,
  pe.categorie as produit_categorie,
  ub.name as uploader_name,
  ub.email as uploader_email,
  vb.name as validator_name,
  vb.email as validator_email
FROM "ClientProcessDocument" cpd
LEFT JOIN "Client" c ON cpd.client_id = c.id
LEFT JOIN "ProduitEligible" pe ON cpd.produit_id = pe.id
LEFT JOIN LATERAL (
  SELECT name, email FROM "Admin" WHERE id = cpd.uploaded_by
  UNION ALL
  SELECT name, email FROM "Expert" WHERE id = cpd.uploaded_by
  UNION ALL
  SELECT name, email FROM "Client" WHERE id = cpd.uploaded_by
  LIMIT 1
) ub ON true
LEFT JOIN LATERAL (
  SELECT name, email FROM "Admin" WHERE id = cpd.validated_by
  LIMIT 1
) vb ON true;

-- Vue pour documentation app avec permissions
CREATE OR REPLACE VIEW v_admin_documentation_app AS
SELECT 
  gd.*,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'user_type', gdp.user_type,
        'can_read', gdp.can_read,
        'can_write', gdp.can_write
      )
    ) FILTER (WHERE gdp.id IS NOT NULL),
    '[]'
  ) as permissions,
  COALESCE(
    json_agg(
      DISTINCT gdl.name
    ) FILTER (WHERE gdl.id IS NOT NULL),
    '[]'
  ) as labels
FROM "GEDDocument" gd
LEFT JOIN "GEDDocumentPermission" gdp ON gd.id = gdp.document_id
LEFT JOIN "GEDDocumentLabelRelation" gdlr ON gd.id = gdlr.document_id
LEFT JOIN "GEDDocumentLabel" gdl ON gdlr.label_id = gdl.id
WHERE gd.category != 'client_process' -- Exclure docs process
GROUP BY gd.id;

RAISE NOTICE '✅ Vues helper créées';

-- ============================================================================
-- ÉTAPE 6 : FONCTION HELPER POUR STATISTIQUES
-- ============================================================================

CREATE OR REPLACE FUNCTION get_documents_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'process_clients', json_build_object(
      'total', (SELECT COUNT(*) FROM "ClientProcessDocument"),
      'pending', (SELECT COUNT(*) FROM "ClientProcessDocument" WHERE status = 'pending'),
      'validated', (SELECT COUNT(*) FROM "ClientProcessDocument" WHERE status = 'validated'),
      'uploads_this_month', (
        SELECT COUNT(*) FROM "ClientProcessDocument" 
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
      ),
      'by_type', (
        SELECT json_object_agg(document_type, count)
        FROM (
          SELECT document_type, COUNT(*) as count
          FROM "ClientProcessDocument"
          GROUP BY document_type
        ) t
      )
    ),
    'documentation_app', json_build_object(
      'total', (SELECT COUNT(*) FROM "GEDDocument" WHERE category = 'documentation'),
      'published', (SELECT COUNT(*) FROM "GEDDocument" WHERE category = 'documentation' AND is_published = true),
      'drafts', (SELECT COUNT(*) FROM "GEDDocument" WHERE category = 'documentation' AND is_published = false),
      'total_views', (SELECT SUM(view_count) FROM "GEDDocument" WHERE category = 'documentation'),
      'by_category', (
        SELECT json_object_agg(category, count)
        FROM (
          SELECT category, COUNT(*) as count
          FROM "GEDDocument"
          WHERE category = 'documentation'
          GROUP BY category
        ) t
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Fonction stats créée';

-- ============================================================================
-- ÉTAPE 7 : CRÉER LABELS PAR DÉFAUT
-- ============================================================================

-- Ajouter contrainte unique sur name si n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_ged_label_name'
  ) THEN
    ALTER TABLE "GEDDocumentLabel" 
    ADD CONSTRAINT unique_ged_label_name UNIQUE (name);
    RAISE NOTICE '✅ Contrainte unique ajoutée sur GEDDocumentLabel.name';
  ELSE
    RAISE NOTICE 'ℹ️ Contrainte unique sur name existe déjà';
  END IF;
END $$;

-- Labels pour organisation documentation (éviter doublons avec nom unique)
INSERT INTO "GEDDocumentLabel" (name, color, description) VALUES
  ('Guides Utilisateurs', '#3B82F6', 'Guides d''utilisation de la plateforme'),
  ('FAQ', '#10B981', 'Questions fréquentes'),
  ('Tutoriels Vidéo', '#8B5CF6', 'Tutoriels vidéo et démos'),
  ('Documentation Technique', '#EF4444', 'Documentation API et technique'),
  ('Procédures Internes', '#F59E0B', 'Procédures et workflows internes'),
  ('Changelog', '#6366F1', 'Historique des mises à jour'),
  ('Templates', '#EC4899', 'Modèles et templates réutilisables')
ON CONFLICT (name) DO NOTHING;

RAISE NOTICE '✅ Labels par défaut créés (ou déjà existants)';

-- ============================================================================
-- ÉTAPE 8 : NETTOYAGE (Optionnel - À faire manuellement après vérification)
-- ============================================================================

-- ⚠️ NE PAS EXÉCUTER AUTOMATIQUEMENT
-- ⚠️ Vérifier d'abord que migration est OK

-- Supprimer admin_documents (vide)
-- DROP TABLE IF EXISTS admin_documents CASCADE;

-- Supprimer documentation_items après migration
-- DROP TABLE IF EXISTS documentation CASCADE;
-- DROP TABLE IF EXISTS documentation_items CASCADE;
-- DROP TABLE IF EXISTS documentation_categories CASCADE;

-- RAISE NOTICE '⚠️ Nettoyage à faire manuellement après validation';

-- ============================================================================
-- ÉTAPE 9 : VÉRIFICATIONS FINALES
-- ============================================================================

-- Compter les tables/lignes
DO $$
DECLARE
  ged_count INTEGER;
  process_count INTEGER;
  permission_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ged_count FROM "GEDDocument";
  SELECT COUNT(*) INTO process_count FROM "ClientProcessDocument";
  SELECT COUNT(*) INTO permission_count FROM "GEDDocumentPermission";
  
  RAISE NOTICE '📊 RÉSULTATS MIGRATION:';
  RAISE NOTICE '   - GEDDocument: % documents', ged_count;
  RAISE NOTICE '   - ClientProcessDocument: % fichiers', process_count;
  RAISE NOTICE '   - GEDDocumentPermission: % permissions', permission_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration terminée avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
  RAISE NOTICE '   1. Vérifier les données migrées';
  RAISE NOTICE '   2. Tester les vues (v_admin_client_process_documents, v_admin_documentation_app)';
  RAISE NOTICE '   3. Tester la fonction get_documents_stats()';
  RAISE NOTICE '   4. Si OK, supprimer manuellement les anciennes tables';
END $$;

COMMIT;

-- ============================================================================
-- TEST : Appeler la fonction stats
-- ============================================================================
SELECT get_documents_stats();

