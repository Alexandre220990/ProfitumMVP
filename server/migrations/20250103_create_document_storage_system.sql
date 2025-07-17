-- Migration pour étendre le système GED avec stockage de fichiers Supabase
-- Date: 2025-01-03
-- Version: 2.0
-- Auteur: FinancialTracker Team

-- ===== 1. TABLE DES FICHIERS STOCKÉS =====

CREATE TABLE IF NOT EXISTS "DocumentFile" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "document_id" INTEGER REFERENCES "Document"("id") ON DELETE CASCADE,
    "client_id" UUID REFERENCES "Client"("id") ON DELETE CASCADE,
    "audit_id" UUID REFERENCES "Audit"("id") ON DELETE SET NULL,
    
    -- Informations du fichier
    "original_filename" VARCHAR(255) NOT NULL,
    "stored_filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "bucket_name" VARCHAR(100) NOT NULL DEFAULT 'documents',
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_extension" VARCHAR(20),
    
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
    
    -- Statut et validation
    "status" VARCHAR(20) DEFAULT 'uploaded' CHECK ("status" IN (
        'uploaded', 'validated', 'rejected', 'archived', 'deleted'
    )),
    "validation_status" VARCHAR(20) DEFAULT 'pending' CHECK ("validation_status" IN (
        'pending', 'approved', 'rejected', 'requires_revision'
    )),
    "is_public" BOOLEAN DEFAULT false,
    "is_encrypted" BOOLEAN DEFAULT false,
    
    -- Sécurité et accès
    "access_level" VARCHAR(20) DEFAULT 'private' CHECK ("access_level" IN (
        'public', 'private', 'restricted', 'confidential'
    )),
    "expires_at" TIMESTAMP WITH TIME ZONE,
    "download_count" INTEGER DEFAULT 0,
    "last_downloaded" TIMESTAMP WITH TIME ZONE,
    
    -- Traçabilité
    "uploaded_by" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    "validated_by" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS "idx_document_file_document_id" ON "DocumentFile" ("document_id");
CREATE INDEX IF NOT EXISTS "idx_document_file_client_id" ON "DocumentFile" ("client_id");
CREATE INDEX IF NOT EXISTS "idx_document_file_audit_id" ON "DocumentFile" ("audit_id");
CREATE INDEX IF NOT EXISTS "idx_document_file_category" ON "DocumentFile" ("category");
CREATE INDEX IF NOT EXISTS "idx_document_file_status" ON "DocumentFile" ("status");
CREATE INDEX IF NOT EXISTS "idx_document_file_uploaded_by" ON "DocumentFile" ("uploaded_by");
CREATE INDEX IF NOT EXISTS "idx_document_file_created_at" ON "DocumentFile" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_document_file_bucket_name" ON "DocumentFile" ("bucket_name");
CREATE INDEX IF NOT EXISTS "idx_document_file_tags" ON "DocumentFile" USING GIN("tags");
CREATE INDEX IF NOT EXISTS "idx_document_file_expires_at" ON "DocumentFile" ("expires_at");

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_document_file_client_category" ON "DocumentFile" ("client_id", "category");
CREATE INDEX IF NOT EXISTS "idx_document_file_client_status" ON "DocumentFile" ("client_id", "status");
CREATE INDEX IF NOT EXISTS "idx_document_file_audit_category" ON "DocumentFile" ("audit_id", "category");

-- ===== 2. TABLE DES VERSIONS DE FICHIERS =====

CREATE TABLE IF NOT EXISTS "DocumentFileVersion" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "file_id" UUID REFERENCES "DocumentFile"("id") ON DELETE CASCADE,
    "version_number" INTEGER NOT NULL CHECK ("version_number" > 0),
    "stored_filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "change_description" TEXT,
    "uploaded_by" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les versions
CREATE INDEX IF NOT EXISTS "idx_document_file_version_file_id" ON "DocumentFileVersion" ("file_id");
CREATE INDEX IF NOT EXISTS "idx_document_file_version_number" ON "DocumentFileVersion" ("version_number");
CREATE INDEX IF NOT EXISTS "idx_document_file_version_created_at" ON "DocumentFileVersion" ("created_at");

-- Index composite
CREATE INDEX IF NOT EXISTS "idx_document_file_version_file_number" ON "DocumentFileVersion" ("file_id", "version_number");

-- ===== 3. TABLE DES LOGS D'ACCÈS AUX FICHIERS =====

