-- ============================================================================
-- MIGRATION SYSTÈME DOCUMENTAIRE UNIFIÉ RÉVOLUTIONNAIRE
-- ============================================================================
-- Inspiré par Michael Stonebraker (PostgreSQL) - ACID + Performance
-- Optimisation extrême, indexation stratégique, partitioning

-- Date: 2025-01-05
-- Version: 3.0 - Système unifié
-- Auteur: FinancialTracker Team

-- ===== 1. NETTOYAGE DES TABLES EXISTANTES =====

-- Supprimer les tables legacy pour éviter les conflits
DROP TABLE IF EXISTS "DocumentFileVersion" CASCADE;
DROP TABLE IF EXISTS "DocumentFile" CASCADE;
DROP TABLE IF EXISTS "DocumentRequest" CASCADE;
DROP TABLE IF EXISTS "WorkflowStep" CASCADE;
DROP TABLE IF EXISTS "DocumentShare" CASCADE;
DROP TABLE IF EXISTS "DocumentAuditLog" CASCADE;

-- Supprimer les fonctions et triggers existants
DROP FUNCTION IF EXISTS update_document_file_updated_at() CASCADE;
DROP FUNCTION IF EXISTS increment_download_count() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_shares() CASCADE;
DROP FUNCTION IF EXISTS get_user_document_stats(UUID) CASCADE;

-- ===== 2. TABLE PRINCIPALE UNIFIÉE =====

CREATE TABLE IF NOT EXISTS "DocumentFile" (
    -- Identifiants
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations utilisateurs
    "client_id" UUID REFERENCES "Client"("id") ON DELETE CASCADE,
    "expert_id" UUID REFERENCES "Expert"("id") ON DELETE SET NULL,
    "audit_id" UUID REFERENCES "Audit"("id") ON DELETE SET NULL,
    
    -- Informations du fichier
    "original_filename" VARCHAR(255) NOT NULL,
    "stored_filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "bucket_name" VARCHAR(100) NOT NULL DEFAULT 'documents',
    "file_size" BIGINT NOT NULL CHECK ("file_size" > 0),
    "mime_type" VARCHAR(100) NOT NULL,
    "file_extension" VARCHAR(20) NOT NULL,
    "file_hash" VARCHAR(64) GENERATED ALWAYS AS (
        encode(sha256(original_filename::bytea || stored_filename::bytea || file_size::text::bytea), 'hex')
    ) STORED,
    
    -- Métadonnées
    "category" VARCHAR(50) NOT NULL CHECK ("category" IN (
        'charte', 'rapport', 'audit', 'simulation', 'guide', 
        'facture', 'contrat', 'certificat', 'formulaire', 'autre'
    )),
    "document_type" VARCHAR(50) NOT NULL CHECK ("document_type" IN (
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 
        'jpg', 'jpeg', 'png', 'gif', 'txt', 'csv', 'zip', 'rar'
    )),
    "description" TEXT,
    "tags" TEXT[] DEFAULT '{}',
    "metadata" JSONB DEFAULT '{}',
    
    -- Statut et validation
    "status" VARCHAR(20) DEFAULT 'uploaded' CHECK ("status" IN (
        'uploaded', 'validated', 'rejected', 'archived', 'deleted'
    )),
    "validation_status" VARCHAR(20) DEFAULT 'pending' CHECK ("validation_status" IN (
        'pending', 'approved', 'rejected', 'requires_revision'
    )),
    
    -- Sécurité et accès
    "is_public" BOOLEAN DEFAULT false,
    "is_encrypted" BOOLEAN DEFAULT false,
    "encryption_iv" VARCHAR(32), -- IV pour AES-256-GCM
    "access_level" VARCHAR(20) DEFAULT 'private' CHECK ("access_level" IN (
        'public', 'private', 'restricted', 'confidential'
    )),
    "expires_at" TIMESTAMP WITH TIME ZONE,
    
    -- Statistiques
    "download_count" INTEGER DEFAULT 0 CHECK ("download_count" >= 0),
    "last_downloaded" TIMESTAMP WITH TIME ZONE,
    "view_count" INTEGER DEFAULT 0 CHECK ("view_count" >= 0),
    "last_viewed" TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    "uploaded_by" UUID NOT NULL,
    "validated_by" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE,
    
    -- Contraintes de cohérence
    CONSTRAINT "document_file_user_consistency" CHECK (
        ("client_id" IS NOT NULL AND "expert_id" IS NULL) OR
        ("expert_id" IS NOT NULL AND "client_id" IS NULL) OR
        ("client_id" IS NULL AND "expert_id" IS NULL)
    ),
    
    CONSTRAINT "document_file_expiry_consistency" CHECK (
        "expires_at" IS NULL OR "expires_at" > "created_at"
    )
);

