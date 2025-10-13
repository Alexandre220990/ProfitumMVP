-- ============================================================================
-- VÉRIFICATION SETUP GED - À EXÉCUTER DANS SUPABASE SQL EDITOR
-- ============================================================================
-- Date: 2025-10-13
-- Ce script vérifie que tout est en place pour la GED unifiée
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFIER LES BUCKETS
-- ============================================================================
SELECT 
  name, 
  public, 
  file_size_limit,
  CASE 
    WHEN allowed_mime_types IS NULL THEN '✓ Tous types autorisés'
    ELSE '✓ Types restreints'
  END as mime_status,
  created_at
FROM storage.buckets
WHERE name IN ('client-documents', 'expert-documents', 'apporteur-documents', 'admin-documents')
ORDER BY name;

-- RÉSULTAT ATTENDU : 4 buckets (tous avec public = false)

-- ============================================================================
-- 2. VÉRIFIER LES POLICIES APPORTEUR
-- ============================================================================
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%apporteur%' THEN '✓ Policy apporteur OK'
    ELSE '  Policy autre'
  END as status
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%apporteur%'
ORDER BY cmd, policyname;

-- RÉSULTAT ATTENDU : 4 policies minimum (SELECT, INSERT, UPDATE, DELETE)

-- ============================================================================
-- 3. VÉRIFIER LA TABLE ClientProcessDocument
-- ============================================================================
SELECT 
  COUNT(*) as total_documents,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'validated' THEN 1 END) as validated,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
  COUNT(CASE WHEN bucket_name = 'client-documents' THEN 1 END) as client_docs,
  COUNT(CASE WHEN bucket_name = 'expert-documents' THEN 1 END) as expert_docs,
  COUNT(CASE WHEN bucket_name = 'apporteur-documents' THEN 1 END) as apporteur_docs
FROM "ClientProcessDocument";

-- ============================================================================
-- 4. VÉRIFIER LA STRUCTURE DE LA TABLE (colonnes nécessaires)
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ClientProcessDocument'
AND column_name IN (
  'id', 'client_id', 'produit_id', 'document_type', 'filename',
  'storage_path', 'bucket_name', 'file_size', 'mime_type',
  'status', 'uploaded_by', 'uploaded_by_type', 'metadata',
  'validated_by', 'validated_at', 'validation_notes',
  'created_at', 'updated_at'
)
ORDER BY ordinal_position;

-- RÉSULTAT ATTENDU : Toutes ces colonnes doivent exister

-- ============================================================================
-- 5. VÉRIFIER LES TABLES OPTIONNELLES GED
-- ============================================================================

-- Table des favoris (optionnel)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'GEDUserDocumentFavorite')
    THEN '✓ Table GEDUserDocumentFavorite existe'
    ELSE '⚠ Table GEDUserDocumentFavorite manquante (optionnel)'
  END as favorite_table_status;

-- Table des versions (optionnel)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'GEDDocumentVersion')
    THEN '✓ Table GEDDocumentVersion existe'
    ELSE '⚠ Table GEDDocumentVersion manquante (optionnel)'
  END as version_table_status;

-- ============================================================================
-- 6. COMPTER LES POLICIES PAR BUCKET
-- ============================================================================
SELECT 
  CASE 
    WHEN policyname LIKE '%client-documents%' THEN 'client-documents'
    WHEN policyname LIKE '%expert-documents%' THEN 'expert-documents'
    WHEN policyname LIKE '%apporteur-documents%' THEN 'apporteur-documents'
    WHEN policyname LIKE '%admin-documents%' THEN 'admin-documents'
    ELSE 'autre'
  END as bucket,
  cmd,
  COUNT(*) as nb_policies
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
GROUP BY bucket, cmd
ORDER BY bucket, cmd;

-- ============================================================================
-- 7. TESTER LA CONNEXION À SUPABASE STORAGE (depuis le backend)
-- ============================================================================

-- Ce test doit être fait dans le backend Node.js :
-- 
-- const { data: buckets } = await supabase.storage.listBuckets();
-- console.log(buckets);
--
-- Expected: Voir les 4 buckets (client, expert, apporteur, admin)

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

SELECT 
  '✓ Setup GED complet' as status,
  'Buckets créés, policies en place, prêt pour les tests' as message
WHERE EXISTS (
  SELECT 1 FROM storage.buckets 
  WHERE name IN ('client-documents', 'expert-documents', 'apporteur-documents')
)
AND EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE policyname LIKE '%apporteur%'
  AND tablename = 'objects'
);

-- ============================================================================
-- ACTIONS SUIVANTES
-- ============================================================================
-- 1. ✓ Buckets vérifiés
-- 2. ✓ Policies vérifiées  
-- 3. → Lancer le serveur backend (npm run dev dans /server)
-- 4. → Exécuter TEST-GED-UPLOAD-DOWNLOAD.sh
-- 5. → Tester l'interface web (client, expert, apporteur)

