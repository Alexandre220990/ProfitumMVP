-- Migration pour créer les tables du système de Gestion Électronique Documentaire (GED)
-- Date: 2025-01-27
-- Auteur: FinancialTracker Team

-- ===== 1. TABLE DES DOCUMENTS =====

CREATE TABLE IF NOT EXISTS "Document" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL CHECK ("category" IN ('business', 'technical')),
    "file_path" VARCHAR(500),
    "last_modified" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    "is_active" BOOLEAN DEFAULT true,
    "read_time" INTEGER DEFAULT 5 CHECK ("read_time" > 0),
    "version" INTEGER DEFAULT 1 CHECK ("version" > 0)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_document_category" ON "Document" ("category");
CREATE INDEX IF NOT EXISTS "idx_document_created_by" ON "Document" ("created_by");
CREATE INDEX IF NOT EXISTS "idx_document_created_at" ON "Document" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_document_last_modified" ON "Document" ("last_modified");
CREATE INDEX IF NOT EXISTS "idx_document_is_active" ON "Document" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_document_title" ON "Document" USING gin(to_tsvector('french', "title"));
CREATE INDEX IF NOT EXISTS "idx_document_content" ON "Document" USING gin(to_tsvector('french', "content"));

-- ===== 2. TABLE DES LABELS/TAGS =====

CREATE TABLE IF NOT EXISTS "DocumentLabel" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "color" VARCHAR(7) DEFAULT '#3B82F6' CHECK ("color" ~ '^#[0-9A-Fa-f]{6}$'),
    "description" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_document_label_name" ON "DocumentLabel" ("name");
CREATE INDEX IF NOT EXISTS "idx_document_label_created_at" ON "DocumentLabel" ("created_at");

-- ===== 3. TABLE DE LIAISON DOCUMENTS-LABELS =====

