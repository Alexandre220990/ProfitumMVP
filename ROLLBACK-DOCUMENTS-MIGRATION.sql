-- ============================================================================
-- ROLLBACK MIGRATION DOCUMENTS
-- Si vous voulez repartir de zéro
-- ============================================================================
-- ⚠️ À exécuter SEULEMENT si vous voulez annuler la migration

BEGIN;

-- Supprimer les policies
DROP POLICY IF EXISTS "admin_all_client_process_documents" ON "ClientProcessDocument";
DROP POLICY IF EXISTS "client_view_own_process_documents" ON "ClientProcessDocument";
DROP POLICY IF EXISTS "expert_view_assigned_client_documents" ON "ClientProcessDocument";
DROP POLICY IF EXISTS "apporteur_view_own_client_documents" ON "ClientProcessDocument";

-- Supprimer les vues
DROP VIEW IF EXISTS v_admin_client_process_documents;
DROP VIEW IF EXISTS v_admin_documentation_app;

-- Supprimer la fonction stats
DROP FUNCTION IF EXISTS get_documents_stats();

-- Supprimer le trigger
DROP TRIGGER IF EXISTS trigger_update_client_process_document_updated_at ON "ClientProcessDocument";
DROP FUNCTION IF EXISTS update_client_process_document_updated_at();

-- Supprimer la table ClientProcessDocument
DROP TABLE IF EXISTS "ClientProcessDocument" CASCADE;

-- Retirer les colonnes ajoutées à GEDDocument (si vous voulez)
-- ALTER TABLE "GEDDocument" DROP COLUMN IF EXISTS slug;
-- ALTER TABLE "GEDDocument" DROP COLUMN IF EXISTS meta_description;
-- ALTER TABLE "GEDDocument" DROP COLUMN IF EXISTS tags;
-- ALTER TABLE "GEDDocument" DROP COLUMN IF EXISTS is_published;
-- ALTER TABLE "GEDDocument" DROP COLUMN IF EXISTS is_featured;
-- ALTER TABLE "GEDDocument" DROP COLUMN IF EXISTS view_count;
-- ALTER TABLE "GEDDocument" DROP COLUMN IF EXISTS helpful_count;
-- ALTER TABLE "GEDDocument" DROP COLUMN IF EXISTS not_helpful_count;
-- ALTER TABLE "GEDDocument" DROP COLUMN IF EXISTS author_id;
-- ALTER TABLE "GEDDocument" DROP COLUMN IF EXISTS published_at;

COMMIT;

RAISE NOTICE '✅ Rollback terminé - Vous pouvez relancer la migration';