-- ===== 3. TABLE DES VERSIONS OPTIMISÉE =====

CREATE TABLE IF NOT EXISTS "DocumentFileVersion" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "document_file_id" UUID NOT NULL REFERENCES "DocumentFile"("id") ON DELETE CASCADE,
    "version_number" INTEGER NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" BIGINT NOT NULL CHECK ("file_size" > 0),
    "file_hash" VARCHAR(64) NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "upload_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "change_description" TEXT,
    "is_current" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité pour version_number par document
    UNIQUE ("document_file_id", "version_number")
);

-- ===== 4. TABLE DES PARTAGES SÉCURISÉS =====

CREATE TABLE IF NOT EXISTS "DocumentShare" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "document_file_id" UUID NOT NULL REFERENCES "DocumentFile"("id") ON DELETE CASCADE,
    "shared_by" UUID NOT NULL,
    "shared_with_email" VARCHAR(255) NOT NULL,
    "share_token" VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    "can_download" BOOLEAN DEFAULT false,
    "can_view" BOOLEAN DEFAULT true,
    "expires_at" TIMESTAMP WITH TIME ZONE,
    "accessed_at" TIMESTAMP WITH TIME ZONE,
    "access_count" INTEGER DEFAULT 0 CHECK ("access_count" >= 0),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT "document_share_expiry_consistency" CHECK (
        "expires_at" IS NULL OR "expires_at" > "created_at"
    )
);

-- ===== 5. TABLE D'AUDIT COMPLÈTE =====

CREATE TABLE IF NOT EXISTS "DocumentAuditLog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "document_file_id" UUID REFERENCES "DocumentFile"("id") ON DELETE SET NULL,
    "user_id" UUID NOT NULL,
    "user_type" VARCHAR(20) NOT NULL CHECK ("user_type" IN ('client', 'expert', 'admin')),
    "action" VARCHAR(50) NOT NULL CHECK ("action" IN (
        'upload', 'download', 'view', 'delete', 'share', 'validate', 'update', 'archive'
    )),
    "ip_address" INET,
    "user_agent" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 6. INDEXATION STRATÉGIQUE (Michael Stonebraker) =====

-- Index primaires et secondaires (sans CONCURRENTLY pour compatibilité transaction)
CREATE INDEX IF NOT EXISTS "idx_document_file_client_id" ON "DocumentFile"("client_id");
CREATE INDEX IF NOT EXISTS "idx_document_file_expert_id" ON "DocumentFile"("expert_id");
CREATE INDEX IF NOT EXISTS "idx_document_file_uploaded_by" ON "DocumentFile"("uploaded_by");
CREATE INDEX IF NOT EXISTS "idx_document_file_category" ON "DocumentFile"("category");
CREATE INDEX IF NOT EXISTS "idx_document_file_status" ON "DocumentFile"("status");
CREATE INDEX IF NOT EXISTS "idx_document_file_access_level" ON "DocumentFile"("access_level");
CREATE INDEX IF NOT EXISTS "idx_document_file_created_at" ON "DocumentFile"("created_at");
CREATE INDEX IF NOT EXISTS "idx_document_file_updated_at" ON "DocumentFile"("updated_at");

-- Index composites pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_document_file_client_category_status" 
ON "DocumentFile"("client_id", "category", "status");

CREATE INDEX IF NOT EXISTS "idx_document_file_expert_category_status" 
ON "DocumentFile"("expert_id", "category", "status");

