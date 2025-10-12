-- ============================================================================
-- VÉRIFICATION POST-MIGRATION SYSTÈME DOCUMENTAIRE
-- À exécuter après MIGRATION-DOCUMENTS-UNIFICATION.sql
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION TABLES PRINCIPALES
-- ============================================================================

SELECT '📊 TABLES DOCUMENTAIRES' as section;

SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name 
     AND table_schema = 'public') as nb_colonnes,
  CASE 
    WHEN table_name = 'ClientProcessDocument' THEN '✅ Nouvelle table (process clients)'
    WHEN table_name = 'GEDDocument' THEN '✅ Table enrichie (documentation app)'
    WHEN table_name = 'GEDDocumentPermission' THEN '✅ Permissions granulaires'
    WHEN table_name = 'GEDDocumentVersion' THEN '✅ Historique versions'
    WHEN table_name = 'GEDDocumentLabel' THEN '✅ Tags/Labels'
    WHEN table_name = 'DocumentActivity' THEN '✅ Logs activité'
    WHEN table_name = 'admin_documents' THEN '⚠️ À SUPPRIMER (doublon vide)'
    WHEN table_name = 'documentation_items' THEN '⚠️ À SUPPRIMER (migré vers GEDDocument)'
    WHEN table_name = 'documentation_categories' THEN '⚠️ À SUPPRIMER (migré vers labels)'
    WHEN table_name = 'documentation' THEN '⚠️ À SUPPRIMER (migré)'
    ELSE '📋 Autre'
  END as statut
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND (
    table_name ILIKE '%document%' 
    OR table_name ILIKE '%ged%'
  )
ORDER BY 
  CASE 
    WHEN table_name IN ('ClientProcessDocument', 'GEDDocument') THEN 1
    WHEN table_name LIKE 'GED%' THEN 2
    ELSE 3
  END,
  table_name;

-- ============================================================================
-- 2. VÉRIFICATION COLONNES GEDOCUMENT (Enrichissement)
-- ============================================================================

SELECT '🔍 COLONNES GEDOCUMENT ENRICHIES' as section;

SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('slug', 'meta_description', 'tags', 'is_published', 'is_featured', 
                         'view_count', 'helpful_count', 'not_helpful_count', 'author_id', 'published_at') 
    THEN '✅ Nouvelle colonne'
    ELSE '📋 Existante'
  END as statut
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'GEDDocument'
ORDER BY 
  CASE 
    WHEN column_name IN ('slug', 'tags', 'is_published', 'view_count') THEN 1
    ELSE 2
  END,
  column_name;

-- ============================================================================
-- 3. VÉRIFICATION STRUCTURE ClientProcessDocument
-- ============================================================================

SELECT '📁 STRUCTURE CLIENTPROCESSDOCUMENT' as section;

SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name IN ('client_id', 'produit_id') THEN '🔗 Relations'
    WHEN column_name IN ('workflow_step', 'document_type', 'status') THEN '📋 Classification'
    WHEN column_name IN ('filename', 'storage_path', 'bucket_name') THEN '📄 Fichier'
    WHEN column_name IN ('uploaded_by', 'uploaded_by_type', 'validated_by') THEN '👤 Traçabilité'
    ELSE '📊 Autre'
  END as categorie
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ClientProcessDocument'
ORDER BY ordinal_position;

-- ============================================================================
-- 4. VÉRIFICATION INDEX CRÉÉS
-- ============================================================================

SELECT '🔍 INDEX CRÉÉS' as section;

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename = 'ClientProcessDocument'
    OR (tablename = 'GEDDocument' AND indexname LIKE 'idx_ged_document_%')
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- 5. VÉRIFICATION RLS POLICIES
-- ============================================================================

SELECT '🔐 RLS POLICIES' as section;

SELECT 
  tablename,
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
WHERE schemaname = 'public'
  AND tablename IN ('ClientProcessDocument', 'GEDDocument', 'GEDDocumentPermission')
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. VÉRIFICATION LABELS PAR DÉFAUT
-- ============================================================================

SELECT '🏷️ LABELS CRÉÉS' as section;

SELECT 
  name,
  color,
  description,
  created_at
FROM "GEDDocumentLabel"
ORDER BY name;

-- ============================================================================
-- 7. COMPTAGE DONNÉES
-- ============================================================================

SELECT '📊 COMPTAGE DONNÉES' as section;

-- ClientProcessDocument
SELECT 
  'ClientProcessDocument' as table_name,
  COUNT(*) as nb_lignes,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'validated' THEN 1 END) as validated,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM "ClientProcessDocument"

