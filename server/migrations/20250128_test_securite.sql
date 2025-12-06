-- ============================================================================
-- SCRIPT DE TEST DE SÉCURITÉ POST-CORRECTIONS
-- ============================================================================
-- Date : 2025-01-28
-- Objectif : Tester que les corrections de sécurité fonctionnent correctement
--            sans casser les fonctionnalités existantes
-- ============================================================================
-- ⚠️ IMPORTANT : Exécuter ce script avec un utilisateur ayant les droits admin
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. VÉRIFICATION DE L'ÉTAT DES CORRECTIONS
-- ============================================================================

DO $$
DECLARE
  tables_avec_rls INTEGER;
  vues_avec_security_definer INTEGER;
  tables_sans_rls INTEGER;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 VÉRIFICATION DE L''ÉTAT DES CORRECTIONS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Compter les tables avec RLS activé
  SELECT COUNT(*) INTO tables_avec_rls
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true;
  
  RAISE NOTICE '✅ Tables avec RLS activé : %', tables_avec_rls;
  
  -- Compter les tables publiques sans RLS
  SELECT COUNT(*) INTO tables_sans_rls
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = false
    AND tablename NOT IN ('schema_migrations', '_prisma_migrations');
  
  IF tables_sans_rls > 0 THEN
    RAISE WARNING '⚠️ Tables publiques SANS RLS : %', tables_sans_rls;
  ELSE
    RAISE NOTICE '✅ Toutes les tables publiques ont RLS activé';
  END IF;
  
  -- Vérifier les vues avec SECURITY DEFINER
  SELECT COUNT(*) INTO vues_avec_security_definer
  FROM pg_views
  WHERE schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%';
  
  IF vues_avec_security_definer > 0 THEN
    RAISE WARNING '⚠️ Vues avec SECURITY DEFINER restantes : %', vues_avec_security_definer;
  ELSE
    RAISE NOTICE '✅ Aucune vue avec SECURITY DEFINER';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 2. TEST DE LA VUE authenticated_users
-- ============================================================================

DO $$
DECLARE
  vue_existe BOOLEAN;
  expose_auth_users BOOLEAN;
  nombre_utilisateurs INTEGER;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔍 TEST : Vue authenticated_users';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Vérifier que la vue existe
  SELECT EXISTS (
    SELECT 1 FROM pg_views 
    WHERE viewname = 'authenticated_users' 
    AND schemaname = 'public'
  ) INTO vue_existe;
  
  IF vue_existe THEN
    RAISE NOTICE '✅ Vue authenticated_users existe';
    
    -- Vérifier qu'elle n'expose pas auth.users
    SELECT EXISTS (
      SELECT 1 FROM pg_views 
      WHERE viewname = 'authenticated_users' 
      AND schemaname = 'public'
      AND definition LIKE '%auth.users%'
    ) INTO expose_auth_users;
    
    IF expose_auth_users THEN
      RAISE WARNING '⚠️ La vue expose encore auth.users directement';
    ELSE
      RAISE NOTICE '✅ La vue n''expose pas auth.users directement';
    END IF;
    
    -- Tester que la vue retourne des données
    BEGIN
      SELECT COUNT(*) INTO nombre_utilisateurs FROM authenticated_users;
      RAISE NOTICE '✅ Vue accessible, % utilisateurs trouvés', nombre_utilisateurs;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Erreur lors de l''accès à la vue : %', SQLERRM;
    END;
  ELSE
    RAISE WARNING '❌ Vue authenticated_users n''existe pas';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 3. TEST DES POLITIQUES RLS - Vérification de l'existence
-- ============================================================================

DO $$
DECLARE
  nombre_politiques INTEGER;
  tables_sans_politique TEXT[];
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔍 TEST : Politiques RLS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Compter les politiques RLS
  SELECT COUNT(*) INTO nombre_politiques
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '✅ Nombre de politiques RLS créées : %', nombre_politiques;
  
  -- Vérifier les tables critiques ont des politiques
  SELECT array_agg(tablename) INTO tables_sans_politique
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true
    AND tablename IN (
      'Client', 'Expert', 'Admin', 'ApporteurAffaires',
      'ClientProduitEligible', 'messages', 'conversations'
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public'
      AND p.tablename = t.tablename
    );
  
  IF array_length(tables_sans_politique, 1) > 0 THEN
    RAISE WARNING '⚠️ Tables avec RLS mais sans politique : %', array_to_string(tables_sans_politique, ', ');
  ELSE
    RAISE NOTICE '✅ Toutes les tables critiques ont des politiques RLS';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 4. TEST D'ACCÈS AUX DONNÉES - Simulation (sans utilisateur réel)
-- ============================================================================

