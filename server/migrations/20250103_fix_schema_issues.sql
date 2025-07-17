-- Migration pour corriger les problèmes de schéma identifiés
-- Date: 2025-01-03

-- 1. Ajouter la colonne 'statut' à expertassignment
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expertassignment' 
        AND column_name = 'statut'
    ) THEN
        ALTER TABLE public.expertassignment 
        ADD COLUMN statut VARCHAR(50) DEFAULT 'pending' CHECK (statut IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled'));
        
        COMMENT ON COLUMN public.expertassignment.statut IS 'Statut de l''assignation expert';
    END IF;
END $$;

-- 2. Ajouter la colonne 'client_produit_eligible_id' à expertassignment si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expertassignment' 
        AND column_name = 'client_produit_eligible_id'
    ) THEN
        ALTER TABLE public.expertassignment 
        ADD COLUMN client_produit_eligible_id UUID;
        
        COMMENT ON COLUMN public.expertassignment.client_produit_eligible_id IS 'Référence vers la relation client-produit éligible';
    END IF;
END $$;

-- 3. Ajouter la colonne 'category' à ProduitEligible
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public."ProduitEligible" 
        ADD COLUMN category VARCHAR(100) DEFAULT 'general';
        
        COMMENT ON COLUMN public."ProduitEligible".category IS 'Catégorie du produit éligible';
    END IF;
END $$;

-- 4. Ajouter la colonne 'active' à ProduitEligible
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'active'
    ) THEN
        ALTER TABLE public."ProduitEligible" 
        ADD COLUMN active BOOLEAN DEFAULT true;
        
        COMMENT ON COLUMN public."ProduitEligible".active IS 'Indique si le produit est actif';
    END IF;
END $$;

-- 5. Ajouter la colonne 'timestamp' à message
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'message' 
        AND column_name = 'timestamp'
    ) THEN
        ALTER TABLE public.message 
        ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        COMMENT ON COLUMN public.message.timestamp IS 'Horodatage du message';
    END IF;
END $$;

