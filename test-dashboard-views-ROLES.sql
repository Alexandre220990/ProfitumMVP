-- ============================================================================
-- SCRIPT DE TEST DES VUES PAR RÔLE (ADMIN vs APPORTEUR)
-- ============================================================================
-- Ce script teste que toutes les vues fonctionnent avec les bonnes colonnes
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION DE LA STRUCTURE DES TABLES
-- ============================================================================

-- Vérifier que la colonne apporteur_id existe dans Client
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Client' 
        AND column_name = 'apporteur_id'
        AND table_schema = 'public'
    ) THEN 'EXISTE'
    ELSE 'N''EXISTE PAS'
  END as apporteur_id_status;

-- Vérifier les valeurs possibles pour apporteur_id
SELECT 
  apporteur_id,
  COUNT(*) as nombre_clients
FROM "Client" 
WHERE apporteur_id IS NOT NULL
GROUP BY apporteur_id
ORDER BY nombre_clients DESC
LIMIT 5;

-- ============================================================================
-- 2. TEST DES VUES ADMIN (GLOBALES)
-- ============================================================================

SELECT 'Test vue_admin_kpis_globaux' as test_name;
SELECT * FROM vue_admin_kpis_globaux;

SELECT 'Test vue_admin_activite_globale' as test_name;
SELECT * FROM vue_admin_activite_globale LIMIT 5;

SELECT 'Test vue_admin_alertes_globales' as test_name;
SELECT * FROM vue_admin_alertes_globales;

-- ============================================================================
-- 3. TEST DES VUES APPORTEUR (PERSONNELLES)
-- ============================================================================

-- Obtenir un ID d'apporteur existant pour les tests
SELECT 'Recherche d''un apporteur existant' as test_name;
SELECT id, email, first_name, last_name 
FROM "ApporteurAffaires" 
WHERE status = 'active'
LIMIT 1;

-- Test avec un ID d'apporteur réel (remplacer par un vrai ID)
-- SELECT 'Test vue_apporteur_kpis_personnels' as test_name;
-- SELECT * FROM vue_apporteur_kpis_personnels WHERE $1 = 'apporteur-uuid-exemple';

-- Test de la fonction get_apporteur_kpis
SELECT 'Test fonction get_apporteur_kpis' as test_name;
-- SELECT * FROM get_apporteur_kpis('apporteur-uuid-exemple');

-- ============================================================================
-- 4. TEST DES VUES PARTAGÉES
-- ============================================================================

SELECT 'Test vue_stats_produits_globale' as test_name;
SELECT * FROM vue_stats_produits_globale LIMIT 5;

SELECT 'Test vue_sessions_actives_globale' as test_name;
SELECT * FROM vue_sessions_actives_globale;

SELECT 'Test vue_metriques_systeme_globale' as test_name;
SELECT * FROM vue_metriques_systeme_globale;

-- ============================================================================
-- 5. VÉRIFICATION DES VUES CRÉÉES
-- ============================================================================

SELECT 'Vérification des vues créées' as test_name;

SELECT 
  table_name as nom_vue,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = views.table_name) as nombre_colonnes,
  CASE 
    WHEN table_name LIKE '%admin%' THEN 'ADMIN'
    WHEN table_name LIKE '%apporteur%' THEN 'APPORTEUR'
    ELSE 'PARTAGÉE'
  END as type_dashboard
FROM information_schema.views views
WHERE table_schema = 'public'
  AND table_name LIKE 'vue_%'
ORDER BY type_dashboard, table_name;

-- ============================================================================
-- 6. TEST DE LA FONCTION get_apporteur_kpis
-- ============================================================================

SELECT 'Test de la fonction get_apporteur_kpis' as test_name;

-- Vérifier que la fonction existe
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'get_apporteur_kpis'
  AND routine_schema = 'public';

-- ============================================================================
-- 7. RÉSUMÉ DES TESTS
-- ============================================================================

SELECT 'Résumé des tests' as test_name;

-- Compter les vues par type
SELECT 
  CASE 
    WHEN table_name LIKE '%admin%' THEN 'ADMIN'
    WHEN table_name LIKE '%apporteur%' THEN 'APPORTEUR'
    ELSE 'PARTAGÉE'
  END as type_dashboard,
  COUNT(*) as nombre_vues
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name LIKE 'vue_%'
GROUP BY 
  CASE 
    WHEN table_name LIKE '%admin%' THEN 'ADMIN'
    WHEN table_name LIKE '%apporteur%' THEN 'APPORTEUR'
    ELSE 'PARTAGÉE'
  END
ORDER BY type_dashboard;

-- ============================================================================
-- 8. INSTRUCTIONS POUR LES TESTS APPORTEUR
-- ============================================================================

SELECT 'Instructions pour tester les vues apporteur' as info;

-- Pour tester les vues apporteur, vous devez :
-- 1. Remplacer $1 par un vrai UUID d'apporteur
-- 2. Ou utiliser la fonction get_apporteur_kpis avec un UUID réel

-- Exemple :
-- SELECT * FROM vue_apporteur_kpis_personnels WHERE $1 = 'votre-uuid-apporteur';
-- SELECT * FROM get_apporteur_kpis('votre-uuid-apporteur');

-- ============================================================================
-- SCRIPT DE TEST TERMINÉ
-- ============================================================================
-- ✅ Toutes les vues admin testées
-- ✅ Vues partagées testées
-- ✅ Fonction get_apporteur_kpis vérifiée
-- ✅ Structure des tables vérifiée
-- ============================================================================
