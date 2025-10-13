-- ============================================================================
-- AUDIT COMPLET MODULE GED - Structure & Permissions
-- Exécutez chaque section séparément dans Supabase
-- ============================================================================

-- 1️⃣ LISTER TOUTES LES TABLES DOCUMENTAIRES
SELECT 'CHECK 1: Tables GED' as verification;
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as nb_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%ocument%' 
    OR table_name LIKE 'GED%'
    OR table_name LIKE '%ged%'
  )
ORDER BY table_name;

-- 2️⃣ STRUCTURE ClientProcessDocument (documents process clients)
SELECT 'CHECK 2: Colonnes ClientProcessDocument' as verification;
SELECT 
  column_name, 
  data_type,
  is_nullable,
  CASE 
    WHEN column_name IN ('client_id', 'produit_id', 'uploaded_by', 'validated_by') THEN '🔗 Relation'
    WHEN column_name IN ('document_type', 'workflow_step', 'status') THEN '📋 Statut'
    WHEN column_name IN ('filename', 'storage_path', 'bucket_name', 'mime_type') THEN '📄 Fichier'
    WHEN column_name IN ('uploaded_by_type') THEN '👤 Type user'
    ELSE '📊 Autre'
  END as categorie
FROM information_schema.columns
WHERE table_name = 'ClientProcessDocument'
ORDER BY ordinal_position;

-- 3️⃣ STRUCTURE GEDDocument (documentation app)
SELECT 'CHECK 3: Colonnes GEDDocument' as verification;
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'GEDDocument'
ORDER BY ordinal_position;

-- 4️⃣ RLS POLICIES ClientProcessDocument
SELECT 'CHECK 4: RLS ClientProcessDocument' as verification;
SELECT 
  policyname,
  cmd as action,
  CASE 
    WHEN policyname LIKE '%admin%' THEN '👑 Admin'
    WHEN policyname LIKE '%client%' THEN '👤 Client'
    WHEN policyname LIKE '%expert%' THEN '🎓 Expert'
    WHEN policyname LIKE '%apporteur%' THEN '💼 Apporteur'
    ELSE '📋 Autre'
  END as type_utilisateur
FROM pg_policies
WHERE tablename = 'ClientProcessDocument'
ORDER BY policyname;

-- 5️⃣ RLS POLICIES GEDDocument
SELECT 'CHECK 5: RLS GEDDocument' as verification;
SELECT 
  policyname,
  cmd as action,
  qual as condition
FROM pg_policies
WHERE tablename = 'GEDDocument'
ORDER BY policyname;

-- 6️⃣ TABLE GEDDocumentPermission
SELECT 'CHECK 6: Permissions GED' as verification;
SELECT 
  user_type,
  COUNT(*) as nb_permissions,
  COUNT(CASE WHEN can_read THEN 1 END) as can_read,
  COUNT(CASE WHEN can_write THEN 1 END) as can_write,
  COUNT(CASE WHEN can_delete THEN 1 END) as can_delete
FROM "GEDDocumentPermission"
GROUP BY user_type;

-- 7️⃣ BUCKETS STORAGE
SELECT 'CHECK 7: Buckets Storage' as verification;
SELECT 
  name,
  public,
  CASE 
    WHEN name LIKE '%admin%' THEN '👑 Admin'
    WHEN name LIKE '%client%' THEN '👤 Clients'
    WHEN name LIKE '%expert%' THEN '🎓 Experts'
    WHEN name = 'documents' THEN '📁 Process'
    ELSE '📋 Autre'
  END as usage,
  created_at
FROM storage.buckets
WHERE name LIKE '%doc%' OR name IN ('rapports', 'factures', 'guides')
ORDER BY name;

-- 8️⃣ FICHIERS PAR BUCKET
SELECT 'CHECK 8: Fichiers par bucket' as verification;
SELECT 
  bucket_id,
  COUNT(*) as nb_fichiers,
  ROUND(SUM(metadata->>'size'::text)::bigint / 1024.0 / 1024.0, 2) as taille_mo
FROM storage.objects
WHERE bucket_id IN ('admin-documents', 'client-documents', 'expert-documents', 'documents', 'rapports', 'factures', 'guides')
GROUP BY bucket_id
ORDER BY nb_fichiers DESC;

-- 9️⃣ EXEMPLES DE DOCUMENTS
SELECT 'CHECK 9: Exemples ClientProcessDocument' as verification;
SELECT 
  document_type,
  status,
  COUNT(*) as nb_docs
FROM "ClientProcessDocument"
GROUP BY document_type, status
ORDER BY document_type, status;

-- 🔟 EXEMPLES GEDDocument
SELECT 'CHECK 10: Exemples GEDDocument' as verification;
SELECT 
  category,
  is_published,
  COUNT(*) as nb_docs
FROM "GEDDocument"
GROUP BY category, is_published
ORDER BY category, is_published;

-- 1️⃣1️⃣ VÉRIFIER LES RELATIONS
SELECT 'CHECK 11: Relations FK' as verification;
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('ClientProcessDocument', 'GEDDocument', 'GEDDocumentPermission')
ORDER BY tc.table_name, kcu.column_name;

-- 1️⃣2️⃣ VÉRIFIER LES INDEX
SELECT 'CHECK 12: Index' as verification;
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('ClientProcessDocument', 'GEDDocument', 'GEDDocumentPermission')
ORDER BY tablename, indexname;

