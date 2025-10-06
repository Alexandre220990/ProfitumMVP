-- Script de test complet pour toutes les vues apporteur

-- Test des vues existantes
SELECT 'Test vue_apporteur_rendez_vous' as test_name;
SELECT COUNT(*) as nb_rendez_vous FROM vue_apporteur_rendez_vous;

SELECT 'Test vue_apporteur_agenda' as test_name;
SELECT COUNT(*) as nb_evenements_agenda FROM vue_apporteur_agenda;

SELECT 'Test vue_apporteur_notifications' as test_name;
SELECT COUNT(*) as nb_notifications FROM vue_apporteur_notifications;

SELECT 'Test vue_apporteur_produits' as test_name;
SELECT COUNT(*) as nb_produits FROM vue_apporteur_produits;

SELECT 'Test vue_apporteur_performance_produits' as test_name;
SELECT COUNT(*) as nb_produits_performance FROM vue_apporteur_performance_produits;

SELECT 'Test vue_apporteur_sources_prospects' as test_name;
SELECT COUNT(*) as nb_sources FROM vue_apporteur_sources_prospects;

SELECT 'Test vue_apporteur_statistiques_mensuelles' as test_name;
SELECT COUNT(*) as nb_mois FROM vue_apporteur_statistiques_mensuelles;

-- Test des vues à créer
SELECT 'Test vue_apporteur_experts' as test_name;
SELECT COUNT(*) as nb_experts FROM vue_apporteur_experts;

SELECT 'Test vue_apporteur_conversations' as test_name;
SELECT COUNT(*) as nb_conversations FROM vue_apporteur_conversations;

SELECT 'Test vue_apporteur_commissions' as test_name;
SELECT COUNT(*) as nb_commissions FROM vue_apporteur_commissions;

SELECT 'Test vue_apporteur_kpis_globaux' as test_name;
SELECT * FROM vue_apporteur_kpis_globaux;

SELECT 'Test vue_apporteur_activite_recente' as test_name;
SELECT COUNT(*) as nb_activites FROM vue_apporteur_activite_recente;

-- Résumé final
SELECT 'Résumé - Toutes les vues apporteur' as test_name;
SELECT 
    schemaname,
    viewname,
    CASE 
        WHEN viewname LIKE 'vue_apporteur_%' THEN 'Vue Apporteur'
        ELSE 'Autre'
    END as type_vue
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname LIKE 'vue_apporteur_%'
ORDER BY viewname;