CREATE TABLE IF NOT EXISTS "DocumentFileAccessLog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "file_id" UUID REFERENCES "DocumentFile"("id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    "user_type" VARCHAR(20) NOT NULL CHECK ("user_type" IN ('admin', 'client', 'expert')),
    "action" VARCHAR(20) NOT NULL CHECK ("action" IN ('view', 'download', 'upload', 'update', 'delete', 'validate', 'reject')),
    "ip_address" INET,
    "user_agent" TEXT,
    "session_id" VARCHAR(255),
    "access_granted" BOOLEAN DEFAULT true,
    "error_message" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les logs
CREATE INDEX IF NOT EXISTS "idx_document_file_access_log_file_id" ON "DocumentFileAccessLog" ("file_id");
CREATE INDEX IF NOT EXISTS "idx_document_file_access_log_user_id" ON "DocumentFileAccessLog" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_document_file_access_log_action" ON "DocumentFileAccessLog" ("action");
CREATE INDEX IF NOT EXISTS "idx_document_file_access_log_created_at" ON "DocumentFileAccessLog" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_document_file_access_log_user_type" ON "DocumentFileAccessLog" ("user_type");

-- ===== 4. TABLE DES PERMISSIONS DE FICHIERS =====

CREATE TABLE IF NOT EXISTS "DocumentFilePermission" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "file_id" UUID REFERENCES "DocumentFile"("id") ON DELETE CASCADE,
    "user_type" VARCHAR(20) NOT NULL CHECK ("user_type" IN ('admin', 'client', 'expert')),
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    "can_view" BOOLEAN DEFAULT false,
    "can_download" BOOLEAN DEFAULT false,
    "can_upload" BOOLEAN DEFAULT false,
    "can_update" BOOLEAN DEFAULT false,
    "can_delete" BOOLEAN DEFAULT false,
    "can_share" BOOLEAN DEFAULT false,
    "expires_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les permissions
CREATE INDEX IF NOT EXISTS "idx_document_file_permission_file_id" ON "DocumentFilePermission" ("file_id");
CREATE INDEX IF NOT EXISTS "idx_document_file_permission_user_type" ON "DocumentFilePermission" ("user_type");
CREATE INDEX IF NOT EXISTS "idx_document_file_permission_user_id" ON "DocumentFilePermission" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_document_file_permission_expires_at" ON "DocumentFilePermission" ("expires_at");

-- Index composite
CREATE INDEX IF NOT EXISTS "idx_document_file_permission_file_user" ON "DocumentFilePermission" ("file_id", "user_id");

-- ===== 5. TABLE DES PARTAGES DE FICHIERS =====

CREATE TABLE IF NOT EXISTS "DocumentFileShare" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "file_id" UUID REFERENCES "DocumentFile"("id") ON DELETE CASCADE,
    "shared_by" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    "shared_with_email" VARCHAR(255),
    "shared_with_user_id" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    "share_token" VARCHAR(255) UNIQUE NOT NULL,
    "permissions" JSONB DEFAULT '{"view": true, "download": false}',
    "expires_at" TIMESTAMP WITH TIME ZONE,
    "download_limit" INTEGER,
    "download_count" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les partages
CREATE INDEX IF NOT EXISTS "idx_document_file_share_file_id" ON "DocumentFileShare" ("file_id");
CREATE INDEX IF NOT EXISTS "idx_document_file_share_token" ON "DocumentFileShare" ("share_token");
CREATE INDEX IF NOT EXISTS "idx_document_file_share_shared_by" ON "DocumentFileShare" ("shared_by");
CREATE INDEX IF NOT EXISTS "idx_document_file_share_expires_at" ON "DocumentFileShare" ("expires_at");
CREATE INDEX IF NOT EXISTS "idx_document_file_share_is_active" ON "DocumentFileShare" ("is_active");

-- ===== 6. TRIGGERS POUR MISE À JOUR AUTOMATIQUE =====

-- Trigger pour mettre à jour updated_at dans DocumentFile
CREATE OR REPLACE FUNCTION update_document_file_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_file_updated_at
    BEFORE UPDATE ON "DocumentFile"
    FOR EACH ROW
    EXECUTE FUNCTION update_document_file_updated_at();