CREATE TABLE IF NOT EXISTS "DocumentLabelRelation" (
    "document_id" UUID REFERENCES "Document"("id") ON DELETE CASCADE,
    "label_id" UUID REFERENCES "DocumentLabel"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("document_id", "label_id")
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_document_label_relation_document" ON "DocumentLabelRelation" ("document_id");
CREATE INDEX IF NOT EXISTS "idx_document_label_relation_label" ON "DocumentLabelRelation" ("label_id");

-- ===== 4. TABLE DES DROITS D'ACCÈS PAR PROFIL =====

CREATE TABLE IF NOT EXISTS "DocumentPermission" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "document_id" UUID REFERENCES "Document"("id") ON DELETE CASCADE,
    "user_type" VARCHAR(20) NOT NULL CHECK ("user_type" IN ('admin', 'client', 'expert')),
    "can_read" BOOLEAN DEFAULT false,
    "can_write" BOOLEAN DEFAULT false,
    "can_delete" BOOLEAN DEFAULT false,
    "can_share" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_document_permission_document" ON "DocumentPermission" ("document_id");
CREATE INDEX IF NOT EXISTS "idx_document_permission_user_type" ON "DocumentPermission" ("user_type");
CREATE INDEX IF NOT EXISTS "idx_document_permission_can_read" ON "DocumentPermission" ("can_read");
CREATE INDEX IF NOT EXISTS "idx_document_permission_can_write" ON "DocumentPermission" ("can_write");

-- Index composite pour les requêtes de permissions
CREATE INDEX IF NOT EXISTS "idx_document_permission_document_user" ON "DocumentPermission" ("document_id", "user_type");

-- ===== 5. TABLE DES VERSIONS DE DOCUMENTS =====

CREATE TABLE IF NOT EXISTS "DocumentVersion" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "document_id" UUID REFERENCES "Document"("id") ON DELETE CASCADE,
    "version_number" INTEGER NOT NULL CHECK ("version_number" > 0),
    "content" TEXT NOT NULL,
    "modified_by" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    "modified_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "change_description" TEXT
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_document_version_document" ON "DocumentVersion" ("document_id");
CREATE INDEX IF NOT EXISTS "idx_document_version_number" ON "DocumentVersion" ("version_number");
CREATE INDEX IF NOT EXISTS "idx_document_version_modified_at" ON "DocumentVersion" ("modified_at");
CREATE INDEX IF NOT EXISTS "idx_document_version_modified_by" ON "DocumentVersion" ("modified_by");

-- Index composite pour les requêtes de versions
CREATE INDEX IF NOT EXISTS "idx_document_version_document_number" ON "DocumentVersion" ("document_id", "version_number");

-- ===== 6. TABLE DES FAVORIS UTILISATEURS =====

CREATE TABLE IF NOT EXISTS "UserDocumentFavorite" (
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    "document_id" UUID REFERENCES "Document"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("user_id", "document_id")
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "idx_user_document_favorite_user" ON "UserDocumentFavorite" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_document_favorite_document" ON "UserDocumentFavorite" ("document_id");
CREATE INDEX IF NOT EXISTS "idx_user_document_favorite_created_at" ON "UserDocumentFavorite" ("created_at");

-- ===== 7. TRIGGERS POUR MISE À JOUR AUTOMATIQUE =====

-- Trigger pour mettre à jour last_modified automatiquement
CREATE OR REPLACE FUNCTION update_document_last_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_last_modified
    BEFORE UPDATE ON "Document"
    FOR EACH ROW
    EXECUTE FUNCTION update_document_last_modified();

-- Trigger pour mettre à jour updated_at dans DocumentPermission
CREATE OR REPLACE FUNCTION update_document_permission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_permission_updated_at
    BEFORE UPDATE ON "DocumentPermission"
    FOR EACH ROW
    EXECUTE FUNCTION update_document_permission_updated_at();

-- ===== 8. INSERTION DES LABELS PAR DÉFAUT =====

INSERT INTO "DocumentLabel" ("name", "color", "description") VALUES
    ('admin', '#EF4444', 'Documentation pour les administrateurs'),
    ('client', '#3B82F6', 'Documentation pour les clients'),
    ('expert', '#10B981', 'Documentation pour les experts'),
    ('guide', '#F59E0B', 'Guides d''utilisation'),
    ('fonctionnalités', '#8B5CF6', 'Description des fonctionnalités'),
    ('processus', '#06B6D4', 'Processus métier'),
    ('métier', '#84CC16', 'Documentation métier'),
    ('sécurité', '#DC2626', 'Documentation sécurité'),
    ('api', '#7C3AED', 'Documentation API'),
    ('architecture', '#059669', 'Architecture technique'),
    ('déploiement', '#D97706', 'Guides de déploiement'),
    ('tests', '#0891B2', 'Documentation des tests'),
    ('ged', '#7C2D12', 'Gestion Électronique Documentaire'),
    ('documentation', '#1E40AF', 'Documentation générale'),
    ('implémentation', '#BE185D', 'Guides d''implémentation'),
    ('base-de-données', '#92400E', 'Documentation base de données'),
    ('iso', '#374151', 'Conformité ISO')
ON CONFLICT ("name") DO NOTHING;

-- ===== 9. POLITIQUES RLS (ROW LEVEL SECURITY) =====

-- Activer RLS sur toutes les tables
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentLabel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentLabelRelation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentPermission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserDocumentFavorite" ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les documents selon les permissions
CREATE POLICY "document_read_policy" ON "Document"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "DocumentPermission" dp
            WHERE dp.document_id = "Document".id
            AND dp.user_type = current_setting('app.user_type', true)::text
            AND dp.can_read = true
        )
        OR 
        current_setting('app.user_type', true)::text = 'admin'
    );

-- Politique d'écriture pour les admins et auteurs
CREATE POLICY "document_write_policy" ON "Document"
    FOR UPDATE USING (
        current_setting('app.user_type', true)::text = 'admin'
        OR created_by = auth.uid()
    );

