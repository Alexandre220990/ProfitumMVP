-- ============================================================================
-- SCRIPT DE TEST SIMPLIFIÉ : VÉRIFICATION DES CORRECTIONS
-- ============================================================================
-- Ce script teste que les corrections ont résolu les erreurs
-- ============================================================================

-- 1. VÉRIFICATION DES COLONNES
SELECT 
    '✅ Colonnes présentes' as test,
    column_name,
    data_type
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
    '✅ Vue fonctionnelle' as test,
    name,
    total_assignments,
    completed_assignments,
    total_earnings,
    monthly_earnings,
    success_rate
FROM expert_stats_view 
LIMIT 3;

-- 3. TEST DES FONCTIONS (sans erreur de syntaxe)
SELECT 
    '✅ Fonction get_top_experts' as test,
    name,
    total_earnings,
    success_rate
FROM get_top_experts(3);

SELECT 
    '✅ Fonction get_expert_global_stats' as test,
    total_experts,
    active_experts,
    total_earnings,
    avg_success_rate
FROM get_expert_global_stats();

-- 4. TEST DES INDEX
SELECT 
    '✅ Index créés' as test,
    indexname
FROM pg_indexes 
WHERE tablename = 'Expert' 
AND indexname LIKE 'idx_expert_%'
ORDER BY indexname;

-- 5. TEST DES TRIGGERS
SELECT 
    '✅ Triggers actifs' as test,
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name IN (
    'update_expert_stats_trigger',
    'update_expert_earnings_trigger'
)
ORDER BY trigger_name;

-- 6. TEST DES CALCULS DE BASE
SELECT 
    '✅ Calculs de base' as test,
    name,
    total_assignments,
    completed_assignments,
    CASE 
        WHEN total_assignments > 0 
        THEN ROUND((completed_assignments::DECIMAL / total_assignments) * 100, 2)
        ELSE 0 
    END as success_rate
FROM "Expert" 
LIMIT 3;

-- ============================================================================
-- RÉSULTATS ATTENDUS
-- ============================================================================
-- ✅ Aucune erreur de syntaxe
-- ✅ Toutes les colonnes présentes
-- ✅ Vue fonctionnelle
-- ✅ Fonctions exécutables
-- ✅ Index créés
-- ✅ Triggers actifs
-- ✅ Calculs corrects
-- ============================================================================ 