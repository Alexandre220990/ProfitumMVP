-- =====================================================
-- SCHÉMA BDD - SYSTÈME DE GESTION DOCUMENTS EXPERT
-- =====================================================
-- Date: 2025-11-04
-- Objectif: Permettre aux experts de valider/invalider des documents
--           et de demander des documents complémentaires aux clients
-- =====================================================

-- =====================================================
-- 1️⃣ MODIFICATION TABLE DocumentFile
-- =====================================================
-- Ajouter les colonnes de validation par l'expert
-- NOTE: La table s'appelle "DocumentFile" dans votre base

-- Vérifier si la colonne validation_status existe déjà (elle existe probablement)
-- Si elle existe, on passe simplement à l'étape suivante

-- Colonne: ID de l'expert qui a validé/rejeté (NOUVELLE)
ALTER TABLE "DocumentFile" 
ADD COLUMN IF NOT EXISTS validated_by UUID;

-- Colonne: Date de validation/rejet (NOUVELLE)
ALTER TABLE "DocumentFile" 
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

-- Colonne: Raison du rejet (NOUVELLE)
ALTER TABLE "DocumentFile" 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Vérifier si validation_status existe, sinon la créer
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'DocumentFile' AND column_name = 'validation_status'
  ) THEN
    ALTER TABLE "DocumentFile" ADD COLUMN validation_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Commentaires
COMMENT ON COLUMN "DocumentFile".validation_status IS 'Statut de validation: pending, validated, rejected';
COMMENT ON COLUMN "DocumentFile".validated_by IS 'UUID de l''expert qui a validé/rejeté le document';
COMMENT ON COLUMN "DocumentFile".validated_at IS 'Date et heure de validation/rejet';
COMMENT ON COLUMN "DocumentFile".rejection_reason IS 'Raison fournie par l''expert en cas de rejet';

-- Contraintes (avec vérification d'existence)
DO $$ 
BEGIN
  -- Contrainte: validation_status doit être dans la liste autorisée
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documentfile_validation_status_check'
  ) THEN
    ALTER TABLE "DocumentFile" 
    ADD CONSTRAINT documentfile_validation_status_check 
    CHECK (validation_status IN ('pending', 'validated', 'rejected'));
  END IF;

  -- Contrainte: Si validated_by existe, validated_at doit exister aussi
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documentfile_validation_consistency_check'
  ) THEN
    ALTER TABLE "DocumentFile" 
    ADD CONSTRAINT documentfile_validation_consistency_check 
    CHECK (
      (validated_by IS NULL AND validated_at IS NULL) OR 
      (validated_by IS NOT NULL AND validated_at IS NOT NULL)
    );
  END IF;

  -- Contrainte: Si rejected, rejection_reason doit être fournie
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documentfile_rejection_reason_check'
  ) THEN
    ALTER TABLE "DocumentFile" 
    ADD CONSTRAINT documentfile_rejection_reason_check 
    CHECK (
      (validation_status != 'rejected') OR 
      (validation_status = 'rejected' AND rejection_reason IS NOT NULL AND LENGTH(rejection_reason) > 0)
    );
  END IF;
END $$;

