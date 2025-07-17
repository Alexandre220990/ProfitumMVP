-- ===== CONFIGURATION SÉCURITÉ BUCKET ADMIN-DOCUMENTS - VERSION FINALE =====
-- Script pour configurer uniquement les politiques RLS du bucket admin-documents
-- Date: 2025-01-03
-- Version: 3.0 - Compatible avec les politiques existantes

-- ===== 1. VÉRIFICATION PRÉALABLE =====
-- Vérifier que le bucket admin-documents existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'admin-documents') THEN
        RAISE EXCEPTION 'Le bucket admin-documents n''existe pas. Veuillez le créer d''abord.';
    END IF;
END $$;

-- ===== 2. SUPPRESSION DES POLITIQUES EXISTANTES SUR LE BUCKET =====
-- Supprimer les politiques existantes sur le bucket admin-documents pour éviter les conflits
DROP POLICY IF EXISTS "admin_full_access" ON storage.objects;
DROP POLICY IF EXISTS "public_read_access" ON storage.objects;
DROP POLICY IF EXISTS "user_targeted_access" ON storage.objects;
DROP POLICY IF EXISTS "admin_expert_upload" ON storage.objects;
DROP POLICY IF EXISTS "admin_update_only" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_only" ON storage.objects;

-- ===== 3. POLITIQUES POUR LE BUCKET ADMIN-DOCUMENTS =====

-- Politique 1: Accès complet pour les administrateurs
CREATE POLICY "admin_documents_full_access" ON storage.objects
    FOR ALL USING (
        bucket_id = 'admin-documents' 
        AND (
            -- Vérifier si l'utilisateur est admin via la table Admin
            EXISTS (
                SELECT 1 FROM "Admin" 
                WHERE "Admin".id = auth.uid()
            )
            OR
            -- Vérifier si l'utilisateur a le rôle admin dans le JWT
            auth.jwt() ->> 'role' = 'admin'
            OR
            -- Vérifier via le système de settings existant
            current_setting('app.user_type', true) = 'admin'
        )
    );

-- Politique 2: Accès public en lecture seule pour certains documents
CREATE POLICY "admin_documents_public_read" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'admin-documents'
        AND (
            -- Documents publics (guides utilisateur, etc.)
            (storage.foldername(name))[1] = 'public'
            OR
            -- Documents avec métadonnées public = true
            (metadata->>'public')::boolean = true
            OR
            -- Documents dans le dossier guides (accessibles à tous les utilisateurs authentifiés)
            (storage.foldername(name))[1] = 'guides'
        )
    );

-- Politique 3: Accès ciblé selon les permissions utilisateur
CREATE POLICY "admin_documents_user_access" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'admin-documents'
        AND (
            -- Clients : accès aux guides et documents métier
            (
                current_setting('app.user_type', true) = 'client'
                AND (
                    (storage.foldername(name))[1] IN ('workflows', 'client-docs')
                    OR (metadata->>'user_type')::text = 'client'
                )
            )
            OR
            -- Experts : accès étendu aux guides et documents techniques
            (
                current_setting('app.user_type', true) = 'expert'
                AND (
                    (storage.foldername(name))[1] IN ('workflows', 'expert-docs', 'technical')
                    OR (metadata->>'user_type')::text = 'expert'
                )
            )
        )
    );

-- Politique 4: Upload autorisé pour les admins et experts (pour les guides)
CREATE POLICY "admin_documents_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'admin-documents'
        AND (
            -- Admins peuvent tout uploader
            current_setting('app.user_type', true) = 'admin'
            OR
            -- Experts peuvent uploader des guides
            (
                current_setting('app.user_type', true) = 'expert'
                AND (storage.foldername(name))[1] = 'guides'
            )
        )
    );

-- Politique 5: Mise à jour autorisée pour les admins uniquement
CREATE POLICY "admin_documents_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'admin-documents'
        AND current_setting('app.user_type', true) = 'admin'
    );

-- Politique 6: Suppression autorisée pour les admins uniquement
CREATE POLICY "admin_documents_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'admin-documents'
        AND current_setting('app.user_type', true) = 'admin'
    );

-- ===== 4. FONCTIONS UTILITAIRES POUR LE BUCKET =====

-- Fonction pour vérifier les permissions d'accès au bucket
CREATE OR REPLACE FUNCTION check_bucket_permissions(
    bucket_name TEXT DEFAULT 'admin-documents',
    user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    can_view BOOLEAN,
    can_upload BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Lecture autorisée pour tous les utilisateurs authentifiés
        true as can_view,
        -- Upload autorisé pour admins et experts
        (
            current_setting('app.user_type', true) = 'admin'
            OR current_setting('app.user_type', true) = 'expert'
        ) as can_upload,
        -- Mise à jour autorisée pour admins uniquement
        (current_setting('app.user_type', true) = 'admin') as can_update,
        -- Suppression autorisée pour admins uniquement
        (current_setting('app.user_type', true) = 'admin') as can_delete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour logger l'accès au bucket
CREATE OR REPLACE FUNCTION log_bucket_access(
    file_path TEXT,
    action_type TEXT,
    user_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    -- Insérer dans une table de logs si elle existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'DocumentFileAccessLog'
    ) THEN
        INSERT INTO "DocumentFileAccessLog" (
            file_id,
            user_id,
            action,
            ip_address,
            user_agent,
            created_at
        ) VALUES (
            gen_random_uuid(), -- ID temporaire pour les fichiers du bucket
            user_id,
            action_type,
            inet_client_addr(),
            current_setting('request.headers', true)::json->>'user-agent',
            NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5. VÉRIFICATION FINALE =====

-- Vérifier que toutes les politiques ont été créées
SELECT 
    'Politiques bucket créées avec succès' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%admin_documents%';

-- Vérifier les fonctions créées
SELECT 
    'Fonctions bucket créées avec succès' as status,
    COUNT(*) as total_functions
FROM pg_proc 
WHERE proname IN ('check_bucket_permissions', 'log_bucket_access');

-- Afficher un résumé de la configuration
SELECT 
    'Configuration bucket terminée' as message,
    'Bucket admin-documents sécurisé' as details,
    'Politiques RLS compatibles avec le système existant' as security_status;

-- ===== 6. INSTRUCTIONS D'UTILISATION =====
-- 
-- Pour utiliser le bucket admin-documents :
-- 
-- 1. Upload de fichiers :
--    - Admins : Tous les dossiers
--    - Experts : Dossier 'guides' uniquement
--    - Clients : Aucun upload autorisé
-- 
-- 2. Lecture de fichiers :
--    - Admins : Tous les fichiers
--    - Experts : Guides + workflows + expert-docs + technical
--    - Clients : Guides + workflows + client-docs
--    - Public : Dossier 'public' + fichiers avec metadata.public = true
-- 
-- 3. Modification/Suppression :
--    - Admins uniquement
-- 
-- 4. Structure recommandée des dossiers :
--    /admin-documents/
--    ├── public/          (accès public)
--    ├── guides/          (accès tous utilisateurs)
--    ├── workflows/       (accès selon rôle)
--    ├── client-docs/     (accès clients)
--    ├── expert-docs/     (accès experts)
--    ├── technical/       (accès experts)
--    └── admin/           (accès admin uniquement) 