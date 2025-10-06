-- Script de test pour vérifier que les vues corrigées fonctionnent

-- Test 1: Vue des experts
SELECT 'Test vue_apporteur_experts' as test_name;
SELECT COUNT(*) as nb_experts FROM vue_apporteur_experts;

-- Test 2: Vue des conversations
SELECT 'Test vue_apporteur_conversations' as test_name;
SELECT COUNT(*) as nb_conversations FROM vue_apporteur_conversations;

-- Test 3: Vue des commissions (CORRIGÉE)
SELECT 'Test vue_apporteur_commissions' as test_name;
SELECT COUNT(*) as nb_commissions FROM vue_apporteur_commissions;

-- Test 4: Vue des KPIs globaux
SELECT 'Test vue_apporteur_kpis_globaux' as test_name;
SELECT * FROM vue_apporteur_kpis_globaux;

-- Test 5: Vue de l'activité récente (CORRIGÉE)
SELECT 'Test vue_apporteur_activite_recente' as test_name;
SELECT COUNT(*) as nb_activites FROM vue_apporteur_activite_recente;

-- Test final: Vérifier que toutes les vues existent
SELECT 'Résumé - Toutes les vues apporteur' as test_name;
SELECT 
    schemaname,
    viewname,
    'Vue Apporteur' as type_vue
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname LIKE 'vue_apporteur_%'
ORDER BY viewname;

-- Vérification du nombre total
SELECT 'Nombre total de vues apporteur' as test_name;
SELECT COUNT(*) as total_vues_apporteur
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname LIKE 'vue_apporteur_%';
