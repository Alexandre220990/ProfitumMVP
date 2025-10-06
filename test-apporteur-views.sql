-- Script de test pour vérifier les vues apporteur
-- À exécuter après avoir créé les vues

-- Test 1: Vérifier que les vues existent
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname LIKE 'vue_apporteur_%'
ORDER BY viewname;

-- Test 2: Tester la vue rendez-vous (si des données existent)
SELECT COUNT(*) as nb_rendez_vous FROM vue_apporteur_rendez_vous;

-- Test 3: Tester la vue experts
SELECT COUNT(*) as nb_experts FROM vue_apporteur_experts;

-- Test 4: Tester la vue produits
SELECT COUNT(*) as nb_produits FROM vue_apporteur_produits;

-- Test 5: Tester la vue conversations
SELECT COUNT(*) as nb_conversations FROM vue_apporteur_conversations;

-- Test 6: Tester la vue commissions
SELECT COUNT(*) as nb_commissions FROM vue_apporteur_commissions;

-- Test 7: Tester la vue statistiques mensuelles
SELECT COUNT(*) as nb_mois FROM vue_apporteur_statistiques_mensuelles;

-- Test 8: Tester la vue performance produits
SELECT COUNT(*) as nb_produits_performance FROM vue_apporteur_performance_produits;

-- Test 9: Tester la vue notifications
SELECT COUNT(*) as nb_notifications FROM vue_apporteur_notifications;

-- Test 10: Tester la vue agenda
SELECT COUNT(*) as nb_evenements_agenda FROM vue_apporteur_agenda;

-- Test 11: Tester la vue sources prospects
SELECT COUNT(*) as nb_sources FROM vue_apporteur_sources_prospects;

-- Test 12: Vérifier la structure d'une vue (exemple: rendez-vous)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'vue_apporteur_rendez_vous'
ORDER BY ordinal_position;

-- Test 13: Vérifier les permissions RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN (
    'CalendarEvent', 'Expert', 'ProduitEligible', 'conversations', 
    'messages', 'ApporteurCommission', 'Dossier', 'Client', 'notification'
);

-- Test 14: Vérifier que l'utilisateur actuel peut accéder aux vues
SELECT current_user, current_database();

-- Test 15: Test de performance - temps d'exécution des vues
EXPLAIN ANALYZE SELECT * FROM vue_apporteur_rendez_vous LIMIT 10;
EXPLAIN ANALYZE SELECT * FROM vue_apporteur_experts LIMIT 10;
EXPLAIN ANALYZE SELECT * FROM vue_apporteur_produits LIMIT 10;