-- 6. Créer la relation expertassignment -> ClientProduitEligible
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expertassignment_client_produit_eligible_fkey'
    ) THEN
        ALTER TABLE public.expertassignment 
        ADD CONSTRAINT expertassignment_client_produit_eligible_fkey 
        FOREIGN KEY (client_produit_eligible_id) 
        REFERENCES public."ClientProduitEligible"(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. Activer RLS sur les tables critiques
ALTER TABLE public.expertassignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

-- 8. Créer les politiques RLS de base
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expertassignment' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON public.expertassignment
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'message' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON public.message
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notification' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON public.notification
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 9. Créer des index supplémentaires pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_expertassignment_statut ON public.expertassignment(statut);
CREATE INDEX IF NOT EXISTS idx_expertassignment_client_produit_eligible_id ON public.expertassignment(client_produit_eligible_id);
CREATE INDEX IF NOT EXISTS idx_produiteligible_category ON public."ProduitEligible"(category);
CREATE INDEX IF NOT EXISTS idx_produiteligible_active ON public."ProduitEligible"(active);
CREATE INDEX IF NOT EXISTS idx_message_timestamp ON public.message(timestamp);

-- 10. Mettre à jour les données existantes
-- Mettre à jour les produits éligibles existants
UPDATE public."ProduitEligible" 
SET 
    category = CASE 
        WHEN LOWER(nom) LIKE '%ticpe%' THEN 'ticpe'
        WHEN LOWER(nom) LIKE '%cee%' THEN 'cee'
        WHEN LOWER(nom) LIKE '%audit%' THEN 'audit'
        ELSE 'general'
    END,
    active = true
WHERE category IS NULL OR active IS NULL;

-- Mettre à jour les assignations existantes
UPDATE public.expertassignment 
SET statut = 'pending' 
WHERE statut IS NULL;

-- Mettre à jour les messages existants
UPDATE public.message 
SET timestamp = created_at 
WHERE timestamp IS NULL AND created_at IS NOT NULL;

-- 11. Créer des vues optimisées pour les requêtes fréquentes
CREATE OR REPLACE VIEW public.v_expert_assignments AS
SELECT 
    ea.id,
    ea.expert_id,
    ea.client_produit_eligible_id,
    ea.statut,
    ea.created_at,
    ea.updated_at,
    cpe.client_id,
    cpe.produit_eligible_id,
    c.company_name as client_name,
    pe.nom as produit_nom,
    pe.category as produit_category,
    e.first_name as expert_first_name,
    e.last_name as expert_last_name,
    e.email as expert_email
FROM public.expertassignment ea
LEFT JOIN public."ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
LEFT JOIN public.client c ON cpe.client_id = c.id
LEFT JOIN public."ProduitEligible" pe ON cpe.produit_eligible_id = pe.id
LEFT JOIN public.expert e ON ea.expert_id = e.id
WHERE pe.active = true;

-- Vue pour les messages avec informations utilisateur
CREATE OR REPLACE VIEW public.v_messages_with_users AS
SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.timestamp,
    m.created_at,
    m.updated_at,
    c.title as conversation_title,
    CASE 
        WHEN e.id IS NOT NULL THEN e.first_name || ' ' || e.last_name
        WHEN cl.id IS NOT NULL THEN cl.company_name
        ELSE 'Utilisateur inconnu'
    END as sender_name,
    CASE 
        WHEN e.id IS NOT NULL THEN 'expert'
        WHEN cl.id IS NOT NULL THEN 'client'
        ELSE 'unknown'
    END as sender_type
FROM public.message m
LEFT JOIN public.conversation c ON m.conversation_id = c.id
LEFT JOIN public.expert e ON m.sender_id = e.id
LEFT JOIN public.client cl ON m.sender_id = cl.id
ORDER BY m.timestamp DESC;

-- 12. Créer des fonctions utilitaires
CREATE OR REPLACE FUNCTION public.get_expert_assignments_by_status(status_filter VARCHAR(50))
RETURNS TABLE (
    assignment_id UUID,
    expert_name TEXT,
    client_name TEXT,
    produit_nom TEXT,
    statut VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id::UUID,
        (e.first_name || ' ' || e.last_name)::TEXT,
        c.company_name::TEXT,
        pe.nom::TEXT,
        ea.statut,
        ea.created_at
    FROM public.expertassignment ea
    LEFT JOIN public."ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
    LEFT JOIN public.client c ON cpe.client_id = c.id
    LEFT JOIN public."ProduitEligible" pe ON cpe.produit_eligible_id = pe.id
    LEFT JOIN public.expert e ON ea.expert_id = e.id
    WHERE ea.statut = status_filter
    ORDER BY ea.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques des assignations
CREATE OR REPLACE FUNCTION public.get_assignment_statistics()
RETURNS TABLE (
    statut VARCHAR(50),
    count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            statut,
            COUNT(*) as count,
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
        FROM public.expertassignment
        GROUP BY statut
    )
    SELECT 
        statut,
        count,
        ROUND(percentage, 2) as percentage
    FROM stats
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Créer des triggers pour maintenir la cohérence
CREATE OR REPLACE FUNCTION public.update_expertassignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expertassignment_updated_at
    BEFORE UPDATE ON public.expertassignment
    FOR EACH ROW
    EXECUTE FUNCTION public.update_expertassignment_updated_at();

-- 14. Créer des contraintes de validation supplémentaires
ALTER TABLE public.expertassignment 
ADD CONSTRAINT check_expertassignment_dates 
CHECK (created_at <= updated_at OR updated_at IS NULL);

-- 15. Optimiser les performances avec des index composites
CREATE INDEX IF NOT EXISTS idx_expertassignment_expert_statut 
ON public.expertassignment(expert_id, statut);

CREATE INDEX IF NOT EXISTS idx_expertassignment_client_produit_statut 
ON public.expertassignment(client_produit_eligible_id, statut);

CREATE INDEX IF NOT EXISTS idx_message_conversation_timestamp 
ON public.message(conversation_id, timestamp DESC);

-- 16. Créer des index pour les recherches textuelles
CREATE INDEX IF NOT EXISTS idx_produiteligible_nom_gin 
ON public."ProduitEligible" USING gin(to_tsvector('french', nom));

CREATE INDEX IF NOT EXISTS idx_message_content_gin 
ON public.message USING gin(to_tsvector('french', content));

-- 17. Ajouter des commentaires pour la documentation
COMMENT ON TABLE public.expertassignment IS 'Table des assignations d''experts aux clients pour des produits éligibles';
COMMENT ON COLUMN public.expertassignment.statut IS 'Statut de l''assignation: pending, accepted, rejected, completed, cancelled';
COMMENT ON COLUMN public.expertassignment.client_produit_eligible_id IS 'Référence vers la relation client-produit éligible';

COMMENT ON TABLE public."ProduitEligible" IS 'Table des produits éligibles pour les aides et subventions';
COMMENT ON COLUMN public."ProduitEligible".category IS 'Catégorie du produit: ticpe, cee, audit, general';
COMMENT ON COLUMN public."ProduitEligible".active IS 'Indique si le produit est actuellement disponible';

COMMENT ON TABLE public.message IS 'Table des messages de la messagerie temps réel';
COMMENT ON COLUMN public.message.timestamp IS 'Horodatage précis du message pour l''ordre chronologique';

-- 18. Créer des vues pour les rapports
CREATE OR REPLACE VIEW public.v_assignment_reports AS
SELECT 
    DATE_TRUNC('month', ea.created_at) as month,
    pe.category,
    ea.statut,
    COUNT(*) as count,
    COUNT(DISTINCT ea.expert_id) as unique_experts,
    COUNT(DISTINCT cpe.client_id) as unique_clients
FROM public.expertassignment ea
LEFT JOIN public."ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
LEFT JOIN public."ProduitEligible" pe ON cpe.produit_eligible_id = pe.id
GROUP BY DATE_TRUNC('month', ea.created_at), pe.category, ea.statut
ORDER BY month DESC, category, statut;

-- 19. Créer des fonctions pour les métriques
CREATE OR REPLACE FUNCTION public.get_monthly_metrics(year_param INTEGER, month_param INTEGER)
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    metric_unit TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Total Assignations'::TEXT,
        COUNT(*)::NUMERIC,
        'assignations'::TEXT
    FROM public.expertassignment ea
    WHERE EXTRACT(YEAR FROM ea.created_at) = year_param 
    AND EXTRACT(MONTH FROM ea.created_at) = month_param
    
    UNION ALL
    
    SELECT 
        'Assignations Acceptées'::TEXT,
        COUNT(*)::NUMERIC,
        'assignations'::TEXT
    FROM public.expertassignment ea
    WHERE EXTRACT(YEAR FROM ea.created_at) = year_param 
    AND EXTRACT(MONTH FROM ea.created_at) = month_param
    AND ea.statut = 'accepted'
    
    UNION ALL
    
    SELECT 
        'Taux d''Acceptation'::TEXT,
        ROUND(
            (COUNT(*) FILTER (WHERE ea.statut = 'accepted') * 100.0 / COUNT(*))::NUMERIC, 2
        ),
        '%'::TEXT
    FROM public.expertassignment ea
    WHERE EXTRACT(YEAR FROM ea.created_at) = year_param 
    AND EXTRACT(MONTH FROM ea.created_at) = month_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Créer des politiques RLS plus avancées
DO $$
BEGIN
    -- Politique pour les experts: voir leurs propres assignations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expertassignment' 
        AND policyname = 'Experts can view their own assignments'
    ) THEN
        CREATE POLICY "Experts can view their own assignments" ON public.expertassignment
        FOR SELECT USING (
            auth.uid()::text = expert_id::text
        );
    END IF;
    
    -- Politique pour les clients: voir les assignations liées à leurs produits
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expertassignment' 
        AND policyname = 'Clients can view assignments for their products'
    ) THEN
        CREATE POLICY "Clients can view assignments for their products" ON public.expertassignment
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public."ClientProduitEligible" cpe
                WHERE cpe.id = expertassignment.client_produit_eligible_id
                AND cpe.client_id::text = auth.uid()::text
            )
        );
    END IF;
END $$;

-- 21. Finaliser avec des optimisations de performance
ANALYZE public.expertassignment;
ANALYZE public."ProduitEligible";
ANALYZE public.message;
ANALYZE public."ClientProduitEligible";

-- Créer des statistiques pour les nouvelles colonnes
ANALYZE public.expertassignment(statut);
ANALYZE public."ProduitEligible"(category, active);
ANALYZE public.message(timestamp); 