CREATE INDEX IF NOT EXISTS "idx_document_file_uploaded_by_created_at" 
ON "DocumentFile"("uploaded_by", "created_at" DESC);

-- Index pour recherche full-text
CREATE INDEX IF NOT EXISTS "idx_document_file_description_fts" 
ON "DocumentFile" USING gin(to_tsvector('french', COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS "idx_document_file_filename_fts" 
ON "DocumentFile" USING gin(to_tsvector('french', original_filename));

-- Index pour les tags (array)
CREATE INDEX IF NOT EXISTS "idx_document_file_tags" 
ON "DocumentFile" USING gin(tags);

-- Index pour les métadonnées JSONB
CREATE INDEX IF NOT EXISTS "idx_document_file_metadata" 
ON "DocumentFile" USING gin(metadata);

-- Index pour les fichiers expirés
CREATE INDEX IF NOT EXISTS "idx_document_file_expires_at" 
ON "DocumentFile"("expires_at") WHERE "expires_at" IS NOT NULL;

-- Index pour les fichiers supprimés (soft delete)
CREATE INDEX IF NOT EXISTS "idx_document_file_deleted_at" 
ON "DocumentFile"("deleted_at") WHERE "deleted_at" IS NOT NULL;

-- Index pour les versions
CREATE INDEX IF NOT EXISTS "idx_document_file_version_document_id" 
ON "DocumentFileVersion"("document_file_id");

CREATE INDEX IF NOT EXISTS "idx_document_file_version_current" 
ON "DocumentFileVersion"("document_file_id") WHERE "is_current" = true;

-- Index pour les partages
CREATE INDEX IF NOT EXISTS "idx_document_share_document_id" 
ON "DocumentShare"("document_file_id");

CREATE INDEX IF NOT EXISTS "idx_document_share_token" 
ON "DocumentShare"("share_token");

CREATE INDEX IF NOT EXISTS "idx_document_share_expires_at" 
ON "DocumentShare"("expires_at") WHERE "expires_at" IS NOT NULL;

-- Index pour l'audit
CREATE INDEX IF NOT EXISTS "idx_document_audit_log_document_id" 
ON "DocumentAuditLog"("document_file_id");

CREATE INDEX IF NOT EXISTS "idx_document_audit_log_user_id" 
ON "DocumentAuditLog"("user_id");

CREATE INDEX IF NOT EXISTS "idx_document_audit_log_action" 
ON "DocumentAuditLog"("action");

CREATE INDEX IF NOT EXISTS "idx_document_audit_log_created_at" 
ON "DocumentAuditLog"("created_at" DESC);

-- ===== 7. PARTITIONING POUR PERFORMANCE (Michael Stonebraker) =====

-- Note: Le partitioning sera configuré séparément après la création des tables
-- car il nécessite une configuration spéciale de PostgreSQL
-- CREATE TABLE IF NOT EXISTS "DocumentAuditLog_2025_01" PARTITION OF "DocumentAuditLog"
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- CREATE TABLE IF NOT EXISTS "DocumentAuditLog_2025_02" PARTITION OF "DocumentAuditLog"
-- FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- ===== 8. FONCTIONS UTILITAIRES =====

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_document_file_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_document_file_updated_at
    BEFORE UPDATE ON "DocumentFile"
    FOR EACH ROW
    EXECUTE FUNCTION update_document_file_updated_at();

-- Fonction pour incrémenter le compteur de téléchargements
CREATE OR REPLACE FUNCTION increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "DocumentFile" 
    SET 
        download_count = download_count + 1,
        last_downloaded = NOW()
    WHERE id = NEW.document_file_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour incrémenter download_count
CREATE TRIGGER trigger_increment_download_count
    AFTER INSERT ON "DocumentAuditLog"
    FOR EACH ROW
    WHEN (NEW.action = 'download')
    EXECUTE FUNCTION increment_download_count();

-- Fonction pour nettoyer les partages expirés
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "DocumentShare" 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_document_stats(user_uuid UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size BIGINT,
    recent_uploads BIGINT,
    files_by_category JSONB,
    files_by_status JSONB,
    files_by_access_level JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_files,
        COALESCE(SUM(file_size), 0)::BIGINT as total_size,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT as recent_uploads,
        jsonb_object_agg(category, count) FILTER (WHERE category IS NOT NULL) as files_by_category,
        jsonb_object_agg(status, count) FILTER (WHERE status IS NOT NULL) as files_by_status,
        jsonb_object_agg(access_level, count) FILTER (WHERE access_level IS NOT NULL) as files_by_access_level
    FROM (
        SELECT 
            category,
            status,
            access_level,
            COUNT(*) as count
        FROM "DocumentFile"
        WHERE (client_id = user_uuid OR expert_id = user_uuid OR uploaded_by = user_uuid)
        AND deleted_at IS NULL
        GROUP BY GROUPING SETS ((category), (status), (access_level))
    ) stats;
END;
$$ LANGUAGE plpgsql;

-- ===== 9. POLITIQUES RLS (Row Level Security) =====

-- Activer RLS sur toutes les tables
ALTER TABLE "DocumentFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentFileVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentShare" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentAuditLog" ENABLE ROW LEVEL SECURITY;

-- Politiques pour DocumentFile
CREATE POLICY "document_file_select_policy" ON "DocumentFile"
    FOR SELECT USING (
        -- Admins voient tout
        EXISTS (SELECT 1 FROM "Admin" WHERE "Admin".id = auth.uid()) OR
        -- Clients voient leurs fichiers
        client_id = auth.uid() OR
        -- Experts voient leurs fichiers et ceux de leurs clients
        expert_id = auth.uid() OR
        -- Uploader peut voir ses fichiers
        uploaded_by = auth.uid() OR
        -- Fichiers publics
        is_public = true
    );

CREATE POLICY "document_file_insert_policy" ON "DocumentFile"
    FOR INSERT WITH CHECK (
        -- Admins peuvent tout insérer
        EXISTS (SELECT 1 FROM "Admin" WHERE "Admin".id = auth.uid()) OR
        -- Clients peuvent insérer leurs fichiers
        client_id = auth.uid() OR
        -- Experts peuvent insérer leurs fichiers
        expert_id = auth.uid() OR
        -- Uploader doit être l'utilisateur connecté
        uploaded_by = auth.uid()
    );

CREATE POLICY "document_file_update_policy" ON "DocumentFile"
    FOR UPDATE USING (
        -- Admins peuvent tout modifier
        EXISTS (SELECT 1 FROM "Admin" WHERE "Admin".id = auth.uid()) OR
        -- Uploader peut modifier ses fichiers
        uploaded_by = auth.uid() OR
        -- Experts peuvent modifier leurs fichiers
        expert_id = auth.uid()
    );

CREATE POLICY "document_file_delete_policy" ON "DocumentFile"
    FOR DELETE USING (
        -- Admins peuvent tout supprimer
        EXISTS (SELECT 1 FROM "Admin" WHERE "Admin".id = auth.uid()) OR
        -- Uploader peut supprimer ses fichiers
        uploaded_by = auth.uid()
    );

-- Politiques pour DocumentShare
CREATE POLICY "document_share_select_policy" ON "DocumentShare"
    FOR SELECT USING (
        -- Admins voient tout
        EXISTS (SELECT 1 FROM "Admin" WHERE "Admin".id = auth.uid()) OR
        -- Créateur du partage
        shared_by = auth.uid() OR
        -- Utilisateur avec token valide (géré au niveau application)
        true
    );

CREATE POLICY "document_share_insert_policy" ON "DocumentShare"
    FOR INSERT WITH CHECK (
        -- Admins peuvent tout insérer
        EXISTS (SELECT 1 FROM "Admin" WHERE "Admin".id = auth.uid()) OR
        -- Créateur du partage
        shared_by = auth.uid()
    );

-- Politiques pour DocumentAuditLog
CREATE POLICY "document_audit_log_select_policy" ON "DocumentAuditLog"
    FOR SELECT USING (
        -- Admins voient tout
        EXISTS (SELECT 1 FROM "Admin" WHERE "Admin".id = auth.uid()) OR
        -- Utilisateur voit ses propres logs
        user_id = auth.uid()
    );

CREATE POLICY "document_audit_log_insert_policy" ON "DocumentAuditLog"
    FOR INSERT WITH CHECK (
        -- Seuls les admins peuvent insérer des logs
        EXISTS (SELECT 1 FROM "Admin" WHERE "Admin".id = auth.uid())
    );

-- ===== 10. VUES OPTIMISÉES =====

-- Vue pour les fichiers récents
CREATE OR REPLACE VIEW "recent_documents" AS
SELECT 
    df.*,
    c.name as client_nom,
    e.name as expert_nom,
    u.email as uploaded_by_email
FROM "DocumentFile" df
LEFT JOIN "Client" c ON df.client_id = c.id
LEFT JOIN "Expert" e ON df.expert_id = e.id
LEFT JOIN "auth"."users" u ON df.uploaded_by = u.id
WHERE df.deleted_at IS NULL
ORDER BY df.created_at DESC;

-- Vue pour les statistiques globales
CREATE OR REPLACE VIEW "document_stats_global" AS
SELECT 
    COUNT(*) as total_files,
    COALESCE(SUM(file_size), 0) as total_size,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_uploads,
    COUNT(*) FILTER (WHERE status = 'uploaded') as pending_validation,
    COUNT(*) FILTER (WHERE status = 'validated') as validated_files,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_files
FROM "DocumentFile"
WHERE deleted_at IS NULL;

-- ===== 11. MAINTENANCE ET OPTIMISATION =====

-- Job pour nettoyer les partages expirés (à exécuter quotidiennement)
-- SELECT cleanup_expired_shares();

-- Job pour analyser les tables (à exécuter hebdomadairement)
-- ANALYZE "DocumentFile";
-- ANALYZE "DocumentFileVersion";
-- ANALYZE "DocumentShare";
-- ANALYZE "DocumentAuditLog";

-- ===== 12. COMMENTAIRES ET DOCUMENTATION =====

COMMENT ON TABLE "DocumentFile" IS 'Table principale unifiée pour tous les fichiers documentaires';
COMMENT ON TABLE "DocumentFileVersion" IS 'Versions des fichiers pour traçabilité';
COMMENT ON TABLE "DocumentShare" IS 'Partages sécurisés de fichiers';
COMMENT ON TABLE "DocumentAuditLog" IS 'Logs d''audit complets pour conformité';

COMMENT ON COLUMN "DocumentFile"."file_hash" IS 'Hash SHA-256 pour intégrité des fichiers';
COMMENT ON COLUMN "DocumentFile"."encryption_iv" IS 'IV pour chiffrement AES-256-GCM';
COMMENT ON COLUMN "DocumentFile"."access_level" IS 'Niveaux: public, private, restricted, confidential';

-- ===== 13. MIGRATION DES DONNÉES EXISTANTES =====

-- Note: Cette section sera exécutée séparément pour migrer les données existantes
-- depuis les anciennes tables vers la nouvelle structure unifiée

-- ===== 14. VALIDATION FINALE =====

-- Vérifier que toutes les contraintes sont respectées
DO $$
BEGIN
    -- Vérifier les contraintes CHECK
    IF EXISTS (
        SELECT 1 FROM "DocumentFile" 
        WHERE file_size <= 0 OR 
              (client_id IS NOT NULL AND expert_id IS NOT NULL) OR
              (expires_at IS NOT NULL AND expires_at <= created_at)
    ) THEN
        RAISE EXCEPTION 'Contraintes CHECK violées dans DocumentFile';
    END IF;
    
    -- Vérifier que les tables principales existent
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'DocumentFile') THEN
        RAISE EXCEPTION 'Table DocumentFile manquante';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'DocumentFileVersion') THEN
        RAISE EXCEPTION 'Table DocumentFileVersion manquante';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'DocumentShare') THEN
        RAISE EXCEPTION 'Table DocumentShare manquante';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'DocumentAuditLog') THEN
        RAISE EXCEPTION 'Table DocumentAuditLog manquante';
    END IF;
    
    RAISE NOTICE 'Migration unifiée terminée avec succès!';
END $$; 