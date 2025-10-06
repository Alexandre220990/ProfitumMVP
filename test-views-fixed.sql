-- Script de test pour vérifier que toutes les vues corrigées fonctionnent

-- Test 1: Vérifier la vue des rendez-vous
SELECT 'Test vue_apporteur_rendez_vous' as test_name;
SELECT COUNT(*) as nb_rendez_vous FROM vue_apporteur_rendez_vous;

-- Test 2: Vérifier la vue des experts
SELECT 'Test vue_apporteur_experts' as test_name;
SELECT COUNT(*) as nb_experts FROM vue_apporteur_experts;

-- Test 3: Vérifier la vue des produits
SELECT 'Test vue_apporteur_produits' as test_name;
SELECT COUNT(*) as nb_produits FROM vue_apporteur_produits;

-- Test 4: Vérifier la vue des conversations
SELECT 'Test vue_apporteur_conversations' as test_name;
SELECT COUNT(*) as nb_conversations FROM vue_apporteur_conversations;

-- Test 5: Vérifier la vue des commissions
SELECT 'Test vue_apporteur_commissions' as test_name;
SELECT COUNT(*) as nb_commissions FROM vue_apporteur_commissions;

-- Test 6: Vérifier la vue des statistiques mensuelles
SELECT 'Test vue_apporteur_statistiques_mensuelles' as test_name;
SELECT COUNT(*) as nb_mois FROM vue_apporteur_statistiques_mensuelles;

-- Test 7: Vérifier la vue des performances par produit
SELECT 'Test vue_apporteur_performance_produits' as test_name;
SELECT COUNT(*) as nb_produits_performance FROM vue_apporteur_performance_produits;

-- Test 8: Vérifier la vue des notifications
SELECT 'Test vue_apporteur_notifications' as test_name;
SELECT COUNT(*) as nb_notifications FROM vue_apporteur_notifications;

-- Test 9: Vérifier la vue de l'agenda
SELECT 'Test vue_apporteur_agenda' as test_name;
SELECT COUNT(*) as nb_evenements_agenda FROM vue_apporteur_agenda;

-- Test 10: Vérifier la vue des sources de prospects
SELECT 'Test vue_apporteur_sources_prospects' as test_name;
SELECT COUNT(*) as nb_sources FROM vue_apporteur_sources_prospects;

-- Test 11: Vérifier la vue des KPIs globaux
SELECT 'Test vue_apporteur_kpis_globaux' as test_name;
SELECT * FROM vue_apporteur_kpis_globaux;

-- Test 12: Vérifier la vue de l'activité récente
SELECT 'Test vue_apporteur_activite_recente' as test_name;
SELECT COUNT(*) as nb_activites FROM vue_apporteur_activite_recente;

-- Test final: Lister toutes les vues créées
SELECT 
    schemaname,
    viewname
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname LIKE 'vue_apporteur_%'
ORDER BY viewname;
