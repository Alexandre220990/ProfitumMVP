-- ============================================================================
-- VÉRIFICATION SIMPLE - UNE TABLE PAR REQUÊTE
-- Exécutez chaque SELECT un par un pour voir les résultats
-- ============================================================================

-- 1️⃣ Vérifier que ClientProcessDocument existe et sa structure
SELECT 'CHECK 1: Table ClientProcessDocument' as verification;
SELECT COUNT(*) as colonnes_count 
FROM information_schema.columns 
WHERE table_name = 'ClientProcessDocument';

-- 2️⃣ Vérifier colonnes ClientProcessDocument
SELECT 'CHECK 2: Colonnes ClientProcessDocument' as verification;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ClientProcessDocument'
ORDER BY ordinal_position;

-- 3️⃣ Compter documents dans ClientProcessDocument
SELECT 'CHECK 3: Données ClientProcessDocument' as verification;
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'validated' THEN 1 END) as validated,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM "ClientProcessDocument";

-- 4️⃣ Vérifier enrichissement GEDDocument
SELECT 'CHECK 4: Nouvelles colonnes GEDDocument' as verification;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'GEDDocument'
  AND column_name IN ('slug', 'tags', 'is_published', 'view_count', 'helpful_count', 'meta_description', 'is_featured', 'not_helpful_count', 'author_id', 'published_at');

-- 5️⃣ Compter documents GEDDocument
SELECT 'CHECK 5: Données GEDDocument' as verification;
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published,
  COUNT(CASE WHEN is_published = false THEN 1 END) as drafts,
  SUM(view_count) as total_views
FROM "GEDDocument";

-- 6️⃣ Vérifier index ClientProcessDocument
SELECT 'CHECK 6: Index ClientProcessDocument' as verification;
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'ClientProcessDocument'
ORDER BY indexname;

-- 7️⃣ Vérifier RLS policies ClientProcessDocument
SELECT 'CHECK 7: RLS Policies ClientProcessDocument' as verification;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'ClientProcessDocument'
ORDER BY policyname;

-- 8️⃣ Vérifier labels créés
SELECT 'CHECK 8: Labels GEDDocumentLabel' as verification;
SELECT name, color 
FROM "GEDDocumentLabel" 
ORDER BY name;

-- 9️⃣ Vérifier permissions créées
SELECT 'CHECK 9: Permissions GEDDocumentPermission' as verification;
SELECT user_type, COUNT(*) as nb_permissions
FROM "GEDDocumentPermission"
GROUP BY user_type;

-- 🔟 Vérifier vues créées
SELECT 'CHECK 10: Vues helper' as verification;
SELECT table_name 
FROM information_schema.views 
WHERE table_name IN ('v_admin_client_process_documents', 'v_admin_documentation_app');

-- 1️⃣1️⃣ Vérifier fonction stats existe
SELECT 'CHECK 11: Fonction get_documents_stats' as verification;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_documents_stats';

-- 1️⃣2️⃣ Tester fonction stats
SELECT 'CHECK 12: Test fonction stats' as verification;
SELECT get_documents_stats();

-- 1️⃣3️⃣ Vérifier trigger updated_at
SELECT 'CHECK 13: Trigger updated_at' as verification;
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'ClientProcessDocument';

-- 1️⃣4️⃣ Vérifier buckets Storage documents
SELECT 'CHECK 14: Buckets Storage' as verification;
SELECT name, public 
FROM storage.buckets 
WHERE name IN ('admin-documents', 'client-documents', 'expert-documents', 'documents', 'rapports', 'factures', 'guides')
ORDER BY name;

-- 1️⃣5️⃣ Compter fichiers par bucket
SELECT 'CHECK 15: Fichiers dans buckets' as verification;
SELECT 
  bucket_id, 
  COUNT(*) as nb_fichiers
FROM storage.objects 
WHERE bucket_id IN ('admin-documents', 'documents')
GROUP BY bucket_id;

-- 1️⃣6️⃣ Exemples documents migrés
SELECT 'CHECK 16: Exemples documentation migrée' as verification;
SELECT id, title, category, is_published, view_count
FROM "GEDDocument"
LIMIT 5;

-- 1️⃣7️⃣ Tables à supprimer
SELECT 'CHECK 17: Tables obsolètes à supprimer' as verification;
SELECT 
  table_name,
  CASE table_name
    WHEN 'admin_documents' THEN (SELECT COUNT(*)::text FROM admin_documents)
    WHEN 'documentation' THEN (SELECT COUNT(*)::text FROM documentation)
    WHEN 'documentation_items' THEN (SELECT COUNT(*)::text FROM documentation_items)
    WHEN 'documentation_categories' THEN (SELECT COUNT(*)::text FROM documentation_categories)
  END as nb_lignes
FROM information_schema.tables
WHERE table_name IN ('admin_documents', 'documentation', 'documentation_items', 'documentation_categories');

-- ============================================================================
-- RÉSUMÉ FINAL - COMPTAGE
-- ============================================================================

SELECT 'RÉSUMÉ FINAL' as verification;

-- Score migration
SELECT 
  'Score Migration' as metric,
  (
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ClientProcessDocument')::int +
    (SELECT CASE WHEN COUNT(*) >= 10 THEN 1 ELSE 0 END FROM information_schema.columns WHERE table_name = 'GEDDocument' AND column_name IN ('slug', 'tags', 'is_published'))::int +
    (SELECT CASE WHEN COUNT(*) >= 7 THEN 1 ELSE 0 END FROM "GEDDocumentLabel")::int +
    (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM "GEDDocument")::int +
    (SELECT CASE WHEN COUNT(*) >= 4 THEN 1 ELSE 0 END FROM pg_policies WHERE tablename = 'ClientProcessDocument')::int +
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'v_admin_client_process_documents')::int +
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'v_admin_documentation_app')::int +
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'get_documents_stats')::int +
    (SELECT CASE WHEN COUNT(*) >= 6 THEN 1 ELSE 0 END FROM pg_indexes WHERE tablename = 'ClientProcessDocument')::int +
    (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'ClientProcessDocument')::int
  ) as checks_passed,
  10 as checks_total;

-- Détail tables documentaires
SELECT 
  'Tables Documentaires' as metric,
  COUNT(*) as nb_tables
FROM information_schema.tables
WHERE table_name LIKE '%ocument%' OR table_name LIKE '%GED%';

-- Détail migration
SELECT 'Migration Documentation' as metric,
  (SELECT COUNT(*) FROM "GEDDocument") as docs_total,
  (SELECT COUNT(*) FROM "GEDDocument" WHERE is_published = true) as docs_published,
  (SELECT COUNT(*) FROM "GEDDocumentPermission") as permissions_total,
  (SELECT COUNT(*) FROM "GEDDocumentLabel") as labels_total;

