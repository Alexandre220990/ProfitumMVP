-- Migration pour créer la table ExpertCriteria (Critères de recherche et recommandation) - VERSION CORRIGÉE
-- Date: 2025-01-03

-- Création de la table ExpertCriteria
CREATE TABLE IF NOT EXISTS public.ExpertCriteria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    criteria_type VARCHAR(50) NOT NULL CHECK (criteria_type IN ('produit_eligible', 'location', 'rating', 'experience', 'availability', 'price', 'certification', 'company_size')),
    criteria_value JSONB NOT NULL,
    weight DECIMAL(3,2) DEFAULT 1.00 CHECK (weight >= 0 AND weight <= 1),
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES public."Admin"(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_expert_criteria_type ON public.ExpertCriteria(criteria_type);
CREATE INDEX IF NOT EXISTS idx_expert_criteria_active ON public.ExpertCriteria(is_active);
CREATE INDEX IF NOT EXISTS idx_expert_criteria_required ON public.ExpertCriteria(is_required);
CREATE INDEX IF NOT EXISTS idx_expert_criteria_sort_order ON public.ExpertCriteria(sort_order);
CREATE INDEX IF NOT EXISTS idx_expert_criteria_weight ON public.ExpertCriteria(weight);
CREATE INDEX IF NOT EXISTS idx_expert_criteria_value ON public.ExpertCriteria USING GIN(criteria_value);

-- Politique RLS
ALTER TABLE public.ExpertCriteria ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les critères actifs
CREATE POLICY "Anyone can view active criteria" ON public.ExpertCriteria
    FOR SELECT USING (is_active = true);

-- Admins peuvent voir et gérer tous les critères
CREATE POLICY "Admins can manage all criteria" ON public.ExpertCriteria
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_expert_criteria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expert_criteria_updated_at
    BEFORE UPDATE ON public.ExpertCriteria
    FOR EACH ROW
    EXECUTE FUNCTION update_expert_criteria_updated_at();

-- Insertion des critères de base (corrigés)
INSERT INTO public.ExpertCriteria (name, description, criteria_type, criteria_value, weight, is_required, sort_order) VALUES
('Produits éligibles', 'Produits éligibles maîtrisés par l''expert', 'produit_eligible', '{"type": "array", "produit_ids": [], "match_all": false}', 0.35, true, 1),
('Localisation', 'Zone géographique de l''expert', 'location', '{"type": "string", "max_distance_km": 100, "preferred_regions": []}', 0.25, false, 2),
('Note moyenne', 'Note moyenne de l''expert (minimum)', 'rating', '{"type": "number", "min_rating": 4.0, "min_reviews": 5}', 0.20, false, 3),
('Expérience', 'Années d''expérience minimum', 'experience', '{"type": "number", "min_years": 2, "preferred_sectors": []}', 0.15, false, 4),
('Disponibilité', 'Disponibilité de l''expert', 'availability', '{"type": "boolean", "within_days": 7, "preferred_schedule": "weekdays"}', 0.05, false, 5)
ON CONFLICT (name) DO NOTHING;

-- Commentaire sur la table
COMMENT ON TABLE public.ExpertCriteria IS 'Critères de recherche et de recommandation pour les experts basés sur les ProduitEligible et autres facteurs'; 