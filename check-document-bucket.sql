-- ============================================================================
-- VÉRIFIER LE BUCKET_NAME DES DOCUMENTS
-- ============================================================================
-- Ce script vérifie quel bucket_name est enregistré dans ClientProcessDocument
-- ============================================================================

-- 1. Voir les derniers documents uploadés avec leur bucket
SELECT 
  id,
  filename,
  bucket_name,
  storage_path,
  uploaded_by_type,
  status,
  created_at,
  CASE 
    WHEN bucket_name IN ('client-documents', 'expert-documents', 'apporteur-documents', 'admin-documents') 
    THEN '✅ Bucket valide'
    ELSE '❌ Bucket invalide ou manquant'
  END as validation
FROM "ClientProcessDocument"
ORDER BY created_at DESC
LIMIT 10;

-- 2. Compter les documents par bucket
SELECT 
  bucket_name,
  COUNT(*) as nb_documents,
  CASE 
    WHEN bucket_name IN ('client-documents', 'expert-documents', 'apporteur-documents', 'admin-documents') 
    THEN '✅ Valide'
    ELSE '❌ Invalide'
  END as status
FROM "ClientProcessDocument"
GROUP BY bucket_name
ORDER BY nb_documents DESC;

-- 3. Vérifier les bucket_name qui ne correspondent à aucun bucket existant
SELECT DISTINCT
  cpd.bucket_name as bucket_enregistre,
  CASE 
    WHEN b.name IS NOT NULL THEN '✅ Bucket existe'
    ELSE '❌ Bucket manquant'
  END as verification
FROM "ClientProcessDocument" cpd
LEFT JOIN storage.buckets b ON b.name = cpd.bucket_name
ORDER BY verification, bucket_enregistre;

-- 4. Si des documents ont un bucket_name NULL ou invalide, les corriger
-- ATTENTION : Adapter selon le type d'utilisateur
-- 
-- Pour les documents clients uploadés par des clients:
-- UPDATE "ClientProcessDocument"
-- SET bucket_name = 'client-documents'
-- WHERE bucket_name IS NULL OR bucket_name NOT IN ('client-documents', 'expert-documents', 'apporteur-documents', 'admin-documents')
-- AND uploaded_by_type = 'client';

-- ============================================================================
-- DIAGNOSTIC
-- ============================================================================
-- Si vous voyez des bucket_name qui n'existent pas dans storage.buckets,
-- c'est la cause du problème "Bucket not found"
-- ============================================================================