UNION ALL

-- GEDDocument
SELECT 
  'GEDDocument' as table_name,
  COUNT(*) as nb_lignes,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published,
  COUNT(CASE WHEN is_published = false THEN 1 END) as drafts,
  SUM(view_count) as total_views
FROM "GEDDocument"

UNION ALL

-- GEDDocumentPermission
SELECT 
  'GEDDocumentPermission' as table_name,
  COUNT(*) as nb_lignes,
  COUNT(DISTINCT document_id) as docs_avec_permissions,
  COUNT(DISTINCT user_type) as types_utilisateurs,
  NULL
FROM "GEDDocumentPermission"

ORDER BY table_name;

-- ============================================================================
-- 8. VÉRIFICATION VUES CRÉÉES
-- ============================================================================

SELECT '🔭 VUES CRÉÉES' as section;

SELECT 
  table_name,
  CASE 
    WHEN table_name = 'v_admin_client_process_documents' THEN '✅ Vue process clients enrichie'
    WHEN table_name = 'v_admin_documentation_app' THEN '✅ Vue documentation avec permissions'
    WHEN table_name = 'v_admin_documents_published' THEN '📋 Vue ancienne (à vérifier)'
    ELSE '📋 Autre vue'
  END as description
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE '%document%'
ORDER BY table_name;

-- ============================================================================
-- 9. VÉRIFICATION FONCTION STATS
-- ============================================================================

SELECT '📈 FONCTION STATS' as section;

SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_documents_stats';

-- Tester la fonction
SELECT '🧪 TEST FONCTION get_documents_stats()' as section;
SELECT get_documents_stats();

-- ============================================================================
-- 10. VÉRIFICATION PERMISSIONS PAR TYPE
-- ============================================================================

SELECT '👥 PERMISSIONS PAR TYPE UTILISATEUR' as section;

SELECT 
  user_type,
  COUNT(*) as nb_permissions,
  COUNT(CASE WHEN can_read = true THEN 1 END) as can_read,
  COUNT(CASE WHEN can_write = true THEN 1 END) as can_write,
  COUNT(CASE WHEN can_delete = true THEN 1 END) as can_delete
FROM "GEDDocumentPermission"
GROUP BY user_type
ORDER BY user_type;

-- ============================================================================
-- 11. VÉRIFICATION BUCKETS STORAGE
-- ============================================================================

SELECT '📦 BUCKETS STORAGE' as section;

SELECT 
  name as bucket_name,
  public,
  CASE 
    WHEN name LIKE 'client%' THEN '👤 Clients'
    WHEN name LIKE 'expert%' THEN '🎓 Experts'
    WHEN name LIKE 'admin%' THEN '👑 Admin'
    WHEN name IN ('documents', 'rapports', 'factures', 'guides') THEN '📁 Process'
    ELSE '📋 Autre'
  END as usage,
  created_at
FROM storage.buckets
WHERE name LIKE '%document%'
   OR name IN ('documents', 'rapports', 'factures', 'guides', 'formation')
ORDER BY name;

-- Comptage fichiers par bucket
SELECT 
  bucket_id,
  COUNT(*) as nb_fichiers,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as taille_totale_mb
FROM storage.objects
WHERE bucket_id IN (
  SELECT name FROM storage.buckets 
  WHERE name LIKE '%document%'
    OR name IN ('documents', 'rapports', 'factures', 'guides')
)
GROUP BY bucket_id
ORDER BY bucket_id;

-- ============================================================================
-- 12. EXEMPLES DE DONNÉES MIGRÉES
-- ============================================================================

SELECT '📖 EXEMPLES DOCUMENTATION APP (5 premiers)' as section;

SELECT 
  id,
  title,
  category,
  slug,
  is_published,
  view_count,
  array_length(tags, 1) as nb_tags,
  created_at
FROM "GEDDocument"
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- 13. TABLES À SUPPRIMER (Vérification finale)
-- ============================================================================

SELECT '⚠️ TABLES À SUPPRIMER APRÈS VALIDATION' as section;

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as nb_colonnes,
  CASE 
    WHEN table_name = 'admin_documents' THEN 
      (SELECT COUNT(*)::text || ' lignes - VIDE, peut être supprimé' FROM admin_documents)
    WHEN table_name = 'documentation_items' THEN 
      (SELECT COUNT(*)::text || ' lignes - Migré vers GEDDocument' FROM documentation_items)
    WHEN table_name = 'documentation_categories' THEN 
      (SELECT COUNT(*)::text || ' lignes - Migré vers labels' FROM documentation_categories)
    WHEN table_name = 'documentation' THEN 
      (SELECT COUNT(*)::text || ' lignes - Migré' FROM documentation)
    ELSE 'À analyser'
  END as statut
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('admin_documents', 'documentation_items', 'documentation_categories', 'documentation')
ORDER BY table_name;

