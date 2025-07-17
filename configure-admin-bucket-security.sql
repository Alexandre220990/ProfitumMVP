-- Script de configuration des politiques de sécurité pour le bucket admin-documents
-- À exécuter dans l'éditeur SQL de Supabase Dashboard

-- 1. Activer RLS sur la table storage.objects si ce n'est pas déjà fait
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Politique pour permettre aux admins de lire tous les documents admin
CREATE POLICY "Admins can read all admin documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'admin-documents' AND 
  auth.jwt() ->> 'role' = 'authenticated' AND
  auth.jwt() ->> 'user_metadata' ->> 'type' = 'admin'
);

-- 3. Politique pour permettre aux admins d'uploader des documents admin
CREATE POLICY "Admins can upload admin documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'admin-documents' AND 
  auth.jwt() ->> 'role' = 'authenticated' AND
  auth.jwt() ->> 'user_metadata' ->> 'type' = 'admin'
);

-- 4. Politique pour permettre aux admins de modifier leurs documents admin
CREATE POLICY "Admins can update admin documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'admin-documents' AND 
  auth.jwt() ->> 'role' = 'authenticated' AND
  auth.jwt() ->> 'user_metadata' ->> 'type' = 'admin'
);

-- 5. Politique pour permettre aux admins de supprimer leurs documents admin
CREATE POLICY "Admins can delete admin documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'admin-documents' AND 
  auth.jwt() ->> 'role' = 'authenticated' AND
  auth.jwt() ->> 'user_metadata' ->> 'type' = 'admin'
);

-- 6. Politique pour permettre l'accès public aux documents marqués comme publics
CREATE POLICY "Public access to public admin documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'admin-documents' AND 
  metadata->>'access_level' = 'public'
);

-- 7. Politique pour permettre l'accès aux cibles spécifiques
CREATE POLICY "Target-specific access to admin documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'admin-documents' AND 
  auth.jwt() ->> 'role' = 'authenticated' AND
  (
    -- Vérifier si l'utilisateur est dans les cibles du document
    metadata->>'targets' IS NOT NULL AND
    (
      -- Pour les clients
      (auth.jwt() ->> 'user_metadata' ->> 'type' = 'client' AND
       metadata->>'targets'::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.jwt() ->> 'sub', 'type', 'client')))
      OR
      -- Pour les experts
      (auth.jwt() ->> 'user_metadata' ->> 'type' = 'expert' AND
       metadata->>'targets'::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.jwt() ->> 'sub', 'type', 'expert')))
      OR
      -- Pour les admins (accès complet)
      auth.jwt() ->> 'user_metadata' ->> 'type' = 'admin'
    )
  )
);

-- 8. Politique pour les documents privés (accès admin uniquement)
CREATE POLICY "Private admin documents - admin only" ON storage.objects
FOR SELECT USING (
  bucket_id = 'admin-documents' AND 
  metadata->>'access_level' = 'private' AND
  auth.jwt() ->> 'user_metadata' ->> 'type' = 'admin'
);

-- 9. Politique pour les documents restreints (accès admin et cibles spécifiques)
CREATE POLICY "Restricted admin documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'admin-documents' AND 
  metadata->>'access_level' = 'restricted' AND
  auth.jwt() ->> 'role' = 'authenticated' AND
  (
    auth.jwt() ->> 'user_metadata' ->> 'type' = 'admin'
    OR
    -- Vérifier si l'utilisateur est dans les cibles spécifiques
    (metadata->>'targets' IS NOT NULL AND
     metadata->>'targets'::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.jwt() ->> 'sub')))
  )
);

-- 10. Politique pour les documents confidentiels (admin uniquement)
CREATE POLICY "Confidential admin documents - admin only" ON storage.objects
FOR SELECT USING (
  bucket_id = 'admin-documents' AND 
  metadata->>'access_level' = 'confidential' AND
  auth.jwt() ->> 'user_metadata' ->> 'type' = 'admin'
);

