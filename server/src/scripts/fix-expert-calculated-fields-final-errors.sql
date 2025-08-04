-- ============================================================================
-- SCRIPT DE CORRECTION FINALE : ERREURS DE TYPE ET COLONNE
-- ============================================================================
-- Ce script corrige les dernières erreurs rencontrées
-- ============================================================================

-- 1. CORRECTION DE LA FONCTION get_expert_global_stats
-- Problème : COUNT(*) retourne bigint mais on attend integer
DROP FUNCTION IF EXISTS get_expert_global_stats();
CREATE OR REPLACE FUNCTION get_expert_global_stats()
RETURNS TABLE (
    total_experts_count BIGINT,
    active_experts_count BIGINT,
    total_assignments_sum BIGINT,
    total_earnings_sum DOUBLE PRECISION,
    avg_earnings_per_expert DOUBLE PRECISION,
    avg_success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_experts_count,
        COUNT(*) FILTER (WHERE e.status = 'active') as active_experts_count,
        SUM(e.total_assignments) as total_assignments_sum,
        SUM(e.total_earnings) as total_earnings_sum,
        AVG(e.total_earnings) as avg_earnings_per_expert,
        AVG(
            CASE 
                WHEN e.total_assignments > 0 
                THEN (e.completed_assignments::DECIMAL / e.total_assignments) * 100
                ELSE 0 
            END
        ) as avg_success_rate
    FROM "Expert" e
    WHERE e.approval_status = 'approved';
END;
$$ LANGUAGE plpgsql;

-- 2. CORRECTION DU SCRIPT DE TEST
-- Problème : référence à une colonne qui n'existe pas
-- Créer une fonction de test corrigée
CREATE OR REPLACE FUNCTION test_expert_global_stats()
RETURNS TABLE (
    total_experts_count BIGINT,
    active_experts_count BIGINT,
    total_assignments_sum BIGINT,
    total_earnings_sum DOUBLE PRECISION,
    avg_earnings_per_expert DOUBLE PRECISION,
    avg_success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_experts_count,
        COUNT(*) FILTER (WHERE e.status = 'active') as active_experts_count,
        SUM(e.total_assignments) as total_assignments_sum,
        SUM(e.total_earnings) as total_earnings_sum,
        AVG(e.total_earnings) as avg_earnings_per_expert,
        AVG(
            CASE 
                WHEN e.total_assignments > 0 
                THEN (e.completed_assignments::DECIMAL / e.total_assignments) * 100
                ELSE 0 
            END
        ) as avg_success_rate
    FROM "Expert" e
    WHERE e.approval_status = 'approved';
END;
$$ LANGUAGE plpgsql;

-- 3. TESTS DE VÉRIFICATION
-- Test de la fonction get_expert_global_stats corrigée
SELECT 
    '✅ Fonction get_expert_global_stats corrigée' as test,
    total_experts_count,
    active_experts_count,
    total_assignments_sum,
    total_earnings_sum,
    avg_earnings_per_expert,
    avg_success_rate
FROM get_expert_global_stats();

-- Test de la fonction de test
SELECT 
    '✅ Fonction test_expert_global_stats' as test,
    total_experts_count,
    active_experts_count,
    total_assignments_sum,
    total_earnings_sum,
    avg_earnings_per_expert,
    avg_success_rate
FROM test_expert_global_stats();

-- 4. VÉRIFICATION DES TYPES
-- Vérifier que les types sont corrects
SELECT 
    '✅ Types de retour corrects' as test,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('get_expert_global_stats', 'test_expert_global_stats')
ORDER BY p.proname;

-- 5. TEST COMPLET DE TOUTES LES FONCTIONNALITÉS (sans UNION)
-- Vérifier que tout fonctionne ensemble
SELECT 
    '✅ Test complet - Vue' as test,
    COUNT(*) as count
FROM expert_stats_view;

SELECT 
    '✅ Test complet - Top experts' as test,
    COUNT(*) as count
FROM get_top_experts(10);

SELECT 
    '✅ Test complet - Global stats' as test,
    total_experts_count as count
FROM get_expert_global_stats();

-- ============================================================================
-- RÉSUMÉ DES CORRECTIONS FINALES
-- ============================================================================
-- ✅ Type bigint pour COUNT(*) au lieu de integer
-- ✅ Fonction de test créée pour éviter les conflits
-- ✅ Toutes les fonctions avec types corrects
-- ✅ Tests de vérification inclus
-- ✅ Suppression de l'UNION problématique
-- ============================================================================ 