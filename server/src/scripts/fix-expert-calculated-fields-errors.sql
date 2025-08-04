-- ============================================================================
-- SCRIPT DE CORRECTION : ERREURS DANS LES CHAMPS CALCULÉS EXPERT
-- ============================================================================
-- Ce script corrige les erreurs rencontrées lors de l'exécution
-- ============================================================================

-- 1. CORRECTION DE LA FONCTION ROUND POUR DOUBLE PRECISION
-- Le problème : ROUND(double precision, integer) n'existe pas
-- Solution : Cast en DECIMAL avant d'utiliser ROUND

-- Corriger la vue expert_stats_view
DROP VIEW IF EXISTS expert_stats_view;
CREATE OR REPLACE VIEW expert_stats_view AS
SELECT 
    e.id,
    e.name,
    e.email,
    e.company_name,
    e.total_assignments,
    e.completed_assignments,
    e.total_earnings,
    e.monthly_earnings,
    e.rating,
    e.status,
    e.approval_status,
    -- Calculer le taux de réussite
    CASE 
        WHEN e.total_assignments > 0 
        THEN ROUND((e.completed_assignments::DECIMAL / e.total_assignments) * 100, 2)
        ELSE 0 
    END as success_rate,
    -- Calculer le gain moyen par assignation
    CASE 
        WHEN e.completed_assignments > 0 
        THEN ROUND((e.total_earnings / e.completed_assignments)::DECIMAL, 2)
        ELSE 0 
    END as avg_earnings_per_assignment,
    e.created_at,
    e.updated_at
FROM "Expert" e
ORDER BY e.total_earnings DESC;

-- 2. CORRECTION DES INDEX
-- Supprimer l'index problématique et le recréer
DROP INDEX IF EXISTS idx_expert_success_rate;
CREATE INDEX IF NOT EXISTS idx_expert_success_rate ON "Expert"(total_assignments, completed_assignments);

-- 3. CORRECTION DE LA FONCTION get_top_experts
DROP FUNCTION IF EXISTS get_top_experts(INTEGER);
CREATE OR REPLACE FUNCTION get_top_experts(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name TEXT,
    company_name TEXT,
    total_earnings DOUBLE PRECISION,
    monthly_earnings DOUBLE PRECISION,
    success_rate DECIMAL,
    total_assignments INTEGER,
    completed_assignments INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.company_name,
        e.total_earnings,
        e.monthly_earnings,
        CASE 
            WHEN e.total_assignments > 0 
            THEN ROUND((e.completed_assignments::DECIMAL / e.total_assignments) * 100, 2)
            ELSE 0 
        END as success_rate,
        e.total_assignments,
        e.completed_assignments
    FROM "Expert" e
    WHERE e.approval_status = 'approved'
    AND e.status = 'active'
    ORDER BY e.total_earnings DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 4. CORRECTION DE LA FONCTION get_expert_global_stats
DROP FUNCTION IF EXISTS get_expert_global_stats();
CREATE OR REPLACE FUNCTION get_expert_global_stats()
RETURNS TABLE (
    total_experts INTEGER,
    active_experts INTEGER,
    total_assignments INTEGER,
    total_earnings DOUBLE PRECISION,
    avg_earnings_per_expert DOUBLE PRECISION,
    avg_success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_experts,
        COUNT(*) FILTER (WHERE status = 'active') as active_experts,
        SUM(total_assignments) as total_assignments,
        SUM(total_earnings) as total_earnings,
        AVG(total_earnings) as avg_earnings_per_expert,
        AVG(
            CASE 
                WHEN total_assignments > 0 
                THEN (completed_assignments::DECIMAL / total_assignments) * 100
                ELSE 0 
            END
        ) as avg_success_rate
    FROM "Expert"
    WHERE approval_status = 'approved';
END;
$$ LANGUAGE plpgsql;

-- 5. VÉRIFICATION DES CORRECTIONS
-- Tester la vue corrigée
SELECT 
    '✅ Vue expert_stats_view corrigée' as status,
    name,
    total_assignments,
    completed_assignments,
    total_earnings,
    monthly_earnings,
    success_rate,
    avg_earnings_per_assignment
FROM expert_stats_view 
LIMIT 3;

-- Tester la fonction get_top_experts corrigée
SELECT 
    '✅ Fonction get_top_experts corrigée' as status,
    name,
    company_name,
    total_earnings,
    success_rate
FROM get_top_experts(3);

-- Tester la fonction get_expert_global_stats corrigée
SELECT 
    '✅ Fonction get_expert_global_stats corrigée' as status,
    total_experts,
    active_experts,
    total_assignments,
    total_earnings,
    avg_earnings_per_expert,
    avg_success_rate
FROM get_expert_global_stats();

-- 6. VÉRIFICATION DES INDEX
SELECT 
    '✅ Index corrigés' as status,
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename = 'Expert' 
AND indexname LIKE 'idx_expert_%'
ORDER BY indexname;

-- ============================================================================
-- RÉSUMÉ DES CORRECTIONS
-- ============================================================================
-- ✅ ROUND() : Cast en DECIMAL avant utilisation
-- ✅ Index : Suppression de l'index avec CASE complexe
-- ✅ Fonctions : Recréation avec syntaxe corrigée
-- ✅ Vue : Recréation avec calculs corrigés
-- ============================================================================ 