DO $$
DECLARE
  test_result TEXT;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔍 TEST : Structure des politiques RLS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Vérifier que les politiques utilisent auth.uid()
  SELECT COUNT(*) INTO test_result
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual::text LIKE '%auth.uid()%' OR with_check::text LIKE '%auth.uid()%');
  
  RAISE NOTICE '✅ Politiques utilisant auth.uid() : %', test_result;
  
  -- Vérifier les politiques par type d'opération
  RAISE NOTICE '';
  RAISE NOTICE 'Répartition des politiques par opération :';
  
  FOR test_result IN
    SELECT cmd || ' : ' || COUNT(*)::TEXT
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY cmd
    ORDER BY cmd
  LOOP
    RAISE NOTICE '  - %', test_result;
  END LOOP;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 5. TEST DES VUES - Vérification qu'elles sont accessibles
-- ============================================================================

DO $$
DECLARE
  vue_nom TEXT;
  vue_accessible BOOLEAN;
  vues_testees INTEGER := 0;
  vues_erreur INTEGER := 0;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔍 TEST : Accessibilité des vues corrigées';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Tester quelques vues critiques
  FOR vue_nom IN
    SELECT viewname
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname IN (
        'authenticated_users',
        'vue_dashboard_kpis_v2',
        'vue_activite_recente_v2',
        'vue_prospects_detaille',
        'vue_admin_kpis_globaux'
      )
    LIMIT 5
  LOOP
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM %I LIMIT 1', vue_nom);
      vue_accessible := true;
      vues_testees := vues_testees + 1;
      RAISE NOTICE '  ✅ % : Accessible', vue_nom;
    EXCEPTION WHEN OTHERS THEN
      vue_accessible := false;
      vues_erreur := vues_erreur + 1;
      RAISE WARNING '  ❌ % : Erreur - %', vue_nom, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Résumé : % vues testées, % erreurs', vues_testees, vues_erreur;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 6. VÉRIFICATION DES COLONNES CRITIQUES
-- ============================================================================

DO $$
DECLARE
  colonnes_manquantes TEXT[];
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔍 TEST : Colonnes critiques pour RLS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Vérifier que les tables ont les colonnes nécessaires pour RLS
  -- Client doit avoir auth_user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'Client' 
    AND column_name = 'auth_user_id'
  ) THEN
    RAISE WARNING '⚠️ Table Client : colonne auth_user_id manquante';
  ELSE
    RAISE NOTICE '✅ Table Client : auth_user_id présente';
  END IF;
  
  -- Expert doit avoir auth_user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'Expert' 
    AND column_name = 'auth_user_id'
  ) THEN
    RAISE WARNING '⚠️ Table Expert : colonne auth_user_id manquante';
  ELSE
    RAISE NOTICE '✅ Table Expert : auth_user_id présente';
  END IF;
  
  -- Admin doit avoir auth_user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'Admin' 
    AND column_name = 'auth_user_id'
  ) THEN
    RAISE WARNING '⚠️ Table Admin : colonne auth_user_id manquante';
  ELSE
    RAISE NOTICE '✅ Table Admin : auth_user_id présente';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 7. RÉSUMÉ FINAL
-- ============================================================================

DO $$
DECLARE
  score_total INTEGER := 0;
  score_max INTEGER := 6;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 RÉSUMÉ DES TESTS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Compter les succès (simplifié)
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'authenticated_users' AND schemaname = 'public') THEN
    score_total := score_total + 1;
  END IF;
  
  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') > 50 THEN
    score_total := score_total + 1;
  END IF;
  
  IF (SELECT COUNT(*) FROM pg_tables t JOIN pg_class c ON c.relname = t.tablename 
      WHERE t.schemaname = 'public' AND c.relrowsecurity = true) > 50 THEN
    score_total := score_total + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND definition LIKE '%SECURITY DEFINER%') THEN
    score_total := score_total + 1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Client' AND column_name = 'auth_user_id') THEN
    score_total := score_total + 1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expert' AND column_name = 'auth_user_id') THEN
    score_total := score_total + 1;
  END IF;
  
  RAISE NOTICE 'Score de sécurité : %/%', score_total, score_max;
  
  IF score_total = score_max THEN
    RAISE NOTICE '✅ Tous les tests de base sont passés !';
  ELSIF score_total >= score_max * 0.8 THEN
    RAISE NOTICE '⚠️ La plupart des tests sont passés, quelques ajustements peuvent être nécessaires';
  ELSE
    RAISE WARNING '❌ Plusieurs tests ont échoué, vérification manuelle recommandée';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ Script de test terminé';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

COMMIT;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- Ce script teste la structure mais ne peut pas tester les politiques RLS
-- avec de vrais utilisateurs sans authentification active.
--
-- Pour tester complètement :
-- 1. Connectez-vous en tant que CLIENT et vérifiez l'accès à vos données
-- 2. Connectez-vous en tant qu'EXPERT et vérifiez l'accès à vos dossiers
-- 3. Connectez-vous en tant qu'ADMIN et vérifiez l'accès au dashboard
-- 4. Connectez-vous en tant qu'APPORTEUR et vérifiez l'accès aux prospects
--
-- ============================================================================
