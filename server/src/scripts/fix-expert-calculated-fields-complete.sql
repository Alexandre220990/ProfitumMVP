-- ============================================================================
-- SCRIPT DE CORRECTION COMPLÈTE : RÉSOLUTION DÉFINITIVE DE TOUS LES CONFLITS
-- ============================================================================
-- Ce script corrige définitivement toutes les erreurs rencontrées
-- Date : $(date)
-- ============================================================================

-- 1. SUPPRESSION DE TOUTES LES FONCTIONS ET VUES EXISTANTES
DROP VIEW IF EXISTS expert_stats_view CASCADE;
DROP FUNCTION IF EXISTS calculate_expert_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_all_expert_stats() CASCADE;
DROP FUNCTION IF EXISTS get_top_experts(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_expert_global_stats() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_expert_stats() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_expert_earnings() CASCADE;

-- 2. CORRECTION DE LA FONCTION calculate_expert_stats
-- Problème : conflit entre paramètre expert_id et colonne expert_id
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

-- 3. FONCTION POUR METTRE À JOUR TOUS LES EXPERTS
CREATE OR REPLACE FUNCTION update_all_expert_stats()
RETURNS VOID AS $$
DECLARE
    expert_record RECORD;
BEGIN
    FOR expert_record IN SELECT id FROM "Expert" LOOP
        PERFORM calculate_expert_stats(expert_record.id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. CORRECTION DE LA FONCTION get_expert_global_stats
-- Problème : conflit entre alias et colonnes - utilisation d'alias complètement différents
CREATE OR REPLACE FUNCTION get_expert_global_stats()
RETURNS TABLE (
    total_experts_count INTEGER,
    active_experts_count INTEGER,
    total_assignments_sum INTEGER,
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

-- 5. CORRECTION DE LA VUE expert_stats_view
-- Problème : fonction ROUND avec double precision
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

-- 6. CORRECTION DE LA FONCTION get_top_experts
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

-- 7. CORRECTION DES FONCTIONS DE TRIGGER
CREATE OR REPLACE FUNCTION trigger_update_expert_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les stats de l'expert concerné
    IF TG_OP = 'INSERT' THEN
        PERFORM calculate_expert_stats(NEW.expert_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM calculate_expert_stats(NEW.expert_id);
        IF OLD.expert_id != NEW.expert_id THEN
            PERFORM calculate_expert_stats(OLD.expert_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM calculate_expert_stats(OLD.expert_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_expert_earnings()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les gains de l'expert concerné
    IF TG_OP = 'INSERT' THEN
        PERFORM calculate_expert_stats(NEW."expertId");
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM calculate_expert_stats(NEW."expertId");
        IF OLD."expertId" != NEW."expertId" THEN
            PERFORM calculate_expert_stats(OLD."expertId");
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM calculate_expert_stats(OLD."expertId");
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 8. RECRÉATION DES TRIGGERS
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

-- 9. MISE À JOUR INITIALE DES STATISTIQUES
SELECT update_all_expert_stats();

-- 10. VÉRIFICATION FINALE
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
    total_experts_count,
    active_experts_count,
    total_assignments_sum,
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
-- RÉSUMÉ DES CORRECTIONS COMPLÈTES
-- ============================================================================
-- ✅ Suppression complète de toutes les fonctions/vues existantes
-- ✅ Recréation avec syntaxe corrigée
-- ✅ Conflit expert_id : paramètre renommé expert_uuid
-- ✅ Conflit total_assignments : alias complètement différents
-- ✅ Fonction ROUND : cast en DECIMAL avant utilisation
-- ✅ Toutes les fonctions recréées avec syntaxe corrigée
-- ✅ Triggers recréés
-- ✅ Mise à jour initiale des statistiques
-- ✅ Tests de vérification inclus
-- ============================================================================ 