-- Politique d'insertion pour les admins et experts (pour les guides métier)
CREATE POLICY "document_insert_policy" ON "Document"
    FOR INSERT WITH CHECK (
        current_setting('app.user_type', true)::text = 'admin'
        OR (
            current_setting('app.user_type', true)::text = 'expert'
            AND category = 'business'
        )
    );

-- Politique de suppression pour les admins uniquement
CREATE POLICY "document_delete_policy" ON "Document"
    FOR DELETE USING (
        current_setting('app.user_type', true)::text = 'admin'
    );

-- Politiques pour les labels (lecture pour tous, écriture pour admins)
CREATE POLICY "document_label_read_policy" ON "DocumentLabel"
    FOR SELECT USING (true);

CREATE POLICY "document_label_write_policy" ON "DocumentLabel"
    FOR ALL USING (
        current_setting('app.user_type', true)::text = 'admin'
    );

-- Politiques pour les permissions (admins uniquement)
CREATE POLICY "document_permission_policy" ON "DocumentPermission"
    FOR ALL USING (
        current_setting('app.user_type', true)::text = 'admin'
    );

-- Politiques pour les versions (lecture selon permissions document, écriture pour admins/auteurs)
CREATE POLICY "document_version_read_policy" ON "DocumentVersion"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "DocumentPermission" dp
            WHERE dp.document_id = "DocumentVersion".document_id
            AND dp.user_type = current_setting('app.user_type', true)::text
            AND dp.can_read = true
        )
        OR 
        current_setting('app.user_type', true)::text = 'admin'
    );

CREATE POLICY "document_version_write_policy" ON "DocumentVersion"
    FOR ALL USING (
        current_setting('app.user_type', true)::text = 'admin'
        OR modified_by = auth.uid()
    );

-- Politiques pour les favoris (utilisateur propriétaire)
CREATE POLICY "user_document_favorite_policy" ON "UserDocumentFavorite"
    FOR ALL USING (user_id = auth.uid());

-- ===== 10. FONCTIONS UTILITAIRES =====

-- Fonction pour obtenir les permissions d'un utilisateur sur un document
CREATE OR REPLACE FUNCTION get_document_permissions(document_uuid UUID, user_type_param TEXT)
RETURNS TABLE (
    can_read BOOLEAN,
    can_write BOOLEAN,
    can_delete BOOLEAN,
    can_share BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dp.can_read,
        dp.can_write,
        dp.can_delete,
        dp.can_share
    FROM "DocumentPermission" dp
    WHERE dp.document_id = document_uuid
    AND dp.user_type = user_type_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les documents accessibles à un utilisateur
CREATE OR REPLACE FUNCTION get_user_documents(user_type_param TEXT)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMP,
    last_modified TIMESTAMP,
    read_time INTEGER,
    version INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.description,
        d.category,
        d.created_at,
        d.last_modified,
        d.read_time,
        d.version
    FROM "Document" d
    INNER JOIN "DocumentPermission" dp ON d.id = dp.document_id
    WHERE dp.user_type = user_type_param
    AND dp.can_read = true
    AND d.is_active = true
    ORDER BY d.last_modified DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 11. ANALYSE DES TABLES =====

ANALYZE "Document";
ANALYZE "DocumentLabel";
ANALYZE "DocumentLabelRelation";
ANALYZE "DocumentPermission";
ANALYZE "DocumentVersion";
ANALYZE "UserDocumentFavorite";

-- ===== 12. VÉRIFICATION DE LA MIGRATION =====

-- Vérifier que toutes les tables ont été créées
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Document', 'DocumentLabel', 'DocumentLabelRelation', 'DocumentPermission', 'DocumentVersion', 'UserDocumentFavorite')
ORDER BY table_name;

-- Vérifier les index créés
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('Document', 'DocumentLabel', 'DocumentLabelRelation', 'DocumentPermission', 'DocumentVersion', 'UserDocumentFavorite')
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
AND tablename IN ('Document', 'DocumentLabel', 'DocumentLabelRelation', 'DocumentPermission', 'DocumentVersion', 'UserDocumentFavorite')
ORDER BY tablename, policyname; 