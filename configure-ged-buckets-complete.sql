-- ===== CONFIGURATION COMPLÈTE GED SUPABASE - CLIENTS, EXPERTS, ADMINS =====
-- Script pour configurer tous les buckets et politiques de sécurité GED
-- Date: 2025-01-03
-- Version: 1.0 - Configuration complète

-- ===== 1. CRÉATION DES BUCKETS =====

-- Bucket pour les documents clients (par client)
DO $$
BEGIN
    -- Vérifier si le bucket client-documents existe
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'client-documents') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'client-documents',
            'client-documents',
            false,
            10485760, -- 10MB
            ARRAY[
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'image/jpeg',
                'image/png',
                'image/gif',
                'text/plain',
                'text/csv',
                'application/zip',
                'application/x-rar-compressed'
            ]
        );
        RAISE NOTICE 'Bucket client-documents créé';
    ELSE
        RAISE NOTICE 'Bucket client-documents existe déjà';
    END IF;
END $$;

-- Bucket pour les documents experts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'expert-documents') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'expert-documents',
            'expert-documents',
            false,
            52428800, -- 50MB
            ARRAY[
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'image/jpeg',
                'image/png',
                'image/gif',
                'text/plain',
                'text/csv',
                'application/zip',
                'application/x-rar-compressed'
            ]
        );
        RAISE NOTICE 'Bucket expert-documents créé';
    ELSE
        RAISE NOTICE 'Bucket expert-documents existe déjà';
    END IF;
END $$;

-- Bucket pour les documents admin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'admin-documents') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'admin-documents',
            'admin-documents',
            false,
            104857600, -- 100MB
            ARRAY[
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'image/jpeg',
                'image/png',
                'image/gif',
                'text/plain',
                'text/csv',
                'application/zip',
                'application/x-rar-compressed'
            ]
        );
        RAISE NOTICE 'Bucket admin-documents créé';
    ELSE
        RAISE NOTICE 'Bucket admin-documents existe déjà';
    END IF;
END $$;

-- Bucket pour les chartes signées
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'chartes-signatures') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'chartes-signatures',
            'chartes-signatures',
            false,
            10485760, -- 10MB
            ARRAY['application/pdf']
        );
        RAISE NOTICE 'Bucket chartes-signatures créé';
    ELSE
        RAISE NOTICE 'Bucket chartes-signatures existe déjà';
    END IF;
END $$;

-- Bucket pour les rapports d'audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'rapports-audit') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'rapports-audit',
            'rapports-audit',
            false,
            52428800, -- 50MB
            ARRAY[
                'application/pdf',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ]
        );
        RAISE NOTICE 'Bucket rapports-audit créé';
    ELSE
        RAISE NOTICE 'Bucket rapports-audit existe déjà';
    END IF;
END $$;

-- ===== 2. SUPPRESSION DES POLITIQUES EXISTANTES =====

-- Supprimer toutes les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "client_documents_access" ON storage.objects;
DROP POLICY IF EXISTS "expert_documents_access" ON storage.objects;
DROP POLICY IF EXISTS "admin_documents_access" ON storage.objects;
DROP POLICY IF EXISTS "chartes_signatures_access" ON storage.objects;
DROP POLICY IF EXISTS "rapports_audit_access" ON storage.objects;
DROP POLICY IF EXISTS "client_upload_access" ON storage.objects;
DROP POLICY IF EXISTS "expert_upload_access" ON storage.objects;
DROP POLICY IF EXISTS "admin_upload_access" ON storage.objects;
DROP POLICY IF EXISTS "shared_document_access" ON storage.objects;

-- ===== 3. POLITIQUES POUR LE BUCKET CLIENT-DOCUMENTS =====

-- Politique 1: Les clients peuvent voir leurs propres documents
CREATE POLICY "client_documents_view_own" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'client-documents' 
        AND (
            -- Client propriétaire du document
            (storage.foldername(name))[1] = auth.uid()::text
            OR
            -- Client authentifié avec accès au document via la table DocumentFile
            EXISTS (
                SELECT 1 FROM "DocumentFile" df
                WHERE df.client_id = auth.uid()
                AND df.file_path = name
                AND df.bucket_name = 'client-documents'
            )
        )
    );