-- 11. Fonction pour vérifier les permissions d'accès
CREATE OR REPLACE FUNCTION check_admin_document_access(document_path text, user_type text, user_id text)
RETURNS boolean AS $$
DECLARE
  document_metadata jsonb;
  access_level text;
  targets jsonb;
BEGIN
  -- Récupérer les métadonnées du document
  SELECT metadata INTO document_metadata
  FROM storage.objects
  WHERE bucket_id = 'admin-documents' AND name = document_path;
  
  IF document_metadata IS NULL THEN
    RETURN false;
  END IF;
  
  -- Extraire les informations
  access_level := document_metadata->>'access_level';
  targets := document_metadata->>'targets';
  
  -- Vérifier les permissions selon le niveau d'accès
  CASE access_level
    WHEN 'public' THEN
      RETURN true;
    WHEN 'private' THEN
      RETURN user_type = 'admin';
    WHEN 'restricted' THEN
      RETURN user_type = 'admin' OR 
             (targets IS NOT NULL AND targets @> jsonb_build_array(jsonb_build_object('id', user_id, 'type', user_type)));
    WHEN 'confidential' THEN
      RETURN user_type = 'admin';
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Index pour optimiser les requêtes sur les métadonnées
CREATE INDEX IF NOT EXISTS idx_storage_objects_admin_metadata 
ON storage.objects USING gin (metadata) 
WHERE bucket_id = 'admin-documents';

-- 13. Vue pour faciliter la gestion des documents admin
CREATE OR REPLACE VIEW admin_documents_view AS
SELECT 
  id,
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata->>'title' as title,
  metadata->>'description' as description,
  metadata->>'category' as category,
  metadata->>'priority' as priority,
  metadata->>'access_level' as access_level,
  metadata->>'type' as document_type,
  metadata->>'targets' as targets,
  metadata->>'created_at' as document_created_at,
  metadata->>'size' as file_size
FROM storage.objects
WHERE bucket_id = 'admin-documents'
ORDER BY created_at DESC;

-- 14. Fonction pour obtenir les statistiques des documents admin
CREATE OR REPLACE FUNCTION get_admin_documents_stats()
RETURNS TABLE(
  total_documents bigint,
  total_size bigint,
  by_category jsonb,
  by_access_level jsonb,
  by_priority jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_documents,
    COALESCE(SUM((metadata->>'size')::bigint), 0) as total_size,
    jsonb_object_agg(
      COALESCE(metadata->>'category', 'unknown'),
      COUNT(*)
    ) as by_category,
    jsonb_object_agg(
      COALESCE(metadata->>'access_level', 'unknown'),
      COUNT(*)
    ) as by_access_level,
    jsonb_object_agg(
      COALESCE(metadata->>'priority', 'unknown'),
      COUNT(*)
    ) as by_priority
  FROM storage.objects
  WHERE bucket_id = 'admin-documents';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Politique pour permettre aux admins de voir les statistiques
GRANT SELECT ON admin_documents_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_documents_stats() TO authenticated;

-- 16. Commentaires pour documenter les politiques
COMMENT ON POLICY "Admins can read all admin documents" ON storage.objects IS 
'Permet aux administrateurs de lire tous les documents du bucket admin-documents';

COMMENT ON POLICY "Admins can upload admin documents" ON storage.objects IS 
'Permet aux administrateurs d''uploader des documents dans le bucket admin-documents';

COMMENT ON POLICY "Public access to public admin documents" ON storage.objects IS 
'Permet l''accès public aux documents marqués comme publics';

COMMENT ON POLICY "Target-specific access to admin documents" ON storage.objects IS 
'Permet l''accès aux documents selon les cibles spécifiées';

-- 17. Vérification des politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- 18. Test des permissions (à exécuter avec un utilisateur admin)
-- SELECT check_admin_document_access('guides/ged-admin-2025-07-11.html', 'admin', 'admin-user-id');
-- SELECT * FROM admin_documents_view LIMIT 5;
-- SELECT * FROM get_admin_documents_stats(); 