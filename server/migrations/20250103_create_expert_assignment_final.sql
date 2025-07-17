-- Migration pour créer la table ExpertAssignment (Marketplace Experts) - VERSION FINALE
-- Date: 2025-01-03

-- Création de la table ExpertAssignment
CREATE TABLE IF NOT EXISTS public.ExpertAssignment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID REFERENCES public."Expert"(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public."Client"(id) ON DELETE CASCADE,
    produit_id UUID REFERENCES public."ProduitEligible"(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
    client_feedback TEXT,
    expert_rating INTEGER CHECK (expert_rating >= 1 AND expert_rating <= 5),
    expert_feedback TEXT,
    compensation_amount DECIMAL(10,2),
    compensation_status VARCHAR(50) DEFAULT 'pending' CHECK (compensation_status IN ('pending', 'paid', 'cancelled')),
    payment_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_expert_assignment_expert_id ON public.ExpertAssignment(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_client_id ON public.ExpertAssignment(client_id);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_produit_id ON public.ExpertAssignment(produit_id);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_status ON public.ExpertAssignment(status);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_assignment_date ON public.ExpertAssignment(assignment_date);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_compensation_status ON public.ExpertAssignment(compensation_status);

-- Politique RLS
ALTER TABLE public.ExpertAssignment ENABLE ROW LEVEL SECURITY;

-- Experts peuvent voir leurs assignations
CREATE POLICY "Experts can view their assignments" ON public.ExpertAssignment
    FOR SELECT USING (
        expert_id IN (
            SELECT id FROM public."Expert" 
            WHERE user_id = auth.uid()
        )
    );

-- Clients peuvent voir leurs assignations
CREATE POLICY "Clients can view their assignments" ON public.ExpertAssignment
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public."Client" 
            WHERE auth_id = auth.uid()
        )
    );

-- Admins peuvent voir toutes les assignations
CREATE POLICY "Admins can view all assignments" ON public.ExpertAssignment
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Gestion des assignations (experts et admins)
CREATE POLICY "Experts and admins can manage assignments" ON public.ExpertAssignment
    FOR ALL USING (
        expert_id IN (
            SELECT id FROM public."Expert" 
            WHERE user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_expert_assignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expert_assignment_updated_at
    BEFORE UPDATE ON public.ExpertAssignment
    FOR EACH ROW
    EXECUTE FUNCTION update_expert_assignment_updated_at();

-- Commentaire sur la table
COMMENT ON TABLE public.ExpertAssignment IS 'Assignations d''experts aux clients pour la marketplace'; 