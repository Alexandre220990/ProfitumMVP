-- ============================================================================
-- MIGRATION : Versioning des documents avec historique
-- Date : 2025-11-04
-- Description : Ajout du versioning pour permettre de remplacer un document
--               par un nouveau sans modifier l'ancien (traçabilité complète)
-- ============================================================================

-- 1️⃣ Ajouter colonne parent_document_id pour tracer les remplacements
ALTER TABLE "ClientProcessDocument"
ADD COLUMN IF NOT EXISTS "parent_document_id" UUID REFERENCES "ClientProcessDocument"(id) ON DELETE SET NULL;

-- 2️⃣ Ajouter colonne replacement_count pour compter les remplacements
ALTER TABLE "ClientProcessDocument"
ADD COLUMN IF NOT EXISTS "replacement_count" INTEGER DEFAULT 0;

-- 3️⃣ Ajouter colonne is_replacement pour identifier rapidement
ALTER TABLE "ClientProcessDocument"
ADD COLUMN IF NOT EXISTS "is_replacement" BOOLEAN DEFAULT FALSE;

-- 4️⃣ Ajouter colonne version_number pour numéroter les versions
ALTER TABLE "ClientProcessDocument"
ADD COLUMN IF NOT EXISTS "version_number" INTEGER DEFAULT 1;

-- 5️⃣ Index pour performance
CREATE INDEX IF NOT EXISTS "idx_client_process_doc_parent" 
ON "ClientProcessDocument"("parent_document_id");

CREATE INDEX IF NOT EXISTS "idx_client_process_doc_client_produit" 
ON "ClientProcessDocument"("client_produit_id", "document_type", "is_replacement");

-- 6️⃣ Fonction pour calculer automatiquement version_number
CREATE OR REPLACE FUNCTION update_document_version()
RETURNS TRIGGER AS $$
DECLARE
  original_parent_id UUID;
  max_version INTEGER;
BEGIN
  -- Si parent_document_id est fourni, c'est un remplacement
  IF NEW.parent_document_id IS NOT NULL THEN
    -- Trouver le document original (celui qui n'a pas de parent)
    SELECT COALESCE(
      (SELECT id FROM "ClientProcessDocument" WHERE id = NEW.parent_document_id AND parent_document_id IS NULL),
      NEW.parent_document_id
    ) INTO original_parent_id;
    
    -- Si pas trouvé, utiliser le parent_document_id directement
    IF original_parent_id IS NULL THEN
      original_parent_id := NEW.parent_document_id;
    END IF;
    
    -- Compter combien de remplacements existent déjà pour ce document original
    SELECT COALESCE(MAX(version_number), 1) + 1
    INTO max_version
    FROM "ClientProcessDocument"
    WHERE parent_document_id = original_parent_id
       OR (parent_document_id IS NULL AND id = original_parent_id);
    
    NEW.version_number := max_version;
    NEW.is_replacement := TRUE;
    NEW.replacement_count := 0;
    
    -- Incrémenter le compteur du document parent direct
    UPDATE "ClientProcessDocument"
    SET replacement_count = replacement_count + 1
    WHERE id = NEW.parent_document_id;
  ELSE
    NEW.version_number := 1;
    NEW.is_replacement := FALSE;
    NEW.replacement_count := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7️⃣ Trigger pour calculer automatiquement version_number
DROP TRIGGER IF EXISTS trigger_update_document_version ON "ClientProcessDocument";
CREATE TRIGGER trigger_update_document_version
BEFORE INSERT ON "ClientProcessDocument"
FOR EACH ROW
EXECUTE FUNCTION update_document_version();

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON COLUMN "ClientProcessDocument"."parent_document_id" IS 'ID du document remplacé (pour tracer l''historique)';
COMMENT ON COLUMN "ClientProcessDocument"."replacement_count" IS 'Nombre de fois que ce document a été remplacé';
COMMENT ON COLUMN "ClientProcessDocument"."is_replacement" IS 'TRUE si ce document remplace un autre document';
COMMENT ON COLUMN "ClientProcessDocument"."version_number" IS 'Numéro de version (1 = original, 2+ = remplacements)';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ClientProcessDocument'
  AND column_name IN ('parent_document_id', 'replacement_count', 'is_replacement', 'version_number')
ORDER BY column_name;

