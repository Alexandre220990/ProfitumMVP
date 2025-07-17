-- Migration pour créer la table PromotionBanner (Bannières promotionnelles)
-- Date: 2025-01-03

-- Création de la table PromotionBanner
CREATE TABLE IF NOT EXISTS public.PromotionBanner (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subtitle TEXT,
    description TEXT,
    banner_type VARCHAR(50) NOT NULL CHECK (banner_type IN ('expert_featured', 'campaign', 'announcement', 'promotion', 'news')),
    image_url TEXT,
    background_color VARCHAR(7) DEFAULT '#3B82F6',
    text_color VARCHAR(7) DEFAULT '#FFFFFF',
    cta_text VARCHAR(100),
    cta_url TEXT,
    cta_action JSONB DEFAULT '{}'::jsonb,
    target_audience JSONB DEFAULT '{}'::jsonb,
    display_conditions JSONB DEFAULT '{}'::jsonb,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    max_impressions INTEGER,
    current_impressions INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public."Admin"(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_promotion_banner_type ON public.PromotionBanner(banner_type);
CREATE INDEX IF NOT EXISTS idx_promotion_banner_active ON public.PromotionBanner(is_active);
CREATE INDEX IF NOT EXISTS idx_promotion_banner_dates ON public.PromotionBanner(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotion_banner_priority ON public.PromotionBanner(priority);
CREATE INDEX IF NOT EXISTS idx_promotion_banner_created_by ON public.PromotionBanner(created_by);
CREATE INDEX IF NOT EXISTS idx_promotion_banner_impressions ON public.PromotionBanner(max_impressions, current_impressions);

-- Politique RLS
ALTER TABLE public.PromotionBanner ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les bannières actives
CREATE POLICY "Anyone can view active banners" ON public.PromotionBanner
    FOR SELECT USING (is_active = true);

-- Admins peuvent voir et gérer toutes les bannières
CREATE POLICY "Admins can manage all banners" ON public.PromotionBanner
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_promotion_banner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_promotion_banner_updated_at
    BEFORE UPDATE ON public.PromotionBanner
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_banner_updated_at();

-- Trigger pour vérifier les dates
CREATE OR REPLACE FUNCTION check_banner_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_date IS NOT NULL AND NEW.start_date >= NEW.end_date THEN
        RAISE EXCEPTION 'La date de début doit être antérieure à la date de fin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_banner_dates
    BEFORE INSERT OR UPDATE ON public.PromotionBanner
    FOR EACH ROW
    EXECUTE FUNCTION check_banner_dates();

-- Trigger pour désactiver automatiquement
CREATE OR REPLACE FUNCTION update_banner_active_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_date IS NOT NULL AND NEW.end_date < NOW() THEN
        NEW.is_active = false;
    END IF;
    IF NEW.max_impressions IS NOT NULL AND NEW.current_impressions >= NEW.max_impressions THEN
        NEW.is_active = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_banner_active_status
    BEFORE UPDATE ON public.PromotionBanner
    FOR EACH ROW
    EXECUTE FUNCTION update_banner_active_status();

-- Fonction pour incrémenter les impressions
CREATE OR REPLACE FUNCTION increment_banner_impressions(banner_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.PromotionBanner 
    SET current_impressions = current_impressions + 1
    WHERE id = banner_uuid;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter les clics
CREATE OR REPLACE FUNCTION increment_banner_clicks(banner_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.PromotionBanner 
    SET click_count = click_count + 1
    WHERE id = banner_uuid;
END;
$$ LANGUAGE plpgsql;

-- Commentaire sur la table
COMMENT ON TABLE public.PromotionBanner IS 'Bannières promotionnelles pour la marketplace des experts'; 