-- ============================================================================
-- SUPPRESSION TABLES OBSOLÈTES - VERSION SIMPLE
-- Exécutez CHAQUE section SÉPARÉMENT pour voir le résultat
-- ============================================================================

-- ⚠️ ÉTAPE 1: VÉRIFIER LES TABLES AVANT SUPPRESSION
-- Exécutez cette requête en premier pour voir ce qui existe

SELECT 
  t.table_name,
  (xpath('/row/cnt/text()', 
    query_to_xml(format('SELECT COUNT(*) as cnt FROM %I', t.table_name), false, true, '')
  ))[1]::text::int as nb_lignes
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_name IN ('admin_documents', 'documentation', 'documentation_items', 'documentation_categories')
ORDER BY t.table_name;


-- ============================================================================
-- ⚠️ ÉTAPE 2: SUPPRESSION (Exécutez uniquement si vous êtes sûr)
-- ============================================================================
-- DÉCOMMENTEZ LES LIGNES CI-DESSOUS POUR SUPPRIMER

-- DROP TABLE IF EXISTS documentation CASCADE;
-- DROP TABLE IF EXISTS documentation_items CASCADE;
-- DROP TABLE IF EXISTS documentation_categories CASCADE;
-- DROP TABLE IF EXISTS admin_documents CASCADE;


-- ============================================================================
-- ✅ ÉTAPE 3: VÉRIFICATION APRÈS SUPPRESSION
-- Exécutez cette requête pour confirmer que les tables sont supprimées
-- ============================================================================

SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('admin_documents', 'documentation', 'documentation_items', 'documentation_categories');

-- Si cette requête retourne 0 ligne, c'est parfait ! ✅


-- ============================================================================
-- 📊 BONUS: LISTER TOUTES LES TABLES DOCUMENTAIRES RESTANTES
-- ============================================================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as nb_colonnes,
  CASE 
    WHEN table_name = 'ClientProcessDocument' THEN '✅ Process clients'
    WHEN table_name = 'GEDDocument' THEN '✅ Documentation app'
    WHEN table_name = 'GEDDocumentPermission' THEN '✅ Permissions'
    WHEN table_name = 'GEDDocumentLabel' THEN '✅ Labels/Tags'
    WHEN table_name = 'GEDDocumentVersion' THEN '✅ Versions'
    WHEN table_name = 'GEDDocumentLabelRelation' THEN '✅ Relations labels'
    WHEN table_name = 'GEDUserDocumentFavorite' THEN '✅ Favoris'
    WHEN table_name = 'DocumentActivity' THEN '✅ Logs activité'
    ELSE '📋 Autre'
  END as description
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND (table_name LIKE '%ocument%' OR table_name LIKE 'GED%')
ORDER BY 
  CASE 
    WHEN table_name IN ('ClientProcessDocument', 'GEDDocument') THEN 1
    WHEN table_name LIKE 'GED%' THEN 2
    ELSE 3
  END,
  table_name;

