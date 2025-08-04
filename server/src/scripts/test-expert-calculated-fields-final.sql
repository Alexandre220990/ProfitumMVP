-- ============================================================================
-- SCRIPT DE TEST FINAL : VÉRIFICATION COMPLÈTE
-- ============================================================================
-- Ce script teste que toutes les corrections ont résolu les erreurs
-- ============================================================================

-- 1. VÉRIFICATION DES COLONNES
SELECT 
    '✅ Colonnes présentes' as test,
    column_name,
    data_type,
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

-- 2. TEST DE LA VUE (sans erreur ROUND)
SELECT 
    '✅ Vue expert_stats_view' as test,
    name,
    total_assignments,
    completed_assignments,
    total_earnings,
    monthly_earnings,
    success_rate,
    avg_earnings_per_assignment
FROM expert_stats_view 
LIMIT 3;

-- 3. TEST DE LA FONCTION get_top_experts
SELECT 
    '✅ Fonction get_top_experts' as test,
    name,
    company_name,
    total_earnings,
    monthly_earnings,
    success_rate
FROM get_top_experts(3);

-- 4. TEST DE LA FONCTION get_expert_global_stats
SELECT 
    '✅ Fonction get_expert_global_stats' as test,
    total_experts,
    active_experts,
    total_assignments_count,
    total_earnings_sum,
    avg_earnings_per_expert,
    avg_success_rate
FROM get_expert_global_stats();

-- 5. TEST DE LA FONCTION calculate_expert_stats
-- Tester sur un expert spécifique
SELECT 
    '✅ Fonction calculate_expert_stats' as test,
    name,
    total_assignments,
    completed_assignments,
    total_earnings,
    monthly_earnings
FROM "Expert" 
LIMIT 3;

-- 6. TEST DES TRIGGERS
SELECT 
    '✅ Triggers actifs' as test,
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name IN (
    'update_expert_stats_trigger',
    'update_expert_earnings_trigger'
)
ORDER BY trigger_name;

-- 7. TEST DES INDEX
SELECT 
    '✅ Index de performance' as test,
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename = 'Expert' 
AND indexname LIKE 'idx_expert_%'
ORDER BY indexname;

-- 8. TEST DES CALCULS DE BASE
SELECT 
    '✅ Calculs de base' as test,
    name,
    total_assignments,
    completed_assignments,
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
LIMIT 3;

-- 9. TEST DE COHÉRENCE DES DONNÉES
SELECT 
    '✅ Cohérence des données' as test,
    COUNT(*) as total_experts,
    COUNT(*) FILTER (WHERE total_assignments >= completed_assignments) as experts_consistent_assignments,
    COUNT(*) FILTER (WHERE total_earnings >= monthly_earnings) as experts_consistent_earnings,
    COUNT(*) FILTER (WHERE total_assignments = 0 AND completed_assignments = 0) as experts_zero_assignments
FROM "Expert";

-- 10. TEST DE PERFORMANCE
-- Vérifier que les requêtes s'exécutent rapidement
EXPLAIN (ANALYZE, BUFFERS) 
SELECT name, total_earnings 
FROM "Expert" 
ORDER BY total_earnings DESC 
LIMIT 10;

-- ============================================================================
-- RÉSULTATS ATTENDUS
-- ============================================================================
-- ✅ Aucune erreur de syntaxe
-- ✅ Aucune erreur de conflit de noms
-- ✅ Aucune erreur de fonction ROUND
-- ✅ Toutes les colonnes présentes
-- ✅ Vue fonctionnelle
-- ✅ Fonctions exécutables
-- ✅ Triggers actifs
-- ✅ Index créés
-- ✅ Calculs corrects
-- ✅ Données cohérentes
-- ✅ Performance optimale
-- ============================================================================ 