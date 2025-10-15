-- Vérifier le dernier document uploadé avec tous les détails
SELECT 
  cpd.id,
  cpd.filename,
  cpd.bucket_name,
  cpd.storage_path,
  cpd.created_at,
  cpd.uploaded_by_type,
  -- Vérifier si le fichier existe dans storage.objects
  CASE 
    WHEN o.id IS NOT NULL THEN '✅ Fichier existe dans Storage'
    ELSE '❌ Fichier MANQUANT dans Storage'
  END as fichier_storage,
  -- Vérifier si le bucket est valide
  CASE 
    WHEN cpd.bucket_name IN ('client-documents', 'expert-documents', 'apporteur-documents', 'admin-documents') 
    THEN '✅ Bucket valide'
    ELSE '❌ Bucket invalide: ' || COALESCE(cpd.bucket_name, 'NULL')
  END as bucket_validation,
  -- Infos du fichier storage si existe
  o.bucket_id as storage_bucket_id,
  (o.metadata->>'size')::bigint / 1024 as taille_kb
FROM "ClientProcessDocument" cpd
LEFT JOIN storage.objects o ON o.name = cpd.storage_path AND o.bucket_id = cpd.bucket_name
ORDER BY cpd.created_at DESC
LIMIT 1;

