-- ===== CONFIGURATION SÉCURITÉ BUCKET ADMIN-DOCUMENTS - VERSION CORRIGÉE =====
-- Script pour configurer les politiques RLS sécurisant le bucket admin-documents
-- Date: 2025-01-03
-- Version: 2.0 - Corrigée pour les tables existantes

-- ===== 1. VÉRIFICATION PRÉALABLE =====
-- Vérifier que le bucket admin-documents existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'admin-documents') THEN
        RAISE EXCEPTION 'Le bucket admin-documents n''existe pas. Veuillez le créer d''abord.';
    END IF;
END $$;

-- ===== 2. POLITIQUES POUR LE BUCKET ADMIN-DOCUMENTS =====

-- Politique 1: Accès complet pour les administrateurs
CREATE POLICY "admin_full_access" ON storage.objects
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
        )
    );

-- Politique 2: Accès public en lecture seule pour certains documents
CREATE POLICY "public_read_access" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'admin-documents'
        AND (
            -- Documents publics (guides utilisateur, etc.)
            (storage.foldername(name))[1] = 'public'
            OR
            -- Documents avec métadonnées public = true
            (metadata->>'public')::boolean = true
        )
    );

-- Politique 3: Accès ciblé selon les permissions utilisateur
CREATE POLICY "user_targeted_access" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'admin-documents'
        AND (
            -- Clients : accès aux guides et documents métier
            (
                EXISTS (
                    SELECT 1 FROM "Client" 
                    WHERE "Client".id = auth.uid()
                )
                AND (
                    (storage.foldername(name))[1] IN ('guides', 'workflows', 'client-docs')
                    OR (metadata->>'user_type')::text = 'client'
                )
            )
            OR
            -- Experts : accès étendu aux guides et documents techniques
            (
                EXISTS (
                    SELECT 1 FROM "Expert" 
                    WHERE "Expert".id = auth.uid()
                )
                AND (
                    (storage.foldername(name))[1] IN ('guides', 'workflows', 'expert-docs', 'technical')
                    OR (metadata->>'user_type')::text = 'expert'
                )
            )
        )
    );

-- Politique 4: Upload autorisé pour les admins et experts (pour les guides)
CREATE POLICY "admin_expert_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'admin-documents'
        AND (
            -- Admins peuvent tout uploader
            EXISTS (
                SELECT 1 FROM "Admin" 
                WHERE "Admin".id = auth.uid()
            )
            OR
            -- Experts peuvent uploader des guides
            (
                EXISTS (
                    SELECT 1 FROM "Expert" 
                    WHERE "Expert".id = auth.uid()
                )
                AND (storage.foldername(name))[1] = 'guides'
            )
        )
    );

-- Politique 5: Mise à jour autorisée pour les admins uniquement
CREATE POLICY "admin_update_only" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'admin-documents'
        AND EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- Politique 6: Suppression autorisée pour les admins uniquement
CREATE POLICY "admin_delete_only" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'admin-documents'
        AND EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- ===== 3. POLITIQUES POUR LES TABLES DE GESTION DOCUMENTAIRE =====

-- Activer RLS sur les tables existantes
ALTER TABLE "DocumentFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentFilePermission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentFileAccessLog" ENABLE ROW LEVEL SECURITY;

-- Politiques pour DocumentFile
CREATE POLICY "document_file_admin_access" ON "DocumentFile"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

CREATE POLICY "document_file_client_access" ON "DocumentFile"
    FOR SELECT USING (
        client_id = auth.uid()
    );

CREATE POLICY "document_file_expert_access" ON "DocumentFile"
    FOR SELECT USING (
        expert_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM "Expert" 
            WHERE "Expert".id = auth.uid()
        )
    );

-- Politiques pour DocumentFilePermission
CREATE POLICY "document_permission_admin_access" ON "DocumentFilePermission"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

CREATE POLICY "document_permission_user_access" ON "DocumentFilePermission"
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Politiques pour DocumentFileAccessLog
CREATE POLICY "document_access_log_admin_access" ON "DocumentFileAccessLog"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

CREATE POLICY "document_access_log_user_access" ON "DocumentFileAccessLog"
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- ===== 4. FONCTIONS UTILITAIRES =====

-- Fonction pour vérifier les permissions d'un utilisateur sur un document
CREATE OR REPLACE FUNCTION check_document_permissions(
    document_id UUID,
    user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    can_view BOOLEAN,
    can_download BOOLEAN,
    can_upload BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(dfp.can_view, false) as can_view,
        COALESCE(dfp.can_download, false) as can_download,
        COALESCE(dfp.can_upload, false) as can_upload,
        COALESCE(dfp.can_update, false) as can_update,
        COALESCE(dfp.can_delete, false) as can_delete
    FROM "DocumentFilePermission" dfp
    WHERE dfp.file_id = document_id
    AND dfp.user_id = check_document_permissions.user_id
    AND (dfp.expires_at IS NULL OR dfp.expires_at > NOW())
    
    UNION ALL
    
    -- Permissions par défaut pour les admins
    SELECT 
        true, true, true, true, true
    WHERE EXISTS (
        SELECT 1 FROM "Admin" 
        WHERE "Admin".id = check_document_permissions.user_id
    )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour logger l'accès aux documents
CREATE OR REPLACE FUNCTION log_document_access(
    document_id UUID,
    action_type TEXT,
    user_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO "DocumentFileAccessLog" (
        file_id,
        user_id,
        action,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        document_id,
        user_id,
        action_type,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5. TRIGGERS POUR AUDIT AUTOMATIQUE =====

-- Trigger pour logger automatiquement les accès aux documents
CREATE OR REPLACE FUNCTION trigger_log_document_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Logger l'accès selon le type d'opération
    CASE TG_OP
        WHEN 'INSERT' THEN
            PERFORM log_document_access(NEW.id, 'create');
        WHEN 'UPDATE' THEN
            PERFORM log_document_access(NEW.id, 'update');
        WHEN 'DELETE' THEN
            PERFORM log_document_access(OLD.id, 'delete');
    END CASE;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur DocumentFile
DROP TRIGGER IF EXISTS document_file_audit_trigger ON "DocumentFile";
CREATE TRIGGER document_file_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "DocumentFile"
    FOR EACH ROW EXECUTE FUNCTION trigger_log_document_access();

-- ===== 6. VÉRIFICATION FINALE =====

-- Vérifier que toutes les politiques ont été créées
SELECT 
    'Politiques créées avec succès' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%admin%';

-- Vérifier les fonctions créées
SELECT 
    'Fonctions créées avec succès' as status,
    COUNT(*) as total_functions
FROM pg_proc 
WHERE proname IN ('check_document_permissions', 'log_document_access', 'trigger_log_document_access');

-- Afficher un résumé de la configuration
SELECT 
    'Configuration terminée' as message,
    'Bucket admin-documents sécurisé' as details,
    'Politiques RLS actives' as security_status; 