-- ============================================================================
-- SCRIPT DE TEST : VÉRIFICATION DES CHAMPS CALCULÉS EXPERT
-- ============================================================================
-- Ce script teste que les champs calculés fonctionnent correctement
-- ============================================================================

-- 1. VÉRIFICATION DE LA STRUCTURE
-- Vérifier que les nouvelles colonnes existent
SELECT 
    '✅ Colonnes ajoutées avec succès' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Expert' 
AND column_name IN (
    'total_assignments', 
    'completed_assignments', 
    'total_earnings', 
    'monthly_earnings'
)
ORDER BY column_name;

-- 2. VÉRIFICATION DES FONCTIONS
-- Tester la fonction calculate_expert_stats
SELECT 
    '✅ Fonction calculate_expert_stats disponible' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'calculate_expert_stats';

-- Tester la fonction update_all_expert_stats
SELECT 
    '✅ Fonction update_all_expert_stats disponible' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'update_all_expert_stats';

-- 3. VÉRIFICATION DES TRIGGERS
-- Vérifier que les triggers existent
SELECT 
    '✅ Triggers créés avec succès' as status,
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name IN (
    'update_expert_stats_trigger',
    'update_expert_earnings_trigger'
)
ORDER BY trigger_name;

-- 4. VÉRIFICATION DE LA VUE
-- Tester la vue expert_stats_view
SELECT 
    '✅ Vue expert_stats_view disponible' as status,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'expert_stats_view';

-- 5. TEST DES CALCULS
-- Afficher les statistiques actuelles des experts
SELECT 
    '📊 Statistiques des experts' as section,
    name,
    total_assignments,
    completed_assignments,
    total_earnings,
    monthly_earnings,
    CASE 
        WHEN total_assignments > 0 
        THEN ROUND((completed_assignments::DECIMAL / total_assignments) * 100, 2)
        ELSE 0 
    END as success_rate,
    CASE 
        WHEN completed_assignments > 0 
        THEN ROUND((total_earnings / completed_assignments)::DECIMAL, 2)
        ELSE 0 
    END as avg_earnings_per_assignment
FROM "Expert" 
ORDER BY total_earnings DESC
LIMIT 5;

-- 6. TEST DES FONCTIONS UTILITAIRES
-- Tester get_top_experts
SELECT 
    '🏆 Top experts' as section,
    name,
    company_name,
    total_earnings,
    monthly_earnings,
    success_rate
FROM get_top_experts(5);

-- Tester get_expert_global_stats
SELECT 
    '📈 Statistiques globales' as section,
    total_experts,
    active_experts,
    total_assignments,
    total_earnings,
    avg_earnings_per_expert,
    avg_success_rate
FROM get_expert_global_stats();

-- 7. TEST DE PERFORMANCE
-- Vérifier les index créés
SELECT 
    '⚡ Index de performance' as status,
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'Expert' 
AND indexname LIKE 'idx_expert_%'
ORDER BY indexname;

-- 8. SIMULATION D'UNE NOUVELLE ASSIGNATION
-- Créer une assignation de test pour vérifier les triggers
-- (Commenté pour éviter de polluer les données de test)
/*
INSERT INTO "expertassignment" (
    expert_id, 
    client_id, 
    dossier_id, 
    status, 
    created_at, 
    updated_at
) VALUES (
    (SELECT id FROM "Expert" LIMIT 1),
    (SELECT id FROM "Client" LIMIT 1),
    (SELECT id FROM "Dossier" LIMIT 1),
    'pending',
    NOW(),
    NOW()
);
*/

-- 9. VÉRIFICATION DES DONNÉES DE TEST
-- Afficher un résumé des données de test
SELECT 
    '🧪 Résumé des données de test' as section,
    COUNT(*) as total_experts,
    COUNT(*) FILTER (WHERE total_assignments > 0) as experts_with_assignments,
    COUNT(*) FILTER (WHERE total_earnings > 0) as experts_with_earnings,
    SUM(total_assignments) as total_assignments,
    SUM(completed_assignments) as total_completed,
    SUM(total_earnings) as total_earnings,
    AVG(total_earnings) as avg_earnings
FROM "Expert";

-- 10. VÉRIFICATION DE LA COHÉRENCE
-- Vérifier que les calculs sont cohérents
SELECT 
    '🔍 Vérification de cohérence' as section,
    name,
    CASE 
        WHEN total_assignments >= completed_assignments THEN '✅'
        ELSE '❌'
    END as assignments_consistency,
    CASE 
        WHEN total_earnings >= monthly_earnings THEN '✅'
        ELSE '❌'
    END as earnings_consistency,
    CASE 
        WHEN total_assignments = 0 AND completed_assignments = 0 THEN '✅'
        WHEN total_assignments > 0 THEN '✅'
        ELSE '❌'
    END as zero_consistency
FROM "Expert" 
WHERE total_assignments < completed_assignments 
   OR total_earnings < monthly_earnings
   OR (total_assignments = 0 AND completed_assignments > 0)
LIMIT 10;

-- ============================================================================
-- RÉSULTATS ATTENDUS
-- ============================================================================
-- ✅ Toutes les colonnes doivent être présentes
-- ✅ Toutes les fonctions doivent être disponibles
-- ✅ Tous les triggers doivent être actifs
-- ✅ La vue doit être accessible
-- ✅ Les calculs doivent être cohérents
-- ✅ Les index doivent être créés
-- ============================================================================ 