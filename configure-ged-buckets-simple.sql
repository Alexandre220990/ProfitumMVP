-- ===== CONFIGURATION SIMPLIFIÉE GED SUPABASE =====
-- Script pour configurer les buckets et politiques de sécurité GED
-- Date: 2025-01-03
-- Version: 3.0 - Simplifié pour les tables existantes

-- ===== 1. CRÉATION DES TABLES MANQUANTES =====

-- Table pour les activités sur les documents
CREATE TABLE IF NOT EXISTS "DocumentActivity" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES "DocumentFile"(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB DEFAULT '{}'
);

-- Table pour les partages de documents
CREATE TABLE IF NOT EXISTS "DocumentShare" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES "DocumentFile"(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL,
    shared_with_email TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{"view": true, "download": false}',
    share_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table simplifiée pour les assignations expert-client
CREATE TABLE IF NOT EXISTS "ExpertAssignment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unique
    CONSTRAINT expert_assignment_unique UNIQUE (client_id, expert_id)
);

-- ===== 2. CRÉATION DES BUCKETS =====

-- Bucket pour les documents clients
DO $$
BEGIN
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

-- ===== 3. SUPPRESSION DES POLITIQUES EXISTANTES =====

-- Supprimer toutes les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "client_documents_view_own" ON storage.objects;
DROP POLICY IF EXISTS "client_documents_expert_view" ON storage.objects;
DROP POLICY IF EXISTS "client_documents_admin_view" ON storage.objects;
DROP POLICY IF EXISTS "client_documents_upload" ON storage.objects;
DROP POLICY IF EXISTS "client_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "client_documents_delete" ON storage.objects;
DROP POLICY IF EXISTS "expert_documents_view_own" ON storage.objects;
DROP POLICY IF EXISTS "expert_documents_admin_view" ON storage.objects;
DROP POLICY IF EXISTS "expert_documents_upload" ON storage.objects;
DROP POLICY IF EXISTS "expert_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "expert_documents_delete" ON storage.objects;
DROP POLICY IF EXISTS "admin_documents_view" ON storage.objects;
DROP POLICY IF EXISTS "admin_documents_upload" ON storage.objects;
DROP POLICY IF EXISTS "admin_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "admin_documents_delete" ON storage.objects;
DROP POLICY IF EXISTS "chartes_signatures_client_view" ON storage.objects;
DROP POLICY IF EXISTS "chartes_signatures_admin_view" ON storage.objects;
DROP POLICY IF EXISTS "chartes_signatures_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "rapports_audit_expert_view" ON storage.objects;
DROP POLICY IF EXISTS "rapports_audit_client_view" ON storage.objects;
DROP POLICY IF EXISTS "rapports_audit_admin_view" ON storage.objects;
DROP POLICY IF EXISTS "rapports_audit_expert_upload" ON storage.objects;

-- ===== 4. POLITIQUES SIMPLIFIÉES =====

-- Politique 1: Les clients peuvent voir leurs propres documents
CREATE POLICY "client_documents_view_own" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'client-documents' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 2: Les experts peuvent voir les documents des clients qu'ils gèrent
CREATE POLICY "client_documents_expert_view" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'client-documents'
        AND EXISTS (
            SELECT 1 FROM "ExpertAssignment" ea
            WHERE ea.expert_id = auth.uid()
            AND ea.client_id::text = (storage.foldername(name))[1]
            AND ea.status = 'active'
        )
    );

-- Politique 3: Les clients peuvent uploader leurs documents
CREATE POLICY "client_documents_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'client-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 4: Les clients peuvent modifier leurs documents
CREATE POLICY "client_documents_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'client-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 5: Les clients peuvent supprimer leurs documents
CREATE POLICY "client_documents_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'client-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 6: Les experts peuvent voir leurs propres documents
CREATE POLICY "expert_documents_view_own" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'expert-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 7: Les experts peuvent uploader leurs documents
CREATE POLICY "expert_documents_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'expert-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 8: Les experts peuvent modifier leurs documents
CREATE POLICY "expert_documents_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'expert-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 9: Les experts peuvent supprimer leurs documents
CREATE POLICY "expert_documents_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'expert-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Politique 10: Accès admin aux documents admin (basé sur le rôle JWT)
CREATE POLICY "admin_documents_access" ON storage.objects
    FOR ALL USING (
        bucket_id = 'admin-documents'
        AND auth.jwt() ->> 'role' = 'admin'
    );