-- Clé étrangère vers Expert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documentfile_validated_by_fkey'
  ) THEN
    ALTER TABLE "DocumentFile" 
    ADD CONSTRAINT documentfile_validated_by_fkey 
    FOREIGN KEY (validated_by) 
    REFERENCES "Expert"(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour optimiser les requêtes de validation
CREATE INDEX IF NOT EXISTS idx_documentfile_validation_status ON "DocumentFile"(validation_status);
CREATE INDEX IF NOT EXISTS idx_documentfile_validated_by ON "DocumentFile"(validated_by);

-- =====================================================
-- 2️⃣ CRÉATION TABLE DOCUMENT_REQUEST
-- =====================================================
-- Stocker les demandes de documents complémentaires

CREATE TABLE IF NOT EXISTS document_request (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  dossier_id UUID NOT NULL REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  
  -- Liste des documents demandés (JSONB pour flexibilité)
  requested_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Statut de la demande
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Notes de l'expert (optionnel)
  notes TEXT,
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Métadonnées
  notification_sent BOOLEAN DEFAULT false,
  client_notified_at TIMESTAMPTZ
);

-- Commentaires
COMMENT ON TABLE document_request IS 'Demandes de documents complémentaires par les experts';
COMMENT ON COLUMN document_request.requested_documents IS 'Liste JSON des documents demandés avec statut';
COMMENT ON COLUMN document_request.status IS 'pending: en attente, in_progress: client a commencé, completed: tous fournis, cancelled: annulée';
COMMENT ON COLUMN document_request.notes IS 'Notes additionnelles de l''expert pour le client';

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_document_request_dossier ON document_request(dossier_id);
CREATE INDEX IF NOT EXISTS idx_document_request_expert ON document_request(expert_id);
CREATE INDEX IF NOT EXISTS idx_document_request_client ON document_request(client_id);
CREATE INDEX IF NOT EXISTS idx_document_request_status ON document_request(status);
CREATE INDEX IF NOT EXISTS idx_document_request_created ON document_request(created_at DESC);

-- Index GIN pour requêtes JSONB (recherche dans requested_documents)
CREATE INDEX IF NOT EXISTS idx_document_request_jsonb ON document_request USING GIN (requested_documents);

-- =====================================================
-- 3️⃣ FONCTION TRIGGER - MAJ AUTO updated_at
-- =====================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_document_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur document_request
DROP TRIGGER IF EXISTS trigger_update_document_request_updated_at ON document_request;
CREATE TRIGGER trigger_update_document_request_updated_at
  BEFORE UPDATE ON document_request
  FOR EACH ROW
  EXECUTE FUNCTION update_document_request_updated_at();

-- =====================================================
-- 4️⃣ VÉRIFICATIONS ET TESTS
-- =====================================================

-- Vérifier les colonnes ajoutées à DocumentFile
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'DocumentFile'
  AND column_name IN (
    'validation_status',
    'validated_by',
    'validated_at',
    'rejection_reason'
  )
ORDER BY column_name;

-- Vérifier la création de document_request
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'document_request'
ORDER BY ordinal_position;

-- Vérifier les index créés
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename IN ('DocumentFile', 'document_request')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Vérifier les contraintes
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = '"DocumentFile"'::regclass
  AND conname LIKE '%validation%'
ORDER BY conname;

-- =====================================================
-- 5️⃣ EXEMPLE DE STRUCTURE JSONB requested_documents
-- =====================================================

-- Format attendu pour requested_documents:
/*
[
  {
    "id": "doc-1",
    "name": "KBIS de moins de 3 mois",
    "description": "Document officiel d'immatriculation",
    "mandatory": true,
    "uploaded": false,
    "document_id": null,
    "uploaded_at": null
  },
  {
    "id": "doc-2",
    "name": "Relevés bancaires 2023-2024",
    "description": "Relevés des 12 derniers mois",
    "mandatory": true,
    "uploaded": true,
    "document_id": "abc-123-uuid",
    "uploaded_at": "2025-11-04T15:30:00Z"
  },
  {
    "id": "doc-3",
    "name": "Déclaration URSSAF Q3 2024",
    "description": null,
    "mandatory": true,
    "uploaded": false,
    "document_id": null,
    "uploaded_at": null
  }
]
*/

-- Exemple d'insertion
/*
INSERT INTO document_request (
  dossier_id,
  expert_id,
  client_id,
  requested_documents,
  status,
  notes
) VALUES (
  'uuid-du-dossier',
  'uuid-de-l-expert',
  'uuid-du-client',
  '[
    {"id": "doc-1", "name": "KBIS de moins de 3 mois", "mandatory": true, "uploaded": false},
    {"id": "doc-2", "name": "Relevés bancaires 2023-2024", "mandatory": true, "uploaded": false}
  ]'::jsonb,
  'pending',
  'Documents nécessaires pour poursuivre l''audit'
);
*/

-- =====================================================
-- 6️⃣ REQUÊTES UTILES POUR L'APPLICATION
-- =====================================================

-- Récupérer tous les documents d'un dossier avec leur statut de validation
/*
SELECT 
  d.id,
  d.original_filename as file_name,
  d.file_path,
  d.mime_type as file_type,
  d.file_size,
  d.validation_status,
  d.category,
  d.rejection_reason,
  d.validated_at,
  e.name as validated_by_name,
  d.created_at as uploaded_at
FROM "DocumentFile" d
LEFT JOIN "Expert" e ON e.id = d.validated_by
WHERE d.metadata->>'dossier_id' = 'uuid-du-dossier'
ORDER BY d.created_at DESC;
*/

-- Récupérer la dernière demande de documents pour un dossier
/*
SELECT 
  dr.*,
  e.name as expert_name,
  c.company_name as client_company
FROM document_request dr
JOIN "Expert" e ON e.id = dr.expert_id
JOIN "Client" c ON c.id = dr.client_id
WHERE dr.dossier_id = 'uuid-du-dossier'
  AND dr.status != 'cancelled'
ORDER BY dr.created_at DESC
LIMIT 1;
*/

-- Compter les documents en attente de validation pour un expert
/*
SELECT 
  COUNT(*) as documents_pending
FROM document d
JOIN "ClientProduitEligible" cpe ON cpe.id = d.dossier_id
WHERE cpe.expert_id = 'uuid-de-l-expert'
  AND d.validation_status = 'pending';
*/

-- Vérifier si tous les documents demandés ont été fournis
/*
SELECT 
  dr.id,
  dr.status,
  jsonb_array_length(dr.requested_documents) as total_requested,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(dr.requested_documents) doc
    WHERE doc->>'uploaded' = 'true'
  ) as total_uploaded,
  CASE 
    WHEN jsonb_array_length(dr.requested_documents) = (
      SELECT COUNT(*)
      FROM jsonb_array_elements(dr.requested_documents) doc
      WHERE doc->>'uploaded' = 'true'
    ) THEN true
    ELSE false
  END as all_uploaded
FROM document_request dr
WHERE dr.id = 'uuid-de-la-demande';
*/

-- =====================================================
-- 7️⃣ POLITIQUES RLS (Row Level Security) - OPTIONNEL
-- =====================================================

-- Si vous utilisez RLS, ajouter ces politiques:

-- Policy pour document_request: Expert peut voir ses propres demandes
/*
CREATE POLICY expert_view_own_requests ON document_request
  FOR SELECT
  USING (expert_id = auth.uid());

-- Policy pour document_request: Client peut voir ses demandes
CREATE POLICY client_view_own_requests ON document_request
  FOR SELECT
  USING (client_id = auth.uid());

-- Policy pour document: Expert peut valider les documents de ses dossiers
CREATE POLICY expert_validate_documents ON document
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "ClientProduitEligible" cpe
      WHERE cpe.id = document.dossier_id
        AND cpe.expert_id = auth.uid()
    )
  );
*/

-- =====================================================
-- 8️⃣ DONNÉES DE TEST (OPTIONNEL)
-- =====================================================

-- Insérer une demande de test (à adapter avec vos vrais UUID)
/*
INSERT INTO document_request (
  dossier_id,
  expert_id,
  client_id,
  requested_documents,
  status,
  notes
) VALUES (
  (SELECT id FROM "ClientProduitEligible" LIMIT 1),
  (SELECT id FROM "Expert" WHERE email = 'expert@profitum.fr' LIMIT 1),
  (SELECT id FROM "Client" WHERE email = 'alex94@profitum.fr' LIMIT 1),
  '[
    {
      "id": "doc-test-1",
      "name": "KBIS TEST",
      "description": "Document de test",
      "mandatory": true,
      "uploaded": false,
      "document_id": null,
      "uploaded_at": null
    }
  ]'::jsonb,
  'pending',
  'Demande de test pour vérifier le système'
);
*/

-- =====================================================
-- 9️⃣ NETTOYAGE (Si besoin de tout supprimer)
-- =====================================================

-- ⚠️ ATTENTION: Ces commandes suppriment tout!
-- À utiliser uniquement en développement

/*
-- Supprimer la table document_request
DROP TABLE IF EXISTS document_request CASCADE;

-- Supprimer les colonnes ajoutées à document
ALTER TABLE document DROP COLUMN IF EXISTS validation_status CASCADE;
ALTER TABLE document DROP COLUMN IF EXISTS validated_by CASCADE;
ALTER TABLE document DROP COLUMN IF EXISTS validated_at CASCADE;
ALTER TABLE document DROP COLUMN IF EXISTS rejection_reason CASCADE;
ALTER TABLE document DROP COLUMN IF EXISTS document_category CASCADE;

-- Supprimer la fonction trigger
DROP FUNCTION IF EXISTS update_document_request_updated_at() CASCADE;
*/

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