-- Trigger pour mettre à jour updated_at dans DocumentFilePermission
CREATE OR REPLACE FUNCTION update_document_file_permission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_file_permission_updated_at
    BEFORE UPDATE ON "DocumentFilePermission"
    FOR EACH ROW
    EXECUTE FUNCTION update_document_file_permission_updated_at();

-- Trigger pour incrémenter download_count
CREATE OR REPLACE FUNCTION increment_document_file_download_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.action = 'download' THEN
        UPDATE "DocumentFile" 
        SET download_count = download_count + 1,
            last_downloaded = CURRENT_TIMESTAMP
        WHERE id = NEW.file_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_document_file_download_count
    AFTER INSERT ON "DocumentFileAccessLog"
    FOR EACH ROW
    EXECUTE FUNCTION increment_document_file_download_count();

-- ===== 7. POLITIQUES RLS (ROW LEVEL SECURITY) =====

-- Activer RLS sur toutes les tables
ALTER TABLE "DocumentFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentFileVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentFileAccessLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentFilePermission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentFileShare" ENABLE ROW LEVEL SECURITY;

-- Politiques pour DocumentFile
CREATE POLICY "document_file_read_policy" ON "DocumentFile"
    FOR SELECT USING (
        -- Admins peuvent tout voir
        current_setting('app.user_type', true)::text = 'admin'
        OR
        -- Clients peuvent voir leurs propres fichiers
        (current_setting('app.user_type', true)::text = 'client' AND client_id = current_setting('app.user_id', true)::uuid)
        OR
        -- Experts peuvent voir les fichiers des audits qui leur sont assignés
        (current_setting('app.user_type', true)::text = 'expert' AND audit_id IN (
            SELECT audit_id FROM "expertassignment" WHERE expert_id = current_setting('app.user_id', true)::uuid
        ))
        OR
        -- Fichiers publics
        is_public = true
        OR
        -- Permissions explicites
        EXISTS (
            SELECT 1 FROM "DocumentFilePermission" dfp
            WHERE dfp.file_id = "DocumentFile".id
            AND dfp.user_id = current_setting('app.user_id', true)::uuid
            AND dfp.can_view = true
            AND (dfp.expires_at IS NULL OR dfp.expires_at > CURRENT_TIMESTAMP)
        )
    );

CREATE POLICY "document_file_insert_policy" ON "DocumentFile"
    FOR INSERT WITH CHECK (
        current_setting('app.user_type', true)::text = 'admin'
        OR
        (current_setting('app.user_type', true)::text = 'client' AND client_id = current_setting('app.user_id', true)::uuid)
        OR
        (current_setting('app.user_type', true)::text = 'expert' AND audit_id IN (
            SELECT audit_id FROM "expertassignment" WHERE expert_id = current_setting('app.user_id', true)::uuid
        ))
    );

CREATE POLICY "document_file_update_policy" ON "DocumentFile"
    FOR UPDATE USING (
        current_setting('app.user_type', true)::text = 'admin'
        OR
        uploaded_by = current_setting('app.user_id', true)::uuid
        OR
        EXISTS (
            SELECT 1 FROM "DocumentFilePermission" dfp
            WHERE dfp.file_id = "DocumentFile".id
            AND dfp.user_id = current_setting('app.user_id', true)::uuid
            AND dfp.can_update = true
            AND (dfp.expires_at IS NULL OR dfp.expires_at > CURRENT_TIMESTAMP)
        )
    );

CREATE POLICY "document_file_delete_policy" ON "DocumentFile"
    FOR DELETE USING (
        current_setting('app.user_type', true)::text = 'admin'
        OR
        uploaded_by = current_setting('app.user_id', true)::uuid
        OR
        EXISTS (
            SELECT 1 FROM "DocumentFilePermission" dfp
            WHERE dfp.file_id = "DocumentFile".id
            AND dfp.user_id = current_setting('app.user_id', true)::uuid
            AND dfp.can_delete = true
            AND (dfp.expires_at IS NULL OR dfp.expires_at > CURRENT_TIMESTAMP)
        )
    );

-- Politiques pour les autres tables
CREATE POLICY "document_file_version_policy" ON "DocumentFileVersion"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "DocumentFile" df
            WHERE df.id = "DocumentFileVersion".file_id
            AND (
                current_setting('app.user_type', true)::text = 'admin'
                OR df.uploaded_by = current_setting('app.user_id', true)::uuid
                OR df.is_public = true
            )
        )
    );

