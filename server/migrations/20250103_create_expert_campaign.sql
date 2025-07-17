-- Migration pour créer la table ExpertCampaign (Campagnes de promotion)
-- Date: 2025-01-03

-- Création de la table ExpertCampaign
CREATE TABLE IF NOT EXISTS public.ExpertCampaign (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('promotion', 'featured', 'specialization', 'location', 'rating')),
    target_criteria JSONB DEFAULT '{}'::jsonb,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    max_experts INTEGER,
    current_experts INTEGER DEFAULT 0,
    promotion_budget DECIMAL(10,2),
    spent_budget DECIMAL(10,2) DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2),
    created_by UUID REFERENCES public."Admin"(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_expert_campaign_type ON public.ExpertCampaign(campaign_type);
CREATE INDEX IF NOT EXISTS idx_expert_campaign_active ON public.ExpertCampaign(is_active);
CREATE INDEX IF NOT EXISTS idx_expert_campaign_dates ON public.ExpertCampaign(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_expert_campaign_created_by ON public.ExpertCampaign(created_by);
CREATE INDEX IF NOT EXISTS idx_expert_campaign_budget ON public.ExpertCampaign(promotion_budget, spent_budget);

-- Politique RLS
ALTER TABLE public.ExpertCampaign ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les campagnes actives
CREATE POLICY "Anyone can view active campaigns" ON public.ExpertCampaign
    FOR SELECT USING (is_active = true);

-- Admins peuvent voir et gérer toutes les campagnes
CREATE POLICY "Admins can manage all campaigns" ON public.ExpertCampaign
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_expert_campaign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expert_campaign_updated_at
    BEFORE UPDATE ON public.ExpertCampaign
    FOR EACH ROW
    EXECUTE FUNCTION update_expert_campaign_updated_at();

-- Trigger pour vérifier les dates
CREATE OR REPLACE FUNCTION check_campaign_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.start_date >= NEW.end_date THEN
        RAISE EXCEPTION 'La date de début doit être antérieure à la date de fin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_campaign_dates
    BEFORE INSERT OR UPDATE ON public.ExpertCampaign
    FOR EACH ROW
    EXECUTE FUNCTION check_campaign_dates();

-- Trigger pour mettre à jour is_active automatiquement
CREATE OR REPLACE FUNCTION update_campaign_active_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_date < NOW() THEN
        NEW.is_active = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_active_status
    BEFORE UPDATE ON public.ExpertCampaign
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_active_status();

-- Commentaire sur la table
COMMENT ON TABLE public.ExpertCampaign IS 'Campagnes de promotion et de mise en avant des experts'; 