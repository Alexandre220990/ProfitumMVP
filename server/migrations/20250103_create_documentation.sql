-- Migration pour créer la table documentation (table principale)
-- Date: 2025-01-03

-- Création de la table documentation
CREATE TABLE IF NOT EXISTS public.documentation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.documentation_items(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.documentation_categories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_favorite BOOLEAN DEFAULT false,
    last_viewed TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    helpful_feedback BOOLEAN,
    feedback_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_documentation_item_id ON public.documentation(item_id);
CREATE INDEX IF NOT EXISTS idx_documentation_category_id ON public.documentation(category_id);
CREATE INDEX IF NOT EXISTS idx_documentation_user_id ON public.documentation(user_id);
CREATE INDEX IF NOT EXISTS idx_documentation_favorite ON public.documentation(is_favorite);
CREATE INDEX IF NOT EXISTS idx_documentation_last_viewed ON public.documentation(last_viewed);

-- Politique RLS
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;

-- Utilisateurs peuvent voir leurs propres interactions
CREATE POLICY "Users can view their own documentation interactions" ON public.documentation
    FOR SELECT USING (user_id = auth.uid());

-- Utilisateurs peuvent gérer leurs propres interactions
CREATE POLICY "Users can manage their own documentation interactions" ON public.documentation
    FOR ALL USING (user_id = auth.uid());

-- Admins peuvent voir toutes les interactions
CREATE POLICY "Admins can view all documentation interactions" ON public.documentation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_documentation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documentation_updated_at
    BEFORE UPDATE ON public.documentation
    FOR EACH ROW
    EXECUTE FUNCTION update_documentation_updated_at();

-- Fonction pour incrémenter le compteur de vues
CREATE OR REPLACE FUNCTION increment_documentation_view_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le compteur de vues dans documentation_items
    UPDATE public.documentation_items 
    SET view_count = view_count + 1 
    WHERE id = NEW.item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_documentation_view_count
    AFTER INSERT ON public.documentation
    FOR EACH ROW
    EXECUTE FUNCTION increment_documentation_view_count();

-- Commentaire sur la table
COMMENT ON TABLE public.documentation IS 'Table de liaison pour les interactions utilisateurs avec la documentation'; 