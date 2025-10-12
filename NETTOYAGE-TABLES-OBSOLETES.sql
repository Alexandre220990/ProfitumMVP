-- ============================================================================
-- NETTOYAGE TABLES OBSOLÈTES APRÈS MIGRATION
-- ✅ À exécuter APRÈS avoir vérifié que tout fonctionne
-- ============================================================================
-- ⚠️ BACKUP RECOMMANDÉ avant exécution
-- ============================================================================

BEGIN;

-- Vérification avant suppression
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '🗑️ NETTOYAGE TABLES OBSOLÈTES';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables à supprimer:';
  RAISE NOTICE '  • admin_documents: % ligne(s)', (SELECT COUNT(*) FROM admin_documents);
  RAISE NOTICE '  • documentation: % ligne(s)', (SELECT COUNT(*) FROM documentation);
  RAISE NOTICE '  • documentation_categories: % ligne(s)', (SELECT COUNT(*) FROM documentation_categories);
  RAISE NOTICE '  • documentation_items: % ligne(s)', (SELECT COUNT(*) FROM documentation_items);
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ Ces données ont été migrées vers GEDDocument';
  RAISE NOTICE '⚠️ Si vous continuez, ces tables seront supprimées définitivement';
  RAISE NOTICE '';
END $$;

-- Suppression des tables (CASCADE pour supprimer aussi les dépendances)
DROP TABLE IF EXISTS documentation CASCADE;
DROP TABLE IF EXISTS documentation_items CASCADE;
DROP TABLE IF EXISTS documentation_categories CASCADE;
DROP TABLE IF EXISTS admin_documents CASCADE;

RAISE NOTICE '✅ Tables obsolètes supprimées';

-- Vérification finale
DO $$
DECLARE
  remaining_tables INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('admin_documents', 'documentation', 'documentation_items', 'documentation_categories');
  
  IF remaining_tables = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ NETTOYAGE TERMINÉ AVEC SUCCÈS';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TABLES DOCUMENTAIRES RESTANTES:';
    RAISE NOTICE '   ✅ ClientProcessDocument (process clients)';
    RAISE NOTICE '   ✅ GEDDocument (documentation app)';
    RAISE NOTICE '   ✅ GEDDocumentPermission (permissions)';
    RAISE NOTICE '   ✅ GEDDocumentVersion (versioning)';
    RAISE NOTICE '   ✅ GEDDocumentLabel (labels/tags)';
    RAISE NOTICE '   ✅ DocumentActivity (logs)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Système documentaire unifié et optimisé !';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '⚠️ % table(s) n''ont pas pu être supprimées', remaining_tables;
  END IF;
END $$;

COMMIT;