CREATE POLICY "document_file_access_log_policy" ON "DocumentFileAccessLog"
    FOR ALL USING (
        current_setting('app.user_type', true)::text = 'admin'
        OR user_id = current_setting('app.user_id', true)::uuid
    );

CREATE POLICY "document_file_permission_policy" ON "DocumentFilePermission"
    FOR ALL USING (
        current_setting('app.user_type', true)::text = 'admin'
        OR user_id = current_setting('app.user_id', true)::uuid
    );

CREATE POLICY "document_file_share_policy" ON "DocumentFileShare"
    FOR ALL USING (
        current_setting('app.user_type', true)::text = 'admin'
        OR shared_by = current_setting('app.user_id', true)::uuid
        OR shared_with_user_id = current_setting('app.user_id', true)::uuid
    );

-- ===== 8. FONCTIONS UTILITAIRES =====

-- Fonction pour obtenir les fichiers d'un client
CREATE OR REPLACE FUNCTION get_client_files(client_uuid UUID, category_filter TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    original_filename VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    category VARCHAR(50),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        df.id,
        df.original_filename,
        df.file_size,
        df.mime_type,
        df.category,
        df.status,
        df.created_at,
        df.download_count
    FROM "DocumentFile" df
    WHERE df.client_id = client_uuid
    AND df.deleted_at IS NULL
    AND (category_filter IS NULL OR df.category = category_filter)
    ORDER BY df.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques de fichiers d'un client
CREATE OR REPLACE FUNCTION get_client_file_stats(client_uuid UUID)
RETURNS TABLE (
    total_files INTEGER,
    total_size BIGINT,
    files_by_category JSONB,
    files_by_status JSONB,
    recent_uploads INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_files,
        COALESCE(SUM(file_size), 0) as total_size,
        COALESCE(
            jsonb_object_agg(
                category, 
                COUNT(*)::INTEGER
            ) FILTER (WHERE category IS NOT NULL),
            '{}'::jsonb
        ) as files_by_category,
        COALESCE(
            jsonb_object_agg(
                status, 
                COUNT(*)::INTEGER
            ) FILTER (WHERE status IS NOT NULL),
            '{}'::jsonb
        ) as files_by_status,
        COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days')::INTEGER as recent_uploads
    FROM "DocumentFile"
    WHERE client_id = client_uuid
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les fichiers expirés
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "DocumentFile"
    WHERE expires_at IS NOT NULL 
    AND expires_at < CURRENT_TIMESTAMP
    AND status != 'archived';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 9. INSERTION DES DONNÉES DE TEST =====

-- Insérer des catégories de fichiers par défaut
INSERT INTO "DocumentFile" (
    "document_id", "client_id", "original_filename", "stored_filename", 
    "file_path", "file_size", "mime_type", "category", "document_type", 
    "description", "status", "uploaded_by"
) VALUES 
    (
        NULL, 
        (SELECT id FROM "Client" LIMIT 1),
        'charte-engagement-2025.pdf',
        'charte_20250103_001.pdf',
        'documents/clients/chartes/charte_20250103_001.pdf',
        2048576,
        'application/pdf',
        'charte',
        'pdf',
        'Charte d''engagement pour l''optimisation fiscale 2025',
        'validated',
        (SELECT id FROM auth.users LIMIT 1)
    ),
    (
        NULL,
        (SELECT id FROM "Client" LIMIT 1),
        'rapport-audit-energetique.pdf',
        'audit_energie_20250103_001.pdf',
        'documents/clients/audits/audit_energie_20250103_001.pdf',
        5120000,
        'application/pdf',
        'audit',
        'pdf',
        'Rapport d''audit énergétique complet',
        'validated',
        (SELECT id FROM auth.users LIMIT 1)
    )
ON CONFLICT DO NOTHING;

-- ===== 10. ANALYSE DES TABLES =====

ANALYZE "DocumentFile";
ANALYZE "DocumentFileVersion";
ANALYZE "DocumentFileAccessLog";
ANALYZE "DocumentFilePermission";
ANALYZE "DocumentFileShare";

-- ===== 11. VÉRIFICATION DE LA MIGRATION =====

-- Vérifier que toutes les tables ont été créées
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'DocumentFile%'
ORDER BY table_name;

-- Vérifier les index créés
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'DocumentFile%'
ORDER BY tablename, indexname;

-- Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'DocumentFile%'
ORDER BY tablename, policyname; 