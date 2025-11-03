-- ============================================================================
-- DIAGNOSTIC : Vérifier les buckets Supabase Storage
-- Date : 2025-11-03
-- Description : Vérifier l'existence et la configuration du bucket client-documents
-- ============================================================================

-- 1. Lister TOUS les buckets Storage disponibles
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
ORDER BY name;

-- 2. Vérifier spécifiquement le bucket 'client-documents'
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
WHERE name = 'client-documents';

-- 3. Vérifier les fichiers dans ClientProcessDocument (quel bucket ils utilisent)
SELECT 
    DISTINCT bucket_name,
    COUNT(*) as nombre_fichiers
FROM "ClientProcessDocument"
GROUP BY bucket_name
ORDER BY nombre_fichiers DESC;

-- 4. Vérifier les 10 premiers fichiers pour voir le bucket utilisé
SELECT 
    id,
    filename,
    bucket_name,
    storage_path,
    created_at
FROM "ClientProcessDocument"
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- SOLUTION : Créer/Configurer le bucket (à exécuter si nécessaire)
-- ============================================================================

-- 5. Créer le bucket 'client-documents' s'il n'existe pas
-- Décommentez et exécutez cette ligne si le bucket n'existe pas
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'client-documents',
    'client-documents',
    true,  -- PUBLIC : important pour permettre l'accès direct via URL
    52428800,  -- 50 MB max par fichier
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
*/

-- 6. Rendre le bucket PUBLIC s'il existe mais n'est pas public
-- Décommentez et exécutez cette ligne si le bucket existe mais n'est pas public
/*
UPDATE storage.buckets
SET public = true
WHERE name = 'client-documents';
*/

-- 7. Vérifier les policies RLS (Row Level Security) du bucket
SELECT 
    policyname,
    tablename,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- 8. Créer une policy pour permettre l'accès public en lecture
-- Décommentez et exécutez si nécessaire
/*
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'client-documents' );
*/

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- 9. Tester l'URL d'un fichier spécifique
SELECT 
    cpd.id,
    cpd.filename,
    cpd.bucket_name,
    cpd.storage_path,
    CONCAT(
        current_setting('app.settings.supabase_url', true),
        '/storage/v1/object/public/',
        cpd.bucket_name,
        '/',
        cpd.storage_path
    ) as url_complete
FROM "ClientProcessDocument" cpd
WHERE cpd.id = '37fade75-495d-48e7-82df-44e7db398545'  -- Document KBIS d'AlexTransport
LIMIT 1;

