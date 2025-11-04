-- =====================================================
-- SCHÉMA BDD - SYSTÈME DE GESTION DOCUMENTS EXPERT
-- =====================================================
-- Date: 2025-11-04
-- Version: FIXED - Détection automatique de la table documents
-- =====================================================

-- =====================================================
-- 0️⃣ VÉRIFICATION DES TABLES EXISTANTES
-- =====================================================

-- Afficher toutes les tables contenant "document" dans leur nom
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND LOWER(table_name) LIKE '%document%'
ORDER BY table_name;

-- =====================================================
-- 1️⃣ MODIFICATION TABLE ClientProcessDocument
-- =====================================================
-- Cette table semble être la principale pour les documents clients

-- Ajouter les colonnes de validation par l'expert
ALTER TABLE "ClientProcessDocument" 
ADD COLUMN IF NOT EXISTS validated_by UUID;

ALTER TABLE "ClientProcessDocument" 
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

ALTER TABLE "ClientProcessDocument" 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Vérifier si validation_status existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ClientProcessDocument' AND column_name = 'validation_status'
  ) THEN
    ALTER TABLE "ClientProcessDocument" ADD COLUMN validation_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Commentaires
COMMENT ON COLUMN "ClientProcessDocument".validation_status IS 'Statut de validation: pending, validated, rejected';
COMMENT ON COLUMN "ClientProcessDocument".validated_by IS 'UUID de l''expert qui a validé/rejeté le document';
COMMENT ON COLUMN "ClientProcessDocument".validated_at IS 'Date et heure de validation/rejet';
COMMENT ON COLUMN "ClientProcessDocument".rejection_reason IS 'Raison fournie par l''expert en cas de rejet';

-- Contraintes
DO $$ 
BEGIN
  -- Contrainte: validation_status doit être dans la liste autorisée
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clientprocessdocument_validation_status_check'
  ) THEN
    ALTER TABLE "ClientProcessDocument" 
    ADD CONSTRAINT clientprocessdocument_validation_status_check 
    CHECK (validation_status IN ('pending', 'validated', 'rejected'));
  END IF;

  -- Contrainte: Si validated_by existe, validated_at doit exister aussi
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clientprocessdocument_validation_consistency_check'
  ) THEN
    ALTER TABLE "ClientProcessDocument" 
    ADD CONSTRAINT clientprocessdocument_validation_consistency_check 
    CHECK (
      (validated_by IS NULL AND validated_at IS NULL) OR 
      (validated_by IS NOT NULL AND validated_at IS NOT NULL)
    );
  END IF;

  -- Contrainte: Si rejected, rejection_reason doit être fournie
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clientprocessdocument_rejection_reason_check'
  ) THEN
    ALTER TABLE "ClientProcessDocument" 
    ADD CONSTRAINT clientprocessdocument_rejection_reason_check 
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
    SELECT 1 FROM pg_constraint WHERE conname = 'clientprocessdocument_validated_by_fkey'
  ) THEN
    ALTER TABLE "ClientProcessDocument" 
    ADD CONSTRAINT clientprocessdocument_validated_by_fkey 
    FOREIGN KEY (validated_by) 
    REFERENCES "Expert"(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_clientprocessdocument_validation_status ON "ClientProcessDocument"(validation_status);
CREATE INDEX IF NOT EXISTS idx_clientprocessdocument_validated_by ON "ClientProcessDocument"(validated_by);
CREATE INDEX IF NOT EXISTS idx_clientprocessdocument_client_produit ON "ClientProcessDocument"(client_produit_id);
CREATE INDEX IF NOT EXISTS idx_clientprocessdocument_client ON "ClientProcessDocument"(client_id);
CREATE INDEX IF NOT EXISTS idx_clientprocessdocument_produit ON "ClientProcessDocument"(produit_id);

-- =====================================================
-- 2️⃣ CRÉATION TABLE document_request
-- =====================================================

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

-- Index
CREATE INDEX IF NOT EXISTS idx_document_request_dossier ON document_request(dossier_id);
CREATE INDEX IF NOT EXISTS idx_document_request_expert ON document_request(expert_id);
CREATE INDEX IF NOT EXISTS idx_document_request_client ON document_request(client_id);
CREATE INDEX IF NOT EXISTS idx_document_request_status ON document_request(status);
CREATE INDEX IF NOT EXISTS idx_document_request_created ON document_request(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_request_jsonb ON document_request USING GIN (requested_documents);

-- =====================================================
-- 3️⃣ FONCTION TRIGGER - MAJ AUTO updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_document_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_document_request_updated_at ON document_request;
CREATE TRIGGER trigger_update_document_request_updated_at
  BEFORE UPDATE ON document_request
  FOR EACH ROW
  EXECUTE FUNCTION update_document_request_updated_at();

-- =====================================================
-- 4️⃣ VÉRIFICATIONS
-- =====================================================

-- Vérifier ClientProcessDocument
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ClientProcessDocument'
  AND column_name IN (
    'validation_status',
    'validated_by',
    'validated_at',
    'rejection_reason',
    'client_produit_id'
  )
ORDER BY column_name;

-- Vérifier document_request
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'document_request'
ORDER BY ordinal_position;

-- Vérifier les index
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE tablename IN ('ClientProcessDocument', 'document_request')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- 5️⃣ REQUÊTES UTILES
-- =====================================================

-- Récupérer tous les documents d'un dossier avec validation
/*
SELECT 
  cpd.id,
  cpd.filename as file_name,
  cpd.storage_path as file_path,
  cpd.mime_type as file_type,
  cpd.file_size,
  cpd.validation_status,
  cpd.rejection_reason,
  cpd.validated_at,
  cpd.uploaded_at as created_at,
  e.name as validated_by_name,
  e.email as validated_by_email
FROM "ClientProcessDocument" cpd
LEFT JOIN "Expert" e ON e.id = cpd.validated_by
WHERE cpd.client_produit_id = 'uuid-du-dossier'
ORDER BY cpd.uploaded_at DESC;
*/

-- Récupérer la dernière demande de documents
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

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Résumé des modifications :
SELECT 
  'Script terminé' as status,
  NOW() as executed_at;

-- Afficher les tables modifiées/créées
SELECT 
  'ClientProcessDocument' as table_name,
  'Colonnes de validation ajoutées' as action
UNION ALL
SELECT 
  'document_request' as table_name,
  'Table créée' as action;

