-- ============================================================================
-- SCRIPT : AJOUT DES CHAMPS CALCULÉS À LA TABLE EXPERT
-- ============================================================================
-- Objectif : Ajouter les champs calculés manquants pour les statistiques des experts
-- Champs ajoutés : total_assignments, completed_assignments, total_earnings, monthly_earnings
-- Date : $(date)
-- ============================================================================

-- 1. AJOUT DES COLONNES CALCULÉES
ALTER TABLE "Expert" 
ADD COLUMN IF NOT EXISTS total_assignments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_assignments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS monthly_earnings DOUBLE PRECISION DEFAULT 0.0;

-- 2. FONCTION POUR CALCULER LES STATISTIQUES D'UN EXPERT
CREATE OR REPLACE FUNCTION calculate_expert_stats(expert_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Calculer le nombre total d'assignations
    UPDATE "Expert" 
    SET total_assignments = (
        SELECT COUNT(*) 
        FROM "expertassignment" 
        WHERE "expertassignment"."expert_id" = expert_id
    )
    WHERE "Expert".id = expert_id;
    
    -- Calculer le nombre d'assignations complétées
    UPDATE "Expert" 
    SET completed_assignments = (
        SELECT COUNT(*) 
        FROM "expertassignment" 
        WHERE "expertassignment"."expert_id" = expert_id 
        AND "expertassignment"."status" = 'completed'
    )
    WHERE "Expert".id = expert_id;
    
    -- Calculer les gains totaux (basé sur les audits complétés)
    UPDATE "Expert" 
    SET total_earnings = (
        SELECT COALESCE(SUM(a.montant * 0.1), 0) -- 10% de commission sur les audits
        FROM "Audit" a
        WHERE a."expertId" = expert_id 
        AND a.status = 'completed'
    )
    WHERE "Expert".id = expert_id;
    
    -- Calculer les gains mensuels (derniers 30 jours)
    UPDATE "Expert" 
    SET monthly_earnings = (
        SELECT COALESCE(SUM(a.montant * 0.1), 0) -- 10% de commission sur les audits
        FROM "Audit" a
        WHERE a."expertId" = expert_id 
        AND a.status = 'completed'
        AND a."dateFin" >= NOW() - INTERVAL '30 days'
    )
    WHERE "Expert".id = expert_id;
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

-- 4. TRIGGER POUR METTRE À JOUR AUTOMATIQUEMENT LES STATS
-- Trigger sur expertassignment
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

-- Créer le trigger sur expertassignment
DROP TRIGGER IF EXISTS update_expert_stats_trigger ON "expertassignment";
CREATE TRIGGER update_expert_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "expertassignment"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_expert_stats();

-- Trigger sur Audit
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

-- Créer le trigger sur Audit
DROP TRIGGER IF EXISTS update_expert_earnings_trigger ON "Audit";
CREATE TRIGGER update_expert_earnings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Audit"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_expert_earnings();

-- 5. VUE POUR FACILITER L'ACCÈS AUX STATISTIQUES
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

-- 6. MISE À JOUR INITIALE DES STATISTIQUES
-- Exécuter cette fonction pour calculer les stats de tous les experts existants
SELECT update_all_expert_stats();

-- 7. INDEX POUR OPTIMISER LES PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_expert_total_earnings ON "Expert"(total_earnings DESC);
CREATE INDEX IF NOT EXISTS idx_expert_monthly_earnings ON "Expert"(monthly_earnings DESC);
-- Index pour le taux de réussite (calculé)
CREATE INDEX IF NOT EXISTS idx_expert_success_rate ON "Expert"(total_assignments, completed_assignments);

-- 8. FONCTION POUR OBTENIR LES TOP EXPERTS
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

-- 9. FONCTION POUR OBTENIR LES STATISTIQUES GLOBALES
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

-- 10. VÉRIFICATION ET TESTS
-- Vérifier que les colonnes ont été ajoutées
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'Expert' 
AND column_name IN ('total_assignments', 'completed_assignments', 'total_earnings', 'monthly_earnings')
ORDER BY column_name;

-- Afficher un exemple de statistiques
SELECT 
    name,
    total_assignments,
    completed_assignments,
    total_earnings,
    monthly_earnings,
    CASE 
        WHEN total_assignments > 0 
        THEN ROUND((completed_assignments::DECIMAL / total_assignments) * 100, 2)
        ELSE 0 
    END as success_rate
FROM "Expert" 
LIMIT 5;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Les champs calculés sont maintenant disponibles et mis à jour automatiquement
-- Utilisez la vue expert_stats_view pour un accès facile aux statistiques
-- ============================================================================ 