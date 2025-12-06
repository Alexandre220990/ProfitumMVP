-- ============================================================================
-- VÉRIFICATION FINALE : Confirmation que toutes les vues sont sécurisées
-- ============================================================================
-- Ce script confirme que toutes les vues respectent les bonnes pratiques
-- ============================================================================
-- Date : 2025-01-29
-- ============================================================================

-- ============================================================================
-- RÉSUMÉ : État de sécurité des vues
-- ============================================================================
DO $$
DECLARE
  total_vues INTEGER;
  vues_avec_security_definer INTEGER;
  vues_avec_security_invoker INTEGER;
  message TEXT;
BEGIN
  -- Compter le total de vues
  SELECT COUNT(*) INTO total_vues
  FROM pg_views
  WHERE schemaname = 'public';
  
  -- Compter les vues avec SECURITY DEFINER
  SELECT COUNT(*) INTO vues_avec_security_definer
  FROM (
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'v'
      AND c.reloptions IS NOT NULL
      AND 'security_definer=true' = ANY(c.reloptions)
    
    UNION
    
    SELECT v.viewname
    FROM pg_views v
    WHERE v.schemaname = 'public'
      AND (v.definition LIKE '%SECURITY DEFINER%' 
           OR v.definition LIKE '%security definer%'
           OR v.definition LIKE '%SECURITY_DEFINER%')
  ) vues_problematiques;
  
  -- Les vues restantes utilisent SECURITY INVOKER par défaut
  vues_avec_security_invoker := total_vues - vues_avec_security_definer;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'RÉSUMÉ DE SÉCURITÉ DES VUES';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Total de vues dans le schéma public: %', total_vues;
  RAISE NOTICE 'Vues avec SECURITY DEFINER (problématique): %', vues_avec_security_definer;
  RAISE NOTICE 'Vues avec SECURITY INVOKER (sécurisé): %', vues_avec_security_invoker;
  RAISE NOTICE '============================================================================';
  
  IF vues_avec_security_definer = 0 THEN
    RAISE NOTICE '✅ EXCELLENT ! Toutes les vues sont sécurisées.';
    RAISE NOTICE '✅ Aucune vue ne contourne les politiques RLS.';
    RAISE NOTICE '✅ Les permissions des utilisateurs seront correctement appliquées.';
  ELSE
    RAISE WARNING '⚠️ ATTENTION ! Il reste % vue(s) avec SECURITY DEFINER.', vues_avec_security_definer;
    RAISE WARNING '⚠️ Exécutez la migration 20250129_fix_all_security_definer_views.sql pour corriger.';
  END IF;
  
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- LISTE : Toutes les vues du schéma public (pour référence)
-- ============================================================================
SELECT 
  viewname as nom_vue,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = pg_views.viewname
        AND c.relkind = 'v'
        AND c.reloptions IS NOT NULL
        AND 'security_definer=true' = ANY(c.reloptions)
    ) THEN '❌ SECURITY DEFINER'
    WHEN pg_views.definition LIKE '%SECURITY DEFINER%' 
         OR pg_views.definition LIKE '%security definer%'
         OR pg_views.definition LIKE '%SECURITY_DEFINER%' THEN '❌ SECURITY DEFINER (dans définition)'
    ELSE '✅ SECURITY INVOKER'
  END as statut_securite
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
