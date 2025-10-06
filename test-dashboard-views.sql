-- ============================================================================
-- SCRIPT DE TEST DES VUES DASHBOARD CORRIGÉES
-- ============================================================================
-- Ce script teste que toutes les vues fonctionnent avec la vraie structure BDD
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION DE LA STRUCTURE DES TABLES
-- ============================================================================

-- Vérifier que la table Client existe et a les bonnes colonnes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'Client' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les valeurs possibles pour le statut des clients
SELECT DISTINCT statut, COUNT(*) as nombre
FROM "Client" 
GROUP BY statut
ORDER BY nombre DESC;

-- ============================================================================
-- 2. TEST DE LA VUE KPIs PRINCIPAUX
-- ============================================================================

SELECT 'Test vue_dashboard_kpis_v2' as test_name;

-- Tester la vue KPIs
SELECT * FROM vue_dashboard_kpis_v2;

-- ============================================================================
-- 3. TEST DE LA VUE ACTIVITÉ RÉCENTE
-- ============================================================================

SELECT 'Test vue_activite_recente_v2' as test_name;

-- Tester la vue activité (limité à 5 résultats)
SELECT * FROM vue_activite_recente_v2 LIMIT 5;

-- ============================================================================
-- 4. TEST DE LA VUE STATISTIQUES PRODUITS
-- ============================================================================

SELECT 'Test vue_stats_produits_v2' as test_name;

-- Tester la vue stats produits
SELECT * FROM vue_stats_produits_v2;

-- ============================================================================
-- 5. TEST DE LA VUE SESSIONS ACTIVES
-- ============================================================================

SELECT 'Test vue_sessions_actives' as test_name;

-- Vérifier si la table user_sessions existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'user_sessions' 
    AND table_schema = 'public'
) as table_user_sessions_exists;

-- Si la table existe, tester la vue
SELECT * FROM vue_sessions_actives;

-- ============================================================================
-- 6. TEST DE LA VUE MÉTRIQUES SYSTÈME
-- ============================================================================

SELECT 'Test vue_metriques_systeme_recentes' as test_name;

-- Vérifier si la table system_metrics existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'system_metrics' 
    AND table_schema = 'public'
) as table_system_metrics_exists;

-- Si la table existe, tester la vue
SELECT * FROM vue_metriques_systeme_recentes;

-- ============================================================================
-- 7. TEST DE LA VUE ALERTES
-- ============================================================================

SELECT 'Test vue_alertes_dashboard_v2' as test_name;

-- Tester la vue alertes
SELECT * FROM vue_alertes_dashboard_v2;

-- ============================================================================
-- 8. TEST DE LA VUE ÉVOLUTION TEMPORELLE
-- ============================================================================

SELECT 'Test vue_evolution_30j_v2' as test_name;

-- Tester la vue évolution (limité à 10 jours)
SELECT * FROM vue_evolution_30j_v2 
ORDER BY jour DESC 
LIMIT 10;

-- ============================================================================
-- 9. VÉRIFICATION DES VUES CRÉÉES
-- ============================================================================

SELECT 'Vérification des vues créées' as test_name;

-- Lister toutes les vues créées
SELECT 
  table_name as nom_vue,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = views.table_name 
     AND table_schema = 'public') as nombre_colonnes
FROM information_schema.views views
WHERE table_schema = 'public'
  AND table_name LIKE 'vue_%'
ORDER BY table_name;

-- ============================================================================
-- 10. RÉSUMÉ DES TESTS
-- ============================================================================

SELECT 'Résumé des tests' as test_name;

-- Compter les vues créées
SELECT COUNT(*) as nombre_vues_creees
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name LIKE 'vue_%';

-- Vérifier les tables utilisées
SELECT 
  'Tables utilisées dans les vues' as info,
  'Client' as table_principale,
  'Expert' as table_experts,
  'ClientProduitEligible' as table_dossiers,
  'ApporteurAffaires' as table_apporteurs,
  'ProduitEligible' as table_produits;

-- ============================================================================
-- SCRIPT DE TEST TERMINÉ
-- ============================================================================
-- ✅ Tous les tests doivent passer sans erreur
-- ✅ Les vues doivent retourner des données cohérentes
-- ✅ Aucune référence à la table Prospect
-- ✅ Utilisation correcte de la table Client avec statut = 'prospect'
-- ============================================================================