-- Politique 2: Les experts peuvent voir les documents des clients qu'ils gèrent
CREATE POLICY "client_documents_expert_view" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'client-documents'
        AND EXISTS (
            SELECT 1 FROM "ExpertAssignment" ea
            JOIN "DocumentFile" df ON df.client_id = ea.client_id
            WHERE ea.expert_id = auth.uid()
            AND df.file_path = name
            AND df.bucket_name = 'client-documents'
        )
    );

-- Politique 3: Les admins peuvent voir tous les documents clients
CREATE POLICY "client_documents_admin_view" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'client-documents'
        AND EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- Politique 4: Les clients peuvent uploader leurs documents
CREATE POLICY "client_documents_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'client-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 5: Les clients peuvent modifier leurs documents
CREATE POLICY "client_documents_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'client-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 6: Les clients peuvent supprimer leurs documents
CREATE POLICY "client_documents_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'client-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ===== 4. POLITIQUES POUR LE BUCKET EXPERT-DOCUMENTS =====

-- Politique 1: Les experts peuvent voir leurs propres documents
CREATE POLICY "expert_documents_view_own" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'expert-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 2: Les admins peuvent voir tous les documents experts
CREATE POLICY "expert_documents_admin_view" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'expert-documents'
        AND EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- Politique 3: Les experts peuvent uploader leurs documents
CREATE POLICY "expert_documents_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'expert-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 4: Les experts peuvent modifier leurs documents
CREATE POLICY "expert_documents_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'expert-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 5: Les experts peuvent supprimer leurs documents
CREATE POLICY "expert_documents_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'expert-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ===== 5. POLITIQUES POUR LE BUCKET ADMIN-DOCUMENTS =====

-- Politique 1: Seuls les admins peuvent voir les documents admin
CREATE POLICY "admin_documents_view" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'admin-documents'
        AND EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- Politique 2: Seuls les admins peuvent uploader des documents admin
CREATE POLICY "admin_documents_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'admin-documents'
        AND EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- Politique 3: Seuls les admins peuvent modifier les documents admin
CREATE POLICY "admin_documents_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'admin-documents'
        AND EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- Politique 4: Seuls les admins peuvent supprimer les documents admin
CREATE POLICY "admin_documents_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'admin-documents'
        AND EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- ===== 6. POLITIQUES POUR LE BUCKET CHARTES-SIGNATURES =====

-- Politique 1: Les clients peuvent voir leurs chartes signées
CREATE POLICY "chartes_signatures_client_view" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'chartes-signatures'
        AND EXISTS (
            SELECT 1 FROM "ClientCharteSignature" ccs
            WHERE ccs.client_id = auth.uid()
            AND ccs.file_path = name
        )
    );

-- Politique 2: Les admins peuvent voir toutes les chartes
CREATE POLICY "chartes_signatures_admin_view" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'chartes-signatures'
        AND EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- Politique 3: Les admins peuvent uploader des chartes
CREATE POLICY "chartes_signatures_admin_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'chartes-signatures'
        AND EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- ===== 7. POLITIQUES POUR LE BUCKET RAPPORTS-AUDIT =====

-- Politique 1: Les experts peuvent voir leurs rapports
CREATE POLICY "rapports_audit_expert_view" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'rapports-audit'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 2: Les clients peuvent voir les rapports de leurs audits
CREATE POLICY "rapports_audit_client_view" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'rapports-audit'
        AND EXISTS (
            SELECT 1 FROM "Audit" a
            JOIN "DocumentFile" df ON df.audit_id = a.id
            WHERE a.client_id = auth.uid()
            AND df.file_path = name
            AND df.bucket_name = 'rapports-audit'
        )
    );

-- Politique 3: Les admins peuvent voir tous les rapports
CREATE POLICY "rapports_audit_admin_view" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'rapports-audit'
        AND EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- Politique 4: Les experts peuvent uploader leurs rapports