-- Politique 11: Accès aux chartes signées
CREATE POLICY "chartes_signatures_access" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'chartes-signatures'
        AND (
            -- Client propriétaire
            (storage.foldername(name))[1] = auth.uid()::text
            OR
            -- Admin
            auth.jwt() ->> 'role' = 'admin'
        )
    );

-- Politique 12: Upload de chartes par admin
CREATE POLICY "chartes_signatures_admin_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'chartes-signatures'
        AND auth.jwt() ->> 'role' = 'admin'
    );

-- Politique 13: Accès aux rapports d'audit
CREATE POLICY "rapports_audit_access" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'rapports-audit'
        AND (
            -- Expert propriétaire
            (storage.foldername(name))[1] = auth.uid()::text
            OR
            -- Client assigné
            EXISTS (
                SELECT 1 FROM "ExpertAssignment" ea
                WHERE ea.expert_id::text = (storage.foldername(name))[1]
                AND ea.client_id = auth.uid()
                AND ea.status = 'active'
            )
            OR
            -- Admin
            auth.jwt() ->> 'role' = 'admin'
        )
    );

-- Politique 14: Upload de rapports par experts
CREATE POLICY "rapports_audit_expert_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'rapports-audit'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ===== 5. INDEX POUR OPTIMISER LES PERFORMANCES =====

-- Index sur ExpertAssignment
CREATE INDEX IF NOT EXISTS idx_expertassignment_client_expert 
ON "ExpertAssignment" (client_id, expert_id);

CREATE INDEX IF NOT EXISTS idx_expertassignment_status 
ON "ExpertAssignment" (status);

-- Index sur DocumentActivity
CREATE INDEX IF NOT EXISTS idx_documentactivity_file_user 
ON "DocumentActivity" (file_id, user_id);

CREATE INDEX IF NOT EXISTS idx_documentactivity_timestamp 
ON "DocumentActivity" (timestamp);

-- Index sur DocumentShare
CREATE INDEX IF NOT EXISTS idx_documentshare_file_token 
ON "DocumentShare" (file_id, share_token);

-- ===== 6. FONCTIONS UTILITAIRES =====

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
    -- Vérifier si l'utilisateur est admin (basé sur le rôle JWT)
    is_admin := false; -- Sera vérifié côté application
    
    -- Vérifier si l'utilisateur est propriétaire
    SELECT EXISTS(
        SELECT 1 FROM "DocumentFile" df
        WHERE df.file_path = file_path
        AND df.bucket_name = bucket_name
        AND (df.client_id = user_id OR df.expert_id = user_id)
    ) INTO is_owner;
    
    -- Vérifier si l'utilisateur est expert assigné
    SELECT EXISTS(
        SELECT 1 FROM "DocumentFile" df
        JOIN "ExpertAssignment" ea ON ea.client_id = df.client_id
        WHERE df.file_path = file_path
        AND df.bucket_name = bucket_name
        AND ea.expert_id = user_id
        AND ea.status = 'active'
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

-- ===== 7. VÉRIFICATION FINALE =====

-- Vérifier que tous les buckets ont été créés
SELECT 
    'Bucket Status' as check_type,
    name as bucket_name,
    CASE 
        WHEN name IS NOT NULL THEN '✅ Créé'
        ELSE '❌ Manquant'
    END as status,
    file_size_limit,
    array_length(allowed_mime_types, 1) as allowed_types_count
FROM storage.buckets 
WHERE name IN ('client-documents', 'expert-documents', 'admin-documents', 'chartes-signatures', 'rapports-audit')
ORDER BY name;

-- Vérifier que toutes les politiques ont été créées
SELECT 
    'Policy Status' as check_type,
    policyname,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ Configurée'
        ELSE '❌ Manquante'
    END as status,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Configuration GED Supabase simplifiée terminée!';
    RAISE NOTICE '📁 5 buckets configurés pour clients, experts et admins';
    RAISE NOTICE '🔐 Politiques de sécurité simplifiées en place';
    RAISE NOTICE '📋 Tables DocumentActivity, DocumentShare et ExpertAssignment créées';
    RAISE NOTICE '⚡ Index de performance créés';
    RAISE NOTICE '🛠️ Fonction check_document_access disponible';
    RAISE NOTICE '🎉 Le système est prêt pour les uploads de documents!';
END $$; 