-- ============================================================================
-- 14. RÉSUMÉ FINAL
-- ============================================================================

SELECT '✅ RÉSUMÉ MIGRATION' as section;

DO $$
DECLARE
  cpd_count INTEGER;
  ged_count INTEGER;
  perm_count INTEGER;
  label_count INTEGER;
  published_count INTEGER;
  total_views INTEGER;
BEGIN
  SELECT COUNT(*) INTO cpd_count FROM "ClientProcessDocument";
  SELECT COUNT(*) INTO ged_count FROM "GEDDocument";
  SELECT COUNT(*) INTO perm_count FROM "GEDDocumentPermission";
  SELECT COUNT(*) INTO label_count FROM "GEDDocumentLabel";
  SELECT COUNT(*) INTO published_count FROM "GEDDocument" WHERE is_published = true;
  SELECT COALESCE(SUM(view_count), 0) INTO total_views FROM "GEDDocument";
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '📊 VÉRIFICATION POST-MIGRATION - RÉSULTATS';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ TABLES PRINCIPALES:';
  RAISE NOTICE '   • ClientProcessDocument: % documents', cpd_count;
  RAISE NOTICE '   • GEDDocument: % documents (% publiés)', ged_count, published_count;
  RAISE NOTICE '   • GEDDocumentPermission: % permissions', perm_count;
  RAISE NOTICE '   • GEDDocumentLabel: % labels', label_count;
  RAISE NOTICE '';
  RAISE NOTICE '📈 STATISTIQUES:';
  RAISE NOTICE '   • Vues totales: %', total_views;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PROCHAINES ÉTAPES:';
  RAISE NOTICE '   1. Vérifier que les données sont correctes';
  RAISE NOTICE '   2. Tester les routes backend (/api/admin/documents/*)';
  RAISE NOTICE '   3. Tester la page frontend (/admin/documents-unified)';
  RAISE NOTICE '   4. Si OK, supprimer les anciennes tables:';
  RAISE NOTICE '      - admin_documents';
  RAISE NOTICE '      - documentation_items';
  RAISE NOTICE '      - documentation_categories';
  RAISE NOTICE '      - documentation';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- 15. VÉRIFICATION CONTRAINTES
-- ============================================================================

SELECT '🔒 CONTRAINTES ACTIVES' as section;

SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  CASE 
    WHEN tc.constraint_type = 'FOREIGN KEY' THEN 
      (SELECT ccu.table_name || '(' || ccu.column_name || ')'
       FROM information_schema.constraint_column_usage ccu
       WHERE ccu.constraint_name = tc.constraint_name
       LIMIT 1)
    WHEN tc.constraint_type = 'CHECK' THEN 
      (SELECT pg_get_constraintdef(oid)
       FROM pg_constraint
       WHERE conname = tc.constraint_name
       LIMIT 1)
    ELSE NULL
  END as details
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('ClientProcessDocument', 'GEDDocument')
  AND tc.constraint_type IN ('FOREIGN KEY', 'CHECK', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================================================
-- 16. VÉRIFICATION TRIGGERS
-- ============================================================================

SELECT '⚡ TRIGGERS ACTIFS' as section;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('ClientProcessDocument', 'GEDDocument')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 17. TEST RAPIDE DES VUES
-- ============================================================================

SELECT '🔭 TEST VUE v_admin_client_process_documents' as section;
SELECT COUNT(*) as nb_lignes FROM v_admin_client_process_documents;

SELECT '🔭 TEST VUE v_admin_documentation_app' as section;
SELECT COUNT(*) as nb_lignes FROM v_admin_documentation_app;

-- ============================================================================
-- 18. VÉRIFICATION SÉCURITÉ RLS
-- ============================================================================

SELECT '🛡️ ROW LEVEL SECURITY' as section;

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS activé'
    ELSE '❌ RLS désactivé'
  END as statut_rls,
  (SELECT COUNT(*) 
   FROM pg_policies 
   WHERE schemaname = 'public' 
     AND pg_policies.tablename = c.tablename) as nb_policies
FROM pg_tables c
WHERE schemaname = 'public'
  AND tablename IN ('ClientProcessDocument', 'GEDDocument', 'GEDDocumentPermission')
ORDER BY tablename;

-- ============================================================================
-- 19. SAMPLE DATA - Documentation App
-- ============================================================================

SELECT '📚 ÉCHANTILLON DOCUMENTATION APP' as section;

SELECT 
  title,
  category,
  is_published,
  view_count,
  COALESCE(array_length(tags, 1), 0) as nb_tags,
  TO_CHAR(created_at, 'DD/MM/YYYY') as date_creation
FROM "GEDDocument"
ORDER BY view_count DESC
LIMIT 10;

-- ============================================================================
-- 20. ÉTAT FINAL - CHECKLIST
-- ============================================================================

SELECT '✅ CHECKLIST MIGRATION' as section;

DO $$
DECLARE
  checks_passed INTEGER := 0;
  checks_total INTEGER := 10;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CHECKLIST MIGRATION DOCUMENTAIRE';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Check 1: Table ClientProcessDocument existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ClientProcessDocument') THEN
    RAISE NOTICE '✅ Table ClientProcessDocument créée';
    checks_passed := checks_passed + 1;
  ELSE
    RAISE NOTICE '❌ Table ClientProcessDocument manquante';
  END IF;
  
  -- Check 2: GEDDocument enrichi
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GEDDocument' AND column_name = 'slug') THEN
    RAISE NOTICE '✅ GEDDocument enrichi (slug existe)';
    checks_passed := checks_passed + 1;
  ELSE
    RAISE NOTICE '❌ GEDDocument pas enrichi';
  END IF;
  
  -- Check 3: Labels créés
  IF (SELECT COUNT(*) FROM "GEDDocumentLabel") >= 7 THEN
    RAISE NOTICE '✅ Labels créés (% labels)', (SELECT COUNT(*) FROM "GEDDocumentLabel");
    checks_passed := checks_passed + 1;
  ELSE
    RAISE NOTICE '⚠️ Moins de 7 labels créés';
  END IF;
  
  -- Check 4: Données migrées
  IF (SELECT COUNT(*) FROM "GEDDocument") > 0 THEN
    RAISE NOTICE '✅ Données migrées (% documents)', (SELECT COUNT(*) FROM "GEDDocument");
    checks_passed := checks_passed + 1;
  ELSE
    RAISE NOTICE '⚠️ Aucun document dans GEDDocument';
  END IF;
  
  -- Check 5: RLS activé
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ClientProcessDocument') >= 4 THEN
    RAISE NOTICE '✅ RLS Policies créées (% policies)', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ClientProcessDocument');
    checks_passed := checks_passed + 1;
  ELSE
    RAISE NOTICE '❌ RLS Policies manquantes';
  END IF;
  
  -- Check 6: Vue process existe
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_admin_client_process_documents') THEN
    RAISE NOTICE '✅ Vue v_admin_client_process_documents créée';
    checks_passed := checks_passed + 1;
  ELSE
    RAISE NOTICE '❌ Vue manquante';
  END IF;
  
  -- Check 7: Vue documentation existe
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_admin_documentation_app') THEN
    RAISE NOTICE '✅ Vue v_admin_documentation_app créée';
    checks_passed := checks_passed + 1;
  ELSE
    RAISE NOTICE '❌ Vue manquante';
  END IF;
  
  -- Check 8: Fonction stats existe
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_documents_stats') THEN
    RAISE NOTICE '✅ Fonction get_documents_stats() créée';
    checks_passed := checks_passed + 1;
  ELSE
    RAISE NOTICE '❌ Fonction manquante';
  END IF;
  
  -- Check 9: Index créés
  IF (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'ClientProcessDocument') >= 6 THEN
    RAISE NOTICE '✅ Index créés (% index)', (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'ClientProcessDocument');
    checks_passed := checks_passed + 1;
  ELSE
    RAISE NOTICE '⚠️ Certains index manquants';
  END IF;
  
  -- Check 10: Trigger updated_at
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE event_object_table = 'ClientProcessDocument') THEN
    RAISE NOTICE '✅ Trigger updated_at créé';
    checks_passed := checks_passed + 1;
  ELSE
    RAISE NOTICE '❌ Trigger manquant';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '🎯 SCORE: %/% checks passés', checks_passed, checks_total;
  RAISE NOTICE '';
  
  IF checks_passed = checks_total THEN
    RAISE NOTICE '🎉 MIGRATION 100%% RÉUSSIE !';
    RAISE NOTICE '✅ Vous pouvez maintenant tester le frontend/backend';
  ELSIF checks_passed >= 8 THEN
    RAISE NOTICE '✅ Migration OK (quelques éléments mineurs manquants)';
  ELSE
    RAISE NOTICE '⚠️ Vérifier les éléments manquants ci-dessus';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

