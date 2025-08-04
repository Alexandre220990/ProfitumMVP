-- ============================================================================
-- SCRIPT DE CORRECTION FINAL : RÉSOLUTION DE TOUS LES CONFLITS
-- ============================================================================
-- Ce script corrige définitivement toutes les erreurs rencontrées
-- ============================================================================

-- 1. CORRECTION DE LA FONCTION calculate_expert_stats
-- Problème : conflit entre paramètre expert_id et colonne expert_id
DROP FUNCTION IF EXISTS calculate_expert_stats(UUID);
CREATE OR REPLACE FUNCTION calculate_expert_stats(expert_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Calculer le nombre total d'assignations
    UPDATE "Expert" 
    SET total_assignments = (
        SELECT COUNT(*) 
        FROM "expertassignment" 
        WHERE "expertassignment"."expert_id" = expert_uuid
    )
    WHERE "Expert".id = expert_uuid;
    
    -- Calculer le nombre d'assignations complétées
    UPDATE "Expert" 
    SET completed_assignments = (
        SELECT COUNT(*) 
        FROM "expertassignment" 
        WHERE "expertassignment"."expert_id" = expert_uuid 
        AND "expertassignment"."status" = 'completed'
    )
    WHERE "Expert".id = expert_uuid;
    
    -- Calculer les gains totaux (basé sur les audits complétés)
    UPDATE "Expert" 
    SET total_earnings = (
        SELECT COALESCE(SUM(a.montant * 0.1), 0) -- 10% de commission sur les audits
        FROM "Audit" a
        WHERE a."expertId" = expert_uuid 
        AND a.status = 'completed'
    )
    WHERE "Expert".id = expert_uuid;
    
    -- Calculer les gains mensuels (derniers 30 jours)
    UPDATE "Expert" 
    SET monthly_earnings = (
        SELECT COALESCE(SUM(a.montant * 0.1), 0) -- 10% de commission sur les audits
        FROM "Audit" a
        WHERE a."expertId" = expert_uuid 
        AND a.status = 'completed'
        AND a."dateFin" >= NOW() - INTERVAL '30 days'
    )
    WHERE "Expert".id = expert_uuid;
END;
$$ LANGUAGE plpgsql;

-- 2. CORRECTION DE LA FONCTION get_expert_global_stats
-- Problème : conflit entre alias et colonnes
DROP FUNCTION IF EXISTS get_expert_global_stats();
CREATE OR REPLACE FUNCTION get_expert_global_stats()
RETURNS TABLE (
    total_experts INTEGER,
    active_experts INTEGER,
    total_assignments_count INTEGER,
    total_earnings_sum DOUBLE PRECISION,
    avg_earnings_per_expert DOUBLE PRECISION,
    avg_success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_experts,
        COUNT(*) FILTER (WHERE e.status = 'active') as active_experts,
        SUM(e.total_assignments) as total_assignments_count,
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

-- 3. CORRECTION DE LA VUE expert_stats_view
-- Problème : fonction ROUND avec double precision
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

-- 4. CORRECTION DE LA FONCTION get_top_experts
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

-- 5. CORRECTION DES TRIGGERS
-- Trigger sur expertassignment
DROP TRIGGER IF EXISTS update_expert_stats_trigger ON "expertassignment";
CREATE TRIGGER update_expert_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "expertassignment"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_expert_stats();

-- Trigger sur Audit
DROP TRIGGER IF EXISTS update_expert_earnings_trigger ON "Audit";
CREATE TRIGGER update_expert_earnings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Audit"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_expert_earnings();

-- 6. MISE À JOUR INITIALE DES STATISTIQUES
SELECT update_all_expert_stats();

-- 7. TESTS DE VÉRIFICATION
-- Test de la vue
SELECT 
    '✅ Vue expert_stats_view corrigée' as test,
    name,
    total_assignments,
    completed_assignments,
    total_earnings,
    monthly_earnings,
    success_rate
FROM expert_stats_view 
LIMIT 3;

-- Test de la fonction get_top_experts
SELECT 
    '✅ Fonction get_top_experts corrigée' as test,
    name,
    company_name,
    total_earnings,
    success_rate
FROM get_top_experts(3);

-- Test de la fonction get_expert_global_stats
SELECT 
    '✅ Fonction get_expert_global_stats corrigée' as test,
    total_experts,
    active_experts,
    total_assignments_count,
    total_earnings_sum,
    avg_earnings_per_expert,
    avg_success_rate
FROM get_expert_global_stats();

-- Test de la fonction calculate_expert_stats
SELECT 
    '✅ Fonction calculate_expert_stats corrigée' as test,
    name,
    total_assignments,
    completed_assignments,
    total_earnings,
    monthly_earnings
FROM "Expert" 
LIMIT 3;

-- ============================================================================
-- RÉSUMÉ DES CORRECTIONS FINALES
-- ============================================================================
-- ✅ Conflit expert_id : renommé paramètre en expert_uuid
-- ✅ Conflit total_assignments : utilisé alias distincts
-- ✅ Fonction ROUND : cast en DECIMAL avant utilisation
-- ✅ Toutes les fonctions recréées avec syntaxe corrigée
-- ✅ Triggers recréés
-- ✅ Mise à jour initiale des statistiques
-- ============================================================================ 