CREATE POLICY "rapports_audit_expert_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'rapports-audit'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ===== 8. POLITIQUES DE PARTAGE DE DOCUMENTS =====

-- Politique pour les documents partagés entre clients et experts
CREATE POLICY "shared_document_access" ON storage.objects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "DocumentFile" df
            JOIN "ExpertAssignment" ea ON ea.client_id = df.client_id
            WHERE df.file_path = name
            AND (
                -- Client propriétaire
                df.client_id = auth.uid()
                OR
                -- Expert assigné
                ea.expert_id = auth.uid()
                OR
                -- Admin
                EXISTS (SELECT 1 FROM "Admin" WHERE "Admin".id = auth.uid())
            )
        )
    );

-- ===== 9. FONCTIONS UTILITAIRES =====

-- Fonction pour créer un bucket client automatiquement
CREATE OR REPLACE FUNCTION create_client_bucket(client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Cette fonction sera appelée par le service backend
    -- Le bucket sera créé dynamiquement lors du premier upload
    RETURN TRUE;
END;
$$;

-- Fonction pour vérifier les permissions d'accès
CREATE OR REPLACE FUNCTION check_document_access(
    file_path TEXT,
    bucket_name TEXT,
    user_id UUID,
    action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN;
    is_owner BOOLEAN;
    is_expert BOOLEAN;
BEGIN
    -- Vérifier si l'utilisateur est admin
    SELECT EXISTS(SELECT 1 FROM "Admin" WHERE id = user_id) INTO is_admin;
    
    -- Vérifier si l'utilisateur est propriétaire
    SELECT EXISTS(
        SELECT 1 FROM "DocumentFile" df
        WHERE df.file_path = file_path
        AND df.bucket_name = bucket_name
        AND df.client_id = user_id
    ) INTO is_owner;
    
    -- Vérifier si l'utilisateur est expert assigné
    SELECT EXISTS(
        SELECT 1 FROM "DocumentFile" df
        JOIN "ExpertAssignment" ea ON ea.client_id = df.client_id
        WHERE df.file_path = file_path
        AND df.bucket_name = bucket_name
        AND ea.expert_id = user_id
    ) INTO is_expert;
    
    -- Retourner les permissions selon l'action
    CASE action
        WHEN 'view' THEN
            RETURN is_admin OR is_owner OR is_expert;
        WHEN 'upload' THEN
            RETURN is_admin OR is_owner;
        WHEN 'update' THEN
            RETURN is_admin OR is_owner;
        WHEN 'delete' THEN
            RETURN is_admin OR is_owner;
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$;

-- ===== 10. INDEX POUR OPTIMISER LES PERFORMANCES =====

-- Index sur la table DocumentFile pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_documentfile_client_bucket 
ON "DocumentFile" (client_id, bucket_name);

CREATE INDEX IF NOT EXISTS idx_documentfile_audit_bucket 
ON "DocumentFile" (audit_id, bucket_name);

CREATE INDEX IF NOT EXISTS idx_documentfile_path_bucket 
ON "DocumentFile" (file_path, bucket_name);

-- Index sur ExpertAssignment pour optimiser les vérifications d'accès
CREATE INDEX IF NOT EXISTS idx_expertassignment_client_expert 
ON "ExpertAssignment" (client_id, expert_id);

-- ===== 11. VÉRIFICATION FINALE =====

-- Vérifier que tous les buckets ont été créés
SELECT 
    name as bucket_name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name IN ('client-documents', 'expert-documents', 'admin-documents', 'chartes-signatures', 'rapports-audit')
ORDER BY name;

-- Vérifier que toutes les politiques ont été créées
SELECT 
    policyname,
    tablename,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Configuration GED Supabase terminée avec succès!';
    RAISE NOTICE '📁 Buckets créés: client-documents, expert-documents, admin-documents, chartes-signatures, rapports-audit';
    RAISE NOTICE '🔐 Politiques de sécurité configurées pour tous les buckets';
    RAISE NOTICE '⚡ Index de performance créés';
    RAISE NOTICE '🛠️ Fonctions utilitaires disponibles';
END $$; 